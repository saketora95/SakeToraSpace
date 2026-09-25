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
    setAttribute() {}, focus() {}, scrollIntoView() {},
  });
  return nodes.get(selector);
}
const modes = ['regions', 'items'].map(mode => Object.assign(node(mode), { dataset: { mode } }));
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
for (const label of ['道具類型', '裝備職業', '等級需求', '總屬性值']) {
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
assert.equal(compare(scroll70, sameRate), 0);
const totalLow = makeItem('武器');
totalLow.variants[0].totalMaxStats = '3';
const totalHigh = makeItem('武器', '劍士', 80, '力量 + 1');
totalHigh.variants[0].totalMaxStats = '10';
assert(compare(totalLow, totalHigh) < 0);
node('#drop-reset').listeners.click();
assert.equal(node('#drop-detail-body').innerHTML, '');
assert.equal(node('#drop-kind').value, '');
console.log('Passed: summary order, retained details, selection, filters, elements, reset, default mode.');
