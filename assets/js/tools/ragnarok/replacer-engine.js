"use strict";

// Stable sorting preserves the unified table's order for equally long keys.
const replacerWords = Object.entries(replaceDictionary)
  .filter(([word]) => word.length > 0).sort((a, b) => [...b[0]].length - [...a[0]].length);
// Keep the data grouped for maintainers; sort copies of each layer for execution.
const sortReplacerLayer = rules => [...rules].sort((a, b) => [...b.pattern].length - [...a.pattern].length);
const replacerPatterns = [...sortReplacerLayer(firstLayerRegexRules), ...sortReplacerLayer(secondLayerRegexRules)].map(rule => ({
  regex: new RegExp(rule.browserPattern, "gu"), replacement: rule.replacement,
}));

function formatReplacerMatch(template, args) {
  const named = typeof args[args.length - 1] === "object" ? args[args.length - 1] : {};
  const groupEnd = args.length - (typeof args[args.length - 1] === "object" ? 3 : 2);
  const values = { ...named };
  for (let index = 1; index < groupEnd; index++) values[`g${index}`] = args[index];
  let missing = false;
  const result = template.replace(/\{\{|\}\}|\{([^{}]+)\}/g, (token, field) => {
    if (token === "{{") return "{";
    if (token === "}}") return "}";
    const [key, spec = ""] = field.split(":");
    if (!Object.hasOwn(values, key)) { missing = true; return token; }
    const value = values[key] ?? "None";
    // Python's string format, used by refinement levels: {value:>2}.
    return /^>\d+$/.test(spec) ? " ".repeat(Math.max(0, Number(spec.slice(1)) - [...value].length)) + value : value;
  });
  return missing ? args[0] : result;
}

async function replaceText(source, { signal, onProgress = () => {} } = {}) {
  // replace_file processes each physical line independently with universal newlines.
  const lines = source.replace(/\r\n?/g, "\n").match(/[^\n]*\n|[^\n]+$/g) || [];
  const output = [];
  let matches = 0;
  const total = Math.max(1, lines.length * (replacerPatterns.length + replacerWords.length));
  let done = 0;
  const checkpoint = async () => {
    onProgress(done, total);
    await new Promise(resolve => setTimeout(resolve, 0));
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  };
  await checkpoint();
  for (let text of lines) {
    for (const { regex, replacement } of replacerPatterns) {
      text = text.replace(regex, (...args) => { matches++; return formatReplacerMatch(replacement, args); });
      done++;
      if (done % 500 === 0) await checkpoint();
    }
    for (const [word, replacement] of replacerWords) {
      if (text.includes(word)) {
        // A callback keeps $&, $1 and similar text literal in dictionary values.
        text = text.replaceAll(word, () => { matches++; return replacement; });
      }
      done++;
      if (done % 500 === 0) await checkpoint();
    }
    output.push(text);
  }
  await checkpoint();
  return { text: output.join(""), matches };
}
