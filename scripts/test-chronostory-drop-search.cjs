// Run with Node.js: node scripts/test-chronostory-drop-search.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const nodes = new Map();
function node(selector) {
  if (!nodes.has(selector)) nodes.set(selector, {
    innerHTML: '', value: '', hidden: false, disabled: false,
    listeners: {}, classList: { toggle() {} },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute() {}, focus() {}, scrollIntoView() {}, querySelectorAll() { return []; },
  });
  return nodes.get(selector);
}
const modes = ['regions', 'items', 'jobs'].map(mode => Object.assign(node(mode), { dataset: { mode } }));
const root = { innerHTML: '', querySelector: node, querySelectorAll: selector => selector === '[data-mode]' ? modes : [] };
const location = { hash: '' };
const windowListeners = {};
const navigation = [];
let navigationIndex = 0;
const browserHistory = {
  state: null,
  replaceState(state, unused, hash) {
    this.state = structuredClone(state);
    location.hash = hash;
    navigation[navigationIndex] = { state: this.state, hash };
  },
  pushState(state, unused, hash) {
    navigation.splice(++navigationIndex);
    this.replaceState(state, unused, hash);
  },
  go(delta) {
    navigationIndex += delta;
    const entry = navigation[navigationIndex];
    this.state = structuredClone(entry.state);
    location.hash = entry.hash;
    windowListeners.popstate({ state: this.state });
    windowListeners.hashchange();
  },
  back() { this.go(-1); },
};
const context = vm.createContext({ location, window: {
  history: browserHistory,
  addEventListener(type, fn) { windowListeners[type] = fn; }, matchMedia: () => ({ matches: false }),
} });
vm.runInContext(fs.readFileSync(path.join(base, 'assets/js/tools/chronostory/drop-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(base, 'assets/js/tools/chronostory/drop-search.js'), 'utf8')
  .replace('void renderChronostoryDropSearch();', ''), context);
context.root = root;
vm.runInContext('mountChronoStoryDropSearch(root, window.chronoStoryDropData)', context);
const data = context.window.chronoStoryDropData;
function change(selector, value) {
  node(selector).value = value;
  node(selector).listeners.change({ target: { value } });
}
assert.equal(location.hash, '#regions');
assert(!root.innerHTML.includes('drop-source'));
assert(!root.innerHTML.includes('魔物名稱查詢'));
assert(!root.innerHTML.includes('支援部分名稱'));
assert(root.innerHTML.indexOf('id="drop-kind"') < root.innerHTML.indexOf('id="drop-job"'));
assert(root.innerHTML.indexOf('id="drop-job"') < root.innerHTML.indexOf('id="drop-query"'));
const itemResults = context.findChronoStoryEntries(data, { mode: 'items', query: '', kind: '', job: '' });
for (let i = 1; i < itemResults.length; i++) {
  assert(context.compareChronoStoryDrops(itemResults[i - 1], itemResults[i]) <= 0);
}
const regions = [...new Set(data.summary.map(entry => entry.region))];
const areaMarkup = root.innerHTML.match(/<select id="drop-area">(.*?)<\/select>/s)[1];
assert.deepEqual([...areaMarkup.matchAll(/<option value="([^"]+)">/g)].map(m => m[1]), regions);
for (const region of regions) {
  change('#drop-area', region);
  const actual = [...node('#drop-monster').innerHTML.matchAll(/<option value="([^"]+)">/g)].map(m => m[1]);
  assert.deepEqual(actual, Array.from(data.summary.filter(entry => entry.region === region), entry => entry.monsterId));
}
const first = data.summary[0];
change('#drop-area', first.region);
change('#drop-monster', first.monsterId);
const previous = node('#drop-detail-body').innerHTML;
change('#drop-area', regions[1]);
assert.equal(node('#drop-detail-body').innerHTML, previous);
assert.equal(node('#drop-monster').value, '');
change('#drop-monster', '');
assert.equal(node('#drop-detail-body').innerHTML, previous);
const next = data.summary.find(entry => entry.region === regions[1]);
change('#drop-monster', next.monsterId);
assert.notEqual(node('#drop-detail-body').innerHTML, previous);
function displayedIds() {
  return [...node('#drop-detail-body').innerHTML.matchAll(/data-related="([^"]+)"/g)].map(m => m[1]).sort();
}
function expectedIds(kind, job = '') {
  return Array.from(data.drops.filter(drop => drop.monsterId === next.monsterId && data.items.some(item =>
    item.id === drop.itemId && item.kind === kind && (!job || item.jobs.includes(job)))), drop => drop.itemId).sort();
}
change('#drop-kind', 'equipment');
assert.deepEqual(displayedIds(), expectedIds('equipment'));
change('#drop-job', '劍士');
assert.deepEqual(displayedIds(), expectedIds('equipment', '劍士'));
change('#drop-kind', 'scroll');
assert.equal(node('#drop-job').value, '');
assert.equal(node('#drop-job').disabled, true);
assert.deepEqual(displayedIds(), expectedIds('scroll'));
const testEquipment = data.items.find(item => item.kind === 'equipment' && item.categories.length
  && data.drops.some(drop => drop.monsterId === next.monsterId && drop.itemId === item.id));
const testPart = context.chronoStoryEquipmentParts(testEquipment)[0];
change('#drop-kind', `equipment:${testPart}`);
const weaponIds = Array.from(data.drops.filter(drop => drop.monsterId === next.monsterId
  && data.items.some(item => item.id === drop.itemId && item.kind === 'equipment' && context.chronoStoryEquipmentParts(item).includes(testPart))), drop => drop.itemId).sort();
assert.deepEqual(displayedIds(), weaponIds);
for (const label of ['道具類型', '裝備職業', '等級需求', '最高能力值總和']) {
  assert(node('#drop-detail-body').innerHTML.includes(`<th scope="col">${label}</th>`));
}
assert(weaponIds.length > 0);
const originalDetail = node('#drop-detail-body').innerHTML;
node('#drop-detail-body').listeners.click({ target: { closest: () => ({ dataset: { related: weaponIds[0] } }) } });
assert.equal(location.hash, '#items');
browserHistory.back();
assert.equal(location.hash, '#regions');
assert.equal(node('#drop-kind').value, `equipment:${testPart}`);
assert.equal(node('#drop-monster').value, next.monsterId);
assert.equal(node('#drop-detail-body').innerHTML, originalDetail);
browserHistory.go(1);
assert.equal(location.hash, '#items');
node('#drop-back').listeners.click();
assert.equal(node('#drop-detail-body').innerHTML, originalDetail);
const describe = context.describeChronoStoryElements;
assert.equal(describe({ element: '火', damageEffect: 'increase' }), '此魔物受到的火屬性傷害會提高。');
assert.equal(describe({ element: '冰', damageEffect: 'decrease', qualifier: '魚屋' }), '魚屋：此魔物受到的冰屬性傷害會降低。');
assert(!node('#drop-detail-body').innerHTML.includes('僅顯示已收錄的掉落'));
const makeItem = (category, job = '劍士', level = 80, stats = '力量 + 5', kind = 'equipment') => ({
  name: category, kind, categories: [category], jobs: [job], summaryNotes: [],
  variants: [{ category, stats, requirement: { type: 'level', value: level } }],
});
const compare = context.compareChronoStoryDrops;
const ordered = ['武器', '帽子', '上衣', '褲子', '套服', '手套', '鞋子'].map(part => makeItem(part))
  .concat(['單手劍', '盾牌攻擊', '頭盔智力', '上衣力量', '褲裙敏捷', '套服敏捷', '手套攻擊', '鞋子跳躍', '飾品力量']
    .map(part => makeItem(part, '', 0, '', 'scroll')));
assert.deepEqual([...ordered].reverse().sort(compare), ordered);
const jobs = ['劍士', '法師', '弓箭手', '盜賊', '海盜'].map(job => makeItem('武器', job));
assert.deepEqual([...jobs].reverse().sort(compare), jobs);
assert(compare(makeItem('武器', '劍士', 80, '力量 + 99'), makeItem('武器', '劍士', 90, '力量 + 1')) < 0);
assert(compare(makeItem('帽子', '劍士', 80, '力量 + 5、物理防禦 + 999'), makeItem('帽子', '劍士', 80, '力量 + 6、魔法防禦 + 1')) < 0);
const lukOnly = makeItem('武器', '法師', 20);
lukOnly.variants[0].requirement.type = 'luk';
assert.equal(context.chronoStoryItemColumns(lukOnly)[2], '未記載');
assert.equal(context.chronoStoryItemColumns(makeItem('帽子', '劍士', 80, '力量 + 5、物理防禦 + 999'))[3], '5');
assert(context.matchesChronoStoryItem(makeItem('帽子'), { kind: 'equipment:頭盔', job: '' }));
assert(compare(makeItem('武器', '法師', 100), lukOnly) < 0);
assert(compare(makeItem('披風'), makeItem('單手劍', '', 0, '', 'scroll')) < 0);
const scroll70 = makeItem('單手劍', '', 0, '力量 + 99', 'scroll');
scroll70.variants[0].successPercent = 70;
const scroll10 = makeItem('單手劍', '', 0, '力量 + 1', 'scroll');
scroll10.variants[0].successPercent = 10;
assert(compare(scroll70, scroll10) < 0);
assert.equal(context.chronoStoryItemColumns(scroll70)[3], '—');
const sameRate = makeItem('單手斧', '', 999, '力量 + 999', 'scroll');
sameRate.variants[0].successPercent = 70;
assert.notEqual(compare(scroll70, sameRate), 0);
const groupedScrolls = [
  ['單手劍攻擊卷軸10%', 10], ['單手斧攻擊卷軸60%', 60],
  ['單手劍攻擊詛咒卷軸70%', 70], ['單手斧攻擊卷軸10%', 10],
  ['單手劍攻擊卷軸60%', 60],
].map(([name, successPercent]) => {
  const item = makeItem(name, '', 0, '', 'scroll');
  item.variants[0].successPercent = successPercent;
  return item;
}).sort(compare);
const swordPositions = groupedScrolls.map((item, i) => item.name.startsWith('單手劍') ? i : -1).filter(i => i >= 0);
assert.equal(swordPositions[2] - swordPositions[0], 2);
assert.deepEqual(groupedScrolls.filter(item => item.name.startsWith('單手劍')).map(item => item.variants[0].successPercent), [70, 60, 10]);
assert.deepEqual(groupedScrolls.filter(item => item.name.startsWith('單手斧')).map(item => item.variants[0].successPercent), [60, 10]);
const totalLow = makeItem('武器');
totalLow.variants[0].totalMaxStats = '3';
const totalHigh = makeItem('武器', '劍士', 80, '力量 + 1');
totalHigh.variants[0].totalMaxStats = '10';
assert(compare(totalLow, totalHigh) < 0);
node('#drop-reset').listeners.click();
assert.equal(node('#drop-detail-body').innerHTML, '');
assert.equal(node('#drop-kind').value, '');
console.log('Passed: summary order, retained details, selection, filters, elements, reset, default mode.');

const strength = '盜賊 (力量／幸運)', dexterity = '盜賊 (敏捷／幸運)';
const equipment = (id, build, category, total) => ({ id, name: id, kind: 'equipment', categories: [category],
  jobs: ['盜賊'], summaryNotes: [], variants: [{ job: '盜賊', build, category, totalMaxStats: String(total) }] });
const fixture = { items: [equipment('a', strength, '帽子', 20), equipment('b', strength, '帽子', 20),
  equipment('c', strength, '帽子', 19), equipment('d', dexterity, '帽子', 18), equipment('e', strength, '鞋子', 10)] };
const stateForJobs = { query: '', professions: [], parts: [] };
const find = state => context.findChronoStoryJobEntries(fixture, { ...stateForJobs, ...state });
assert.equal(find({}).length, 5);
assert.equal(find({ professions: [strength], parts: ['頭盔'] }).length, 3);
assert.equal(find({ professions: [dexterity] })[0].id, 'd');
assert.equal(find({ professions: [strength, dexterity] }).length, 5);
assert.equal(find({ equipLevels: ['999'], equipLevel: '999' }).length, 5);
const leaders = context.createChronoStoryLeaders(fixture);
assert.equal(leaders(fixture.items[0]).length, 1);
assert.equal(leaders(fixture.items[1]).length, 1);
assert.equal(leaders(fixture.items[2]).length, 0);
assert.equal(leaders(fixture.items[3]).length, 1);
assert.equal(leaders(fixture.items[4]).length, 1);
assert.equal(leaders(find({ query: 'c' })[0]).length, 0);

modes.find(mode => mode.dataset.mode === 'jobs').listeners.click();
assert.equal(browserHistory.state.chronoStory.state.professions.length, 0);
assert(!root.innerHTML.includes('drop-equip-level'));
assert(!root.innerHTML.includes('drop-build'));
const choose = (control, value) => node(control).listeners.click({ target: { closest: () => ({ dataset: { choice: value } }) } });
choose('#drop-profession', strength);
choose('#drop-profession', dexterity);
assert.deepEqual(Array.from(browserHistory.state.chronoStory.state.professions), [strength, dexterity]);
choose('#drop-part', '頭盔');
assert(node('#drop-result-list').innerHTML.includes('最高能力值總和'));
assert(node('#drop-result-list').innerHTML.includes('drop-best-result'));
const bestId = data.items.find(item => item.name === '藍色阿爾納帽').id;
modes.find(mode => mode.dataset.mode === 'items').listeners.click();
node('#drop-query').listeners.input({ target: { value: '藍色阿爾納帽' } });
assert(node('#drop-detail-body').innerHTML.includes('最高能力值總和 19'));
assert(node('#drop-detail-body').innerHTML.includes('弓箭手・頭盔最高'));
assert(node('#drop-result-list').innerHTML.includes('drop-best-result'));
assert(node('#drop-result-list').innerHTML.includes(bestId));
const relatedMonster = node('#drop-detail-body').innerHTML.match(/data-related="([^"]+)"/)[1];
node('#drop-detail-body').listeners.click({ target: { closest: () => ({ dataset: { related: relatedMonster } }) } });
browserHistory.back();
assert(node('#drop-detail-body').innerHTML.includes('最高能力值總和 19'));
node('#drop-reset').listeners.click();
assert.equal(browserHistory.state.chronoStory.state.professions.length, 0);
console.log('Passed: all professions, split thief builds, no level filter, tied global leaders and detail labels.');

const bis = context.createChronoStoryBis(fixture, strength);
assert.equal(bis.get('頭盔').length, 2);
assert.equal(bis.get('頭盔')[0].value, 20);
assert.equal(bis.get('頭盔')[0].entries.length, 2);
assert.equal(bis.get('頭盔')[1].rank, 2);
assert.equal(context.createChronoStoryBis(fixture, '').size, 0);
assert.equal(context.createChronoStoryBis(fixture, dexterity).get('頭盔')[0].entries[0].item.id, 'd');
modes.push(Object.assign(node('bis'), { dataset: { mode: 'bis' } }));
// Remount to wire the newly added mode in this lightweight DOM fixture.
vm.runInContext('mountChronoStoryDropSearch(root, window.chronoStoryDropData)', context);
modes.find(mode => mode.dataset.mode === 'bis').listeners.click();
assert.equal(location.hash, '#bis');
assert.equal(node('#drop-bis-results').innerHTML, '');
assert(!node('#drop-bis-profession').innerHTML.includes('aria-pressed="true"'));
assert(node('.drop-browser').hidden);
const chooseBis = job => node('#drop-bis-profession').listeners.click({ target: { closest: () => ({ dataset: { bisJob: job } }) } });
chooseBis(strength);
assert.equal(browserHistory.state.chronoStory.state.bisJob, strength);
assert.equal((node('#drop-bis-profession').innerHTML.match(/aria-pressed="true"/g) || []).length, 2);
for (const label of ['等級需求', '最高能力值總和', '掉落來源', '更高', '更低']) {
  assert(node('#drop-bis-results').innerHTML.includes(label));
}
const realBis = context.createChronoStoryBis(data, strength);
const [part, tiers] = [...realBis].find(([, tiers]) => tiers.length > 1);
const step = direction => node('#drop-bis-results').listeners.click({ target: { closest: () => ({ dataset: { bisPart: part, bisStep: String(direction) }, disabled: false }) } });
step(1);
assert.equal(browserHistory.state.chronoStory.state.bisTiers[part], 1);
assert.equal(Object.keys(browserHistory.state.chronoStory.state.bisTiers).length, 1);
assert(node('#drop-bis-results').innerHTML.includes(`最高能力值總和 ${tiers[1].value}`));
step(-1);
assert.equal(browserHistory.state.chronoStory.state.bisTiers[part], 0);
step(-1);
assert.equal(browserHistory.state.chronoStory.state.bisTiers[part], 0);
chooseBis(dexterity);
assert.equal(browserHistory.state.chronoStory.state.bisJob, dexterity);
assert.equal(Object.keys(browserHistory.state.chronoStory.state.bisTiers).length, 0);
node('#drop-reset').listeners.click();
assert.equal(node('#drop-bis-results').innerHTML, '');
assert.equal(browserHistory.state.chronoStory.state.bisJob, '');
console.log('Passed: BIS ties, rankings, no default, single profession, independent tiers, boundaries and reset.');

chooseBis('盜賊');
assert.equal(browserHistory.state.chronoStory.state.bisJob, dexterity);
assert.equal(node('.drop-search-actions').hidden, true);
assert(node('#drop-bis-profession').innerHTML.includes('drop-bis-builds'));
assert(node('#drop-bis-results').innerHTML.includes('drop-bis-data'));
chooseBis('劍士');
assert.equal(browserHistory.state.chronoStory.state.bisJob, '劍士');
assert.equal((node('#drop-bis-profession').innerHTML.match(/aria-pressed="true"/g) || []).length, 1);
modes.find(mode => mode.dataset.mode === 'bis').listeners.click();
assert.equal(node('#drop-result-status').textContent, '');
assert.equal(node('#drop-result-status').hidden, true);
modes.find(mode => mode.dataset.mode === 'items').listeners.click();
assert.equal(node('.drop-search-actions').hidden, false);
console.log('Passed: thief defaults to dexterity, grouped buttons and BIS-only hidden controls.');

modes.find(mode => mode.dataset.mode === 'bis').listeners.click();
chooseBis('劍士');
assert(!node('#drop-bis-results').innerHTML.includes('最優選'));
assert(!node('#drop-bis-results').innerHTML.includes('<p>最高能力值總和：'));
assert(node('#drop-bis-results').innerHTML.includes('第 1 名 · 最高能力值總和'));

context.sharedFixture = {
  items: fixture.items,
  monsters: [{ id: 'shared', name: '進化迅猛龍' }, { id: 'solo', name: '單一來源' }],
  summary: [],
  drops: [
    { itemId: 'a', monsterId: 'shared', observations: [{ region: '區域一' }] },
    { itemId: 'e', monsterId: 'shared', observations: [{ region: '區域二' }] },
    { itemId: 'b', monsterId: 'solo', observations: [] },
    { itemId: 'b', monsterId: 'solo', observations: [{ region: '另一區域' }] },
  ],
};
vm.runInContext('mountChronoStoryDropSearch(root, sharedFixture)', context);
modes.find(mode => mode.dataset.mode === 'bis').listeners.click();
chooseBis(strength);
let sharedMarkup = node('#drop-bis-results').innerHTML;
assert(!sharedMarkup.includes('class="drop-bis-shared-item"'));
assert.equal((sharedMarkup.match(/data-bis-source="shared"/g) || []).length, 2);
const hoverItems = ['shared', 'shared', 'solo'].map(id => {
  const source = { dataset: { bisSource: id }, setAttribute() {}, classList: { toggle(name, value) { this[name] = value; } } };
  return { source, querySelectorAll: () => [source], classList: { toggle(name, value) { this[name] = value; } } };
});
node('#drop-bis-results').querySelectorAll = () => hoverItems;
const sourceEvent = { target: { closest: () => hoverItems[0].source } };
node('#drop-bis-results').listeners.mouseover(sourceEvent);
assert.deepEqual(hoverItems.map(item => item.classList['drop-bis-hover-item']), [true, true, false]);
node('#drop-bis-results').listeners.mouseout(sourceEvent);
assert(hoverItems.every(item => !item.classList['drop-bis-shared-item'] && !item.source.classList['drop-bis-shared-source']));
node('#drop-bis-results').listeners.click(sourceEvent);
node('#drop-bis-results').listeners.mouseout(sourceEvent);
assert.deepEqual(hoverItems.map(item => item.classList['drop-bis-shared-item']), [true, true, false]);
const otherSourceEvent = { target: { closest: () => hoverItems[2].source } };
node('#drop-bis-results').listeners.mouseover(otherSourceEvent);
assert.equal(hoverItems[2].classList['drop-bis-hover-item'], true);
const overlap = { dataset: { bisSource: 'solo' }, setAttribute() {}, classList: { toggle() {} } };
hoverItems[0].querySelectorAll = () => [hoverItems[0].source, overlap];
node('#drop-bis-results').listeners.mouseover(otherSourceEvent);
assert.equal(hoverItems[0].classList['drop-bis-shared-item'], true);
assert.equal(hoverItems[0].classList['drop-bis-hover-item'], false);
node('#drop-bis-results').listeners.click(sourceEvent);
assert(hoverItems.every(item => !item.classList['drop-bis-shared-item']));
node('#drop-bis-results').listeners.mouseout(otherSourceEvent);
assert(hoverItems.every(item => !item.classList['drop-bis-hover-item']));
node('#drop-bis-results').querySelectorAll = () => [];
node('#drop-bis-results').listeners.click({ target: { closest: () => ({ dataset: { bisPart: '頭盔', bisStep: '1' }, disabled: false }) } });
assert(!node('#drop-bis-results').innerHTML.includes('class="drop-bis-shared-item"'));
console.log('Passed: shared monster highlights across regions, distinct item counting and tier refresh.');
