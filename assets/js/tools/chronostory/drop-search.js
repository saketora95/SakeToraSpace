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

function describeChronoStoryElements({ element, damageEffect, qualifier }) {
  return `${qualifier ? `${qualifier}：` : ""}此魔物受到的${element}屬性傷害會${damageEffect === "increase" ? "提高" : "降低"}。`;
}

function chronoStoryEquipmentParts(item) {
  return [...new Set(item.categories.map(part => part === "帽子" ? "頭盔" : part))];
}

function matchesChronoStoryItem(item, state) {
  const typeMatches = !state.kind || item.kind === state.kind
    || (state.kind.startsWith("equipment:") && item.kind === "equipment"
      && chronoStoryEquipmentParts(item).includes(state.kind.slice(10)));
  return typeMatches && (!state.job || item.jobs.includes(state.job));
}

function chronoStoryItemColumns(item) {
  const levels = [...item.variants.filter(v => v.requirement?.type === "level").map(v => v.requirement.value),
    ...item.summaryNotes.map(note => note.level)].filter(Number.isFinite);
  const variantTotals = item.variants.map(v => v.totalMaxStats).filter(Boolean);
  const totals = [...new Set(variantTotals.length ? variantTotals : item.summaryNotes.map(note => note.totalMaxStats).filter(Boolean))];
  const computed = chronoStoryDropSortKey(item)[3];
  const jobLabels = item.jobs.map(job => {
    if (job !== "盜賊") return job;
    const buildNotes = [...item.variants.map(variant => variant.build || ""),
      ...item.summaryNotes.map(note => note.totalMaxStats || "")];
    const builds = ["力量／幸運", "敏捷／幸運"].filter(build => buildNotes.some(note => note.includes(build)));
    return builds.length ? `盜賊（${builds.map(build => build.replace("／", "＋")).join("、")}）` : job;
  });
  return [item.kind === "scroll" ? "卷軸" : chronoStoryEquipmentParts(item).join("、") || "裝備（部位未記載）",
    jobLabels.join("、") || (item.kind === "scroll" ? "—" : "未記載"),
    item.kind === "scroll" ? "—" : [...new Set(levels)].sort((a, b) => a - b).join(" / ") || "未記載",
    item.kind === "scroll" ? "—" : totals.join(" / ") || (Number.isFinite(computed) ? String(computed) : "未記載")];
}

function chronoStoryDropSortKey(item) {
  const jobs = ["劍士", "法師", "弓箭手", "盜賊", "海盜"];
  const equipment = ["武器", "頭盔", "上衣", "褲子", "套服", "手套", "鞋子"];
  const scrolls = ["武器", "盾牌", "頭盔", "上衣", "褲子", "套服", "手套", "鞋子", "飾品"];
  const weapons = /^(單手劍|單手斧|單手棍|雙手劍|雙手斧|雙手棍|短劍|拳套|長杖|短杖|弓|弩|槍|矛|指虎|火槍|武器)/;
  const normalizePart = value => value.replace(/^帽子/, "頭盔").replace(/^褲裙/, "褲子")
    .replace(/^套幅/, "套服").replace(/^耳環/, "飾品");
  const categories = [...item.categories, ...item.variants.map(v => v.category || "")];
  const parts = item.kind === "scroll" ? scrolls : equipment;
  const ranks = [...categories, item.name].map(value => {
    const part = normalizePart(value);
    const rank = item.kind === "scroll" && weapons.test(part) ? 0 : parts.findIndex(name => part.startsWith(name));
    return rank < 0 ? Infinity : rank + (item.kind === "scroll" ? equipment.length + 1 : 0);
  });
  const rank = Math.min(...ranks, item.kind === "scroll" ? 99 : equipment.length);
  if (item.kind === "scroll") {
    const success = Math.max(...item.variants.map(v => v.successPercent).filter(Number.isFinite),
      Number(item.name.match(/(\d+)%$/)?.[1]) || 0);
    return [rank, -success, 0, 0];
  }
  const job = Math.min(...item.jobs.map(name => jobs.indexOf(name)).filter(rank => rank >= 0), Infinity);
  const levels = [...item.variants.filter(v => v.requirement?.type === "level").map(v => v.requirement.value),
    ...item.summaryNotes.map(note => note.level)].filter(Number.isFinite);
  const values = [...item.variants, ...item.summaryNotes].map(variant => {
    const total = Number.parseFloat(variant.totalMaxStats);
    if (Number.isFinite(total) || !variant.stats) return total;
    return [...variant.stats.matchAll(/([^、]+?)\s*([+-])\s*(\d+(?:\.\d+)?)/g)]
      .filter(match => !/防禦|可升級次數/.test(match[1]))
      .reduce((sum, match) => sum + (match[2] === "-" ? -1 : 1) * Number(match[3]), 0);
  }).filter(Number.isFinite);
  return [rank, job, Math.min(...levels, Infinity), Math.min(...values, Infinity)];
}

function compareChronoStoryDrops(a, b) {
  const left = chronoStoryDropSortKey(a);
  const right = chronoStoryDropSortKey(b);
  if (a.kind === "scroll" && b.kind === "scroll" && left[0] === right[0]) {
    const scrollType = item => item.name.normalize("NFKC")
      .replace(/(?:詛咒)?卷軸/g, "").replace(/\d+(?:\.\d+)?%$/, "").replace(/\s+/g, "");
    const typeOrder = scrollType(a).localeCompare(scrollType(b), "zh-Hant");
    if (typeOrder) return typeOrder;
  }
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return a.kind === "scroll" && b.kind === "scroll" ? 0 : a.name.localeCompare(b.name, "zh-Hant");
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

function findChronoStoryJobEntries(data, state) {
  const tokens = state.query.normalize("NFKC").trim().split(/\s+/).map(normalizeChronoStoryQuery).filter(Boolean);
  return data.items.filter(item => item.kind === "equipment")
    .map(item => {
      const variants = item.variants.filter(variant => variant.job === state.job
        && (!state.build || variant.build === state.build)
        && (!state.part || (variant.category === "帽子" ? "頭盔" : variant.category) === state.part)
        && (!state.equipLevel || (variant.requirement?.type === "level" && variant.requirement.value === Number(state.equipLevel))));
      return { ...item, variants, categories: [...new Set(variants.map(v => v.category).filter(Boolean))], jobs: [state.job], summaryNotes: [] };
    })
    .filter(item => item.variants.length && tokens.every(token => normalizeChronoStoryQuery(item.name).includes(token)))
    .sort(compareChronoStoryDrops);
}

function findChronoStoryEntries(data, state) {
  if (state.mode === "jobs") return findChronoStoryJobEntries(data, state);
  const tokens = state.query.normalize("NFKC").trim().split(/\s+/).map(normalizeChronoStoryQuery).filter(Boolean);
  const entries = state.mode === "items" ? data.items : data.monsters;
  const collator = new Intl.Collator("zh-Hant");
  const exact = normalizeChronoStoryQuery(state.query);
  return entries.filter(entry => {
    if (!tokens.every(token => normalizeChronoStoryQuery(entry.name).includes(token))) return false;
    if (state.mode === "items") {
      return matchesChronoStoryItem(entry, state);
    }
    return !state.region || entry.regions.includes(state.region);
  }).sort((a, b) => state.mode === "items" ? compareChronoStoryDrops(a, b) : Number(normalizeChronoStoryQuery(b.name) === exact) - Number(normalizeChronoStoryQuery(a.name) === exact)
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
  const modeFromHash = () => ["items", "regions", "jobs"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "regions";
  const state = { mode: modeFromHash(), query: "", kind: "", job: modeFromHash() === "jobs" ? "劍士" : "", region: "", build: "", part: "", equipLevel: "", selected: null, limit: 40 };
  const history = [];
  let matches = [];
  const summaryRegions = unique(data.summary.map(entry => entry.region));
  const jobs = unique(data.items.flatMap(item => item.jobs));
  const equipmentParts = ["武器", "頭盔", "上衣", "褲子", "套服", "手套", "鞋子", "盾牌", "披風", "戒指"];
  const options = values => values.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join("");
  const kindName = item => item.kind === "scroll" ? "卷軸" : "裝備";
  const relationCount = entry => state.mode !== "regions" ? index.itemDrops.get(entry.id).length : index.monsterDrops.get(entry.id).length;

  root.innerHTML = `
    <div class="drop-summary"><span>${data.items.length} 種道具</span><span>${data.monsters.length} 種魔物</span><span>${data.drops.length} 筆掉落關聯</span></div>
    <div class="drop-modes" role="group" aria-label="查詢方式">
      <button type="button" data-mode="regions" aria-pressed="false">魔物掉落查詢</button>
      <button type="button" data-mode="items" aria-pressed="false">道具查詢</button>
      <button type="button" data-mode="jobs" aria-pressed="false">職業查詢</button>
    </div>
    <div class="drop-region-controls" hidden>
      <label class="field" for="drop-area">區域<select id="drop-area"><option value="">請選擇區域</option>${options(summaryRegions)}</select></label>
      <label class="field" for="drop-monster">魔物<select id="drop-monster" disabled><option value="">請先選擇區域</option></select></label>
    </div>
    <div class="drop-job-controls" hidden>
      <label class="field" for="drop-profession">職業<select id="drop-profession">${options(["劍士", "法師", "弓箭手", "盜賊", "海盜"])}</select></label>
      <label class="field" id="drop-build-field" for="drop-build">配裝<select id="drop-build"><option value="">全部配裝</option><option value="盜賊 (力量／幸運)">力量＋幸運</option><option value="盜賊 (敏捷／幸運)">敏捷＋幸運</option></select></label>
      <label class="field" for="drop-part">裝備部位<select id="drop-part"><option value="">全部部位</option></select></label>
      <label class="field" for="drop-equip-level">等級需求<select id="drop-equip-level"><option value="">全部等級</option></select></label>
    </div>
    <div class="drop-controls">
      <label class="field" id="drop-kind-field" for="drop-kind">道具類型<select id="drop-kind"><option value="">全部類型</option value="equipment">裝備</option>${equipmentParts.map(part => `<option value="equipment:${part}">裝備・${part}</option>`).join("")}<option value="scroll">卷軸</option></select></label>
      <label class="field" id="drop-job-field" for="drop-job">裝備職業<select id="drop-job"><option value="">全部職業</option>${options(jobs)}</select></label>
      <label class="field drop-query" for="drop-query"><span id="drop-query-label">道具名稱</span><input id="drop-query" type="search" autocomplete="off" placeholder="例如：火槍攻擊、紅色巴爾鞋"></label>
    </div>
    <div class="drop-search-actions"><button type="button" class="secondary-button" id="drop-reset">清除條件</button></div>
    <p id="drop-result-status" class="helper" role="status" aria-live="polite"></p>
    <div class="drop-browser">
      <section class="drop-results" aria-label="搜尋結果"><div id="drop-result-list" class="drop-result-list"></div><button type="button" class="secondary-button" id="drop-more" hidden>顯示更多</button></section>
      <section class="drop-detail" aria-label="查詢明細"><button type="button" class="secondary-button" id="drop-back" hidden>← 返回上次查詢</button><div id="drop-detail-body"></div></section>
    </div>`;
  const $ = selector => root.querySelector(selector);

  function rateMarkup(drop) {
    const rates = unique(drop.observations.map(o => o.ratePercent).filter(rate => rate !== null)).sort((a, b) => b - a);
    const needsConfirmation = rates.length > 1 || drop.observations.some(o => o.rateText && o.ratePercent === null);
    return `${rates.length ? rates.map(rate => `${rate}%`).join(" / ") : "未記載"}${needsConfirmation ? '<small>機率待確認</small>' : ""}`;
  }

  function itemFacts(item) {
    const records = item.variants.length ? item.variants : item.summaryNotes;
    const facts = unique(records.map(v => {
      const fields = [v.build, v.category].filter(Boolean);
      if (v.requirement?.value !== null && v.requirement?.value !== undefined) fields.push(`${v.requirement.type === "luk" ? "幸運需求" : "裝備等級"} ${v.requirement.value}`);
      else if (v.level !== null && v.level !== undefined) fields.push(`裝備等級 ${v.level}`);
      if (v.successPercent !== undefined) fields.push(`卷軸成功率 ${v.successPercent}%`);
      const total = v.totalMaxStats ? `<strong class="drop-fact-total">最高屬性總和 ${escape(v.totalMaxStats)}</strong>` : "";
      const stats = v.stats ? `<span class="${item.kind === "scroll" ? "drop-fact-effect" : "drop-fact-stats"}">${item.kind === "scroll" ? "效果" : "最高屬性"}：${escape(v.stats)}</span>` : "";
      return `<li>${fields.map(value => `<span>${escape(value)}</span>`).join("")}${total}${stats}</li>`;
    }));
    return `<ul class="drop-facts">${facts.join("")}</ul>`;
  }

  function renderDetail() {
    $("#drop-back").hidden = history.length === 0;
    const entry = state.mode === "jobs" ? matches.find(item => item.id === state.selected)
      : (state.mode === "items" ? index.items : index.monsters).get(state.selected);
    $(".drop-browser").classList.toggle("drop-has-result", state.mode === "regions" && Boolean(entry));
    if (!entry) {
      $("#drop-detail-body").innerHTML = state.mode === "regions" ? "" : '<p class="drop-placeholder">選擇一筆結果，即可查看掉落資料。</p>';
      return;
    }
    const isItem = state.mode !== "regions";
    const rows = [...(isItem ? index.itemDrops : index.monsterDrops).get(entry.id)].filter(drop => {
      if (isItem) return true;
      const item = index.items.get(drop.itemId);
      return matchesChronoStoryItem(item, state);
    });
    const collator = new Intl.Collator("zh-Hant");
    const related = drop => isItem ? index.monsters.get(drop.monsterId) : index.items.get(drop.itemId);
    rows.sort((a, b) => isItem ? collator.compare(related(a).name, related(b).name) : compareChronoStoryDrops(related(a), related(b)));
    const meta = isItem ? [kindName(entry), ...entry.jobs, ...entry.categories] : [entry.boss ? "Boss" : "魔物", ...entry.regions];
    const facts = isItem ? itemFacts(entry) : unique(entry.elements.map(describeChronoStoryElements)).map(text => `<p class="drop-elements">${escape(text)}</p>`).join("");
    $("#drop-detail-body").innerHTML = `
      <h3 id="drop-detail-title" tabindex="-1">${escape(entry.name)}</h3>
      <div class="drop-tags">${unique(meta).map(label => `<span>${escape(label)}</span>`).join("")}</div>
      ${facts}
      <h4>${isItem ? "掉落來源" : "已收錄掉落品"}<span>${rows.length}</span></h4>
      ${rows.length ? `<div class="drop-table-scroll" role="region" aria-label="掉落資料，可左右捲動" tabindex="0"><table class="drop-table${isItem ? "" : " drop-item-table"}"><thead><tr><th scope="col">${isItem ? "魔物 / 區域" : "道具"}</th>${isItem ? "" : ["道具類型", "裝備職業", "等級需求", "總屬性值"].map(label => `<th scope="col">${label}</th>`).join("")}<th scope="col">掉落率</th></tr></thead><tbody>${rows.map(drop => {
        const other = related(drop);
        const sub = isItem ? unique(drop.observations.map(o => o.region)).join("、") : "";
        const effects = isItem ? [] : unique((other.variants.length ? other.variants : other.summaryNotes)
          .map(variant => variant.stats || "").filter(Boolean));
        return `<tr><th scope="row"><button type="button" class="drop-related" data-related="${escape(other.id)}">${escape(other.name)} <span aria-hidden="true">↗</span></button>${sub ? `<small>${escape(sub)}</small>` : ""}${effects.map(effect => `<small class="drop-effects">${escape(effect)}</small>`).join("")}</th>${isItem ? "" : chronoStoryItemColumns(other).map(value => `<td>${escape(value)}</td>`).join("")}<td>${rateMarkup(drop)}</td></tr>`;
      }).join("")}</tbody></table></div>` : `<p class="drop-placeholder">${isItem ? "尚未收錄此道具的掉落來源。" : "沒有符合篩選條件的掉落道具。"}</p>`}`;
  }

  function renderList() {
    $("#drop-result-list").innerHTML = matches.length ? matches.slice(0, state.limit).map(entry => `<button type="button" class="drop-result" data-entry="${escape(entry.id)}" aria-pressed="${entry.id === state.selected}"><span>${escape(entry.name)}</span><small>${state.mode !== "regions" ? `${kindName(entry)} · ${relationCount(entry)} 種魔物` : `${entry.boss ? "Boss · " : ""}${relationCount(entry)} 種道具`}</small></button>`).join("") : '<p class="drop-placeholder">找不到符合的資料。試試部分名稱，或清除篩選條件。</p>';
    $("#drop-result-status").textContent = `找到 ${matches.length} ${state.mode !== "regions" ? "種道具" : "種魔物"}，顯示 ${Math.min(matches.length, state.limit)} 筆。`;
    $("#drop-more").hidden = state.limit >= matches.length;
  }

  function update(refreshDetail = true) {
    if (state.mode === "regions") {
      const monsters = data.summary.filter(entry => entry.region === state.region)
        .map(entry => index.monsters.get(entry.monsterId));
      $("#drop-monster").innerHTML = `<option value="">${state.region ? "請選擇魔物" : "請先選擇區域"}</option>`
        + monsters.map(monster => `<option value="${escape(monster.id)}">${escape(monster.name)}${monster.boss ? "（Boss）" : ""}</option>`).join("");
      $("#drop-monster").disabled = !monsters.length;
      $("#drop-monster").value = monsters.some(monster => monster.id === state.selected) ? state.selected : "";
      $("#drop-result-status").textContent = state.region ? `${state.region} · ${monsters.length} 種魔物可查詢` : "";
      if (refreshDetail) renderDetail();
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
    const jobMode = state.mode === "jobs";
    $(".drop-job-controls").hidden = !jobMode;
    $("#drop-kind-field").hidden = jobMode;
    $("#drop-job-field").hidden = jobMode;
    $(".drop-controls").classList.toggle("drop-job-name", jobMode);
    if (jobMode) {
      if (!jobs.includes(state.job)) state.job = "劍士";
      if (state.job !== "盜賊") state.build = "";
      const variants = data.items.filter(item => item.kind === "equipment").flatMap(item => item.variants)
        .filter(v => v.job === state.job && (!state.build || v.build === state.build));
      const parts = equipmentParts.filter(part => variants.some(v => (v.category === "帽子" ? "頭盔" : v.category) === part));
      if (!parts.includes(state.part)) state.part = "";
      const levels = unique(variants.filter(v => (!state.part || (v.category === "帽子" ? "頭盔" : v.category) === state.part)
        && v.requirement?.type === "level" && Number.isFinite(v.requirement.value)).map(v => v.requirement.value))
        .sort((a, b) => a - b).map(String);
      if (!levels.includes(state.equipLevel)) state.equipLevel = "";
      $("#drop-profession").value = state.job;
      $("#drop-build-field").hidden = state.job !== "盜賊";
      $("#drop-build").value = state.build;
      $("#drop-part").innerHTML = `<option value="">全部部位</option>${options(parts)}`;
      $("#drop-part").value = state.part;
      $("#drop-equip-level").innerHTML = `<option value="">全部等級</option>${options(levels)}`;
      $("#drop-equip-level").value = state.equipLevel;
    }
    root.querySelectorAll("[data-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode)));
    $(".drop-query").hidden = regionMode;
    $(".drop-controls").classList.toggle("drop-filters-only", regionMode);
    $(".drop-region-controls").hidden = !regionMode;
    $(".drop-results").hidden = regionMode;
    $(".drop-browser").classList.toggle("drop-region-browser", regionMode);
    $("#drop-area").value = regionMode ? state.region : "";
    $("#drop-query").value = state.query;
    $("#drop-kind").value = state.kind;
    $("#drop-job").value = state.job;
    $("#drop-job").disabled = state.kind === "scroll";
    $("#drop-query-label").textContent = jobMode ? "裝備名稱" : "道具名稱";
    $("#drop-query").placeholder = jobMode ? "輸入裝備名稱" : "例如：火槍攻擊、紅色巴爾鞋";
    update();
    saveNavigation();
  }

  function saveNavigation() {
    window.history.replaceState({ chronoStory: { state: { ...state }, history: history.map(entry => ({ ...entry })) } }, "", `#${state.mode}`);
  }

  function restoreNavigation(snapshot) {
    Object.assign(state, snapshot.state);
    if (state.mode === "monsters") state.mode = "regions";
    history.splice(0, history.length, ...snapshot.history);
    syncControls();
  }

  function reset(mode = state.mode) {
    Object.assign(state, { mode, query: "", kind: "", job: mode === "jobs" ? "劍士" : "", region: "", build: "", part: "", equipLevel: "", selected: null, limit: 40 });
    history.length = 0;
    syncControls();
    $(state.mode === "regions" ? "#drop-area" : state.mode === "jobs" ? "#drop-profession" : "#drop-query").focus();
  }

  function focusDetail() {
    const title = $("#drop-detail-title");
    if (!title) return;
    title.focus({ preventScroll: true });
    title.scrollIntoView({ block: "start", behavior: "instant" });
  }

  root.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => reset(button.dataset.mode)));
  window.addEventListener("popstate", event => {
    if (event.state?.chronoStory) restoreNavigation(event.state.chronoStory);
  });
  window.addEventListener("hashchange", () => {
    if (state.mode !== modeFromHash()) reset(modeFromHash());
  });
  $("#drop-area").addEventListener("change", event => {
    state.region = event.target.value;
    update(false);
  });
  $("#drop-monster").addEventListener("change", event => {
    if (!event.target.value) return;
    state.selected = event.target.value;
    renderDetail();
  });
  $("#drop-reset").addEventListener("click", () => reset());
  [["profession", "job"], ["build", "build"], ["part", "part"], ["equip-level", "equipLevel"]].forEach(([control, key]) => {
    $("#drop-" + control).addEventListener("change", event => {
      state[key] = event.target.value;
      if (key === "job") Object.assign(state, { build: "", part: "", equipLevel: "" });
      state.selected = null;
      state.limit = 40;
      syncControls();
    });
  });
  $("#drop-query").addEventListener("input", event => {
    state.query = event.target.value;
    state.limit = 40;
    state.selected = null;
    update();
  });
  ["kind", "job"].forEach(key => $("#drop-" + key).addEventListener("change", event => {
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
    saveNavigation();
    history.push({ ...state });
    if (history.length > 30) history.shift();
    state.mode = state.mode !== "regions" ? "regions" : "items";
    const entry = (state.mode === "items" ? index.items : index.monsters).get(button.dataset.related);
    Object.assign(state, { query: state.mode === "items" ? entry.name : "", selected: entry.id, kind: "", job: "", region: state.mode === "regions" ? entry.summaryRegions[0] || "" : "", limit: 40 });
    window.history.pushState(null, "", `#${state.mode}`);
    syncControls();
    focusDetail();
  });
  $("#drop-back").addEventListener("click", () => {
    if (!history.length) return;
    window.history.back();
  });
  if (window.history.state?.chronoStory) restoreNavigation(window.history.state.chronoStory);
  else syncControls();
}

void renderChronostoryDropSearch();
