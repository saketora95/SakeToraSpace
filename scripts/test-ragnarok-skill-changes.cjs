"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const project = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(project, file), "utf8");
const page = read("ragnarok-skill-changes.html");
const nodes = new Map();
let resultsWidth = 900;
const layoutObservers = [];
const windowListeners = {};
const copiedLinks = [];
let fallbackInput = null;
let fallbackCopySucceeds = true;
function node(selector) {
  if (!nodes.has(selector)) nodes.set(selector, {
    innerHTML: "", textContent: "", value: "", hidden: false, disabled: false, listeners: {}, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name] ?? null; },
    addEventListener(type, listener) { this.listeners[type] = listener; },
    focus() { this.focused = true; },
    getBoundingClientRect() { return { width: resultsWidth }; },
    querySelectorAll() {
      return [...this.innerHTML.matchAll(/data-skill="([^"]+)"/g)].map(match => ({ dataset: { skill: match[1] }, focus() {} }));
    },
    querySelector() { return this.querySelectorAll()[0] ?? null; },
  });
  return nodes.get(selector);
}
const root = { querySelector: node };
const context = vm.createContext({ window: {
  location: new URL("https://example.test/ragnarok-skill-changes.html"),
  navigator: { clipboard: { async writeText(value) { copiedLinks.push(value); } } },
  setTimeout() {},
  addEventListener(type, listener) { windowListeners[type] = listener; },
  getComputedStyle() { return { fontFamily: "sans-serif" }; },
  ResizeObserver: class {
    constructor(callback) { this.callback = callback; layoutObservers.push(this); }
    observe(target) { this.target = target; }
  },
}, URL, URLSearchParams, document: {
  body: { appendChild(input) { fallbackInput = input; } },
  execCommand(command) {
    assert.equal(command, "copy");
    if (fallbackCopySucceeds) copiedLinks.push(fallbackInput.value);
    return fallbackCopySucceeds;
  },
  querySelector: selector => selector === "#skill-changes-tool" ? root : node(selector),
  createElement(tag) {
    if (tag === "textarea") return { style: {}, setAttribute() {}, select() { this.selected = true; }, remove() { this.removed = true; } };
    assert.equal(tag, "canvas");
    return { getContext: () => ({ measureText: value => ({ width: Array.from(String(value)).reduce((width, char) => width + (char.codePointAt(0) >= 0x2e80 ? 13 : 7), 0) }) }) };
  },
} });
vm.runInContext(read("assets/js/tools/ragnarok/skill-change-data.js"), context);
const fullImportedData = context.window.ragnarokSkillChangeData;
// Keep the original Dragon Knight regressions alongside checks of the complete import.
const dragonSkills = fullImportedData.skills.filter(skill => skill.jobIds.includes("dragon-knight"));
const dragonIds = new Set(idsFrom(dragonSkills));
const dragonRecords = fullImportedData.records.filter(record => dragonIds.has(record.skillId));
const dragonVersions = new Set(dragonRecords.map(record => record.versionId));
const importedData = {
  ...fullImportedData,
  jobs: fullImportedData.jobs.filter(job => job.id === "dragon-knight"),
  skills: dragonSkills,
  records: dragonRecords,
  versions: fullImportedData.versions.filter(version => dragonVersions.has(version.id)),
  announcements: fullImportedData.announcements.filter(entry => dragonVersions.has(entry.versionId)),
};
function idsFrom(entries) { return entries.map(entry => entry.id); }
vm.runInContext(read("scripts/fixtures/ragnarok-skill-change-demo.js"), context);
vm.runInContext(read("assets/js/tools/ragnarok/skill-changes.js"), context);
const data = context.window.ragnarokSkillChangeData;
const api = context.window.ragnarokSkillChanges;
const clone = () => JSON.parse(JSON.stringify(data));
const ids = entries => Array.from(entries, entry => entry.id);
const dispatch = (selector, type, value) => {
  node(selector).value = value;
  node(selector).listeners[type]({ target: node(selector) });
};
const select = id => node("#skill-list").listeners.click({ target: { closest: () => ({ dataset: { skill: id } }) } });
function expandAll() {
  if (results().includes("data-expand-all")) node("#skill-results").listeners.click({ target: {
    closest: selector => selector === "button[data-expand-all]" ? { dataset: { expandAll: "" } } : null,
  } });
}
function mount(root, sample) { api.mount(root, sample); expandAll(); }
const reset = () => { node("#skill-reset").listeners.click(); expandAll(); };
const results = () => node("#skill-results").innerHTML;
const sources = () => node("#skill-announcement-list").innerHTML;
const cards = () => (results().match(/class="skill-card"/g) || []).length;
const records = () => (results().match(/data-record="/g) || []).length;
const tables = () => (results().match(/<table /g) || []).length;
const assertBrowseAll = active => {
  assert.equal(node("#skill-show-all").disabled, false);
  assert.equal(node("#skill-show-all").getAttribute("aria-pressed"), String(active));
};
const columnGroups = () => Array.from(results().matchAll(/<colgroup>(.*?)<\/colgroup>/g), match => match[1]);
const renderedWidths = () => Object.fromEntries(Array.from(columnGroups()[0].matchAll(/data-column="([^"]+)" style="width:([\d.]+)%"/g), match => [match[1], Number(match[2])]));
const assertSharedColumns = count => {
  const groups = columnGroups();
  assert.equal(groups.length, tables());
  assert(groups.every(group => group === groups[0]));
  if (groups.length) {
    const widths = Object.values(renderedWidths());
    assert.equal(widths.length, count);
    assert(widths.every(width => Number.isFinite(width) && width > 0));
    assert(Math.abs(widths.reduce((total, width) => total + width, 0) - 100) < 0.001);
  }
};
const resizeResults = width => {
  resultsWidth = width;
  const observer = layoutObservers.at(-1);
  observer.callback([{ target: observer.target, contentRect: { width } }]);
};

assert.equal(cards(), 0);
assert.match(results(), /資料較多，請先篩選/);
expandAll();
assert.equal(cards(), 5);
node("#skill-reset").listeners.click();
assert.equal(cards(), 0);
select("demo-slash");
assert.equal(cards(), 1);
select("demo-slash");
assert.equal(cards(), 0);
dispatch("#skill-job", "change", "knight");
assert.equal(cards(), 2);
dispatch("#skill-job", "change", "");
assert.equal(cards(), 0);
dispatch("#skill-query", "input", "　 ");
assert.equal(cards(), 0);
node("#skill-reset").listeners.click();
expandAll();
assert.equal(cards(), 5);
console.log("Passed: unfiltered results stay collapsed, explicit expansion works, filters/selection display results, and reset collapses again.");
assert.equal(api.validateData(data).length, 0);
assert.equal(api.findSkills(data).length, 5);
assert.deepEqual(ids(api.findSkills(data, { jobId: "knight" })), ["demo-slash", "demo-combo"]);
assert.deepEqual(ids(api.findSkills(data, { jobId: "swordsman" })), ["demo-slash"]);
assert.deepEqual(ids(api.findSkills(data, { query: "ＦＩＲＥ" })), ["demo-fire"]);
assert.deepEqual(ids(api.findSkills(data, { query: "정밀" })), ["demo-arrow"]);
assert.deepEqual(ids(api.findSkills(data, { query: "暴風術" })), ["demo-storm"]);
assert.deepEqual(ids(api.findSkills(data, { query: "900002" })), ["demo-combo"]);
assert.deepEqual(ids(api.findSkills(data, { query: "fire demo", jobId: "wizard" })), ["demo-fire"]);
assert.equal(api.findSkills(data, { query: "fire", jobId: "knight" }).length, 0);
assert.deepEqual(ids(api.findRecords(data, "demo-slash")), ["demo-slash-v3", "demo-slash-v2", "demo-slash-v1"]);
assert.deepEqual(ids(api.findRecords(data, "demo-slash", "demo-v2")), ["demo-slash-v2"]);
assert.equal(api.findRecords(data, "demo-combo", "demo-v3").length, 0);
assert.deepEqual(ids(api.findSkills(data, { versionId: "demo-v3" })), ["demo-slash", "demo-fire", "demo-storm"]);
assert.deepEqual(ids(api.findSkills(data, { jobId: "knight", versionId: "demo-v3" })), ["demo-slash"]);
assert.equal(api.findSkills(data, { query: "combo", versionId: "demo-v3" }).length, 0);
assert.equal(api.formatValue(0, "秒"), "0 秒");
assert.equal(api.formatValue(0.5, "秒"), "0.5 秒");
assert.equal(api.formatValue(null, "%"), "—");
assert.equal(api.formatValue(undefined, "秒"), "—");
assert.equal(api.formatValue("5 x 5"), "5 x 5");
assert.equal(api.formatValue(400, "%"), "400%");
assert.equal(api.formatValue(3, "格"), "3 格");
assert.equal(api.formatValue(4, "次"), "4 次");
assert.equal(api.formatValue(100, " HP"), "100 HP");
console.log("Passed: multilingual/combined filters, shared jobs, all-version default, ordering, typed values.");

const widthsFor = (sample, includeVersion = true, availableWidth = 900) => Object.fromEntries(Array.from(
  api.calculateColumnWidths(sample, sample.records, { includeVersion, availableWidth }), column => [column.key, column.width]));
const baselineWidths = widthsFor(data);
for (const [column, field] of [["item", "item"], ["before", "before"], ["after", "after"]]) {
  const longer = clone();
  longer.records[0].changes[0][field] = "長文字與數值公式".repeat(10);
  assert(widthsFor(longer)[column] > baselineWidths[column], `${column} should grow for longer data`);
}
const shortNotes = clone();
shortNotes.records.forEach(record => record.changes.forEach(change => { delete change.note; }));
assert(widthsFor(shortNotes).note < baselineWidths.note);
const longVersion = clone();
longVersion.versions[2].name = "技能平衡調整追加修正版本".repeat(4);
assert(widthsFor(longVersion).version > baselineWidths.version);
const narrowWidths = widthsFor(data, false, 460);
assert.equal(Object.keys(narrowWidths).length, 4);
for (const [key, minimum] of [["item", 80], ["before", 104], ["after", 104], ["note", 88]]) {
  assert(narrowWidths[key] * 460 / 100 >= minimum - 0.001);
}
const hugeNotes = clone();
hugeNotes.records[0].changes[0].note = "說明".repeat(1000);
const cappedWidths = widthsFor(hugeNotes);
hugeNotes.records[0].changes[0].note += "說明".repeat(1000);
assert.deepEqual(widthsFor(hugeNotes), cappedWidths);
assert(cappedWidths.note < 60);
const noRecords = api.calculateColumnWidths(data, [], { includeVersion: false });
assert(Array.from(noRecords).every(column => column.width > 0 && Number.isFinite(column.width)));
console.log("Passed: shared widths adapt to field lengths, keep readable minima and wrap extreme content.");

assert.equal(cards(), 5);
assert.equal(records(), 8);
assertBrowseAll(true);
assert.equal(node("#skill-result-status").textContent, "");
assert.equal(node("#skill-result-status").hidden, true);
assert.equal((results().match(/class="skill-version-rows is-current"/g) || []).length, 5);
assert.match(results(), /ID 900001/);
const summary = results().match(/<p class="skill-metadata">(.*?)<\/p>/)[1];
assert.equal(summary.replace(/<[^>]+>/g, ""), "劍士、騎士 ‧ ID 900001 ‧ 베기 (예시) ‧ 斬撃（サンプル） ‧ Slash (Demo)");
assert(!results().includes("<dl"));
assert(!results().includes("改版前 → 改版後"));
assert(!results().includes("示範公告"));
assert.match(results(), /lang="ko"/);
assert.match(results(), /lang="en"/);
assert.match(results(), /lang="ja"/);
assert.match(results(), /400%/);
assert.match(results(), /450%/);
assert.match(results(), /9 x 9/);
assert.match(results(), /0 秒/);
assert.match(results(), /<td>—<\/td>/);
assert(!results().includes("未記載"));
assert.match(results(), /最高技能等級|技能等級上限/);
assert.equal(node("#skill-data-notice").hidden, false);
assert.match(node("#skill-data-notice").textContent, /示範資料/);
assert(!sources().includes("href="));
assert.match(sources(), /官方維護公告連結待補/);
assert(!sources().includes("技能優化與範圍調整（示範公告）"));
assert(!sources().includes("追加修正說明（示範公告）"));
assert.equal(tables(), 5);
assert.equal((results().match(/<th scope="col">版本<\/th>/g) || []).length, 5);
assert.match(results(), /scope="rowgroup" rowspan="3"/);
assert.match(results(), /<div class="skill-version-title"><span>示範版本 3<\/span> <span class="skill-current-badge">現行版本<\/span><\/div>/);
assert.match(results(), /<span>示範版本 2<\/span> <span class="skill-carried-badge">沿用至 示範版本 3<\/span>/);
assert.equal((results().match(/skill-current-badge/g) || []).length, 3);
assert.equal((results().match(/skill-carried-badge/g) || []).length, 2);
assertSharedColumns(5);
const initialWidths = renderedWidths();
resizeResults(760);
assertSharedColumns(5);
assert.notDeepEqual(renderedWidths(), initialWidths); // widths recalculate without crossing the merged-table breakpoint
resizeResults(900);
assert.deepEqual(renderedWidths(), initialWidths);

select("demo-slash");
select("demo-slash");
assert.equal(cards(), 5);
assert.equal(records(), 8);
assertBrowseAll(true);
assert(!node("#skill-list").innerHTML.includes('aria-pressed="true"'));
select("demo-slash");
assert.equal(tables(), 1);
assertBrowseAll(false);
assert.equal(records(), 3);
assert(results().indexOf("示範版本 3") < results().indexOf("示範版本 2"));
assert(results().indexOf("示範版本 2") < results().indexOf("示範版本 1"));
resizeResults(719);
assert.equal(tables(), 3);
assertSharedColumns(4);
assert(!results().includes("skill-merged-table"));
assert.equal((results().match(/class="skill-version-record is-current"/g) || []).length, 1);
assert.match(results(), /class="skill-current-badge">現行版本<\/span>/);
assert(!results().includes("示範公告"));
resizeResults(720);
assert.equal(tables(), 1);
assertSharedColumns(5);
assert.match(results(), /skill-merged-table/);
dispatch("#skill-version", "change", "demo-v2");
assert.equal(tables(), 1);
assert.equal(records(), 1);
assert(!results().includes("skill-merged-table"));
assertSharedColumns(4);
assert(!/skill-(current|carried)-badge/.test(results())); // filtering does not move the marker to an older visible record
resizeResults(600);
resizeResults(900);
assert.equal(records(), 1); // resizing must retain the selected version and skill
assert(!results().includes("skill-merged-table"));
dispatch("#skill-version", "change", "");
assert.equal(tables(), 1);
assert.equal(records(), 3);
reset();
assertSharedColumns(5);
console.log("Passed: one-line metadata, removed repeated text, merged table, width changes and retained selection.");

dispatch("#skill-job", "change", "knight");
assert.equal(cards(), 2);
assert.equal(records(), 4);
dispatch("#skill-query", "input", "combo");
assert.equal(cards(), 1);
assert.match(results(), /連續攻擊/);
assert.equal(records(), 1);
select("demo-combo");
dispatch("#skill-version", "change", "demo-v3");
assert.equal(records(), 0);
assert.equal(cards(), 0);
assert.match(results(), /沒有符合條件/);
assert.equal(node("#skill-count").textContent, "共 0 筆資料");
assertBrowseAll(true);
assert.match(sources(), /示範版本 3/);
assert(!sources().includes("初次技能調整"));
assert(!node("#skill-list").innerHTML.includes("連續攻擊"));
dispatch("#skill-query", "input", "");
assert.equal(node("#skill-count").textContent, "共 1 筆資料");
assert.match(node("#skill-list").innerHTML, /斬擊/);
assert(!node("#skill-list").innerHTML.includes("連續攻擊"));
select("demo-slash");
assert.equal(cards(), 1);
assert.equal(records(), 1);
assertBrowseAll(false);
dispatch("#skill-version", "change", "");
assert.equal(records(), 3);
node("#skill-show-all").listeners.click();
assert.equal(cards(), 2);
assertBrowseAll(true);
node("#skill-show-all").listeners.click();
assert.equal(cards(), 2);
assert.equal(node("#skill-job").value, "knight");
assertBrowseAll(true);
select("demo-slash");
select("demo-combo"); // selecting a different skill switches the detail view
assert.equal(cards(), 1);
assert.match(results(), /連續攻擊/);
select("demo-combo");
assert.equal(cards(), 2);
assert.equal(records(), 4);
assert.equal(node("#skill-job").value, "knight");
assertBrowseAll(true);
assert(!node("#skill-list").innerHTML.includes('aria-pressed="true"'));
select("demo-slash");
dispatch("#skill-query", "input", "combo"); // incompatible selection must be cleared
assert.equal(cards(), 1);
assertBrowseAll(true);
assert.match(results(), /連續攻擊/);
dispatch("#skill-query", "input", "does not exist");
assert.equal(cards(), 0);
assert.match(results(), /沒有符合條件/);
assert.match(sources(), /示範版本 1/); // sources remain independent of skill/name filters
reset();
assert.equal(cards(), 5);
assert.equal(records(), 8);
assert.equal(node("#skill-job").value, "");
assert.equal(node("#skill-query").value, "");
assert.equal(node("#skill-version").value, "");
assert.equal(node("#skill-job").focused, true);
assertBrowseAll(true);
console.log("Passed: mounted selection, filters, reset, zero/missing data, empty results and version-only sources.");

const changedCurrent = clone();
changedCurrent.meta.currentVersionId = "demo-v2";
changedCurrent.meta.isDemo = false;
changedCurrent.announcements[0].url = "https://official.example.test/maintenance?id=1&lang=ko";
mount(root, changedCurrent);
assert.equal(node("#skill-data-notice").hidden, true);
const currentBlocks = Array.from(results().matchAll(/class="skill-version-rows is-current"[\s\S]*?<span>(.*?)<\/span>/g), match => match[1]);
assert.deepEqual(currentBlocks, ["示範版本 2", "示範版本 2", "示範版本 1", "示範版本 2"]);
assert.equal((results().match(/skill-current-badge/g) || []).length, 3);
assert.equal((results().match(/skill-carried-badge/g) || []).length, 1);
assert.match(results(), /class="skill-carried-badge">沿用至 示範版本 2<\/span>/);
assert(!results().includes("現行版本："));
dispatch("#skill-version", "change", "demo-v3");
assert(!/skill-(current|carried)-badge/.test(results())); // versions after the current version never qualify
dispatch("#skill-version", "change", "demo-v1");
assert(!results().includes("skill-current-badge"));
assert.equal((results().match(/skill-carried-badge/g) || []).length, 1); // only the skill whose latest eligible record is v1
assert.match(results(), /沿用至 示範版本 2/);
resizeResults(500);
assert.equal((results().match(/class="skill-version-record is-current"/g) || []).length, 1);
assert.match(results(), /class="skill-carried-badge">沿用至 示範版本 2<\/span>/);
assert(!results().includes("skill-current-badge"));
resizeResults(900);
reset();
assert.match(sources(), /href="https:\/\/official\.example\.test\/maintenance\?id=1&amp;lang=ko"/);
assert.match(sources(), /target="_blank" rel="noopener noreferrer"/);

const escaped = clone();
escaped.skills[0].names.zhHant = '<script>alert("skill")</script>';
escaped.records[0].changes[0].note = '<img src=x onerror="alert(1)">';
escaped.announcements[0].title = '<script>alert("notice")</script>';
mount(root, escaped);
assert(!results().includes("<script>"));
assert(!results().includes("<img"));
assert.match(results(), /&lt;script&gt;/);
assert.match(results(), /&lt;img/);
assert(!sources().includes("<script>"));
console.log("Passed: explicit current version independent of newest, safe source links, escaped data text.");

const missingTranslations = clone();
missingTranslations.skills[0].skillId = null;
missingTranslations.skills[0].jobIds = [];
missingTranslations.skills[0].names = { zhHant: "未翻譯技能" };
missingTranslations.records = missingTranslations.records.filter(record => record.skillId !== "demo-slash");
assert.equal(api.validateData(missingTranslations).length, 0);
mount(root, missingTranslations);
assert.match(results(), /此技能尚未收錄調整記錄/);
for (const label of ["技能所屬職業", "技能 ID", "技能韓文名稱", "技能日文名稱", "技能英文名稱"]) {
  assert(results().includes(`（缺少${label}）`));
}
assert.match(node("#skill-list").innerHTML, /（缺少技能 ID）/);
const whitespaceTranslations = clone();
whitespaceTranslations.skills[0].names.ko = " ";
whitespaceTranslations.skills[0].names.ja = "";
whitespaceTranslations.skills[0].names.en = null;
mount(root, whitespaceTranslations);
assert.match(results(), /（缺少技能韓文名稱）/);
assert.match(results(), /（缺少技能日文名稱）/);
assert.match(results(), /（缺少技能英文名稱）/);

const ResizeObserver = context.window.ResizeObserver;
delete context.window.ResizeObserver;
mount(root, data);
assert.equal(tables(), 5);
resultsWidth = 500;
windowListeners.resize();
assert.equal(tables(), 8);
resultsWidth = 900;
windowListeners.resize();
assert.equal(tables(), 5);
context.window.ResizeObserver = ResizeObserver;

assert.equal(api.validateData(importedData).length, 0);
assert.equal(importedData.meta.isDemo, false);
assert.equal(importedData.meta.server, "kRO");
assert.equal(importedData.meta.currentVersionId, "kro-v4-2");
assert.equal(importedData.skills.length, 12);
assert.equal(importedData.versions.length, 10);
assert.equal(importedData.records.length, 36);
assert.equal(importedData.records.reduce((sum, record) => sum + record.changes.length, 0), 97);
assert.equal(api.findSkills(importedData, { jobId: "dragon-knight" }).length, 12);
assert.deepEqual(ids(api.findSkills(importedData, { query: "5213" })), ["dk-5213"]);
assert.equal(api.findSkills(importedData, { query: "서번트" }).length, 5);
assert(importedData.skills.every(skill => Number.isInteger(skill.skillId) && skill.names.ko));
const planned = importedData.versions.find(version => version.id === "kro-v9");
assert.equal(planned.status, "planned");
assert.equal(planned.releasedAt, null);
assert.equal(planned.announcedAt, "2026-09-30");
const plannedChange = api.findRecords(importedData, "dk-6608", "kro-v9")[0].changes[0];
assert.equal(plannedChange.before, 0.7);
assert.equal(plannedChange.after, 0.5);
const vigor = api.findRecords(importedData, "dk-5212", "kro-v8")[0];
assert.equal(vigor.evidence, "player-test");
assert.match(vigor.changes[0].note, /測試.*沒有被列於更新事項/);
const weaponCondition = api.findRecords(importedData, "dk-5211", "kro-v2")[0].changes.find(change => change.item === "技能倍率");
assert.equal(weaponCondition.before, 3750);
assert.equal(weaponCondition.after, 5150);
assert.match(weaponCondition.note, /五級武器.*150/);
const differentBase = api.findRecords(importedData, "dk-5211", "kro-v3")[0].changes.find(change => change.item === "技能基本倍率");
assert.equal(differentBase.before, 4400); // retain article's distinction between total and base multipliers
const conditional = api.findRecords(importedData, "dk-6502", "kro-v7")[0].changes;
assert.equal(conditional.length, 2);
assert.equal(conditional[1].after, 5000);
assert.match(conditional[1].note, /天龍光環/);

mount(root, importedData);
assert.equal(node("#skill-count").textContent, "共 12 筆資料");
assert.deepEqual(node("#skill-list").querySelectorAll().map(button => button.dataset.skill), [
  "dk-5201", "dk-5203", "dk-5204", "dk-5205", "dk-5208", "dk-5210",
  "dk-5211", "dk-5212", "dk-5213", "dk-6001", "dk-6502", "dk-6608",
]);
assert.equal(cards(), 12);
assert.equal(tables(), 12);
assert.equal(records(), 36);
assertSharedColumns(5);
assert.match(results(), /預告・尚未實裝/);
assert(!results().includes("<time"));
assert(!results().includes("公布："));
assert.match(sources(), /<time datetime="2026-09-30">2026-09-30<\/time> <span class="skill-planned-badge">/);
assert.equal((sources().match(/<time datetime="2026-09-30"/g) || []).length, 1);
assert(!sources().includes("另開分頁"));
assert(!sources().includes("公布："));
assert.equal(node("#skill-data-notice").hidden, true);
assert.equal(node("#skill-data-notice").textContent, "");
assert.equal((results().match(/class="skill-version-rows is-current"/g) || []).length, 10);
assert.equal((results().match(/class="skill-current-badge">現行版本<\/span>/g) || []).length, 1);
assert.equal((results().match(/class="skill-carried-badge">沿用至 4\.2 版本<\/span>/g) || []).length, 9);
assert(!results().includes("現行版本："));
assert.match(node("#skill-version").innerHTML, /value="kro-v4-2">第 4\.2 版本（現行版本）/);
assert.equal((sources().match(/href="https:\/\/ro\.gnjoy\.com\//g) || []).length, 10);
assert.match(sources(), /開發者筆記/);
assert(!results().includes("900001"));
dispatch("#skill-query", "input", "死侍武器-斬裂");
assert.equal(cards(), 1);
assert.equal(tables(), 1);
assert.equal(records(), 2);
dispatch("#skill-version", "change", "kro-v9");
assert.equal(records(), 1);
assert(!/skill-(current|carried)-badge/.test(results()));
assert.match(results(), /0\.7 秒/);
assert.match(results(), /0\.5 秒/);
resizeResults(500);
assert.equal(records(), 1);
assert.match(results(), /預告・尚未實裝/);
assert(!results().includes("<time"));
assert(!results().includes("公布："));
reset();
assert.equal(tables(), 36);
assert.equal((results().match(/class="skill-version-record is-current"/g) || []).length, 10);
assert.equal((results().match(/class="skill-current-badge">現行版本<\/span>/g) || []).length, 1);
assert.equal((results().match(/class="skill-carried-badge">沿用至 4\.2 版本<\/span>/g) || []).length, 9);
assertSharedColumns(4);
resizeResults(900);
assert.equal(tables(), 12);
assertSharedColumns(5);
dispatch("#skill-version", "change", "kro-v4-2");
assert.equal(cards(), 1);
assert.equal(records(), 1);
assert.equal((results().match(/skill-current-badge/g) || []).length, 1);
assert.match(results(), /class="skill-current-badge">現行版本<\/span>/);
assert(!results().includes("skill-carried-badge"));
assert.equal(node("#skill-count").textContent, "共 1 筆資料");
assert(!results().includes("<time"));
dispatch("#skill-query", "input", "5213");
assert.equal(cards(), 0);
assert.equal(records(), 0);
assert(!node("#skill-list").innerHTML.includes("風暴斬擊"));
reset();
dispatch("#skill-query", "input", "5213");
assert.match(results(), /<span>第 4 版本<\/span> <span class="skill-carried-badge">沿用至 4\.2 版本<\/span>/);
dispatch("#skill-version", "change", "kro-v4");
assert.match(results(), /class="skill-version-record is-current"/);
assert.match(results(), /class="skill-carried-badge">沿用至 4\.2 版本<\/span>/);
dispatch("#skill-version", "change", "kro-v3");
assert(!/skill-(current|carried)-badge/.test(results()));
reset();
const badCurrent = JSON.parse(JSON.stringify(importedData));
badCurrent.meta.currentVersionId = "kro-v9";
assert(api.validateData(badCurrent).some(error => error.includes("作為現行版本")));
console.log("Passed: real Dragon Knight import, source links, conditional values, player evidence and planned/current versions.");

assert.equal(api.validateData(fullImportedData).length, 0);
assert.equal(fullImportedData.jobs.length, 21);
assert.equal(fullImportedData.skills.length, 290);
assert.equal(fullImportedData.records.length, 642);
assert.equal(fullImportedData.versions.length, 13);
assert.equal(fullImportedData.meta.currentVersionId, "kro-v4-2");
assert.deepEqual(Array.from(fullImportedData.jobs, job => job.id), [
  "dragon-knight", "imperial-guard", "cardinal", "inquisitor", "arch-mage",
  "elemental-master", "meister", "biolo", "wind-hawk", "troubadour", "trouvere",
  "shadow-cross", "abyss-chaser", "sky-emperor", "soul-ascetic", "night-watch",
  "shinkiro", "shiranui", "hyper-novice", "spirit-handler", "druid",
]);
assert.deepEqual(Array.from(fullImportedData.meta.source.coverage, entry => [entry.postId, entry.sections, entry.skillHeadings, entry.rows]), [
  [2901200, 6, 75, 192], [2901201, 6, 71, 172], [2901202, 7, 118, 238], [2901252, 6, 7, 7],
]);
assert(fullImportedData.skills.every(skill => skill.sourceUrl && skill.jobIds.length));
assert(fullImportedData.records.every(record => record.sourceUrl));
const fullSkill = name => fullImportedData.skills.find(skill => skill.names.zhHant.replace(/\s/g, "").includes(name.replace(/\s/g, "")));
const fullRecord = (name, version) => api.findRecords(fullImportedData, fullSkill(name).id, version)[0];
assert.deepEqual(Array.from(fullSkill("玫瑰箭矢").jobIds), ["troubadour", "trouvere"]);
assert.deepEqual(Array.from(fullSkill("詭影狩獵").jobIds), ["shinkiro", "shiranui"]);
// Conflicting official/client ID mappings must not link the wrong Japanese skill.
for (const name of ["填裝火焰陷阱", "填裝急速陷阱"]) {
  assert.equal(fullSkill(name).skillId, null, name);
  assert.equal(fullSkill(name).names.ja, null, name);
}
for (const name of ["魔力增幅", "安希拉", "菁英狙擊", "火山塵暴", "太陽的憤怒", "月亮的憤怒", "星星的憤怒", "大地之芽"]) {
  assert(fullImportedData.records.some(record => record.skillId === fullSkill(name)?.id && record.sourceUrl.endsWith("sn=2901252")), name);
}
const rose = fullRecord("玫瑰箭矢", "kro-v1").changes.filter(change => change.item === "技能倍率");
assert.deepEqual(Array.from(rose, change => [change.before, change.after]), [[2500, 3750], [750, 1750], [3250, 5000], [975, 3750]]);
assert.match(rose[2].note, /混聲烙印.*主要/);
const midnight = fullRecord("午夜殞落", "kro-v7");
assert.equal(midnight.evidence, "article");
assert(midnight.changes.some(change => change.before === "6400%/2070%" && change.after === "6750%/8750%"));
assert(midnight.changes.every(change => change.note.includes("官方筆誤")));
const correction = fullRecord("專注瞄準", "kro-v8");
assert(correction.changes.every(change => change.after.includes("2026-09-02") && change.after.includes("移除")));
const duration = fullRecord("鋼鐵咆哮", "kro-v5").changes[0];
assert.equal(duration.before, 3);
assert.equal(duration.after, 4.5);
assert.equal(duration.unit, "秒");
const unknownDuration = fullRecord("翼梢射擊", "kro-v5").changes.find(change => change.item === "疾風加速持續時間");
assert.equal(unknownDuration.before, null);
assert.equal(unknownDuration.after, 5);
assert.equal(fullRecord("變身：猛禽", "kro-v9").evidence, "article");
// Rendering must keep the requested order even if input skills arrive out of order.
api.mount(root, { ...fullImportedData, skills: [...fullImportedData.skills].reverse() });
assert.equal(cards(), 0);
assert.equal(node("#skill-count").textContent, "共 290 筆資料");
expandAll();
assert.equal(cards(), 290);
assert.equal(records(), 642);
assert(!sources().includes("版本未知"));
assert.deepEqual(node("#skill-list").querySelectorAll().map(button => button.dataset.skill), Array.from(fullImportedData.skills, skill => skill.id));
assert.deepEqual(Array.from(results().matchAll(/<article class="skill-card"><h3>(.*?)<\/h3>/g), match => match[1]),
  Array.from(fullImportedData.skills, skill => skill.names.zhHant));
assertBrowseAll(true);
assertSharedColumns(5);
for (const job of fullImportedData.jobs) {
  dispatch("#skill-job", "change", job.id);
  const skills = fullImportedData.skills.filter(skill => skill.jobIds.includes(job.id));
  assert(skills.length > 0, `${job.name} must contain skills`);
  assert.equal(cards(), skills.length, job.name);
  assert.equal(node("#skill-count").textContent, `共 ${skills.length} 筆資料`);
  const listedIds = node("#skill-list").querySelectorAll().map(button => button.dataset.skill);
  const listed = listedIds.map(id => skills.find(skill => skill.id === id).skillId ?? Infinity);
  assert(listed.every((value, index) => !index || value >= listed[index - 1]), `${job.name} skill ID order`);
  assert.deepEqual(Array.from(results().matchAll(/<article class="skill-card"><h3>(.*?)<\/h3>/g), match => match[1]),
    Array.from(skills, skill => skill.names.zhHant), `${job.name} result order`);
}
reset();
dispatch("#skill-version", "change", "kro-unknown");
assert.equal(sources(), "");
assert.equal(cards(), 1);
assert.equal(records(), 1);
assert.match(results(), /隕石術猛擊/);
assert(!/skill-(current|carried)-badge/.test(results()));
assert(!results().includes("<time"));
reset();
dispatch("#skill-version", "change", "kro-v4-2");
assert(cards() > 1);
assert.equal((results().match(/skill-current-badge/g) || []).length, records());
assert(!results().includes("skill-carried-badge"));
reset();
console.log("Passed: all 21 jobs, 290 skills, 642 records, complete source coverage, shared jobs, corrected effects and unknown versions.");

const unknownVersionData = clone();
unknownVersionData.meta.currentVersionId = "demo-v2";
unknownVersionData.versions.push({ id: "unknown", name: "版本未知", order: 0, releasedAt: null, status: "unknown" });
unknownVersionData.announcements.push({ id: "unknown-source", versionId: "unknown", title: "來源版本未確認", publishedAt: null, url: null });
unknownVersionData.records.push({ id: "unknown-storm", skillId: "demo-storm", versionId: "unknown", announcementIds: ["unknown-source"],
  changes: [{ item: "技能效果", before: null, after: "版本未確認的調整" }] });
assert.equal(api.validateData(unknownVersionData).length, 0);
mount(root, unknownVersionData);
dispatch("#skill-query", "input", "storm");
assert.equal(records(), 2);
assert(!/skill-(current|carried)-badge/.test(results()));
dispatch("#skill-version", "change", "unknown");
assert.equal(records(), 1);
assert(!/skill-(current|carried)-badge/.test(results()));
unknownVersionData.meta.currentVersionId = "unknown";
assert(api.validateData(unknownVersionData).some(error => error.includes("未知版本")));
unknownVersionData.meta.currentVersionId = "demo-v2";
unknownVersionData.versions.at(-1).releasedAt = "2026-10-05";
assert(api.validateData(unknownVersionData).some(error => error.includes("未知版本")));
console.log("Passed: unknown-version records remain visible without current markers or inferred dates.");

for (const [name, mutate] of [
  ["unknown current version", sample => { sample.meta.currentVersionId = "missing"; }],
  ["duplicate id", sample => { sample.skills[1].id = sample.skills[0].id; }],
  ["duplicate game id", sample => { sample.skills[1].skillId = sample.skills[0].skillId; }],
  ["unknown job", sample => { sample.skills[0].jobIds = ["missing"]; }],
  ["unknown skill", sample => { sample.records[0].skillId = "missing"; }],
  ["duplicate version order", sample => { sample.versions[1].order = 1; }],
  ["cross-version announcement", sample => { sample.records[0].announcementIds = ["demo-notice-v3"]; }],
  ["missing source", sample => { sample.records[0].announcementIds = []; }],
  ["script URL", sample => { sample.announcements[0].url = "javascript:alert(1)"; }],
  ["protocol-relative URL", sample => { sample.announcements[0].url = "//example.test"; }],
  ["missing old value", sample => { delete sample.records[0].changes[0].before; }],
  ["invalid value type", sample => { sample.records[0].changes[0].after = {}; }],
  ["invalid date", sample => { sample.versions[0].releasedAt = "2026-02-31"; }],
  ["empty changes", sample => { sample.records[0].changes = []; }],
]) {
  const sample = clone();
  mutate(sample);
  assert(api.validateData(sample).length > 0, name);
}
mount(root, { schemaVersion: 99 });
assert.match(node("#skill-result-status").textContent, /無法載入技能資料/);
assert.equal(node("#skill-result-status").hidden, false);
assert.equal(node("#skill-job").disabled, true);
console.log("Passed: optional translations, skills without records, schema validation and visible load errors.");

// Check the real HTML connects the tested controls and scripts to the catalog.
const showAllButton = page.match(/<button\b[^>]*id="skill-show-all"[^>]*>/)[0];
assert.match(showAllButton, /aria-pressed="true"/);
assert.match(showAllButton, /aria-controls="skill-results"/);
assert(!showAllButton.includes("disabled"));
assert.match(page, /id="skill-picker-heading">篩選結果 /);
for (const removed of ["skill-history-heading", "skill-source", "skill-current-version", "skill-query-help"]) {
  assert(!page.includes(`id="${removed}"`));
}
assert(!page.includes("調整內容"));
assert(!page.includes("可輸入部分名稱；搜尋與職業條件會同時套用。"));
assert(!page.includes("選擇職業或搜尋技能名稱，對照每次改版的調整項目。未指定版本時顯示所有已收錄版本。"));
for (const selector of nodes.keys()) {
  if (selector.startsWith("#")) assert(page.includes(`id="${selector.slice(1)}"`), `missing HTML element ${selector}`);
}
assert(page.indexOf('src="./assets/js/tools/ragnarok/skill-change-data.js"') < page.indexOf('src="./assets/js/tools/ragnarok/skill-changes.js"'));
for (const match of page.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)) {
  assert(fs.existsSync(path.join(project, match[1])), `missing asset ${match[1]}`);
}
assert.match(read("assets/js/app.js"), /id: "ragnarok-skill-changes"[^\n]*category: "ragnarok"[^\n]*page: "\.\/ragnarok-skill-changes.html"/);
console.log("Passed: page controls, static assets, load order and Ragnarok catalog entry.");

async function testShareLinks() {
  context.window.location.hash = "#job=knight&q=%E6%96%AC&version=demo-v3&skill=demo-slash&no=1";
  mount(root, data);
  assert.equal(node("#skill-job").value, "knight");
  assert.equal(node("#skill-query").value, "斬");
  assert.equal(node("#skill-version").value, "demo-v3");
  assert.equal(cards(), 1);
  assertBrowseAll(false);
  assert.equal(node("#skill-home-link").hidden, true);
  assert.match(node("#skill-list").innerHTML, /data-skill="demo-slash" aria-pressed="true"/);
  await node("#skill-copy-filters").listeners.click({ currentTarget: node("#skill-copy-filters") });
  let params = new URLSearchParams(new URL(copiedLinks.at(-1)).hash.slice(1));
  assert.equal(params.get("job"), "knight");
  assert.equal(params.get("q"), "斬");
  assert.equal(params.get("version"), "demo-v3");
  assert.equal(params.get("skill"), "demo-slash");
  assert.equal(params.get("no"), "1");
  const skillButton = { dataset: { copySkill: "demo-slash" }, textContent: "複製技能連結" };
  await node("#skill-results").listeners.click({ target: { closest: () => skillButton } });
  params = new URLSearchParams(new URL(copiedLinks.at(-1)).hash.slice(1));
  assert.equal(params.get("job"), "knight");
  assert.equal(params.get("skill"), "demo-slash");
  assert.equal(params.has("q"), false);
  assert.equal(params.get("no"), "1");
  context.window.location.href = copiedLinks.at(-1);
  windowListeners.hashchange();
  assert.equal(node("#skill-query").value, "");
  assert.equal(cards(), 1);
  assertBrowseAll(false);
  context.window.location.hash = "#main";
  windowListeners.hashchange();
  assert.equal(cards(), 1);
  assert.equal(node("#skill-home-link").hidden, true);
  context.window.location.hash = "#job=invalid&version=invalid&skill=invalid";
  windowListeners.hashchange();
  assert.equal(node("#skill-job").value, "");
  assert.equal(node("#skill-version").value, "");
  assert.equal(node("#skill-home-link").hidden, false);
  assert.equal(cards(), 0);
  expandAll();
  assert.equal(cards(), 5);
  assertBrowseAll(true);
  // Shared skills retain the selected applicable job, or choose the first job by display order.
  dispatch("#skill-job", "change", "swordsman");
  await node("#skill-results").listeners.click({ target: { closest: () => skillButton } });
  params = new URLSearchParams(new URL(copiedLinks.at(-1)).hash.slice(1));
  assert.equal(params.get("job"), "swordsman");
  reset();
  await node("#skill-results").listeners.click({ target: { closest: () => skillButton } });
  params = new URLSearchParams(new URL(copiedLinks.at(-1)).hash.slice(1));
  assert.equal(params.get("job"), data.skills.find(skill => skill.id === "demo-slash").jobIds[0]);
  assert.match(results(), /data-copy-skill="demo-slash"/);
  // Clipboard permissions/availability failures fall back to copying a temporary textarea.
  context.window.navigator.clipboard.writeText = async () => { throw new Error("Denied"); };
  await node("#skill-copy-filters").listeners.click({ currentTarget: node("#skill-copy-filters") });
  assert.equal(fallbackInput.selected, true);
  assert.equal(fallbackInput.removed, true);
  assert.equal(node("#skill-copy-filters").focused, true);
  assert.match(node("#skill-copy-status").textContent, /已複製/);
  fallbackCopySucceeds = false;
  const previousCopies = copiedLinks.length;
  await node("#skill-copy-filters").listeners.click({ currentTarget: node("#skill-copy-filters") });
  assert.equal(copiedLinks.length, previousCopies);
  assert.equal(fallbackInput.removed, true);
  assert.match(node("#skill-copy-status").textContent, /無法複製/);
  console.log("Passed: clipboard links restore filters/selection, skill links choose applicable jobs, no persists, and invalid parameters are ignored.");
}
testShareLinks().catch(error => { console.error(error); process.exitCode = 1; });
