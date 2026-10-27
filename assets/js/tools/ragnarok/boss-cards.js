"use strict";

(() => {
  const data = window.ragnarokBossCardData;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const filters = { query: $("#boss-query"), type: $("#boss-type"), paired: $("#boss-paired"), note: $("#boss-note") };

  if (!data || !Array.isArray(data.bosses)) {
    $("#boss-status").textContent = "資料載入失敗，請重新整理頁面。";
    return;
  }

  const types = [...new Set(data.bosses.flatMap(boss => boss.types))];
  filters.type.insertAdjacentHTML("beforeend", types.map(type => `<option value="${escape(type)}">${escape(type)}</option>`).join(""));
  filters.note.insertAdjacentHTML("beforeend", Object.keys(data.notes).map(note => `<option value="${escape(note)}">${escape(note)}</option>`).join(""));

  // Items are stored as "name" or [name, note]; flatten them once for filtering.
  const bosses = data.bosses.map(boss => {
    const items = boss.items.map(item => Array.isArray(item) ? { name: item[0], note: item[1] } : { name: item, note: "" });
    return { ...boss, items, haystack: normalize([boss.name, ...items.map(item => item.name)].join("\n")) };
  });

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

  const typeTags = boss => (boss.types.length ? boss.types : ["未標示"])
    .map(type => `<span class="boss-type${type === "野生" ? "" : " is-alt"}">${escape(type)}</span>`).join("");

  function renderBoss(boss, tokens) {
    const items = boss.items.map(item => `<li>
        <span class="boss-item">${highlight(item.name, tokens)}</span>${item.note ? `<span class="boss-note" title="${escape(data.notes[item.note] ?? "")}">${escape(item.note)}</span>` : ""}
      </li>`).join("");
    return `<article class="boss-entry">
      <h3>${highlight(boss.name, tokens)}</h3>
      <div class="boss-types">${typeTags(boss)}</div>
      <ul class="boss-items" aria-label="搭配裝備">${items}</ul>
    </article>`;
  }

  function render() {
    const tokens = normalize(filters.query.value).split(/\s+/).filter(Boolean);
    const matches = bosses.filter(boss =>
      (!filters.type.value || boss.types.includes(filters.type.value)) &&
      (!filters.paired.value || (filters.paired.value === "yes") === Boolean(boss.items.length)) &&
      (!filters.note.value || boss.items.some(item => item.note === filters.note.value)) &&
      tokens.every(token => boss.haystack.includes(token)));
    const paired = matches.filter(boss => boss.items.length);
    const unpaired = matches.filter(boss => !boss.items.length);
    $("#boss-status").textContent = matches.length ? "" : "沒有符合條件的 MVP，試試更短的關鍵字或重設篩選。";
    $("#boss-results").innerHTML = [
      paired.length ? `<section class="boss-group" aria-labelledby="boss-paired-head">
        <h2 id="boss-paired-head">有搭配裝備<span>${paired.length}</span></h2>
        <div class="boss-entries">${paired.map(boss => renderBoss(boss, tokens)).join("")}</div>
      </section>` : "",
      unpaired.length ? `<section class="boss-group" aria-labelledby="boss-unpaired-head">
        <h2 id="boss-unpaired-head">無搭配裝備<span>${unpaired.length}</span></h2>
        <ul class="boss-plain">${unpaired.map(boss => `<li>${highlight(boss.name, tokens)}${typeTags(boss)}</li>`).join("")}</ul>
      </section>` : "",
    ].join("");
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
  $("#boss-reset").addEventListener("click", () => {
    for (const control of Object.values(filters)) control.value = "";
    render();
    filters.query.focus();
  });
  window.addEventListener("hashchange", () => { readHash(); render(); });
  readHash();
  render();
})();
