"use strict";

(() => {
  const data = window.ragnarokFrontierGearData;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const filters = { job: $("#frontier-job"), query: $("#frontier-query") };
  const tabs = [...document.querySelectorAll(".frontier-views [role=tab]")];
  const views = tabs.map(tab => tab.dataset.view);
  let view = views[0];

  if (!data || !Array.isArray(data.jobs)) {
    $("#frontier-status").textContent = "資料載入失敗，請重新整理頁面。";
    return;
  }

  $("#frontier-release").textContent = data.release;
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

  const lineList = (lines, tokens, className = "frontier-lines") =>
    `<ul class="${className}">${lines.map(line => `<li>${highlight(line, tokens)}</li>`).join("")}</ul>`;
  const specList = specs => `<dl class="frontier-specs">${specs.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl>`;

  function renderItem(item, kind, tokens, specs) {
    const names = (item.names ?? [item.name]).map(name => `<h4>${highlight(name, tokens)} <span class="frontier-slots">[${item.slots}]</span></h4>`).join("");
    const extra = item.set.extra ? `<p class="frontier-extra-head">額外效果</p>${lineList(item.set.extra, tokens)}` : "";
    const grades = Object.entries(item.grades).map(([grade, lines]) =>
      `<li><span class="frontier-grade">${grade}</span><span>${lines.map(line => highlight(line, tokens)).join("<br>")}</span></li>`).join("");
    return `<article class="frontier-item">
      <header><span class="frontier-kind${kind === "武器" ? " is-weapon" : ""}">${kind}</span>${names}</header>
      ${lineList(item.effects, tokens)}
      <div class="frontier-set">
        <p class="frontier-set-head">${highlight(item.set.condition, tokens)}</p>
        ${lineList(item.set.lines, tokens)}${extra}
      </div>
      <p class="frontier-sub">各階級追加效果</p>
      <ul class="frontier-grades">${grades}</ul>
      ${specList(specs)}
    </article>`;
  }

  function renderJob(job, tokens) {
    const restriction = [["職業限制", job.job.replace(" & ", "、")]];
    return `<section class="frontier-job" aria-label="${escape(job.job)}">
      <h2>${highlight(job.job, tokens)}<span class="frontier-skills">${job.skills.map(skill => highlight(skill, tokens)).join(" · ")}</span></h2>
      <div class="frontier-pair">
        ${renderItem(job.headgear, "頭飾", tokens, [...data.headgearCommon.specs, ...restriction])}
        ${job.weapons.map(weapon => renderItem(weapon, "武器", tokens, [...weapon.specs, ...restriction])).join("")}
      </div>
    </section>`;
  }

  function renderGear() {
    const tokens = normalize(filters.query.value).split(/\s+/).filter(Boolean);
    const matches = jobs.filter(job => (!filters.job.value || job.job === filters.job.value) && tokens.every(token => job.haystack.includes(token)));
    $("#frontier-status").textContent = matches.length ? "" : "沒有符合條件的職業，試試更短的關鍵字或重設篩選。";
    $("#frontier-results").innerHTML = matches.map(job => renderJob(job, tokens)).join("");
  }

  const table = (head, rows) => `<div class="frontier-table-scroll" tabindex="0"><table class="frontier-table">
    <thead><tr>${head.map(cell => `<th scope="col">${escape(cell)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
  const materialRows = materials => materials.map(([name, count]) => [escape(name), `<span class="frontier-num">${escape(count)}</span>`]);
  const materialList = materials => `<ul class="frontier-materials">${materials.map(([name, count]) => `<li><span>${escape(name)}</span><span class="frontier-num">${escape(count)}</span></li>`).join("")}</ul>`;

  function renderHeadgearEnchant() {
    const enchant = data.headgearEnchant;
    const slots = enchant.slots.map(slot => `<section class="frontier-card">
      <h3>${escape(slot.title)}</h3>
      <p class="frontier-sub">所需素材</p>
      ${materialList(slot.materials)}
      <p class="frontier-sub">附魔結果</p>
      ${slot.ranges
        ? table(["附魔", "最小值", "最大值"], slot.ranges.map(([name, min, max]) => [escape(name), `<span class="frontier-num">${min}</span>`, `<span class="frontier-num">${max}</span>`]))
        : `<ul class="frontier-chips">${slot.picks.map(pick => `<li>${escape(pick)}</li>`).join("")}</ul>`}
    </section>`).join("");
    const tiers = enchant.upgradeTiers.map(tier => `<section class="frontier-tier">
      <h4>${escape(tier.title ?? "基本升級")}<span>${escape(tier.note)}</span></h4>
      ${table(["目前等級", "結果", "所需素材"], tier.rows.map(row => [
        `<span class="frontier-num">Lv ${row.level}</span>`,
        `<ul class="frontier-outcomes">${row.outcomes.map(([rate, result]) =>
          `<li class="${result > row.level ? "is-up" : result < row.level ? "is-down" : ""}"><span class="frontier-num">${escape(rate)}</span> → Lv ${result}</li>`).join("")}</ul>`,
        materialList(row.materials),
      ]))}
    </section>`).join("");
    const newEnchants = data.newEnchants.map(item => `<li><strong>${escape(item.name)}</strong>${lineList(item.lines, [])}</li>`).join("");
    $("#frontier-view-headgear").innerHTML = `
      <p class="frontier-intro">可附魔對象：${enchant.targets.map(escape).join("、")}</p>
      <div class="frontier-cards">
        <section class="frontier-card"><h3>附魔重置</h3>${materialList(enchant.reset)}</section>
        ${slots}
      </div>
      <section class="frontier-block">
        <h2>第 2 洞附魔升級</h2>
        ${tiers}
      </section>
      <section class="frontier-block">
        <h2>追加附魔道具</h2>
        <ul class="frontier-new-enchants">${newEnchants}</ul>
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
  $("#frontier-reset").addEventListener("click", () => {
    for (const control of Object.values(filters)) control.value = "";
    renderGear();
    syncHash();
    filters.query.focus();
  });
  window.addEventListener("hashchange", () => { readHash(); renderGear(); });

  renderHeadgearEnchant();
  renderFrontierWeaponEnchant($("#frontier-view-weapon"), { label: "二次元武器", href: "./ragnarok-two-dimension-weapons.html#view=enchant" });
  readHash();
  renderGear();
})();
