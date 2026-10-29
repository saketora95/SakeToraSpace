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
  const detailView = "gear";
  let view = views[0];

  if (!data || !Array.isArray(data.jobs)) {
    $("#frontier-status").textContent = "資料載入失敗，請重新整理頁面。";
    return;
  }

  $("#frontier-release").textContent = data.release;
  filters.job.insertAdjacentHTML("beforeend", data.jobs.map(job => `<option value="${escape(job.job)}">${escape(job.job)}</option>`).join(""));

  const textOf = item => [
    ...(item.names ?? [item.name]), ...item.effects, item.set.condition, ...item.set.lines, item.set.trigger, ...(item.set.extra ?? []),
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

  const namesOf = item => item.names ?? [item.name];

  function renderItem(item, kind, tokens, specs) {
    const names = namesOf(item).map(name => `<h4>${highlight(name, tokens)} <span class="frontier-slots">[${item.slots}]</span></h4>`).join("");
    const grades = Object.entries(item.grades).map(([grade, lines]) =>
      `<li><span class="frontier-grade">${grade}</span><span>${lines.map(line => highlight(line, tokens)).join("<br>")}</span></li>`).join("");
    return `<article class="frontier-item" data-item="${escape(namesOf(item)[0])}">
      <header><span class="frontier-kind${kind === "武器" ? " is-weapon" : ""}">${kind}</span>${names}</header>
      ${lineList(item.effects, tokens)}
      <div class="frontier-set">
        <p class="frontier-set-head">${highlight(item.set.condition, tokens)}</p>
        ${lineList(item.set.extra ? [...item.set.lines, item.set.trigger] : item.set.lines, tokens)}
        ${item.set.extra ? `<p class="frontier-extra-head">額外效果</p>${lineList(item.set.extra, tokens)}` : ""}
      </div>
      <p class="frontier-sub">各階級追加效果</p>
      <ul class="frontier-grades">${grades}</ul>
      ${specList(specs)}
    </article>`;
  }

  function renderJob(job, tokens) {
    const restriction = [["職業限制", job.job.replace(" & ", "、")]];
    return `<section class="frontier-job" aria-label="${escape(job.job)}" data-job="${escape(job.job)}">
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

  const detailLink = (job, item) => `<a href="#${new URLSearchParams({ view: detailView })}" data-job="${escape(job.job)}" data-item="${escape(namesOf(item)[0])}">${namesOf(item).map(escape).join(" / ")}</a>`;
  const lineBreaks = lines => lines.map(escape).join("<br>");
  // Summary-only box for 額外效果 and set bonuses: a tag and head sentence over the effects.
  const effectBox = (tag, head, lines) => `<div class="frontier-extra">
    <p class="frontier-extra-trigger"><span class="frontier-extra-tag">${tag}</span>${escape(head)}</p>
    ${lines.map(line => `<p class="frontier-extra-line">${escape(line)}</p>`).join("")}
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

  function renderSummary() {
    const rows = data.jobs.map(job => [
      `<strong>${escape(job.job)}</strong>`,
      [job.headgear, ...job.weapons].map(item => detailLink(job, item)).join("<br>"),
      lineBreaks(job.skills),
      // Every set bonus of the job: the weapons' two-piece bonus first, then the headgear's full-set bonus.
      `${lineBreaks([...job.weapons, job.headgear].flatMap(item => item.set.lines))}${[...job.weapons, job.headgear].map(item => extraBox(item.set)).join("")}`,
    ]);
    $("#frontier-view-summary").innerHTML = `<div class="frontier-summary">${table(["職業", "道具", "強化技能", "特殊效果"], rows)}</div>`;
  }

  // Summary links open the unfiltered detail view, scroll to the item and highlight it with the rest of its set.
  function openDetail(job, item) {
    for (const control of Object.values(filters)) control.value = "";
    showView(detailView);
    renderGear();
    syncHash();
    const cards = [...document.querySelectorAll(`#frontier-results [data-job="${CSS.escape(job)}"] .frontier-item`)];
    for (const card of cards) card.classList.add("is-target");
    // Land on the job heading when the item starts its row, so the whole set and its skills stay in view.
    const card = cards.find(card => card.dataset.item === item);
    const section = card?.closest(".frontier-job");
    const startsRow = card && Math.abs(card.getBoundingClientRect().top - cards[0].getBoundingClientRect().top) < 1;
    (startsRow ? section : card)?.scrollIntoView({ block: "start" });
  }

  const table = (head, rows) => `<div class="frontier-table-scroll" tabindex="0"><table class="frontier-table">
    <thead><tr>${head.map(cell => `<th scope="col">${escape(cell)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
  const materialRows = materials => materials.map(([name, count]) => [escape(name), `<span class="frontier-num">${escape(count)}</span>`]);
  const materialList = materials => `<ul class="frontier-materials">${materials.map(([name, count]) => `<li><span>${escape(name)}</span><span class="frontier-num">${escape(count)}</span></li>`).join("")}</ul>`;

  // Random slots list each result with its range; when every result shares one range it is stated once, in the slot's own wording if it has one.
  function slotResults(slot) {
    if (slot.picks) return `<ul class="frontier-chips">${slot.picks.map(pick => `<li>${escape(pick)}</li>`).join("")}</ul>`;
    const ranges = new Set(slot.ranges.map(([, min, max]) => `${min} ~ ${max}`));
    if (ranges.size > 1) return `<ul class="frontier-chips">${slot.ranges.map(([name, min, max]) => `<li>${escape(name)} <span class="frontier-num">${min} ~ ${max}</span></li>`).join("")}</ul>`;
    return `<ul class="frontier-chips">${slot.ranges.map(([name]) => `<li>${escape(name)}</li>`).join("")}</ul>
      <p class="frontier-range">${slot.rangeNote ? escape(slot.rangeNote) : `隨機數值 <span class="frontier-num">${[...ranges][0]}</span>`}</p>`;
  }

  const outcomeList = row => `<ul class="frontier-outcomes">${row.outcomes.map(([rate, result]) =>
    `<li class="${result > row.level ? "is-up" : result < row.level ? "is-down" : ""}"><span class="frontier-num">${escape(rate)}</span> → Lv ${result}</li>`).join("")}</ul>`;

  // One table for the regular upgrade path; 特殊升級 stays separate with the same columns.
  function upgradeTable(tiers) {
    const rows = tiers.flatMap(tier => tier.rows.map(row => `<tr>
      <td><span class="frontier-num">Lv ${row.level}</span></td>
      <td>${outcomeList(row)}</td>
      <td>${materialList(row.materials)}</td>
    </tr>`)).join("");
    return `<div class="frontier-table-scroll" tabindex="0"><table class="frontier-table frontier-upgrade">
      <thead><tr>${["目前等級", "結果", "所需素材"].map(cell => `<th scope="col">${cell}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  function renderHeadgearEnchant() {
    const enchant = data.headgearEnchant;
    const enchantRows = [
      `<tr><th scope="row">附魔重置</th><td>${materialList(enchant.reset)}</td><td>—</td></tr>`,
      ...enchant.slots.map(slot => `<tr><th scope="row">${escape(slot.title)}</th><td>${materialList(slot.materials)}</td><td>${slotResults(slot)}</td></tr>`),
    ].join("");
    const regular = enchant.upgradeTiers.filter(tier => !tier.title);
    const special = enchant.upgradeTiers.filter(tier => tier.title);
    const newEnchants = data.newEnchants.map(item => `<li><strong>${escape(item.name)}</strong>${lineList(item.lines, [])}</li>`).join("");
    $("#frontier-view-headgear").innerHTML = `
      <p class="frontier-intro">可附魔對象：${enchant.targets.map(escape).join("、")}</p>
      <div class="frontier-table-scroll" tabindex="0"><table class="frontier-table frontier-enchant">
        <thead><tr><th scope="col">項目</th><th scope="col">所需素材</th><th scope="col">附魔結果</th></tr></thead>
        <tbody>${enchantRows}</tbody>
      </table></div>
      <section class="frontier-block">
        <h2>第 2 洞附魔升級</h2>
        ${upgradeTable(regular)}
        ${special.map(tier => `<section class="frontier-tier">
          <h4>${escape(tier.title)}</h4>
          ${upgradeTable([tier])}
        </section>`).join("")}
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
  $("#frontier-reset").addEventListener("click", () => {
    for (const control of Object.values(filters)) control.value = "";
    renderGear();
    syncHash();
    filters.query.focus();
  });
  $("#frontier-view-summary").addEventListener("click", event => {
    const link = event.target.closest("a[data-job]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    openDetail(link.dataset.job, link.dataset.item);
  });
  window.addEventListener("hashchange", () => { readHash(); renderGear(); });

  renderSummary();
  renderHeadgearEnchant();
  renderFrontierWeaponEnchant($("#frontier-view-weapon"), { label: "二次元武器", href: "./ragnarok-two-dimension-weapons.html#view=enchant" });
  readHash();
  renderGear();
})();
