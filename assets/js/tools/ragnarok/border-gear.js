"use strict";

(() => {
  const data = window.ragnarokBorderGearData;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const filters = { job: $("#border-job"), query: $("#border-query") };
  const tabs = [...document.querySelectorAll(".border-views [role=tab]")];
  const views = tabs.map(tab => tab.dataset.view);
  let view = views[0];

  if (!data || !Array.isArray(data.jobs)) {
    $("#border-status").textContent = "資料載入失敗，請重新整理頁面。";
    return;
  }

  $("#border-release").textContent = data.release;
  filters.job.insertAdjacentHTML("beforeend", data.jobs.map(job => `<option value="${escape(job.job)}">${escape(job.job)}</option>`).join(""));

  const textOf = item => [
    ...(item.names ?? [item.name]), ...item.effects, item.set.condition, ...item.set.lines, ...(item.set.extra ?? []),
    ...Object.values(item.grades).flat(), ...(item.specs ?? []).map(spec => spec[1]),
  ];
  const jobs = data.jobs.map(job => ({
    ...job,
    haystack: normalize([job.job, ...job.skills, ...textOf(job.headgear), ...job.weapons.flatMap(textOf)].join("\n")),
  }));

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

  const lineList = (lines, tokens, className = "border-lines") =>
    `<ul class="${className}">${lines.map(line => `<li>${highlight(line, tokens)}</li>`).join("")}</ul>`;
  const specList = specs => `<dl class="border-specs">${specs.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl>`;

  function renderItem(item, kind, tokens, specs) {
    const names = (item.names ?? [item.name]).map(name => `<h4>${highlight(name, tokens)} <span class="border-slots">[${item.slots}]</span></h4>`).join("");
    const extra = item.set.extra ? `<p class="border-extra-head">額外效果</p>${lineList(item.set.extra, tokens)}` : "";
    const grades = Object.entries(item.grades).map(([grade, lines]) =>
      `<li><span class="border-grade">${grade}</span><span>${lines.map(line => highlight(line, tokens)).join("<br>")}</span></li>`).join("");
    return `<article class="border-item">
      <header><span class="border-kind${kind === "武器" ? " is-weapon" : ""}">${kind}</span>${names}</header>
      ${lineList(item.effects, tokens)}
      <div class="border-set">
        <p class="border-set-head">${highlight(item.set.condition, tokens)}</p>
        ${lineList(item.set.lines, tokens)}${extra}
      </div>
      <p class="border-sub">各階級追加效果</p>
      <ul class="border-grades">${grades}</ul>
      ${specList(specs)}
    </article>`;
  }

  function renderJob(job, tokens) {
    const restriction = [["職業限制", job.job.replace(" & ", "、")]];
    return `<section class="border-job" aria-label="${escape(job.job)}">
      <h2>${highlight(job.job, tokens)}<span class="border-skills">${job.skills.map(skill => highlight(skill, tokens)).join(" · ")}</span></h2>
      <div class="border-pair">
        ${renderItem(job.headgear, "頭冠", tokens, [...data.headgearCommon.specs, ...restriction])}
        ${job.weapons.map(weapon => renderItem(weapon, "武器", tokens, [...weapon.specs, ...restriction])).join("")}
      </div>
    </section>`;
  }

  function renderGear() {
    const tokens = normalize(filters.query.value).split(/\s+/).filter(Boolean);
    const matches = jobs.filter(job => (!filters.job.value || job.job === filters.job.value) && tokens.every(token => job.haystack.includes(token)));
    $("#border-status").textContent = matches.length ? "" : "沒有符合條件的職業，試試更短的關鍵字或重設篩選。";
    $("#border-results").innerHTML = matches.map(job => renderJob(job, tokens)).join("");
  }

  const table = (head, rows) => `<div class="border-table-scroll" tabindex="0"><table class="border-table">
    <thead><tr>${head.map(cell => `<th scope="col">${escape(cell)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
  const materialRows = materials => materials.map(([name, count]) => [escape(name), `<span class="border-num">${escape(count)}</span>`]);
  const materialList = materials => `<ul class="border-materials">${materials.map(([name, count]) => `<li><span>${escape(name)}</span><span class="border-num">${escape(count)}</span></li>`).join("")}</ul>`;

  function renderHeadgearEnchant() {
    const enchant = data.headgearEnchant;
    const slots = enchant.slots.map(slot => `<section class="border-card">
      <h3>${escape(slot.title)}</h3>
      <p class="border-sub">所需素材</p>
      ${materialList(slot.materials)}
      <p class="border-sub">附魔結果</p>
      ${slot.ranges
        ? table(["附魔", "最小值", "最大值"], slot.ranges.map(([name, min, max]) => [escape(name), `<span class="border-num">${min}</span>`, `<span class="border-num">${max}</span>`]))
        : `<ul class="border-chips">${slot.picks.map(pick => `<li>${escape(pick)}</li>`).join("")}</ul>`}
    </section>`).join("");
    const tiers = enchant.upgradeTiers.map(tier => `<section class="border-tier">
      <h4>${escape(tier.title ?? "基本升級")}<span>${escape(tier.note)}</span></h4>
      ${table(["目前等級", "結果", "所需素材"], tier.rows.map(row => [
        `<span class="border-num">Lv ${row.level}</span>`,
        `<ul class="border-outcomes">${row.outcomes.map(([rate, result]) =>
          `<li class="${result > row.level ? "is-up" : result < row.level ? "is-down" : ""}"><span class="border-num">${escape(rate)}</span> → Lv ${result}</li>`).join("")}</ul>`,
        materialList(row.materials),
      ]))}
    </section>`).join("");
    const newEnchants = data.newEnchants.map(item => `<li><strong>${escape(item.name)}</strong>${lineList(item.lines, [])}</li>`).join("");
    $("#border-view-headgear").innerHTML = `
      <p class="border-intro">可附魔對象：${enchant.targets.map(escape).join("、")}</p>
      <div class="border-cards">
        <section class="border-card"><h3>附魔重置</h3>${materialList(enchant.reset)}</section>
        ${slots}
      </div>
      <section class="border-block">
        <h2>第 2 洞附魔升級</h2>
        ${tiers}
      </section>
      <section class="border-block">
        <h2>追加附魔道具</h2>
        <ul class="border-new-enchants">${newEnchants}</ul>
      </section>`;
  }

  function renderWeaponEnchant() {
    const enchant = data.weaponEnchant;
    const anchor = index => `border-weapon-${index}`;
    const categories = enchant.categories.map((category, index) => `<section class="border-block" id="${anchor(index)}">
      <h2>${escape(category.name)}</h2>
      <div class="border-lines-grid">
        ${category.lines.map((rows, line) => `<div>
          <h3>${line ? "第二條／第三條" : "第一條"}</h3>
          ${table(["效果", "最低值", "最高值"], rows.map(([name, min, max]) => [escape(name), `<span class="border-num">${min}</span>`, `<span class="border-num">${max}</span>`]))}
        </div>`).join("")}
      </div>
    </section>`).join("");
    $("#border-view-weapon").innerHTML = `
      ${enchant.intro.map(text => `<p class="border-intro">${escape(text)}</p>`).join("")}
      <ul class="border-notes">${enchant.notes.map(note => `<li>${escape(note)}</li>`).join("")}</ul>
      <nav class="border-jump" aria-label="武器分類">${enchant.categories.map((category, index) => `<a href="#${anchor(index)}">${escape(category.name)}</a>`).join("")}</nav>
      ${categories}`;
    // In-page anchors would overwrite the filter hash, so scroll manually instead.
    $("#border-view-weapon .border-jump").addEventListener("click", event => {
      const link = event.target.closest("a");
      if (!link) return;
      event.preventDefault();
      document.getElementById(link.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
    showView(params.get("view"));
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
  $("#border-reset").addEventListener("click", () => {
    for (const control of Object.values(filters)) control.value = "";
    renderGear();
    syncHash();
    filters.query.focus();
  });
  window.addEventListener("hashchange", () => { readHash(); renderGear(); });

  renderHeadgearEnchant();
  renderWeaponEnchant();
  readHash();
  renderGear();
})();
