"use strict";

// Shared by the sky and radiant gear pages; each page loads its own data file into window.ragnarokRuneGearData.
(() => {
  const data = window.ragnarokRuneGearData;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const filters = { job: $("#rune-job"), wave: $("#rune-wave"), query: $("#rune-query") };
  const tabs = [...document.querySelectorAll(".rune-views [role=tab]")];
  const views = tabs.map(tab => tab.dataset.view);
  const detailView = "gear";
  const sorts = ["job", "release"];
  let view = views[0];
  let sort = sorts[0];

  if (!data || !Array.isArray(data.jobs)) {
    $("#rune-status").textContent = "資料載入失敗，請重新整理頁面。";
    return;
  }

  $("#rune-intro").innerHTML = data.intro.map(text => `<p>${escape(text)}</p>`).join("");
  filters.job.insertAdjacentHTML("beforeend", data.jobs.map(job => `<option value="${escape(job.job)}">${escape(job.job)}</option>`).join(""));
  filters.wave.insertAdjacentHTML("beforeend", data.waves.map(wave => `<option value="${wave}">${wave}</option>`).join(""));

  const textOf = item => [
    ...item.names.flatMap(name => [name.id, name.kr, name.zh]), item.note, ...item.effects,
    ...(item.blocks ?? []).flatMap(block => [block.condition, ...block.lines]),
    ...Object.values(item.grades).flat(), ...(item.specs ?? []).map(spec => spec[1]),
  ];
  const jobs = data.jobs.map(job => ({
    ...job,
    haystack: normalize([job.job, job.restriction, ...job.skills, ...textOf(job.headgear), ...job.weapons.flatMap(textOf)].join("\n")),
  }));

  function highlight(text, tokens) {
    if (!tokens.length) return escape(text);
    const pattern = new RegExp(tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "giu");
    const shown = String(text).normalize("NFKC");
    let html = "";
    let last = 0;
    for (const match of shown.matchAll(pattern)) {
      html += escape(shown.slice(last, match.index)) + `<mark>${escape(match[0])}</mark>`;
      last = match.index + match[0].length;
    }
    return html + escape(shown.slice(last));
  }

  const lineList = (lines, tokens) => `<ul class="rune-lines">${lines.map(line => `<li>${highlight(line, tokens)}</li>`).join("")}</ul>`;
  const specList = specs => `<dl class="rune-specs">${specs.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl>`;

  function renderItem(item, kind, tokens, specs) {
    const names = item.names.map(name => `<div class="rune-name">
      <h4>${highlight(name.zh, tokens)} <span class="rune-slots">[${item.slots}]</span></h4>
      <p>${name.id ? `<span class="rune-num">${highlight(name.id, tokens)}</span> · ` : ""}<span lang="ko">${highlight(name.kr, tokens)}</span></p>
    </div>`).join("");
    const blocks = (item.blocks ?? []).map(block => `<div class="rune-block">
      <p class="rune-block-head">${highlight(block.condition, tokens)}</p>
      ${lineList(block.lines, tokens)}
    </div>`).join("");
    const grades = Object.entries(item.grades).map(([grade, lines]) =>
      `<li><span class="rune-grade">${grade}</span><span>${lines.map(line => highlight(line, tokens)).join("<br>")}</span></li>`).join("");
    return `<article class="rune-item" data-item="${escape(item.names[0].zh)}">
      <header><span class="rune-kind${kind === "武器" ? " is-weapon" : ""}">${kind}</span>${names}</header>
      ${item.note ? `<p class="rune-note">${highlight(item.note, tokens)}</p>` : ""}
      ${item.effects.length ? lineList(item.effects, tokens) : ""}
      ${blocks}
      <p class="rune-sub">各階級追加效果</p>
      <ul class="rune-grades">${grades}</ul>
      ${specList(specs)}
    </article>`;
  }

  function renderJob(job, tokens) {
    const restriction = item => [["職業限制", item.restriction ?? job.restriction ?? job.job.replace(" & ", "、")]];
    return `<section class="rune-job" aria-label="${escape(job.job)}" data-job="${escape(job.job)}">
      <h3>${highlight(job.job, tokens)}<span class="rune-skills">${job.skills.map(skill => highlight(skill, tokens)).join(" · ")}</span></h3>
      <div class="rune-pair">
        ${renderItem(job.headgear, "頭飾", tokens, [...data.headgearSpecs, ...restriction(job.headgear)])}
        ${job.weapons.map(weapon => renderItem(weapon, "武器", tokens, [...weapon.specs, ...data.weaponSpecs, ...restriction(weapon)])).join("")}
      </div>
    </section>`;
  }

  function renderGear() {
    const tokens = normalize(filters.query.value).split(/\s+/).filter(Boolean);
    const matches = jobs.filter(job =>
      (!filters.job.value || job.job === filters.job.value)
      && (!filters.wave.value || job.wave === filters.wave.value)
      && tokens.every(token => job.haystack.includes(token)));
    $("#rune-status").textContent = matches.length ? "" : "沒有符合條件的職業，試試更短的關鍵字或重設篩選。";
    $("#rune-results").innerHTML = data.waves.map(wave => {
      const items = matches.filter(job => job.wave === wave);
      if (!items.length) return "";
      return `<section class="rune-wave-block" aria-label="${wave} 推出">
        <h2><span class="rune-num">${wave}</span><span>推出</span></h2>
        ${items.map(job => renderJob(job, tokens)).join("")}
      </section>`;
    }).join("");
  }

  const table = (head, rows, headCell = cell => `<th scope="col">${escape(cell)}</th>`) => `<div class="rune-table-scroll" tabindex="0"><table class="rune-table">
    <thead><tr>${head.map(headCell).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
  const lineBreaks = lines => lines.map(escape).join("<br>");

  const detailLink = (job, item) => `<a href="#${new URLSearchParams({ view: detailView })}" data-job="${escape(job.job)}" data-item="${escape(item.names[0].zh)}">${item.names.map(name => escape(name.zh)).join(" / ")}</a>`;

  const byJob = (a, b) => window.ragnarokJobRank(a.job) - window.ragnarokJobRank(b.job);
  const comparators = {
    job: byJob,
    release: (a, b) => data.waves.indexOf(a.wave) - data.waves.indexOf(b.wave) || byJob(a, b),
  };

  // The 推出 and 職業 headers double as the sort controls of the summary table.
  const sortColumns = { 推出: "release", 職業: "job" };
  const summaryHead = cell => {
    const key = sortColumns[cell];
    if (!key) return `<th scope="col">${escape(cell)}</th>`;
    const active = key === sort;
    return `<th scope="col" aria-sort="${active ? "ascending" : "none"}"><button type="button" class="rune-sort${active ? " is-active" : ""}" data-sort="${key}" title="依${key === "job" ? "職業" : "推出時間"}排序">${escape(cell)}<span aria-hidden="true">${active ? "▲" : "↕"}</span></button></th>`;
  };

  function renderSummary() {
    const rows = [...data.jobs].sort(comparators[sort]).map(job => [
      `<span class="rune-num">${job.wave}</span>`,
      `<strong>${escape(job.job)}</strong>`,
      [job.headgear, ...job.weapons].map(item => detailLink(job, item)).join("<br>"),
      lineBreaks(job.skills),
      [job.headgear, ...job.weapons].flatMap(item => item.blocks ?? []).map(block => `<p class="rune-summary-block">${lineBreaks(block.lines)}</p>`).join(""),
    ]);
    $("#rune-summary-table").innerHTML = table(["推出", "職業", "道具", "強化技能", "特殊效果"], rows, summaryHead);
  }

  // Summary links open the unfiltered detail view, scroll to the item and highlight it with the rest of its set.
  function openDetail(job, item) {
    for (const control of Object.values(filters)) control.value = "";
    showView(detailView);
    renderGear();
    syncHash();
    const cards = [...document.querySelectorAll(`#rune-results [data-job="${CSS.escape(job)}"] .rune-item`)];
    for (const card of cards) card.classList.add("is-target");
    // Land on the job heading when the item starts its row, so the whole set and its skills stay in view.
    const card = cards.find(card => card.dataset.item === item);
    const section = card?.closest(".rune-job");
    const startsRow = card && Math.abs(card.getBoundingClientRect().top - cards[0].getBoundingClientRect().top) < 1;
    (startsRow ? section : card)?.scrollIntoView({ block: "start" });
  }

  function renderItems() {
    const hammers = data.hammers.map(hammer => `<section class="rune-card">
      <h3>${escape(hammer.zh)}</h3>
      <p class="rune-card-meta"><span class="rune-num">${hammer.id}</span> · <span lang="ko">${escape(hammer.kr)}</span></p>
      ${lineList(hammer.lines, [])}
    </section>`).join("");
    const enchant = data.headgearEnchant;
    const rows = enchant.rows.map(row => [
      `<strong>${escape(row.name)}</strong>${row.mechanism ? `<span class="rune-mechanism">${escape(row.mechanism)}</span>` : ""}`,
      `<ul class="rune-materials">${row.materials.map(([name, count]) => `<li><span>${escape(name)}</span><span class="rune-num">${escape(count)}</span></li>`).join("")}</ul>`,
      row.picks ? `<ul class="rune-chips">${row.picks.map(pick => `<li>${escape(pick)}</li>`).join("")}</ul>` : `<span class="rune-num">${escape(row.result)}</span>`,
    ]);
    $("#rune-view-items").innerHTML = `
      <section class="rune-block-section">
        <h2>精煉道具</h2>
        <div class="rune-cards">${hammers}</div>
      </section>
      <section class="rune-block-section">
        <h2>頭飾附魔</h2>
        <div class="rune-enchant">${table(["項目", "所需素材", "附魔結果"], rows)}</div>
        ${enchant.notes.map(note => `<p class="rune-footnote">${escape(note)}</p>`).join("")}
      </section>
      <section class="rune-block-section">
        <h2>武器附魔</h2>
        <p class="rune-intro">${escape(data.weaponEnchant)}</p>
      </section>`;
  }

  function showView(next) {
    view = views.includes(next) ? next : views[0];
    for (const tab of tabs) {
      const active = tab.dataset.view === view;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
    }
  }

  // View and filters live in the hash so a filtered view can be bookmarked or shared.
  function syncHash() {
    const params = new URLSearchParams();
    if (view !== views[0]) params.set("view", view);
    if (sort !== sorts[0]) params.set("sort", sort);
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
    sort = sorts.includes(params.get("sort")) ? params.get("sort") : sorts[0];
    // Older bookmarks carry filters without a view; those belong to the detail view.
    const filtered = Object.keys(filters).some(key => params.has(key));
    showView(params.get("view") ?? (filtered ? detailView : null));
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => { showView(tab.dataset.view); syncHash(); });
    tab.addEventListener("keydown", event => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      const next = tabs[(index + step + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });
  for (const control of Object.values(filters)) control.addEventListener(control.tagName === "SELECT" ? "change" : "input", () => { renderGear(); syncHash(); });
  $("#rune-reset").addEventListener("click", () => {
    for (const control of Object.values(filters)) control.value = "";
    renderGear();
    syncHash();
    filters.query.focus();
  });
  $("#rune-view-summary").addEventListener("click", event => {
    const sortButton = event.target.closest("[data-sort]");
    if (sortButton) {
      sort = sortButton.dataset.sort;
      renderSummary();
      $(`#rune-summary-table [data-sort="${sort}"]`).focus();
      syncHash();
      return;
    }
    const link = event.target.closest("a[data-job]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    openDetail(link.dataset.job, link.dataset.item);
  });
  window.addEventListener("hashchange", () => { readHash(); renderSummary(); renderGear(); });

  renderItems();
  readHash();
  renderSummary();
  renderGear();
})();
