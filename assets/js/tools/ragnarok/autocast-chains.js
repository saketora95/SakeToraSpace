"use strict";

(() => {
  const data = window.ragnarokAutocastChainData;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const filters = { job: $("#chain-job"), query: $("#chain-query"), origin: $("#chain-origin"), server: $("#chain-server") };

  if (!data || !Array.isArray(data.jobs)) {
    $("#chain-status").textContent = "資料載入失敗，請重新整理頁面。";
    return;
  }

  filters.job.insertAdjacentHTML("beforeend", data.jobs.map(job => `<option value="${escape(job.name)}">${escape(job.name)}</option>`).join(""));

  // Each entry keeps one searchable string covering its job, items and skills.
  const entries = data.jobs.flatMap(job => job.entries.map(entry => ({
    job: job.name,
    entry,
    haystack: normalize([job.name, ...entry.sets.flat(), ...entry.chains.flatMap(chain => [chain.trigger, chain.skill])].join("\n")),
  })));

  function highlight(text, tokens) {
    if (!tokens.length) return escape(text);
    const pattern = new RegExp(tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "giu");
    const shown = text.normalize("NFKC");
    let html = "";
    let last = 0;
    for (const match of shown.matchAll(pattern)) {
      html += escape(shown.slice(last, match.index)) + `<mark>${escape(match[0])}</mark>`;
      last = match.index + match[0].length;
    }
    return html + escape(shown.slice(last));
  }

  function renderEntry({ entry }, tokens) {
    const sets = entry.sets.map(set => `<ul class="chain-set">${set.map(item => `<li>${highlight(item, tokens)}</li>`).join("")}</ul>`).join('<span class="chain-or">或</span>');
    const chains = entry.chains.map(chain => `<li>
        <span class="chain-skill">${highlight(chain.trigger, tokens)}</span>
        <span class="chain-arrow" aria-label="有 ${chain.rate}% 機率連鎖">→ <b class="chain-rate${chain.rate < 100 ? " is-partial" : ""}">${chain.rate}%</b></span>
        <span class="chain-skill">${highlight(chain.skill, tokens)}${chain.level ? ` <span class="chain-level">Lv ${chain.level}</span>` : ""}</span>
      </li>`).join("");
    const date = (label, value) => `<div><dt>${label}</dt><dd>${value ? `<time datetime="${escape(value)}">${escape(value)}</time>` : '<span class="muted">未實裝</span>'}</dd></div>`;
    return `<article class="chain-entry">
      <div class="chain-items"><span class="chain-origin${entry.origin === "臺特" ? " is-tw" : ""}">${escape(entry.origin)}</span>${sets}</div>
      <ul class="chain-list" aria-label="連鎖效果">${chains}</ul>
      <dl class="chain-dates">${entry.origin === "臺特" ? "" : date("kRO", entry.kro)}${date("twRO", entry.twro)}</dl>
    </article>`;
  }

  function render() {
    const tokens = normalize(filters.query.value).split(/\s+/).filter(Boolean);
    const matches = entries.filter(item =>
      (!filters.job.value || item.job === filters.job.value) &&
      (!filters.origin.value || item.entry.origin === filters.origin.value) &&
      (!filters.server.value || (filters.server.value === "released") === Boolean(item.entry.twro)) &&
      tokens.every(token => item.haystack.includes(token)));
    const groups = data.jobs.map(job => [job.name, matches.filter(item => item.job === job.name)]).filter(([, items]) => items.length);
    $("#chain-status").textContent = matches.length ? "" : "沒有符合條件的裝備，試試更短的關鍵字或重設篩選。";
    $("#chain-results").innerHTML = groups.map(([job, items], index) => `<section class="chain-job" aria-labelledby="chain-job-${index}">
        <h2 id="chain-job-${index}">${highlight(job, tokens)}<span>${items.length}</span></h2>
        <div class="chain-entries">${items.map(item => renderEntry(item, tokens)).join("")}</div>
      </section>`).join("");
    syncHash();
  }

  // Filters live in the hash so a filtered view can be bookmarked or shared.
  function syncHash() {
    const params = new URLSearchParams();
    for (const [key, control] of Object.entries(filters)) if (control.value.trim()) params.set(key, control.value.trim());
    const hash = params.toString();
    const url = new URL(window.location.href);
    url.hash = hash;
    if (url.href !== window.location.href) window.history.replaceState(null, "", hash ? url : url.pathname + url.search);
  }
  function readHash() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    for (const [key, control] of Object.entries(filters)) {
      const value = params.get(key) ?? "";
      control.value = control.tagName === "SELECT" && ![...control.options].some(option => option.value === value) ? "" : value;
    }
  }

  for (const control of Object.values(filters)) control.addEventListener(control.tagName === "SELECT" ? "change" : "input", render);
  $("#chain-reset").addEventListener("click", () => {
    for (const control of Object.values(filters)) control.value = "";
    render();
    filters.query.focus();
  });
  window.addEventListener("hashchange", () => { readHash(); render(); });
  readHash();
  render();
})();
