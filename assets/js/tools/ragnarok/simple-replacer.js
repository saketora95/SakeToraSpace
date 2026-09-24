"use strict";

const replacerElement = id => document.getElementById(id);
const input = replacerElement("replace-input");
const output = replacerElement("replace-output");
let controller = null;
let resultSource = null;
function updateReplacerStaleNotice() {
  replacerElement("replace-stale").hidden = resultSource === null || input.value === resultSource;
}
function updateReplacerCount() {
  replacerElement("replace-count").textContent = `${input.value.length.toLocaleString("zh-TW")}／${input.maxLength.toLocaleString("zh-TW")} 字元`;
}
updateReplacerCount();
window.addEventListener("pageshow", updateReplacerCount);
function setReplacerBusy(busy) {
  input.readOnly = busy;
  replacerElement("replace-run").disabled = busy;
  replacerElement("replace-run").textContent = busy ? "取代中…" : "執行取代";
  replacerElement("replace-clear").disabled = busy;
  replacerElement("replace-copy").disabled = busy || !output.value;
  output.setAttribute("aria-busy", String(busy));
}
replacerElement("replace-run").addEventListener("click", async () => {
  if (controller) return;
  if (!input.value || input.value.length > input.maxLength) { input.focus(); return; }
  controller = new AbortController();
  const source = input.value;
  output.value = "";
  resultSource = null;
  updateReplacerStaleNotice();
  setReplacerBusy(true);
  try {
    const result = await replaceText(source, { signal: controller.signal });
    output.value = result.text;
    resultSource = source;
    updateReplacerStaleNotice();
  } catch (error) {
    if (error.name !== "AbortError") console.error("取代失敗", error);
  } finally { controller = null; setReplacerBusy(false); }
});
replacerElement("replace-clear").addEventListener("click", () => {
  input.value = ""; output.value = ""; setReplacerBusy(false); input.focus();
  resultSource = null;
  updateReplacerStaleNotice();
  updateReplacerCount();
});
input.addEventListener("input", () => {
  updateReplacerCount();
  updateReplacerStaleNotice();
});
replacerElement("replace-copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(output.value); }
  catch { output.focus(); output.select(); }
});
window.addEventListener("pagehide", () => controller?.abort());

const ruleGroups = {
  words: Object.entries(replaceDictionary),
  regex: [...firstLayerRegexRules.map(rule => [`第一層：${rule.pattern}`, rule.replacement]),
    ...secondLayerRegexRules.map(rule => [`第二層：${rule.pattern}`, rule.replacement])],
};
replacerElement("rule-total").textContent = `${Object.values(ruleGroups).reduce((sum, rows) => sum + rows.length, 0).toLocaleString("zh-TW")} 條`;
let rulePage = 0;
function renderReplacerRules() {
  const query = replacerElement("rule-search").value.trim().toLocaleLowerCase();
  const rows = ruleGroups[replacerElement("rule-type").value].filter(row => row.some(text => text.toLocaleLowerCase().includes(query)));
  const pages = Math.max(1, Math.ceil(rows.length / 100));
  rulePage = Math.min(rulePage, pages - 1);
  const body = replacerElement("rule-rows");
  body.replaceChildren();
  for (const row of rows.slice(rulePage * 100, (rulePage + 1) * 100)) {
    const tr = document.createElement("tr");
    for (const value of row) { const td = document.createElement("td"); td.textContent = value; tr.append(td); }
    body.append(tr);
  }
  if (!rows.length) { const tr = document.createElement("tr"); const td = document.createElement("td"); td.colSpan = 2; td.textContent = "沒有符合的規則"; tr.append(td); body.append(tr); }
  replacerElement("rule-page").textContent = `${rulePage + 1} / ${pages} 頁 · ${rows.length.toLocaleString("zh-TW")} 條`;
  replacerElement("rule-prev").disabled = rulePage === 0;
  replacerElement("rule-next").disabled = rulePage >= pages - 1;
  body.parentElement.parentElement.scrollTop = 0;
}
replacerElement("rule-search").addEventListener("input", () => { rulePage = 0; renderReplacerRules(); });
replacerElement("rule-type").addEventListener("change", () => { rulePage = 0; renderReplacerRules(); });
replacerElement("rule-prev").addEventListener("click", () => { rulePage--; renderReplacerRules(); });
replacerElement("rule-next").addEventListener("click", () => { rulePage++; renderReplacerRules(); });
renderReplacerRules();
