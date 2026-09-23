"use strict";

// Add a catalog entry and a matching renderer below to extend the toolbox.
const tools = [
  { id: "ragnarok-timer", title: "倒數計時", category: "ragnarok", icon: "◷", tone: "#ed9b9f", description: "一個簡單的倒數計時器，讓安排時間變得更方便。", keywords: "RO 仙境傳說 倒數 計時 timer" },
  { id: "ragnarok-tw", title: "twRO 官方網站", category: "ragnarok", icon: "↗", tone: "#ed9b9f", description: "前往 twRO 臺灣伺服器官方網站。", keywords: "RO 台灣 臺灣 TW 官網 官方網站", url: "https://ro.gnjoy.com.tw/" },
  { id: "ragnarok-website", title: "kRO 官方網站", category: "ragnarok", icon: "↗", tone: "#ed9b9f", description: "前往 kRO 韓國伺服器官方網站。", keywords: "RO 韓國 KR kRO 官網 官方網站", url: "https://ro.gnjoy.com/" },
  { id: "ragnarok-jp", title: "jRO 官方網站", category: "ragnarok", icon: "↗", tone: "#ed9b9f", description: "前往 jRO 日本伺服器官方網站。", keywords: "RO 日本 JP jRO 官網 官方網站", url: "https://ragnarokonline.gungho.jp/" },
  { id: "ragnarok-iro", title: "iRO 官方網站", category: "ragnarok", icon: "↗", tone: "#ed9b9f", description: "前往 iRO 國際伺服器官方網站。", keywords: "RO 國際 iRO 官網 官方網站", url: "https://renewal.playragnarok.com/" },
  { id: "ragnarok-th", title: "thRO 官方網站", category: "ragnarok", icon: "↗", tone: "#ed9b9f", description: "前往 thRO 泰國伺服器官方網站。", keywords: "RO 泰國 TH thRO 官網 官方網站", url: "https://ro.gnjoy.in.th/home/" },
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
      : `<li class="nav-empty">${categoryItems.length ? "沒有符合所選類型的項目" : "該分類下沒有工具"}</li>`;
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
function renderTools() {
  renderNavigation();
  const query = $("#search").value.trim().toLocaleLowerCase();
  const visible = tools.filter(tool =>
    matchesType(tool) &&
    (activeFilter === "all" || (activeFilter === "favorites" ? favorites.has(tool.id) : tool.category === activeFilter)) &&
    [tool.title, tool.description, tool.keywords, toolCategoryLabel(tool)].join(" ").toLocaleLowerCase().includes(query)
  );
  $("#tool-grid").innerHTML = visible.map(tool => `
    <article class="tool-card" style="--tone:${tool.tone}">
      <div class="card-top"><span class="tool-icon" aria-hidden="true">${tool.icon}</span><button class="favorite-button" data-favorite="${tool.id}" aria-label="${favorites.has(tool.id) ? "取消收藏" : "收藏"}${tool.title}" aria-pressed="${favorites.has(tool.id)}">${favorites.has(tool.id) ? "★" : "☆"}</button></div>
      <h3>${tool.title}</h3><p>${tool.description}</p>
      <div class="card-footer"><span class="category-label">${toolCategoryLabel(tool)}</span>${toolAction(tool, "open-tool", `${tool.url ? "前往網站" : "開啟工具"} <span aria-hidden="true">↗</span>`)}</div>
    </article>`).join("");
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
$("#close-dialog").addEventListener("click", () => {
  stopTimer();
  dialog.close();
});
// Only the explicit close button dismisses this tool.
dialog.addEventListener("cancel", event => event.preventDefault());
function openTool(id) {
  const tool = tools.find(item => item.id === id);
  if (!tool || tool.url) return;
  $("#dialog-title").textContent = tool.title;
  $("#dialog-category").textContent = toolCategoryLabel(tool);
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
async function prepareAlarm() {
  stopAlarm();
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
function stopAlarm() {
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
  updateTimerView();
}
window.addEventListener("pagehide", stopTimer);
document.addEventListener("visibilitychange", () => { if (!document.hidden) tickTimer(); });
const renderers = { "ragnarok-timer": renderTimer };
renderTools();
