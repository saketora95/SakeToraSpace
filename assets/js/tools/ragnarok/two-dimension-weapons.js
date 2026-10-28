"use strict";

(() => {
  const data = window.ragnarokTwoDimensionWeaponData;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const filters = { job: $("#dimension-job"), wave: $("#dimension-wave"), query: $("#dimension-query") };
  const tabs = [...document.querySelectorAll(".dimension-views [role=tab]")];
  const views = tabs.map(tab => tab.dataset.view);
  const detailView = "weapons";
  const sorts = ["job", "release"];
  let view = views[0];
  let sort = sorts[0];

  if (!data || !Array.isArray(data.weapons)) {
    $("#dimension-status").textContent = "資料載入失敗，請重新整理頁面。";
    return;
  }

  const waveLabel = wave => `第 ${wave} 波`;

  filters.job.insertAdjacentHTML("beforeend", data.weapons.map(weapon => `<option value="${escape(weapon.job)}">${escape(weapon.job)}</option>`).join(""));
  filters.wave.insertAdjacentHTML("beforeend", data.waves.map(entry => `<option value="${entry.wave}">${waveLabel(entry.wave)}（${entry.date}）</option>`).join(""));

  const weapons = data.weapons.map(weapon => ({
    ...weapon,
    haystack: normalize([
      weapon.job, weapon.restriction, ...weapon.skills, ...weapon.effects,
      ...weapon.names.flatMap(name => [name.id, name.kr, name.zh]),
      ...weapon.blocks.flatMap(block => [block.condition, ...block.lines, block.trigger, ...(block.extra ?? [])]),
      ...Object.values(weapon.grades).flat(), ...weapon.specs.map(spec => spec[1]),
    ].join("\n")),
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

  const lineList = (lines, tokens) => `<ul class="dimension-lines">${lines.map(line => `<li>${highlight(line, tokens)}</li>`).join("")}</ul>`;
  const specList = specs => `<dl class="dimension-specs">${specs.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl>`;

  function renderWeapon(weapon, tokens) {
    const names = weapon.names.map(name => `<div class="dimension-name">
      <h3>${highlight(name.zh, tokens)} <span class="dimension-slots">[${weapon.slots}]</span></h3>
      <p><span class="dimension-num">${highlight(name.id, tokens)}</span> · <span lang="ko">${highlight(name.kr, tokens)}</span></p>
    </div>`).join("");
    const blocks = weapon.blocks.map(block => `<div class="dimension-block">
      <p class="dimension-block-head">${highlight(block.condition, tokens)}</p>
      ${lineList(block.extra ? [...block.lines, block.trigger] : block.lines, tokens)}
      ${block.extra ? `<p class="dimension-extra-head">額外效果</p>${lineList(block.extra, tokens)}` : ""}
    </div>`).join("");
    const grades = Object.entries(weapon.grades).map(([grade, lines]) =>
      `<li><span class="dimension-grade">${grade}</span><span>${lines.map(line => highlight(line, tokens)).join("<br>")}</span></li>`).join("");
    const restriction = [["職業限制", weapon.restriction ?? weapon.job.replace(" & ", "、")]];
    return `<article class="dimension-item" data-item="${escape(weapon.names[0].zh)}">
      <header>
        <div class="dimension-tags"><span class="dimension-wave">${waveLabel(weapon.wave)}</span><span class="dimension-job">${highlight(weapon.job, tokens)}</span></div>
        ${names}
      </header>
      ${lineList(weapon.effects, tokens)}
      ${blocks}
      <p class="dimension-sub">各階級追加效果</p>
      <ul class="dimension-grades">${grades}</ul>
      ${specList([...weapon.specs, ...data.commonSpecs, ...restriction])}
    </article>`;
  }

  function renderWeapons() {
    const tokens = normalize(filters.query.value).split(/\s+/).filter(Boolean);
    const matches = weapons.filter(weapon =>
      (!filters.job.value || weapon.job === filters.job.value)
      && (!filters.wave.value || String(weapon.wave) === filters.wave.value)
      && tokens.every(token => weapon.haystack.includes(token)));
    $("#dimension-status").textContent = matches.length ? "" : "沒有符合條件的武器，試試更短的關鍵字或重設篩選。";
    $("#dimension-results").innerHTML = data.waves.map(entry => {
      const items = matches.filter(weapon => weapon.wave === entry.wave);
      if (!items.length) return "";
      return `<section class="dimension-wave-block" aria-label="${waveLabel(entry.wave)}">
        <h2>${waveLabel(entry.wave)}<span><a href="${escape(entry.url)}" target="_blank" rel="noopener">kRO ${entry.date} 改版</a></span></h2>
        <div class="dimension-grid">${items.map(weapon => renderWeapon(weapon, tokens)).join("")}</div>
      </section>`;
    }).join("");
  }

  const lineBreaks = lines => lines.map(escape).join("<br>");
  const refineCondition = "精煉值達 +12 以上時";
  const withoutRefineCondition = line => line.startsWith(`${refineCondition}，`) ? line.slice(refineCondition.length + 1) : line;
  // Summary-only box for 額外效果 and set bonuses: a tag and head sentence over the effects.
  const effectBox = (tag, head, lines) => `<div class="dimension-extra">
    <p class="dimension-extra-trigger"><span class="dimension-extra-tag">${tag}</span>${escape(head)}</p>
    ${lines.map(line => `<p class="dimension-extra-line">${escape(line)}</p>`).join("")}
  </div>`;
  // The summary trigger keeps the rank and the cast skill but drops the 習得等級 prerequisites.
  function shortTrigger(trigger) {
    const [prefix, rest] = trigger.split("並施展");
    if (rest === undefined) return trigger;
    const kept = prefix.split("、").filter(part => !part.startsWith("習得等級"));
    const head = kept.join("、");
    return head ? `${head}${/[A-Za-z0-9]$/.test(head) ? " " : ""}並施展${rest}` : `施展${rest}`;
  }
  const extraBox = block => block.extra ? effectBox("額外效果", shortTrigger(block.trigger), block.extra) : "";

  // Every +12 effect and set bonus; the plain +12 condition is implied, so only stricter conditions are shown.
  function specialEffects(weapon) {
    const refine = weapon.effects.filter(line => line.includes("+12")).map(withoutRefineCondition);
    const plain = weapon.blocks.filter(block => block.condition === refineCondition);
    const paragraphs = [];
    if (refine.length || plain.length) {
      paragraphs.push(`${lineBreaks([...refine, ...plain.flatMap(block => block.lines)])}${plain.map(extraBox).join("")}`);
    }
    for (const block of weapon.blocks.filter(block => block.condition !== refineCondition)) {
      paragraphs.push(block.condition.startsWith("同時裝備")
        ? `${effectBox("套裝效果", block.condition, block.lines)}${extraBox(block)}`
        : `<span class="dimension-summary-head">${escape(block.condition)}</span><br>${lineBreaks(block.lines)}${extraBox(block)}`);
    }
    for (const [grade, lines] of Object.entries(weapon.grades)) {
      const graded = lines.filter(line => line.includes("+12")).map(withoutRefineCondition);
      if (graded.length) paragraphs.push(`<span class="dimension-grade">${grade}</span> ${lineBreaks(graded)}`);
    }
    return paragraphs.map(html => `<div class="dimension-summary-block">${html}</div>`).join("");
  }

  const byJob = (a, b) => window.ragnarokJobRank(a.job) - window.ragnarokJobRank(b.job);
  const comparators = { job: byJob, release: (a, b) => a.wave - b.wave || byJob(a, b) };

  // The 推出 and 職業 headers double as the sort controls of the summary table.
  const sortColumns = { 推出: "release", 職業: "job" };
  const summaryHead = cell => {
    const key = sortColumns[cell];
    if (!key) return `<th scope="col">${escape(cell)}</th>`;
    const active = key === sort;
    return `<th scope="col" aria-sort="${active ? "ascending" : "none"}"><button type="button" class="dimension-sort${active ? " is-active" : ""}" data-sort="${key}" title="依${key === "job" ? "職業" : "推出時間"}排序">${escape(cell)}<span aria-hidden="true">${active ? "▲" : "↕"}</span></button></th>`;
  };

  function renderSummary() {
    const rows = [...data.weapons].sort(comparators[sort]).map(weapon => `<tr>
      <td>${waveLabel(weapon.wave)}</td>
      <td><strong>${escape(weapon.job)}</strong></td>
      <td><a href="#${new URLSearchParams({ view: detailView })}" data-job="${escape(weapon.job)}" data-item="${escape(weapon.names[0].zh)}">${weapon.names.map(name => escape(name.zh)).join(" / ")}</a></td>
      <td>${lineBreaks(weapon.skills)}</td>
      <td>${specialEffects(weapon)}</td>
    </tr>`).join("");
    $("#dimension-summary-table").innerHTML = `<div class="dimension-table-scroll" tabindex="0"><table class="dimension-table">
      <thead><tr>${["推出", "職業", "武器", "強化技能", "特殊效果"].map(summaryHead).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  // Summary links open the unfiltered detail view, scroll to the item and highlight it.
  function openDetail(job, item) {
    for (const control of Object.values(filters)) control.value = "";
    showView(detailView);
    renderWeapons();
    syncHash();
    const cards = [...document.querySelectorAll(`#dimension-results [data-item="${CSS.escape(item)}"]`)];
    for (const card of cards) card.classList.add("is-target");
    cards.find(card => card.dataset.item === item)?.scrollIntoView({ block: "start" });
  }

  function renderAbout() {
    const waves = data.waves.map(entry => {
      const jobs = data.weapons.filter(weapon => weapon.wave === entry.wave).map(weapon => weapon.job.replace(" & ", "&"));
      return `<li><strong>${waveLabel(entry.wave)}</strong> <a class="dimension-num" href="${escape(entry.url)}" target="_blank" rel="noopener">${entry.date}</a><span>${escape(jobs.join("、"))}</span></li>`;
    }).join("");
    $("#dimension-view-about").innerHTML = `
      ${data.intro.map(text => `<p class="dimension-intro">${escape(text)}</p>`).join("")}
      <section class="dimension-card">
        <h2>推出時間</h2>
        <ul class="dimension-waves">${waves}</ul>
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
  for (const control of Object.values(filters)) control.addEventListener(control.tagName === "SELECT" ? "change" : "input", () => { renderWeapons(); syncHash(); });
  $("#dimension-reset").addEventListener("click", () => {
    for (const control of Object.values(filters)) control.value = "";
    renderWeapons();
    syncHash();
    filters.query.focus();
  });
  $("#dimension-view-summary").addEventListener("click", event => {
    const sortButton = event.target.closest("[data-sort]");
    if (sortButton) {
      sort = sortButton.dataset.sort;
      renderSummary();
      $(`#dimension-summary-table [data-sort="${sort}"]`).focus();
      syncHash();
      return;
    }
    const link = event.target.closest("a[data-job]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    openDetail(link.dataset.job, link.dataset.item);
  });
  window.addEventListener("hashchange", () => { readHash(); renderSummary(); renderWeapons(); });


  renderFrontierWeaponEnchant($("#dimension-view-enchant"), { label: "邊界符文頭冠與邊界武器", href: "./ragnarok-frontier-gear.html#view=weapon" });
  renderAbout();
  readHash();
  renderSummary();
  renderWeapons();
})();
