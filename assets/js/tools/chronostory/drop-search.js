"use strict";

let chronoStoryDataPromise;
function loadChronoStoryDrops() {
  if (window.chronoStoryDropData) return Promise.resolve(window.chronoStoryDropData);
  if (!chronoStoryDataPromise) {
    chronoStoryDataPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("./assets/js/tools/chronostory/drop-data.js", document.baseURI).href;
      script.onload = () => {
        if (window.chronoStoryDropData) resolve(window.chronoStoryDropData);
        else { script.remove(); reject(new Error("Missing drop data")); }
      };
      script.onerror = () => { script.remove(); reject(new Error("Unable to load drop data")); };
      document.head.append(script);
    }).catch(error => { chronoStoryDataPromise = null; throw error; });
  }
  return chronoStoryDataPromise;
}

function normalizeChronoStoryQuery(value) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/卷軸/g, "").replace(/\s+/g, "");
}

function createChronoStoryIndex(data) {
  const items = new Map(data.items.map(item => [item.id, item]));
  const monsters = new Map(data.monsters.map(monster => [monster.id, monster]));
  const itemDrops = new Map(data.items.map(item => [item.id, []]));
  const monsterDrops = new Map(data.monsters.map(monster => [monster.id, []]));
  data.drops.forEach(drop => {
    itemDrops.get(drop.itemId).push(drop);
    monsterDrops.get(drop.monsterId).push(drop);
  });
  return { items, monsters, itemDrops, monsterDrops };
}

function findChronoStoryEntries(data, state) {
  const tokens = state.query.normalize("NFKC").trim().split(/\s+/).map(normalizeChronoStoryQuery).filter(Boolean);
  const entries = state.mode === "items" ? data.items : data.monsters;
  const collator = new Intl.Collator("zh-Hant");
  const exact = normalizeChronoStoryQuery(state.query);
  return entries.filter(entry => {
    if (!tokens.every(token => normalizeChronoStoryQuery(entry.name).includes(token))) return false;
    if (state.mode === "items") {
      return (!state.kind || entry.kind === state.kind) && (!state.job || entry.jobs.includes(state.job));
    }
    return !state.region || entry.regions.includes(state.region);
  }).sort((a, b) => Number(normalizeChronoStoryQuery(b.name) === exact) - Number(normalizeChronoStoryQuery(a.name) === exact)
    || collator.compare(a.name, b.name));
}

async function renderChronostoryDropSearch() {
  const content = document.querySelector("#chronostory-content");
  content.innerHTML = '<div class="drop-search"><p role="status" class="helper">正在載入掉落資料…</p></div>';
  const root = content.firstElementChild;
  try {
    const data = await loadChronoStoryDrops();
    if (!root.isConnected) return;
    mountChronoStoryDropSearch(root, data);
  } catch {
    if (!root.isConnected) return;
    root.innerHTML = '<p role="alert">掉落資料載入失敗，請重試。</p><button type="button" class="secondary-button">重新載入</button>';
    root.querySelector("button").addEventListener("click", renderChronostoryDropSearch);
  }
}

function mountChronoStoryDropSearch(root, data) {
  const index = createChronoStoryIndex(data);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  const unique = values => [...new Set(values)];
  const modeFromHash = () => ["items", "monsters", "regions"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "items";
  const state = { mode: modeFromHash(), query: "", kind: "", job: "", region: "", selected: null, limit: 40 };
  const history = [];
  let matches = [];
  const regions = unique(data.monsters.flatMap(monster => monster.regions));
  const jobs = unique(data.items.flatMap(item => item.jobs));
  const options = values => values.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join("");
  const kindName = item => item.kind === "scroll" ? "卷軸" : "裝備";
  const relationCount = entry => state.mode === "items" ? index.itemDrops.get(entry.id).length : index.monsterDrops.get(entry.id).length;

  root.innerHTML = `
    <div class="drop-summary"><span>${data.items.length} 種道具</span><span>${data.monsters.length} 種魔物</span><span>${data.drops.length} 筆掉落關聯</span></div>
    <div class="drop-modes" role="group" aria-label="查詢方式">
      <button type="button" data-mode="items" aria-pressed="false">道具查詢</button>
      <button type="button" data-mode="monsters" aria-pressed="false">魔物名稱查詢</button>
      <button type="button" data-mode="regions" aria-pressed="false">魔物掉落查詢</button>
    </div>
    <div class="drop-region-controls" hidden>
      <label class="field" for="drop-area">1. 選擇地區<select id="drop-area"><option value="">請選擇地區</option>${options(regions)}</select></label>
      <label class="field" for="drop-monster">2. 選擇魔物<select id="drop-monster" disabled><option value="">請先選擇地區</option></select></label>
    </div>
    <div class="drop-controls">
      <label class="field drop-query" for="drop-query"><span id="drop-query-label">道具名稱</span><input id="drop-query" type="search" autocomplete="off" placeholder="例如：火槍攻擊、紅色巴爾鞋" aria-describedby="drop-search-help"></label>
      <label class="field" id="drop-kind-field" for="drop-kind">道具類型<select id="drop-kind"><option value="">全部類型</option value="equipment">裝備</option><option value="scroll">卷軸</option></select></label>
      <label class="field" id="drop-job-field" for="drop-job">裝備職業<select id="drop-job"><option value="">全部職業</option>${options(jobs)}</select></label>
      <label class="field" id="drop-region-field" for="drop-region" hidden>地區<select id="drop-region"><option value="">全部地區</option>${options(regions)}</select></label>
    </div>
    <div class="drop-search-actions"><p id="drop-search-help" class="helper">支援部分名稱；多個關鍵字以空格分隔，例如「火槍 10%」。</p><button type="button" class="secondary-button" id="drop-reset">清除條件</button></div>
    <p id="drop-result-status" class="helper" role="status" aria-live="polite"></p>
    <div class="drop-browser">
      <section class="drop-results" aria-label="搜尋結果"><div id="drop-result-list" class="drop-result-list"></div><button type="button" class="secondary-button" id="drop-more" hidden>顯示更多</button></section>
      <section class="drop-detail" aria-label="查詢明細"><button type="button" class="secondary-button" id="drop-back" hidden>← 返回上次查詢</button><div id="drop-detail-body"></div></section>
    </div>
    <p class="drop-source">資料更新：${escape(data.source.importedOn)} · <a href="${escape(data.source.url)}" target="_blank" rel="noopener noreferrer">資料來源 ↗</a></p>`;
  const $ = selector => root.querySelector(selector);

  function rateMarkup(drop) {
    const rates = unique(drop.observations.map(o => o.ratePercent).filter(rate => rate !== null)).sort((a, b) => b - a);
    const needsConfirmation = rates.length > 1 || drop.observations.some(o => o.rateText && o.ratePercent === null);
    return `${rates.length ? rates.map(rate => `${rate}%`).join(" / ") : "未記載"}${needsConfirmation ? '<small>機率待確認</small>' : ""}`;
  }

  function itemFacts(item) {
    const variants = item.variants.map(v => {
      const facts = [v.build, v.category];
      if (v.requirement?.value !== null && v.requirement?.value !== undefined) facts.push(`${v.requirement.type === "luk" ? "幸運需求" : "裝備等級"} ${v.requirement.value}`);
      if (v.successPercent !== undefined) facts.push(`卷軸成功率 ${v.successPercent}%`);
      if (v.totalMaxStats) facts.push(`最高屬性總和 ${v.totalMaxStats}`);
      if (v.stats) facts.push(`${item.kind === "scroll" ? "效果" : "最高屬性"}：${v.stats}`);
      return `<li>${facts.filter(Boolean).map(escape).join(" · ")}</li>`;
    }).join("");
    const supplementalFacts = !item.variants.length ? unique(item.summaryNotes.map(note => [
      note.level ? `裝備等級 ${note.level}` : "",
      note.totalMaxStats ? `最高屬性總和 ${note.totalMaxStats}` : "",
      note.stats || "",
    ].filter(Boolean).join(" · "))).filter(Boolean).map(fact => `<li>${escape(fact)}</li>`).join("") : "";
    return `<ul class="drop-facts">${variants || supplementalFacts}</ul>`;
  }

  function renderDetail() {
    $("#drop-back").hidden = history.length === 0;
    const entry = (state.mode === "items" ? index.items : index.monsters).get(state.selected);
    if (!entry) {
      $("#drop-detail-body").innerHTML = `<p class="drop-placeholder">${state.mode === "regions" ? "請從上方依序選擇地區與魔物。" : "選擇一筆結果，即可查看掉落資料。"}</p>`;
      return;
    }
    const isItem = state.mode === "items";
    const rows = [...(isItem ? index.itemDrops : index.monsterDrops).get(entry.id)];
    const collator = new Intl.Collator("zh-Hant");
    const related = drop => isItem ? index.monsters.get(drop.monsterId) : index.items.get(drop.itemId);
    rows.sort((a, b) => collator.compare(related(a).name, related(b).name));
    const meta = isItem ? [kindName(entry), ...entry.jobs, ...entry.categories] : [entry.boss ? "Boss" : "魔物", ...entry.regions];
    const facts = isItem ? itemFacts(entry) : unique(entry.elements.map(element => element.text)).map(text => `<p class="drop-elements">${escape(text)}</p>`).join("");
    $("#drop-detail-body").innerHTML = `
      <h3 id="drop-detail-title" tabindex="-1">${escape(entry.name)}</h3>
      <div class="drop-tags">${unique(meta).map(label => `<span>${escape(label)}</span>`).join("")}</div>
      ${facts}
      <h4>${isItem ? "掉落來源" : "已收錄掉落品"}<span>${rows.length}</span></h4>
      ${!isItem ? '<p class="helper">僅顯示已收錄的掉落；卷軸名稱中的百分比為成功率。</p>' : ""}
      ${rows.length ? `<div class="drop-table-scroll" role="region" aria-label="掉落資料，可左右捲動" tabindex="0"><table class="drop-table"><thead><tr><th scope="col">${isItem ? "魔物 / 地區" : "道具"}</th><th scope="col">掉落率</th></tr></thead><tbody>${rows.map(drop => {
        const other = related(drop);
        const sub = isItem ? unique(drop.observations.map(o => o.region)).join("、") : [kindName(other), ...other.jobs].join(" · ");
        const effects = isItem ? [] : unique((other.variants.length ? other.variants : other.summaryNotes)
          .map(variant => variant.stats || "").filter(Boolean));
        return `<tr><th scope="row"><button type="button" class="drop-related" data-related="${escape(other.id)}">${escape(other.name)} <span aria-hidden="true">↗</span></button><small>${escape(sub)}</small>${effects.map(effect => `<small class="drop-effects">${escape(effect)}</small>`).join("")}</th><td>${rateMarkup(drop)}</td></tr>`;
      }).join("")}</tbody></table></div>` : '<p class="drop-placeholder">尚未收錄此道具的掉落來源。</p>'}`;
  }

  function renderList() {
    $("#drop-result-list").innerHTML = matches.length ? matches.slice(0, state.limit).map(entry => `<button type="button" class="drop-result" data-entry="${escape(entry.id)}" aria-pressed="${entry.id === state.selected}"><span>${escape(entry.name)}</span><small>${state.mode === "items" ? `${kindName(entry)} · ${relationCount(entry) ? `${relationCount(entry)} 種魔物` : "來源未記載"}` : `${entry.boss ? "Boss · " : ""}${relationCount(entry)} 種道具`}</small></button>`).join("") : '<p class="drop-placeholder">找不到符合的資料。試試部分名稱，或清除篩選條件。</p>';
    $("#drop-result-status").textContent = `找到 ${matches.length} ${state.mode === "items" ? "種道具" : "種魔物"}，顯示 ${Math.min(matches.length, state.limit)} 筆。`;
    $("#drop-more").hidden = state.limit >= matches.length;
  }

  function update() {
    if (state.mode === "regions") {
      const monsters = data.monsters.filter(monster => state.region && monster.regions.includes(state.region))
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
      if (!monsters.some(monster => monster.id === state.selected)) state.selected = null;
      $("#drop-monster").innerHTML = `<option value="">${state.region ? "請選擇魔物" : "請先選擇地區"}</option>`
        + monsters.map(monster => `<option value="${escape(monster.id)}">${escape(monster.name)}${monster.boss ? "（Boss）" : ""}</option>`).join("");
      $("#drop-monster").disabled = !monsters.length;
      $("#drop-monster").value = state.selected || "";
      $("#drop-result-status").textContent = state.region ? `${state.region} · ${monsters.length} 種魔物可查詢` : "先選擇地區，再選擇魔物以查看掉落清單。";
      renderDetail();
      return;
    }
    matches = findChronoStoryEntries(data, state);
    if (!matches.some(entry => entry.id === state.selected)) state.selected = matches[0]?.id ?? null;
    renderList();
    $("#drop-result-list").scrollTop = 0;
    renderDetail();
  }

  function syncControls() {
    const regionMode = state.mode === "regions";
    if (location.hash !== `#${state.mode}`) window.history.replaceState(null, "", `#${state.mode}`);
    root.querySelectorAll("[data-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode)));
    $(".drop-controls").hidden = regionMode;
    $(".drop-region-controls").hidden = !regionMode;
    $("#drop-search-help").hidden = regionMode;
    $(".drop-results").hidden = regionMode;
    $(".drop-browser").classList.toggle("drop-region-browser", regionMode);
    $("#drop-area").value = regionMode ? state.region : "";
    $("#drop-query").value = state.query;
    $("#drop-kind").value = state.kind;
    $("#drop-job").value = state.job;
    $("#drop-region").value = state.region;
    $("#drop-kind-field").hidden = state.mode !== "items";
    $("#drop-job-field").hidden = state.mode !== "items";
    $("#drop-job").disabled = state.kind === "scroll";
    $("#drop-region-field").hidden = state.mode !== "monsters";
    $("#drop-query-label").textContent = state.mode === "items" ? "道具名稱" : "魔物名稱";
    $("#drop-query").placeholder = state.mode === "items" ? "例如：火槍攻擊、紅色巴爾鞋" : "例如：化石龍、維京";
    update();
  }

  function reset(mode = state.mode) {
    Object.assign(state, { mode, query: "", kind: "", job: "", region: "", selected: null, limit: 40 });
    history.length = 0;
    syncControls();
    $(state.mode === "regions" ? "#drop-area" : "#drop-query").focus();
  }

  function focusDetail() {
    const title = $("#drop-detail-title");
    if (!title) return;
    title.focus({ preventScroll: true });
    title.scrollIntoView({ block: "start", behavior: "instant" });
  }

  root.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => reset(button.dataset.mode)));
  window.addEventListener("hashchange", () => reset(modeFromHash()));
  $("#drop-area").addEventListener("change", event => {
    state.region = event.target.value;
    state.selected = null;
    update();
  });
  $("#drop-monster").addEventListener("change", event => {
    state.selected = event.target.value || null;
    renderDetail();
  });
  $("#drop-reset").addEventListener("click", () => reset());
  $("#drop-query").addEventListener("input", event => {
    state.query = event.target.value;
    state.limit = 40;
    state.selected = null;
    update();
  });
  ["kind", "job", "region"].forEach(key => $("#drop-" + key).addEventListener("change", event => {
    state[key] = event.target.value;
    if (state.kind === "scroll") state.job = "";
    state.limit = 40;
    syncControls();
  }));
  $("#drop-result-list").addEventListener("click", event => {
    const button = event.target.closest("[data-entry]");
    if (!button) return;
    state.selected = button.dataset.entry;
    root.querySelectorAll("[data-entry]").forEach(entry => entry.setAttribute("aria-pressed", String(entry.dataset.entry === state.selected)));
    renderDetail();
    if (window.matchMedia("(max-width: 680px)").matches) focusDetail();
  });
  $("#drop-more").addEventListener("click", () => {
    const next = state.limit;
    state.limit += 40;
    renderList();
    $("#drop-result-list").children[next]?.focus();
  });
  $("#drop-detail-body").addEventListener("click", event => {
    const button = event.target.closest("[data-related]");
    if (!button) return;
    history.push({ ...state });
    if (history.length > 30) history.shift();
    state.mode = state.mode === "items" ? "monsters" : "items";
    const entry = (state.mode === "items" ? index.items : index.monsters).get(button.dataset.related);
    Object.assign(state, { query: entry.name, selected: entry.id, kind: "", job: "", region: "", limit: 40 });
    syncControls();
    focusDetail();
  });
  $("#drop-back").addEventListener("click", () => {
    if (!history.length) return;
    Object.assign(state, history.pop());
    syncControls();
    focusDetail();
  });
  syncControls();
}

void renderChronostoryDropSearch();
