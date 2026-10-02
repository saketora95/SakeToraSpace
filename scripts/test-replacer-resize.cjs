// Run with Node.js: node scripts/test-replacer-resize.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(base, 'assets/js/tools/ragnarok/simple-replacer.js'), 'utf8');
const resizeCode = source.slice(source.indexOf('if (typeof ResizeObserver'), source.indexOf('let controller'));
function editor() {
  return { height: 300, style: {}, getBoundingClientRect() { return { height: parseFloat(this.style.height) || this.height }; } };
}
const input = editor(), output = editor();
let callback;
const observed = [];
vm.runInNewContext(resizeCode, { input, output, ResizeObserver: class {
  constructor(fn) { callback = fn; }
  observe(editor) { observed.push(editor); }
} });
assert.deepEqual(observed, [input, output]);
callback([{ target: input }, { target: output }]);
assert.equal(output.style.height, undefined);
input.height = 420;
callback([{ target: input }]);
assert.equal(output.style.height, '420px');
callback([{ target: output }]);
assert.equal(input.style.height, undefined);
output.style.height = '250px';
callback([{ target: output }]);
assert.equal(input.style.height, '250px');
callback([{ target: input }]);
assert.equal(output.style.height, '250px');
for (const page of ['ragnarok-replacer.html', 'simple-replacer.html']) {
  assert(fs.readFileSync(path.join(base, page), 'utf8').includes('./assets/js/tools/ragnarok/simple-replacer.js'));
}
console.log('Passed: both pages share bidirectional height synchronization without feedback.');
