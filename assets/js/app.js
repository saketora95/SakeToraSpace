"use strict";

// Add a catalog entry and a matching renderer below to extend the toolbox.
const tools = [
  // RO Tool
  { id: "ragnarok-timer", title: "倒數計時", category: "ragnarok", icon: "◷", tone: "var(--accent)", description: "一個簡單的倒數計時器，讓安排時間變得更方便。", keywords: "RO 仙境傳說 倒數 計時 timer" },
  { id: "ragnarok-simple-replacer", title: "韓文裝備簡易取代器", category: "ragnarok", icon: "⇄", tone: "var(--accent)", description: "依詞彙、技能名稱與句型規則批次取代文字，於獨立頁面操作。", keywords: "RO 仙境傳說 simple replacer 翻譯 取代 韓文 技能", page: "./simple-replacer.html" },
  { id: "ragnarok-glacier-weapon", title: "冰晶武器價格", category: "ragnarok", icon: "◇", tone: "var(--accent)", description: "比較購買、升級與兌換成本，即時計算冰晶武器價格。", keywords: "RO 仙境傳說 glacier weapon 冰晶 武器 附魔 雪花 魔石 成本 計算" },
  { id: "ragnarok-reform-material", title: "改造素材價格", category: "ragnarok", icon: "◇", tone: "var(--accent)", description: "依影子神秘金屬單價，換算強化石成本與所需素材數量。", keywords: "RO 仙境傳說 reform 改造 素材 強化石 強化原石 影子神秘金屬 成本 計算" },
  { id: "ragnarok-grade-material", title: "升階素材價格", category: "ragnarok", icon: "◇", tone: "var(--accent)", description: "依乙太星塵單價與商人折扣，即時計算五種升階素材成本。", keywords: "RO 仙境傳說 grade 升階 素材 乙太 星塵 魔石 天藍寶石 黃寶石 紫寶石 琥珀 低價買進 成本 計算" },

  // RO Url
  { id: "ragnarok-tw", title: "twRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 twRO 臺灣伺服器官方網站。", keywords: "RO 台灣 臺灣 TW 官網 官方網站", url: "https://ro.gnjoy.com.tw/" },
  { id: "ragnarok-website", title: "kRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 kRO 韓國伺服器官方網站。", keywords: "RO 韓國 KR kRO 官網 官方網站", url: "https://ro.gnjoy.com/" },
  { id: "ragnarok-jp", title: "jRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 jRO 日本伺服器官方網站。", keywords: "RO 日本 JP jRO 官網 官方網站", url: "https://ragnarokonline.gungho.jp/" },
  { id: "ragnarok-iro", title: "iRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 iRO 國際伺服器官方網站。", keywords: "RO 國際 iRO 官網 官方網站", url: "https://renewal.playragnarok.com/" },
  { id: "ragnarok-th", title: "thRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 thRO 泰國伺服器官方網站。", keywords: "RO 泰國 TH thRO 官網 官方網站", url: "https://ro.gnjoy.in.th/home/" },
  { id: "ragnarok-divine-pride", title: "Divine Pride", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 Divine Pride 網站，瀏覽各國的資料與解檔資訊。", keywords: "RO 仙境傳說 DP Divine Pride divine-pride", url: "https://www.divine-pride.net/" },
  { id: "ragnarok-calculator", title: "ROCalculator", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 Landgris 大大所製作的 ROCalculator，精準計算 RO 的傷害。", keywords: "RO 仙境傳說 ROCalculator Landgris 計算機 計算器", url: "https://landgris.github.io/ROCalculator/" },

  // FFXIV Url
  { id: "ffxiv-wiki", title: "灰機｜FFXIV 中文 Wiki", category: "ffxiv", icon: "↗", tone: "var(--accent)", description: "前往 FF14 灰機 Wiki 首頁，查詢遊戲內各項資訊。", keywords: "FFXIV FF14 灰機 灰机 Wiki 百科 攻略", url: "https://ff14.huijiwiki.com/wiki/%E9%A6%96%E9%A1%B5" },
  { id: "ffxiv-paissa", title: "Paissa｜FFXIV 住宅狀況", category: "ffxiv", icon: "↗", tone: "var(--accent)", description: "前往 Paissa，確認所屬世界的住宅狀態。", keywords: "FFXIV FF14 Paissa 房屋 住宅 空地 查詢", url: "https://zhu.codes/paissa?world=50&sort=size:2" },
  { id: "ffxiv-gearsets", title: "Eorzea Collection｜FFXIV 裝備外觀預覽", category: "ffxiv", icon: "↗", tone: "var(--accent)", description: "前往 Eorzea Collection，預覽遊戲內各個套裝的外觀。", keywords: "FFXIV FF14 Eorzea Collection gearsets 裝備 套裝 幻化 外觀", url: "https://ffxiv.eorzeacollection.com/gearsets" },
  { id: "ffxiv-worldstatus", title: "Lodestone｜伺服器狀態", category: "ffxiv", icon: "↗", tone: "var(--accent)", description: "前往 Lodestone，查詢各個伺服器的角色創建狀態。", keywords: "FFXIV FF14 Lodestone world status 伺服器 狀態 維護", url: "https://jp.finalfantasyxiv.com/lodestone/worldstatus/" },

  // ChronoStory Tool
  { id: "chronostory-drop-search", title: "道具與魔物查詢", category: "chronostory", icon: "⌕", tone: "var(--accent)", description: "依名稱搜尋道具或魔物，查看裝備效果、掉落來源與掉落率，於獨立頁面操作。", keywords: "ChronoStory 魔物 怪物 道具 掉落 裝備 卷軸 查詢 drop item monster", page: "./chronostory-drops.html#items" },
  { id: "chronostory-monster-drops", title: "魔物掉落查詢", category: "chronostory", icon: "⌕", tone: "var(--accent)", description: "先選擇地區，再選擇魔物，查看掉落道具、裝備效果與掉落率。", keywords: "ChronoStory 魔物 怪物 地區 掉落 清單 region monster drops", page: "./chronostory-drops.html#regions" },
  { id: "chronostory-job-info", title: "轉職資訊", category: "chronostory", icon: "◇", tone: "var(--accent)", description: "查詢一至四轉條件、轉職流程與地點，以及三轉考試題庫與四轉道具取得方式。", keywords: "ChronoStory 轉職 職業 一轉 二轉 三轉 四轉 劍士 法師 弓箭手 盜賊 海盜 job advancement" },

  // ChronoStory Url
  { id: "chronostory-dex", title: "ChronoDEX", category: "chronostory", icon: "↗", tone: "var(--accent)", description: "前往 ChronoDEX 網站。", keywords: "ChronoStory ChronoDEX dex", url: "https://chronostorydex.com/" },
];
const $ = (selector) => document.querySelector(selector);
const categoryNames = { ragnarok: "仙境傳說", ffxiv: "FFXIV", chronostory: "ChronoStory" };
const toolCategoryLabel = tool => categoryNames[tool.category] ?? "通用工具";
const filterNames = { all: "所有工具", favorites: "我的收藏", ...categoryNames };
const storage = {
  read(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
};
let favorites = new Set();
try {
  const saved = JSON.parse(storage.read("saketora.favorites", "[]"));
  if (Array.isArray(saved)) favorites = new Set(saved.filter(id => tools.some(tool => tool.id === id)));
} catch { /* Corrupt saved data should never prevent the tools from opening. */ }
let activeFilter = favorites.size > 0 ? "favorites" : "all";
const expandedMenus = new Set(activeFilter === "all" ? [] : [activeFilter]);
function toolsInFilter(filter) {
  return tools.filter(tool => filter === "all" || (filter === "favorites" ? favorites.has(tool.id) : tool.category === filter));
}
function matchesType(tool) {
  return $(tool.url ? "#show-links" : "#show-tools").checked;
}
function toolAction(tool, className, label) {
  if (tool.page) return `<a class="${className}" href="${tool.page}" aria-label="開啟${tool.title}">${label}</a>`;
  return tool.url
    ? `<a class="${className}" href="${tool.url}" target="_blank" rel="noopener noreferrer" aria-label="${tool.title}（另開分頁）">${label}</a>`
    : `<button class="${className}" data-open="${tool.id}" aria-label="開啟${tool.title}">${label}</button>`;
}
function renderNavigation() {
  document.querySelectorAll("[data-submenu]").forEach(list => {
    const filter = list.dataset.submenu;
    const categoryItems = toolsInFilter(filter);
    const items = categoryItems.filter(matchesType);
    list.hidden = !expandedMenus.has(filter);
    list.innerHTML = items.length
      ? items.map(tool => `<li>${toolAction(tool, "nav-tool", tool.title + (tool.url ? ' <span aria-hidden="true">↗</span>' : ''))}</li>`).join("")
      : `<li class="nav-empty">${categoryItems.length ? "沒有符合所選類型的項目" : "該分類下沒有工具或連結"}</li>`;
    const toggle = document.querySelector(`.navigation [data-filter="${filter}"]`);
    toggle.setAttribute("aria-expanded", String(!list.hidden));
  });
  $("#all-tool-count").textContent = tools.length;
}
let toastTimeout;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { $("#toast").hidden = true; }, 3500);
}
function renderCard(tool) {
  return `
    <article class="tool-card ${tool.url ? "card-link" : "card-tool"}" style="--tone:${tool.tone}">
      <div class="card-top"><div class="card-identity"><span class="tool-icon" aria-hidden="true">${tool.icon}</span><span class="card-type">${tool.url ? "連結" : "工具"}</span></div><button class="favorite-button" data-favorite="${tool.id}" aria-label="${favorites.has(tool.id) ? "取消收藏" : "收藏"}${tool.title}" aria-pressed="${favorites.has(tool.id)}">${favorites.has(tool.id) ? "★" : "☆"}</button></div>
      <h3>${tool.title}</h3><p>${tool.description}</p>
      <div class="card-footer"><span class="category-label">${toolCategoryLabel(tool)}</span>${toolAction(tool, "open-tool", `${tool.url ? "前往網站" : "開啟工具"} <span aria-hidden="true">↗</span>`)}</div>
    </article>`;
}
function renderTools() {
  renderNavigation();
  const query = $("#search").value.trim().toLocaleLowerCase();
  const visible = tools.filter(tool =>
    matchesType(tool) &&
    (activeFilter === "all" || (activeFilter === "favorites" ? favorites.has(tool.id) : tool.category === activeFilter)) &&
    [tool.title, tool.description, tool.keywords, toolCategoryLabel(tool)].join(" ").toLocaleLowerCase().includes(query)
  );
  const collapsed = new Set([...$("#tool-grid").querySelectorAll("details:not([open])")].map(group => group.dataset.category));
  const groups = [...Object.entries(categoryNames), ["general", "通用工具"]];
  $("#tool-grid").innerHTML = groups.map(([category, label]) => {
    const items = visible.filter(tool => (tool.category ?? "general") === category);
    if (!items.length) return "";
    const toolItems = items.filter(tool => !tool.url);
    const linkItems = items.filter(tool => tool.url);
    const renderRow = (entries, type, title) => entries.length
      ? `<section class="card-section" aria-label="${label}的${title}"><h3 class="card-section-title">${title}<span>${entries.length}</span></h3><div class="tool-grid" data-card-type="${type}">${entries.map(renderCard).join("")}</div></section>`
      : "";
    return `<details class="category-group" data-category="${category}" ${collapsed.has(category) ? "" : "open"}><summary><h2>${label}</h2><span class="group-count">${items.length}</span></summary><div class="category-content">${renderRow(toolItems, "tools", "工具")}${renderRow(linkItems, "links", "連結")}</div></details>`;
  }).join("");
  $("#tools-heading").firstChild.textContent = filterNames[activeFilter] + " ";
  $("#result-count").textContent = visible.length;
  $("#favorite-count").textContent = favorites.size;
  $("#empty-state").hidden = visible.length !== 0;
  const emptyFavorites = activeFilter === "favorites" && !query && favorites.size === 0;
  $("#empty-title").textContent = emptyFavorites ? "把常用的工具，留在這裡" : "找不到符合的工具";
  $("#empty-description").textContent = emptyFavorites ? "點一下工具卡片的星星，就能加入你的收藏。" : "換個關鍵字，或看看其他分類吧。";
  if (!query && categoryNames[activeFilter] && !tools.some(tool => tool.category === activeFilter)) {
    $("#empty-title").textContent = `${categoryNames[activeFilter]} 尚未新增工具`;
    $("#empty-description").textContent = "你可以先到「所有工具」查看其他工具。";
  }
  if (!$("#show-tools").checked && !$("#show-links").checked) {
    $("#empty-title").textContent = "請選擇要顯示的類型";
    $("#empty-description").textContent = "勾選「工具」或「連結」，兩者都勾選即可顯示全部。";
  } else if (!visible.length && toolsInFilter(activeFilter).length) {
    $("#empty-title").textContent = "找不到符合的項目";
    $("#empty-description").textContent = "調整搜尋關鍵字、顯示類型或分類再試試。";
  }
  document.querySelectorAll("[data-filter]").forEach(button => {
    const selected = button.dataset.filter === activeFilter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
  const nextFilter = button.dataset.filter;
  const collapse = nextFilter === activeFilter && button.closest(".navigation") && expandedMenus.has(nextFilter);
  expandedMenus.clear();
  if (nextFilter !== "all" && !collapse) expandedMenus.add(nextFilter);
  activeFilter = nextFilter;
  renderTools();
}));
$(".navigation").addEventListener("click", event => {
  const button = event.target.closest("[data-open]");
  if (button) openTool(button.dataset.open);
});
$("#navigation-toggle").addEventListener("click", () => {
  const expanded = $(".sidebar").classList.toggle("menu-open");
  $("#navigation-toggle").setAttribute("aria-expanded", String(expanded));
});
$("#search").addEventListener("input", renderTools);
document.querySelectorAll(".type-filters input").forEach(input => input.addEventListener("change", renderTools));
$("#clear-filters").addEventListener("click", () => {
  activeFilter = "all";
  expandedMenus.clear();
  $("#search").value = "";
  $("#show-tools").checked = true;
  $("#show-links").checked = true;
  renderTools();
});
$("#tool-grid").addEventListener("click", event => {
  const favorite = event.target.closest("[data-favorite]");
  if (favorite) {
    const id = favorite.dataset.favorite;
    const oldIndex = [...document.querySelectorAll("[data-favorite]")].indexOf(favorite);
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    const persisted = storage.write("saketora.favorites", JSON.stringify([...favorites]));
    renderTools();
    const buttons = [...document.querySelectorAll("[data-favorite]")];
    (buttons.find(button => button.dataset.favorite === id) || buttons[Math.min(oldIndex, buttons.length - 1)] || $("#clear-filters")).focus();
    toast(persisted ? (favorites.has(id) ? "已加入收藏" : "已取消收藏") : "瀏覽器無法儲存設定；收藏僅保留在本次使用。");
  }
  const open = event.target.closest("[data-open]");
  if (open) openTool(open.dataset.open);
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey &&
      !$("#tool-dialog").open && !event.target.closest("input, textarea, [contenteditable]")) {
    event.preventDefault();
    $("#search").focus();
  }
});
$("#year").textContent = new Date().getFullYear();

const dialog = $("#tool-dialog");
function closeTool() {
  stopTimer();
  stopLaboratoryTimers();
  dialog.close();
}
$("#close-dialog").addEventListener("click", closeTool);
// Escape uses the same cleanup as the close button for every tool.
dialog.addEventListener("cancel", event => {
  event.preventDefault();
  closeTool();
});
function openTool(id) {
  const tool = tools.find(item => item.id === id);
  if (!tool || tool.url) return;
  if (tool.page) { window.location.href = tool.page; return; }
  stopLaboratoryTimers();
  $("#dialog-title").textContent = tool.title;
  $("#dialog-category").textContent = toolCategoryLabel(tool);
  dialog.classList.toggle("dialog-wide", ["ragnarok-glacier-weapon", "ragnarok-reform-material", "ragnarok-grade-material"].includes(id));
  renderers[id]();
  dialog.showModal();
}
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const rest = Math.floor(seconds % 60);
  return (hours ? String(hours).padStart(2, "0") + ":" : "") + String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
}

const durationKey = "saketora.ragnarok-timer.seconds";
const validDuration = value => Number.isInteger(value) && value >= 1 && value <= 86400;
const savedDuration = Number(storage.read(durationKey, "55"));
const initialDuration = validDuration(savedDuration) ? savedDuration : 55;
const timer = { duration: initialDuration, remaining: initialDuration, state: "idle", deadline: null, interval: null };

// A looping two-beep buffer is prepared during the Start gesture. Keep its
// gain at zero until expiry, so audio does not depend on a later user gesture.
const alarm = { context: null, source: null, gain: null, generation: 0 };
async function prepareAlarm(targetTimer = timer, targetAlarm = alarm) {
  const timer = targetTimer;
  const alarm = targetAlarm;
  stopAlarm(alarm);
  const generation = alarm.generation;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Audio unavailable");
    if (!alarm.context || alarm.context.state === "closed") alarm.context = new AudioContextClass();
    await alarm.context.resume();
    if (generation !== alarm.generation || !["running", "finished"].includes(timer.state)) return;
    const rate = alarm.context.sampleRate;
    const buffer = alarm.context.createBuffer(1, rate, rate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const t = i / rate;
      const beat = t < .18 ? t : t >= .3 && t < .48 ? t - .3 : -1;
      if (beat >= 0) {
        const envelope = Math.min(1, beat / .01, (.18 - beat) / .02);
        samples[i] = Math.sin(2 * Math.PI * 880 * t) * envelope;
      }
    }
    alarm.source = alarm.context.createBufferSource();
    alarm.source.buffer = buffer;
    alarm.source.loop = true;
    alarm.gain = alarm.context.createGain();
    alarm.gain.gain.value = timer.state === "finished" ? .2 : 0;
    alarm.source.connect(alarm.gain).connect(alarm.context.destination);
    alarm.source.start();
  } catch {
    if (generation === alarm.generation) toast("無法啟用音效，請留意畫面倒數。");
  }
}
function stopAlarm(targetAlarm = alarm) {
  const alarm = targetAlarm;
  alarm.generation++;
  if (alarm.source) {
    alarm.source.stop();
    alarm.source.disconnect();
    alarm.source = null;
  }
  if (alarm.gain) {
    alarm.gain.disconnect();
    alarm.gain = null;
  }
}
function remainingSeconds() {
  return timer.state === "running" ? Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000)) : timer.remaining;
}
function updateTimerView() {
  if (!$("#timer-form")) return;
  $("#timer-display").textContent = formatDuration(remainingSeconds());
  $("#timer-duration").disabled = timer.state !== "idle";
  $("#timer-start").disabled = !["idle", "paused"].includes(timer.state) || !$("#timer-duration").validity.valid;
  $("#timer-pause").disabled = timer.state !== "running";
  $("#timer-stop").disabled = timer.state === "idle";
  const message = { idle: "準備就緒", running: "計時中", paused: "已暫停", finished: "時間到！" }[timer.state];
  $("#timer-status").textContent = message;
}
function tickTimer() {
  if (timer.state === "running" && remainingSeconds() === 0) {
    clearInterval(timer.interval);
    timer.interval = null;
    timer.deadline = null;
    timer.remaining = 0;
    timer.state = "finished";
    if (alarm.gain) alarm.gain.gain.setValueAtTime(.2, alarm.context.currentTime);
  }
  updateTimerView();
}
function stopTimer() {
  clearInterval(timer.interval);
  timer.interval = null;
  timer.deadline = null;
  timer.state = "idle";
  timer.remaining = timer.duration;
  stopAlarm();
  if ($("#timer-duration")) $("#timer-duration").value = timer.duration;
  updateTimerView();
}
function renderTimer() {
  $("#tool-content").innerHTML = `<form id="timer-form" class="tool-form"><label class="field" for="timer-duration">倒數秒數<input id="timer-duration" type="number" value="${timer.duration}" min="1" max="86400" step="1" required></label><div id="timer-display" class="timer-display" aria-label="剩餘時間"></div><p id="timer-status" role="status" class="helper">準備就緒</p><div class="timer-actions"><button id="timer-start" type="submit" class="primary-button">開始</button><button id="timer-pause" type="button" class="secondary-button">暫停</button><button id="timer-stop" type="button" class="secondary-button">停止</button></div></form>`;
  $("#timer-duration").addEventListener("input", () => {
    const value = Number($("#timer-duration").value);
    if (timer.state === "idle" && $("#timer-duration").validity.valid && validDuration(value)) {
      timer.duration = value;
      timer.remaining = value;
      if (!storage.write(durationKey, String(value))) toast("無法保存秒數，設定僅保留在本次使用。");
    }
    updateTimerView();
  });
  $("#timer-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!["idle", "paused"].includes(timer.state) || !$("#timer-form").checkValidity()) return;
    timer.state = "running";
    timer.deadline = Date.now() + timer.remaining * 1000;
    void prepareAlarm();
    timer.interval = setInterval(tickTimer, 100);
    tickTimer();
  });
  $("#timer-pause").addEventListener("click", () => {
    tickTimer();
    if (timer.state !== "running") return;
    timer.remaining = remainingSeconds();
    timer.state = "paused";
    timer.deadline = null;
    clearInterval(timer.interval);
    timer.interval = null;
    stopAlarm();
    updateTimerView();
  });
  $("#timer-stop").addEventListener("click", stopTimer);
  renderLaboratoryTimers();
  updateTimerView();
}
window.addEventListener("pagehide", stopTimer);
window.addEventListener("pagehide", stopLaboratoryTimers);
document.addEventListener("visibilitychange", () => { if (!document.hidden) tickTimer(); });
function renderChronostoryJobInfo() {
  const firstJobs = [
    { name: "劍士", level: 10, stat: "STR", requirement: 35, location: "勇士之村" },
    { name: "法師", level: 8, stat: "INT", requirement: 20, location: "魔法森林" },
    { name: "弓箭手", level: 10, stat: "DEX", requirement: 25, location: "弓箭手村" },
    { name: "盜賊", level: 10, stat: "LUK", requirement: 25, location: "墮落城市" },
    { name: "海盜", level: 10, stat: "DEX", requirement: 20, location: "鯨魚號（上層左側）" },
  ];
  const renderLocations = locations => `<ul class="job-locations">${firstJobs.map((job, index) => `<li>${job.name}：${locations[index]}</li>`).join("")}</ul>`;
  const firstInstructorLocations = renderLocations(firstJobs.map(job => job.location));
  const secondInstructorLocations = renderLocations(["西部岩山 IV", "魔法森林北部", "迷宮通道", "北方工地", "鯨魚號（上層右側）"]);
  const dimensionDoorLocations = renderLocations(["螞蟻礦坑", "巫婆森林 II", "森林迷宮 V", "猴子沼澤 II", "火獨眼獸洞穴 II"]);
  const locationStep = (label, locations) => `<details class="job-location-details"><summary>${label} <span class="job-location-toggle"><span class="job-location-show">展開地點</span><span class="job-location-hide">收合地點</span></span></summary>${locations}</details>`;
  $("#tool-content").innerHTML = `<div class="job-info">
    <details>
      <summary>一轉（等級 10；法師等級 8）</summary>
      <div class="job-table-scroll" role="region" aria-label="一轉條件與轉職地點" tabindex="0">
        <table class="job-table">
          <caption class="sr-only">一轉條件與轉職地點</caption>
          <thead><tr><th scope="col">職業</th><th scope="col">等級需求</th><th scope="col">能力值需求</th><th scope="col">轉職地點</th></tr></thead>
          <tbody>${firstJobs.map(job => `<tr><th scope="row">${job.name}</th><td>${job.level}</td><td>${job.stat} ${job.requirement}</td><td>${job.location}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </details>
    <details>
      <summary>二轉（等級 30）</summary>
      <ol class="job-steps">
        <li>${locationStep("找尋一轉轉職教官", firstInstructorLocations)}</li>
        <li>${locationStep("找尋二轉轉職教官", secondInstructorLocations)}</li>
        <li>打倒轉職地圖的魔物，蒐集黑珠 <strong>30 顆</strong>。</li>
        <li>交付黑珠給二轉轉職教官，取得英雄的證明。</li>
        <li>找尋一轉轉職教官，交付英雄的證明並進行二轉。</li>
      </ol>
    </details>
    <details>
      <summary>三轉（等級 70）</summary>
      <ol class="job-steps">
        <li>準備至少 <strong>1 顆黑暗水晶</strong>，用於後續雪原聖地的考試。</li>
        <li>${locationStep("找尋一轉轉職教官", firstInstructorLocations)}</li>
        <li>${locationStep("找尋次元之門", dimensionDoorLocations)}</li>
        <li>進入次元之門，打倒一轉轉職教官分身並取得黑符。</li>
        <li>找尋一轉轉職教官，交付黑符並取得力量項鍊。</li>
        <li>找尋三轉轉職教官。</li>
        <li>找尋雪原聖地（位於尖銳的絕壁 II 右上方木門）。</li>
        <li>與雪原聖地的石碑對話，完成考試並取得智慧項鍊。
          <a href="https://chronostorydex.com/3rd-job-qa" target="_blank" rel="noopener noreferrer" aria-label="三轉考試題庫（另開分頁）">考試題庫 ↗</a>
        </li>
        <li>找尋三轉轉職教官，交付力量項鍊與智慧項鍊並進行三轉。</li>
      </ol>
    </details>
    <details>
      <summary>四轉（等級 120）</summary>
      <ol class="job-steps">
        <li>前往冰原雪域，找尋三轉轉職教官。</li>
        <li>前往神木村的賢者之森，找尋四轉轉職教官。</li>
        <li>前往神木村，找尋神木村村長。</li>
        <li>蒐集英雄五角勳章與英雄星型墜飾，請<strong>選擇其中一種方式</strong>進行。
          <ul class="job-locations">
            <li>正攻法：
              <ol class="job-steps job-steps-compact">
                <li>打倒噴火龍。</li>
                <li>打倒格瑞芬多。</li>
              </ol>
            </li>
            <li>秘咒法：
              <ol class="job-steps job-steps-compact">
                <li>於玩具城愛奧斯塔 25 樓購入「秘咒」一張（需要 <strong>1000 萬</strong>，可由其他角色購買、可提前購買）。</li>
                <li>於神木村完成打倒半人馬國王 Chief Kentaurus 的任務（由轉職角色完成、可提前完成）。</li>
                <li>進入蒐集步驟後，將秘咒交付給神木村村長，直接換取英雄五角勳章與英雄星型墜飾。</li>
              </ol>
            </li>
          </ul>
        </li>
        <li>找尋四轉轉職教官，交付英雄五角勳章與英雄星型墜飾並進行四轉。</li>
      </ol>
    </details>
  </div>`;
}
const renderers = { "ragnarok-timer": renderTimer, "ragnarok-glacier-weapon": renderGlacierWeapon, "ragnarok-reform-material": renderReformMaterial, "ragnarok-grade-material": renderGradeMaterial, "chronostory-job-info": renderChronostoryJobInfo };
renderTools();
