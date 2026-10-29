"use strict";

(() => {
  const data = window.ragnarokDimensionBiosphereData;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const filters = { job: $("#biosphere-job"), batch: $("#biosphere-batch"), region: $("#biosphere-region"), query: $("#biosphere-query") };
  // Job, batch and region each narrow the list on their own; picking one resets the other two.
  const exclusive = [filters.job, filters.batch, filters.region];
  const tabs = [...document.querySelectorAll(".dimension-views [role=tab]")];
  const views = tabs.map(tab => tab.dataset.view);
  const detailView = "weapons";
  const sorts = ["job", "release"];
  let view = views[0];
  let sort = sorts[0];

  if (!data || !Array.isArray(data.gear)) {
    $("#biosphere-status").textContent = "資料載入失敗，請重新整理頁面。";
    return;
  }

  const batchOf = batch => data.batches.find(entry => entry.batch === batch);
  const weapons = data.gear.filter(item => !item.kind);
  const byJob = (a, b) => window.ragnarokJobRank(a.job) - window.ragnarokJobRank(b.job);

  filters.job.insertAdjacentHTML("beforeend", [...weapons].sort(byJob).map(weapon => `<option value="${escape(weapon.job)}">${escape(weapon.job)}</option>`).join(""));
  filters.batch.insertAdjacentHTML("beforeend", data.batches.map(entry => `<option value="${entry.batch}">${escape(entry.title)}（${entry.date}）</option>`).join(""));
  filters.region.insertAdjacentHTML("beforeend", data.batches.map(entry => `<optgroup label="${escape(entry.title)}">
    ${entry.regions.map(region => `<option value="${escape(region)}">${escape(region)}</option>`).join("")}
  </optgroup>`).join(""));

  // Effects are plain lines or { condition, lines } paragraphs; both flatten to text for searching.
  const entryText = entry => typeof entry === "string" ? [entry] : [entry.condition, ...entry.lines];
  const gear = data.gear.map(item => ({
    ...item,
    haystack: normalize([
      item.job, item.region, item.kind ?? "武器", item.restriction, ...(item.skills ?? []),
      ...item.names.flatMap(name => [name.id, name.kr, name.zh]),
      ...item.effects.flatMap(entryText), ...Object.values(item.grades).flat(), ...item.specs.map(spec => spec[1]),
      ...(item.cards ?? []).flatMap(card => [card.id, card.kr, card.zh, ...card.lines.flatMap(entryText)]),
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

  // Consecutive plain lines share one list; each conditional paragraph gets its own accented block.
  function effectList(entries, tokens) {
    const html = [];
    let run = [];
    const flush = () => {
      if (run.length) html.push(lineList(run, tokens));
      run = [];
    };
    for (const entry of entries) {
      if (typeof entry === "string") {
        run.push(entry);
        continue;
      }
      flush();
      html.push(`<div class="dimension-block"><p class="dimension-block-head">${highlight(entry.condition, tokens)}</p>${lineList(entry.lines, tokens)}</div>`);
    }
    flush();
    return html.join("");
  }

  const idPrefix = (id, tokens) => id ? `<span class="dimension-num">${highlight(id, tokens)}</span> · ` : "";
  const nameBlock = (name, slots, tokens) => `<div class="dimension-name">
    <h3>${highlight(name.zh, tokens)} <span class="dimension-slots">[${slots}]</span></h3>
    <p>${idPrefix(name.id, tokens)}<span lang="ko">${highlight(name.kr, tokens)}</span></p>
  </div>`;

  function renderCards(cards, tokens) {
    if (!cards?.length) return "";
    return `<p class="dimension-sub">搭配卡片</p>
      <div class="biosphere-cards">${cards.map(card => `<section class="biosphere-card">
        <h4>${highlight(card.zh, tokens)}</h4>
        <p class="biosphere-card-meta">${idPrefix(card.id, tokens)}<span lang="ko">${highlight(card.kr, tokens)}</span></p>
        ${effectList(card.lines, tokens)}
      </section>`).join("")}</div>`;
  }

  function renderItem(item, tokens, specs) {
    const grades = Object.entries(item.grades).map(([grade, lines]) =>
      `<li><span class="dimension-grade">${grade}</span><span>${lines.map(line => highlight(line, tokens)).join("<br>")}</span></li>`).join("");
    const tags = [
      `<span class="dimension-wave">${escape(item.kind ?? (item.job ? "武器" : "披肩"))}</span>`,
      item.region ? `<span class="biosphere-region">${highlight(item.region, tokens)}</span>` : "",
      item.job ? `<span class="dimension-job">${highlight(item.job, tokens)}</span>` : "",
    ].join("");
    return `<article class="dimension-item" data-item="${escape(item.names[0].zh)}">
      <header>
        <div class="dimension-tags">${tags}</div>
        ${item.names.map(name => nameBlock(name, item.slots, tokens)).join("")}
      </header>
      ${effectList(item.effects, tokens)}
      <p class="dimension-sub">各階級追加效果</p>
      <ul class="dimension-grades">${grades}</ul>
      ${renderCards(item.cards, tokens)}
      ${specList(specs)}
    </article>`;
  }

  const batchHeading = entry => `<h2>${escape(entry.title)}<span><a href="${escape(entry.url)}" target="_blank" rel="noopener">${entry.date} 實裝</a></span></h2>`;
  const gearSpecs = item => [...item.specs, ...data.gearSpecs, ["職業限制", item.restriction ?? item.job.replace(" & ", "、")]];

  function renderWeapons() {
    const tokens = normalize(filters.query.value).split(/\s+/).filter(Boolean);
    const matches = gear.filter(item =>
      (!filters.job.value || item.job === filters.job.value)
      && (!filters.batch.value || String(item.batch) === filters.batch.value)
      && (!filters.region.value || item.region === filters.region.value)
      && tokens.every(token => item.haystack.includes(token)));
    $("#biosphere-status").textContent = matches.length ? "" : "沒有符合條件的裝備，試試更短的關鍵字或重設篩選。";
    $("#biosphere-results").innerHTML = data.batches.map(entry => {
      const items = matches.filter(item => item.batch === entry.batch);
      if (!items.length) return "";
      return `<section class="dimension-wave-block" aria-label="${escape(entry.title)}">
        ${batchHeading(entry)}
        <div class="dimension-grid">${items.map(item => renderItem(item, tokens, gearSpecs(item))).join("")}</div>
      </section>`;
    }).join("");
  }

  function renderCapes() {
    $("#biosphere-view-capes").innerHTML = data.batches.map(entry => {
      const items = data.capes.filter(cape => cape.batch === entry.batch);
      return `<section class="dimension-wave-block" aria-label="${escape(entry.title)}">
        ${batchHeading(entry)}
        <div class="dimension-grid">${items.map(cape => renderItem(cape, [], data.capeSpecs)).join("")}</div>
      </section>`;
    }).join("");
  }

  const lineBreaks = lines => lines.map(escape).join("<br>");
  const baseCardLine = /^M?ATK \+ 10%$/;
  // The summary drops each card's shared ATK / MATK + 10% and folds conditional paragraphs into single lines.
  const cardSummaryLines = card => card.lines.flatMap(entry => typeof entry === "string"
    ? (baseCardLine.test(entry) ? [] : [entry])
    : entry.lines.map(line => `${entry.condition}，${line}`));
  const cardBox = card => `<div class="dimension-extra">
    <p class="dimension-extra-trigger"><span class="dimension-extra-tag">${escape(card.zh.replace(/^次元/, "").replace(/卡片$/, ""))}</span>${escape(card.zh)}</p>
    ${cardSummaryLines(card).map(line => `<p class="dimension-extra-line">${escape(line)}</p>`).join("")}
  </div>`;

  const comparators = { job: byJob, release: (a, b) => a.batch - b.batch || byJob(a, b) };

  // The 推出 and 職業 headers double as the sort controls of the summary table.
  const sortColumns = { 推出: "release", 職業: "job" };
  const summaryHead = cell => {
    const key = sortColumns[cell];
    if (!key) return `<th scope="col">${escape(cell)}</th>`;
    const active = key === sort;
    return `<th scope="col" aria-sort="${active ? "ascending" : "none"}"><button type="button" class="dimension-sort${active ? " is-active" : ""}" data-sort="${key}" title="依${key === "job" ? "職業" : "推出時間"}排序">${escape(cell)}<span aria-hidden="true">${active ? "▲" : "↕"}</span></button></th>`;
  };

  function renderSummary() {
    const rows = [...weapons].sort(comparators[sort]).map(weapon => {
      const set = data.gear.filter(item => item.job === weapon.job && item.batch === weapon.batch);
      return `<tr>
        <td>${batchOf(weapon.batch).date}</td>
        <td>${escape(weapon.region)}</td>
        <td><strong>${weapon.job.split(" & ").map(escape).join("<br>")}</strong></td>
        <td class="biosphere-gear"><a href="#${new URLSearchParams({ view: detailView })}" data-item="${escape(weapon.names[0].zh)}">${set.flatMap(item => item.names.map(name => escape(name.zh))).join("<br>")}</a></td>
        <td class="biosphere-skills">${lineBreaks(weapon.skills)}</td>
        <td>${weapon.cards.map(cardBox).join("")}</td>
      </tr>`;
    }).join("");
    $("#biosphere-summary-table").innerHTML = `<div class="dimension-table-scroll" tabindex="0"><table class="dimension-table">
      <thead><tr>${["推出", "區域", "職業", "裝備", "強化技能", "卡片效果"].map(summaryHead).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  // Summary links open the unfiltered detail view, scroll to the item and highlight it.
  // Capes live in their own view; everything else opens the unfiltered weapon view.
  function openDetail(item) {
    const isCape = data.capes.some(cape => cape.names.some(name => name.zh === item));
    for (const control of Object.values(filters)) control.value = "";
    showView(isCape ? "capes" : detailView);
    renderWeapons();
    syncHash();
    for (const card of document.querySelectorAll(".dimension-item.is-target")) card.classList.remove("is-target");
    const card = document.querySelector(`#biosphere-view-${isCape ? "capes" : "weapons"} [data-item="${CSS.escape(item)}"]`);
    card?.classList.add("is-target");
    card?.scrollIntoView({ block: "start" });
  }

  // Links from the about view open the weapon view filtered to one job, batch or region.
  function openFiltered(key, value) {
    for (const control of Object.values(filters)) control.value = "";
    filters[key].value = value;
    showView(detailView);
    renderWeapons();
    syncHash();
    $("#biosphere-tool").scrollIntoView({ block: "start" });
  }

  // Monster images come from other sites, so they load only after the viewer asks, on every visit.
  let showImages = false;
  let monsterRegion = "";
  const monsterColumns = ["區域", "名稱", "等級", "HP", "種族", "屬性", "體型", "HIT 需求", "CRI 需求"];

  function renderMonsterControls() {
    const regions = data.batches.flatMap(entry => entry.regions);
    // Each region's monsters share one element, shown beside its name, e.g. 火山（火）.
    const element = region => Object.values(data.monsters).flat().find(monster => monster.region === region).element.split(" ")[0];
    $("#biosphere-view-monsters").innerHTML = `<ul class="biosphere-notes">
        ${data.monsterNotes.map(note => `<li><a href="${escape(note.href)}" target="_blank" rel="noopener">${escape(note.text)}</a></li>`).join("")}
        <li>粗體為該批次最高的 HIT 與 CRI 需求。</li>
      </ul>
      <div class="biosphere-monster-controls">
        <div class="biosphere-filter" role="group" aria-label="依區域篩選">
          ${["", ...regions].map(region => `<button type="button" data-region="${escape(region)}">${escape(region ? `${region}（${element(region)}）` : "所有區域")}</button>`).join("")}
        </div>
        <button type="button" class="secondary-button" id="biosphere-images"></button>
      </div>
      <p id="biosphere-monster-peak" class="biosphere-peak" role="status" aria-live="polite"></p>
      <div id="biosphere-monster-tables"></div>`;
  }

  // Each batch's highest HIT and CRI requirement is emphasized, as the articles did; rows follow the batch's region order.
  function renderMonsters() {
    for (const button of document.querySelectorAll("#biosphere-view-monsters [data-region]")) button.setAttribute("aria-pressed", String(button.dataset.region === monsterRegion));
    const toggle = $("#biosphere-images");
    toggle.setAttribute("aria-pressed", String(showImages));
    toggle.textContent = showImages ? "隱藏魔物外觀" : "載入魔物外觀";
    const columns = showImages ? ["外觀", ...monsterColumns] : monsterColumns;
    const colgroup = `<colgroup>${showImages ? '<col class="biosphere-col-image">' : ""}${monsterColumns.map((_, index) => `<col class="biosphere-col-${index}">`).join("")}</colgroup>`;
    const shown = Object.values(data.monsters).flat()
      .filter(monster => !monsterRegion || monster.region === monsterRegion)
      .flatMap(monster => monster.variants);
    $("#biosphere-monster-peak").innerHTML = `目前篩選結果的最高需求：HIT <strong class="dimension-num">${Math.max(...shown.map(variant => variant[2]))}</strong>・CRI <strong class="dimension-num">${Math.max(...shown.map(variant => variant[3]))}</strong>`;
    $("#biosphere-monster-tables").innerHTML = data.batches.map(entry => {
      const all = data.monsters[entry.batch];
      const variants = all.flatMap(monster => monster.variants);
      const maxHit = Math.max(...variants.map(variant => variant[2]));
      const maxCri = Math.max(...variants.map(variant => variant[3]));
      const monsters = all
        .map((monster, order) => ({ monster, order }))
        .sort((a, b) => entry.regions.indexOf(a.monster.region) - entry.regions.indexOf(b.monster.region) || a.order - b.order)
        .map(({ monster }) => monster)
        .filter(monster => !monsterRegion || monster.region === monsterRegion);
      if (!monsters.length) return "";
      const need = (value, max) => `<td class="dimension-num${value === max ? " biosphere-max" : ""}">${value}</td>`;
      const rows = monsters.map(monster => monster.variants.map(([name, hp, hit, cri], index) => {
        const span = `rowspan="${monster.variants.length}"`;
        const shared = cell => index ? "" : `<td ${span}>${escape(cell)}</td>`;
        const image = showImages && !index
          ? `<td ${span} class="biosphere-image"><img src="${escape(monster.image)}" alt="${escape(name)}" loading="lazy" decoding="async"></td>`
          : "";
        return `<tr${index ? "" : ' class="biosphere-group"'}>
          ${image}${shared(monster.region)}
          <td lang="ko">${escape(name)}</td>
          ${index ? "" : `<td class="dimension-num" ${span}>${monster.level}</td>`}
          <td class="dimension-num">${hp.toLocaleString("en-US")}</td>
          ${shared(monster.race)}${shared(monster.element)}${shared(monster.size)}
          ${need(hit, maxHit)}${need(cri, maxCri)}
        </tr>`;
      }).join("")).join("");
      return `<section class="dimension-wave-block" aria-label="${escape(entry.title)}">
        ${batchHeading(entry)}
        <div class="dimension-table-scroll" tabindex="0"><table class="dimension-table biosphere-monsters">
          ${colgroup}
          <thead><tr>${columns.map(cell => `<th scope="col">${cell}</th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </section>`;
    }).join("");
  }

  const plainTable = (head, rows, extra = "") => `<div class="dimension-table-scroll" tabindex="0"><table class="dimension-table biosphere-plain${extra}">
    <thead><tr>${head.map(cell => `<th scope="col">${cell}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;

  const filterLink = (key, value, label) => `<a href="#${new URLSearchParams({ view: detailView, [key]: value })}" data-filter="${key}" data-value="${escape(value)}">${escape(label)}</a>`;
  const itemLink = item => `<a href="#${new URLSearchParams({ view: detailView })}" data-item="${escape(item)}">${escape(item)}</a>`;
  // Exchange materials read "名稱 × 數量" or "數量 Zeny"; splitting them lines every count up on the right.
  const materialPair = text => text.includes(" × ") ? text.split(" × ") : ["Zeny", text.replace(/ Zeny$/, "")];
  const materialList = materials => `<ul class="biosphere-materials">${materials.map(materialPair).map(([name, count]) =>
    `<li><span>${escape(name)}</span><span class="dimension-num${name === "Zeny" ? "" : " biosphere-count"}">${escape(count)}</span></li>`).join("")}</ul>`;

  function renderAbout() {
    const batches = plainTable(["推出時間", "區域", "關聯職業"], data.batches.map(entry => [
      filterLink("batch", String(entry.batch), entry.date),
      entry.regions.map(region => filterLink("region", region, region)).join("、"),
      weapons.filter(weapon => weapon.batch === entry.batch).sort(byJob).map(weapon => filterLink("job", weapon.job, weapon.job.replace(" & ", "&"))).join("、"),
    ]));
    // Weapon leaves (之葉) and cape / shield leaves (葉片) get their own tables, keyed by the region in the name.
    const leafTable = kind => plainTable(["區域", "道具名稱", "適用裝備"], data.leaves.filter(leaf => leaf.name.startsWith(kind)).map(leaf => [
      `<strong>${escape(leaf.name.match(/\((.+)\)/)[1])}</strong>`,
      `${escape(leaf.name)}<br><span class="biosphere-card-meta" lang="ko">${escape(leaf.kr)}</span>`,
      leaf.items.map(itemLink).join("、"),
    ]), " biosphere-leaves");
    const exchanges = plainTable(["兌換道具", "所需素材"], data.exchanges.map(entry => [`<strong>${escape(entry.item)}</strong>`, materialList(entry.materials)]));
    $("#biosphere-view-about").innerHTML = `
      ${data.intro.map(text => `<p class="dimension-intro">${escape(text)}</p>`).join("")}
      <section class="dimension-card">
        <h2>推出時間</h2>
        ${batches}
      </section>
      <section class="dimension-card">
        <h2>二次元生態之葉與葉片</h2>
        <p>可以使用於精煉值 +9 ~ +11 的對應二次元裝備，使精煉值提升 1。</p>
        <h3 class="biosphere-subhead">二次元生態之葉（武器）</h3>
        ${leafTable("二次元生態之葉")}
        <h3 class="biosphere-subhead">二次元生態葉片（披肩、盾牌）</h3>
        ${leafTable("二次元生態葉片")}
      </section>
      <section class="dimension-card">
        <h2>兌換所需素材</h2>
        <p>其他區域推測相同，僅是需要替換為對應區域的素材，此處以火山區域舉例。</p>
        ${exchanges}
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
  for (const control of Object.values(filters)) control.addEventListener(control.tagName === "SELECT" ? "change" : "input", () => {
    if (exclusive.includes(control)) for (const other of exclusive) if (other !== control) other.value = "";
    renderWeapons();
    syncHash();
  });
  $("#biosphere-reset").addEventListener("click", () => {
    for (const control of Object.values(filters)) control.value = "";
    renderWeapons();
    syncHash();
    filters.query.focus();
  });
  $("#biosphere-view-summary").addEventListener("click", event => {
    const sortButton = event.target.closest("[data-sort]");
    if (sortButton) {
      sort = sortButton.dataset.sort;
      renderSummary();
      $(`#biosphere-summary-table [data-sort="${sort}"]`).focus();
      syncHash();
      return;
    }
    const link = event.target.closest("a[data-item]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    openDetail(link.dataset.item);
  });
  $("#biosphere-view-about").addEventListener("click", event => {
    const link = event.target.closest("a[data-filter], a[data-item]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    if (link.dataset.filter) openFiltered(link.dataset.filter, link.dataset.value);
    else openDetail(link.dataset.item);
  });
  window.addEventListener("hashchange", () => { readHash(); renderSummary(); renderWeapons(); });

  $("#biosphere-view-monsters").addEventListener("click", event => {
    const regionButton = event.target.closest("[data-region]");
    if (regionButton) {
      monsterRegion = regionButton.dataset.region;
    } else if (event.target.closest("#biosphere-images")) {
      showImages = !showImages;
    } else {
      return;
    }
    renderMonsters();
  });

  renderCapes();
  renderMonsterControls();
  renderMonsters();
  renderAbout();
  readHash();
  renderSummary();
  renderWeapons();
})();
