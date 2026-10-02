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
function node(selector) {
  if (!nodes.has(selector)) nodes.set(selector, {
    innerHTML: "", textContent: "", value: "", hidden: false, disabled: false, listeners: {},
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
  addEventListener(type, listener) { windowListeners[type] = listener; },
  getComputedStyle() { return { fontFamily: "sans-serif" }; },
  ResizeObserver: class {
    constructor(callback) { this.callback = callback; layoutObservers.push(this); }
    observe(target) { this.target = target; }
  },
}, URL, document: {
  querySelector: selector => selector === "#skill-changes-tool" ? root : node(selector),
  createElement(tag) {
    assert.equal(tag, "canvas");
    return { getContext: () => ({ measureText: value => ({ width: Array.from(String(value)).reduce((width, char) => width + (char.codePointAt(0) >= 0x2e80 ? 13 : 7), 0) }) }) };
  },
} });
vm.runInContext(read("assets/js/tools/ragnarok/skill-change-data.js"), context);
const importedData = context.window.ragnarokSkillChangeData;
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
const reset = () => node("#skill-reset").listeners.click();
const results = () => node("#skill-results").innerHTML;
const sources = () => node("#skill-announcement-list").innerHTML;
const cards = () => (results().match(/class="skill-card"/g) || []).length;
const records = () => (results().match(/data-record="/g) || []).length;
const tables = () => (results().match(/<table /g) || []).length;
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
assert.equal(api.formatValue(0, "秒"), "0秒");
assert.equal(api.formatValue(null, "%"), "未記載");
assert.equal(api.formatValue("5 x 5"), "5 x 5");
assert.equal(api.formatValue(400, "%"), "400%");
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
assert.match(node("#skill-result-status").textContent, /5 個技能、8 筆調整記錄.*所有版本/);
assert.equal((results().match(/class="skill-version-rows is-current"/g) || []).length, 3);
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
assert.match(results(), /0秒/);
assert.match(results(), /未記載/);
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
assertSharedColumns(5);
const initialWidths = renderedWidths();
resizeResults(760);
assertSharedColumns(5);
assert.notDeepEqual(renderedWidths(), initialWidths); // widths recalculate without crossing the merged-table breakpoint
resizeResults(900);
assert.deepEqual(renderedWidths(), initialWidths);

select("demo-slash");
assert.equal(tables(), 1);
assert.equal(records(), 3);
assert(results().indexOf("示範版本 3") < results().indexOf("示範版本 2"));
assert(results().indexOf("示範版本 2") < results().indexOf("示範版本 1"));
resizeResults(719);
assert.equal(tables(), 3);
assertSharedColumns(4);
assert(!results().includes("skill-merged-table"));
assert.equal((results().match(/class="skill-version-record is-current"/g) || []).length, 1);
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
dispatch("#skill-version", "change", "demo-v3");
assert.equal(records(), 0);
assert.match(results(), /此技能在所選版本未收錄調整記錄/);
assert.match(sources(), /示範版本 3/);
assert(!sources().includes("初次技能調整"));
assert.match(node("#skill-list").innerHTML, /連續攻擊/); // version does not hide a job's skills
dispatch("#skill-query", "input", "");
select("demo-slash");
assert.equal(cards(), 1);
assert.equal(records(), 1);
assert.equal(node("#skill-show-all").disabled, false);
dispatch("#skill-version", "change", "");
assert.equal(records(), 3);
node("#skill-show-all").listeners.click();
assert.equal(cards(), 2);
assert.equal(node("#skill-show-all").disabled, true);
select("demo-slash");
dispatch("#skill-query", "input", "combo"); // incompatible selection must be cleared
assert.equal(cards(), 1);
assert.equal(node("#skill-show-all").disabled, true);
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
console.log("Passed: mounted selection, filters, reset, zero/missing data, empty results and version-only sources.");

const changedCurrent = clone();
changedCurrent.meta.currentVersionId = "demo-v2";
changedCurrent.meta.isDemo = false;
changedCurrent.announcements[0].url = "https://official.example.test/maintenance?id=1&lang=ko";
api.mount(root, changedCurrent);
assert.equal(node("#skill-data-notice").hidden, true);
assert.match(node("#skill-current-version").textContent, /現行版本：示範版本 2/);
const currentBlocks = Array.from(results().matchAll(/class="skill-version-rows is-current"[\s\S]*?<span>(.*?)<\/span>/g), match => match[1]);
assert.equal(currentBlocks.length, 3);
assert(currentBlocks.every(name => name === "示範版本 2"));
assert.match(sources(), /href="https:\/\/official\.example\.test\/maintenance\?id=1&amp;lang=ko"/);
assert.match(sources(), /target="_blank" rel="noopener noreferrer"/);

const escaped = clone();
escaped.skills[0].names.zhHant = '<script>alert("skill")</script>';
escaped.records[0].changes[0].note = '<img src=x onerror="alert(1)">';
escaped.announcements[0].title = '<script>alert("notice")</script>';
api.mount(root, escaped);
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
api.mount(root, missingTranslations);
assert.match(results(), /此技能尚未收錄調整記錄/);
for (const label of ["技能所屬職業", "技能 ID", "技能韓文名稱", "技能日文名稱", "技能英文名稱"]) {
  assert(results().includes(`(缺少${label})`));
}
assert.match(node("#skill-list").innerHTML, /\(缺少技能 ID\)/);
const whitespaceTranslations = clone();
whitespaceTranslations.skills[0].names.ko = " ";
whitespaceTranslations.skills[0].names.ja = "";
whitespaceTranslations.skills[0].names.en = null;
api.mount(root, whitespaceTranslations);
assert.match(results(), /\(缺少技能韓文名稱\)/);
assert.match(results(), /\(缺少技能日文名稱\)/);
assert.match(results(), /\(缺少技能英文名稱\)/);

const ResizeObserver = context.window.ResizeObserver;
delete context.window.ResizeObserver;
api.mount(root, data);
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
assert.equal(importedData.meta.currentVersionId, "kro-v8");
assert.equal(importedData.skills.length, 12);
assert.equal(importedData.versions.length, 10);
assert.equal(importedData.records.length, 36);
assert.equal(importedData.records.reduce((sum, record) => sum + record.changes.length, 0), 97);
assert.equal(api.findSkills(importedData, { jobId: "dragon-knight" }).length, 12);
assert.deepEqual(ids(api.findSkills(importedData, { query: "5213" })), ["dk-5213"]);
assert.equal(api.findSkills(importedData, { query: "서번트" }).length, 5);
assert(importedData.skills.every(skill => Number.isInteger(skill.skillId) && skill.names.ko));
assert(importedData.skills.every(skill => skill.names.en === null && skill.names.ja === null));
const planned = importedData.versions.find(version => version.id === "kro-v9");
assert.equal(planned.status, "planned");
assert.equal(planned.releasedAt, null);
assert.equal(planned.announcedAt, "2026-09-30");
const plannedChange = api.findRecords(importedData, "dk-6608", "kro-v9")[0].changes[0];
assert.equal(plannedChange.before, 0.7);
assert.equal(plannedChange.after, 0.5);
const vigor = api.findRecords(importedData, "dk-5212", "kro-v8")[0];
assert.equal(vigor.evidence, "player-test");
assert.match(vigor.changes[0].note, /玩家測試.*官方更新清單未載明/);
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

api.mount(root, importedData);
assert.equal(cards(), 12);
assert.equal(tables(), 12);
assert.equal(records(), 36);
assertSharedColumns(5);
assert.match(results(), /預告・尚未實裝/);
assert.match(results(), /公布：<time datetime="2026-09-30"/);
assert.match(results(), /\(缺少技能英文名稱\)/);
assert.match(results(), /\(缺少技能日文名稱\)/);
assert.match(node("#skill-source").innerHTML, /sn=2901200/);
assert.match(node("#skill-data-notice").textContent, /盧恩龍爵.*來源文章/);
assert.equal((results().match(/class="skill-version-rows is-current"/g) || []).length, 3);
assert.equal((sources().match(/href="https:\/\/ro\.gnjoy\.com\//g) || []).length, 10);
assert.match(sources(), /開發者筆記/);
assert(!results().includes("900001"));
dispatch("#skill-query", "input", "死侍武器-斬裂");
assert.equal(cards(), 1);
assert.equal(tables(), 1);
assert.equal(records(), 2);
dispatch("#skill-version", "change", "kro-v9");
assert.equal(records(), 1);
assert(!results().includes("skill-current-badge"));
assert.match(results(), /0\.7秒/);
assert.match(results(), /0\.5秒/);
resizeResults(500);
assert.equal(records(), 1);
assert.match(results(), /預告・尚未實裝/);
reset();
assert.equal(tables(), 36);
assertSharedColumns(4);
resizeResults(900);
assert.equal(tables(), 12);
assertSharedColumns(5);
const badCurrent = JSON.parse(JSON.stringify(importedData));
badCurrent.meta.currentVersionId = "kro-v9";
assert(api.validateData(badCurrent).some(error => error.includes("作為現行版本")));
console.log("Passed: real Dragon Knight import, source links, conditional values, player evidence and planned/current versions.");

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
api.mount(root, { schemaVersion: 99 });
assert.match(node("#skill-result-status").textContent, /無法載入技能資料/);
assert.equal(node("#skill-job").disabled, true);
console.log("Passed: optional translations, skills without records, schema validation and visible load errors.");

// Check the real HTML connects the tested controls and scripts to the catalog.
for (const selector of nodes.keys()) {
  if (selector.startsWith("#")) assert(page.includes(`id="${selector.slice(1)}"`), `missing HTML element ${selector}`);
}
assert(page.indexOf('src="./assets/js/tools/ragnarok/skill-change-data.js"') < page.indexOf('src="./assets/js/tools/ragnarok/skill-changes.js"'));
for (const match of page.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)) {
  assert(fs.existsSync(path.join(project, match[1])), `missing asset ${match[1]}`);
}
assert.match(read("assets/js/app.js"), /id: "ragnarok-skill-changes"[^\n]*category: "ragnarok"[^\n]*page: "\.\/ragnarok-skill-changes.html"/);
console.log("Passed: page controls, static assets, load order and Ragnarok catalog entry.");
