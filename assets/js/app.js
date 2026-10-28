"use strict";

// Add a catalog entry and a matching renderer below to extend the toolbox.
const tools = [
  // RO Tool
  { id: "ragnarok-timer", title: "倒數計時", category: "ragnarok", icon: "◷", tone: "var(--accent)", description: "一個簡單的倒數計時器，讓安排時間變得更方便。", keywords: "RO 仙境傳說 倒數 計時 timer" },
  { id: "ragnarok-simple-replacer", title: "韓文裝備簡易取代器", category: "ragnarok", icon: "⇄", tone: "var(--accent)", description: "依詞彙、技能名稱與句型規則，批次取代韓文的裝備或卡片道具說明。", keywords: "RO 仙境傳說 simple replacer 翻譯 取代 韓文 技能", page: "./simple-replacer.html" },
  { id: "ragnarok-skill-changes", title: "技能調整記錄", category: "ragnarok", kind: "info", icon: "≋", tone: "var(--accent)", description: "依職業、技能名稱與版本查閱技能調整，對照改版前後數值與官方維護公告。", keywords: "RO 仙境傳說 技能 調整 記錄 改版 版本 職業 skill changes", page: "./ragnarok-skill-changes.html" },
  { id: "ragnarok-autocast-chains", title: "連鎖自動詠唱裝備", category: "ragnarok", kind: "info", icon: "⇉", tone: "var(--accent)", description: "依職業、道具與技能查詢連鎖自動詠唱效果、機率及 kRO／twRO 實裝日期。", keywords: "RO 仙境傳說 連鎖 自動詠唱 自動施放 autocast chain 裝備 卡片 頭冠 武器 臺特 原生", page: "./ragnarok-autocast-chains.html" },
  { id: "ragnarok-boss-cards", title: "MVP 卡片搭配裝備", category: "ragnarok", kind: "info", icon: "♛", tone: "var(--accent)", description: "依 MVP、裝備名稱與 MVP 類型查詢可與 MVP 卡片搭配的裝備及附魔。", keywords: "RO 仙境傳說 王卡 MVP 卡片 搭配 裝備 附魔 野生 副本 boss card combo", page: "./ragnarok-boss-cards.html" },
  { id: "ragnarok-frontier-gear", title: "邊界符文頭冠與邊界武器", category: "ragnarok", kind: "info", icon: "⚔", tone: "var(--accent)", description: "依職業查閱邊界頭冠與武器的精煉、階級與套裝效果，以及頭飾與武器附魔。", keywords: "RO 仙境傳說 邊界 符文 頭冠 武器 套裝 附魔 Zero Cell 階級 時空寶石 frontier", page: "./ragnarok-frontier-gear.html" },
  { id: "ragnarok-two-dimension-weapons", title: "二次元武器", category: "ragnarok", kind: "info", icon: "⚔", tone: "var(--accent)", description: "依職業與推出批次查閱二次元武器的精煉、階級與額外效果，附懶人包與推出時間。", keywords: "RO 仙境傳說 二次元 武器 侵蝕武器 自動詠唱 冷卻時間 階級 精煉 two dimension weapon", page: "./ragnarok-two-dimension-weapons.html" },
  { id: "ragnarok-bmp-parser", title: "對話立繪轉換器", category: "ragnarok", icon: "▧", tone: "var(--accent)", description: "依透明度門檻替換為純洋紅背景，下載原圖尺寸、可套用於 RO 的 BMP 圖片。", keywords: "RO 仙境傳說 圖片 對話 立繪 面板 skin illust PNG BMP 洋紅 透明 背景", page: "./ragnarok-bmp-parser.html" },
  { id: "ragnarok-glacier-weapon", title: "冰晶武器價格", category: "ragnarok", icon: "◇", tone: "var(--accent)", description: "依各項素材的單價，比較購買、升級與兌換成本，即時計算冰晶武器價格。", keywords: "RO 仙境傳說 glacier weapon 冰晶 武器 附魔 雪花 魔石 成本 計算" },
  { id: "ragnarok-reform-material", title: "改造素材價格", category: "ragnarok", icon: "◇", tone: "var(--accent)", description: "依影子神秘金屬的單價，換算強化石成本與所需素材數量。", keywords: "RO 仙境傳說 reform 改造 素材 強化石 強化原石 影子神秘金屬 成本 計算" },
  { id: "ragnarok-grade-material", title: "升階素材價格", category: "ragnarok", icon: "◇", tone: "var(--accent)", description: "依乙太星塵單價與低價買進折扣，計算階級提升的成本。", keywords: "RO 仙境傳說 grade 升階 素材 乙太 星塵 魔石 天藍寶石 黃寶石 紫寶石 琥珀 低價買進 成本 計算" },

  // 酒虎廢文
  { id: "ragnarok-article-438535", title: "kRO 重點更新整理", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=438535" },
  { id: "ragnarok-article-436731", title: "kRO 迄今技能調整／優化整理", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=436731" },
  { id: "ragnarok-article-440198", title: "連鎖自動詠唱裝備整理", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=440198" },
  { id: "ragnarok-article-437323", title: "技能獨立延遲／冷卻時間關聯裝備一覽", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=437323" },
  { id: "ragnarok-article-437413", title: "王卡搭配裝備整理", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=437413" },
  { id: "ragnarok-article-439564", title: "邊界符文頭冠與邊界武器資訊", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=439564" },
  { id: "ragnarok-article-439592", title: "二次元武器資訊整理", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=439592" },
  { id: "ragnarok-article-439379", title: "天空符文冠冕與天空武器系列", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=439379" },
  { id: "ragnarok-article-439950", title: "光輝符文頭冠與光輝武器資訊", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=439950" },
  { id: "ragnarok-article-439873", title: "二次元生物圈（火山 & 大地）資訊速報", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=439873" },
  { id: "ragnarok-article-440019", title: "二次元生物圈（劇毒 & 冰凍）資訊速報", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=440019" },
  { id: "ragnarok-article-440202", title: "二次元生物圈（靈魂、聖殿與死靈）資訊速報", category: "ragnarok", subcategory: "酒虎廢文", icon: "✎", tone: "var(--accent)", description: "於巴哈姆特閱讀酒虎的整理文章。", keywords: "RO 仙境傳說 酒虎廢文 巴哈姆特 攻略 整理", url: "https://forum.gamer.com.tw/C.php?bsn=4212&snA=440202" },

  // RO Url
  { id: "ragnarok-twro", title: "twRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 twRO 臺灣伺服器官方網站。", keywords: "RO 台灣 臺灣 TW 官網 官方網站", url: "https://ro.gnjoy.com.tw/" },
  { id: "ragnarok-shop-search", title: "twRO 露天商店查詢平台", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 twRO 官方露天商店查詢平台，查詢販售、收購與歷史成交紀錄。", keywords: "RO 仙境傳說 twRO 露天 商店 販售 收購 成交 紀錄 價格 查詢", url: "https://event.gnjoy.com.tw/Ro/RoShopSearch" },
  { id: "ragnarok-item-search", title: "twRO 裝備道具查詢平台", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 twRO 官方裝備道具查詢平台，查詢道具說明與裝備資訊。", keywords: "RO 仙境傳說 twRO 裝備 道具 物品 說明 查詢", url: "https://event.gnjoy.com.tw/Ro/RoItemSearch" },
  { id: "ragnarok-website", title: "kRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 kRO 韓國伺服器官方網站。", keywords: "RO 韓國 KR kRO 官網 官方網站", url: "https://ro.gnjoy.com/" },
  { id: "ragnarok-jpro", title: "jRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 jRO 日本伺服器官方網站。", keywords: "RO 日本 JP jRO 官網 官方網站", url: "https://ragnarokonline.gungho.jp/" },
  { id: "ragnarok-iro", title: "iRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 iRO 國際伺服器官方網站。", keywords: "RO 國際 iRO 官網 官方網站", url: "https://renewal.playragnarok.com/" },
  { id: "ragnarok-thro", title: "thRO 官方網站", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 thRO 泰國伺服器官方網站。", keywords: "RO 泰國 TH thRO 官網 官方網站", url: "https://ro.gnjoy.in.th/home/" },
  { id: "ragnarok-divine-pride", title: "Divine Pride", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 Divine Pride 網站，瀏覽各國的資料與解檔資訊。", keywords: "RO 仙境傳說 DP Divine Pride divine-pride", url: "https://www.divine-pride.net/" },
  { id: "ragnarok-calculator", title: "ROCalculator", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "前往 Landgris 大大所製作的 ROCalculator，精準計算 RO 的傷害。", keywords: "RO 仙境傳說 ROCalculator Landgris 計算機 計算器", url: "https://landgris.github.io/ROCalculator/" },
  { id: "ragnarok-replacer-share", title: "韓文裝備簡易取代器", category: "ragnarok", icon: "↗", tone: "var(--accent)", description: "供單獨分享時使用的簡易取代器，功能與工具版並無差異。", keywords: "RO 仙境傳說 韓文 裝備 取代 獨立 分享", url: "./ragnarok-replacer.html", subdued: true },

  // FFXIV Url
  { id: "ffxiv-wiki", title: "灰機｜FFXIV 中文 Wiki", category: "ffxiv", icon: "↗", tone: "var(--accent)", description: "前往 FFXIV 灰機 Wiki 首頁，查詢遊戲內各項資訊。", keywords: "FFXIV FF14 灰機 灰机 Wiki 百科 攻略", url: "https://ff14.huijiwiki.com/wiki/%E9%A6%96%E9%A1%B5" },
  { id: "ffxiv-paissa", title: "Paissa｜FFXIV 住宅狀況", category: "ffxiv", icon: "↗", tone: "var(--accent)", description: "前往 Paissa，查詢 FFXIV 所屬世界的住宅狀態。", keywords: "FFXIV FF14 Paissa 房屋 住宅 空地 查詢", url: "https://zhu.codes/paissa?world=50&sort=size:2" },
  { id: "ffxiv-gearsets", title: "Eorzea Collection｜FFXIV 裝備外觀預覽", category: "ffxiv", icon: "↗", tone: "var(--accent)", description: "前往 Eorzea Collection，預覽遊戲內各個套裝的外觀。", keywords: "FFXIV FF14 Eorzea Collection gearsets 裝備 套裝 幻化 外觀", url: "https://ffxiv.eorzeacollection.com/gearsets" },
  { id: "ffxiv-worldstatus", title: "Lodestone｜伺服器狀態", category: "ffxiv", icon: "↗", tone: "var(--accent)", description: "前往 Lodestone，查詢 FFXIV 各個伺服器的角色創建狀態。", keywords: "FFXIV FF14 Lodestone world status 伺服器 狀態 維護", url: "https://jp.finalfantasyxiv.com/lodestone/worldstatus/" },

  // ChronoStory Tool
  { id: "chronostory-drop-search", title: "魔物掉落道具查詢", category: "chronostory", icon: "⌕", tone: "var(--accent)", description: "依名稱搜尋道具或魔物，查看裝備效果、掉落來源與掉落率，於獨立頁面操作。", keywords: "ChronoStory 魔物 怪物 道具 掉落 裝備 卷軸 查詢 drop item monster", page: "./chronostory-drops.html#regions" },
  { id: "chronostory-job-info", title: "轉職資訊", category: "chronostory", kind: "info", icon: "◇", tone: "var(--accent)", description: "查詢一至四轉條件、轉職流程與地點，以及三轉考試題庫與四轉道具取得方式。", keywords: "ChronoStory 轉職 職業 一轉 二轉 三轉 四轉 劍士 法師 弓箭手 盜賊 海盜 job advancement" },
  { id: "chronostory-support-info", title: "共享輔助狀態資訊", category: "chronostory", kind: "info", icon: "◇", tone: "var(--accent)", description: "依職業查閱輔助技能與效果，包含進階強化、持續消耗及骰子各點數效果。", keywords: "ChronoStory 職業 共享 輔助 狀態 技能 buff 隊伍 骰子" },

  // ChronoStory Url
  { id: "chronostory-dex", title: "ChronoDEX", category: "chronostory", icon: "↗", tone: "var(--accent)", description: "前往 ChronoDEX 網站。", keywords: "ChronoStory ChronoDEX dex", url: "https://chronostorydex.com/" },
];
const $ = (selector) => document.querySelector(selector);
const categories = [
  { id: "ragnarok", name: "仙境傳說" },
  { id: "ffxiv", name: "FFXIV" },
  { id: "chronostory", name: "ChronoStory" },
];
const categoryName = id => categories.find(category => category.id === id)?.name ?? "通用工具";
const toolCategoryLabel = tool => [categoryName(tool.category), tool.subcategory].filter(Boolean).join("／");
const storage = {
  read(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
};
const readJson = (key, fallback) => { try { return JSON.parse(storage.read(key, "null")) ?? fallback; } catch { return fallback; } };
const escapeHtml = text => String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const toolById = id => tools.find(tool => tool.id === id);
const validIds = list => Array.isArray(list) ? list.filter(id => typeof id === "string" && toolById(id)) : [];

let favorites = new Set(validIds(readJson("saketora.favorites", [])));
let recent = validIds(readJson("saketora.recent", []));
const tabIds = ["favorites", ...categories.map(category => category.id)];
let tab = storage.read("saketora.homeTab", "");
if (!tabIds.includes(tab)) tab = favorites.size ? "favorites" : categories[0].id;
let pane = "tool";
let activeIndex = 0;

function kindOf(tool) {
  if (tool.kind) return tool.kind;
  if (tool.subcategory) return "article";
  return tool.url ? "link" : "tool";
}
// Dialog tools open through the #tool= bookmark, handled by syncToolBookmark.
function actionOf(tool) {
  if (tool.page) return { href: tool.page, label: "獨立頁面", external: false };
  if (tool.url && /^https?:/.test(tool.url)) return { href: tool.url, label: new URL(tool.url).hostname.replace(/^www\./, ""), external: true };
  if (tool.url) return { href: tool.url, label: "獨立頁面", external: false };
  return { href: `#tool=${encodeURIComponent(tool.id)}`, label: "工具視窗", external: false };
}
const kindNames = { tool: "工具", info: "資訊", article: "酒虎廢文", link: "外部連結" };

function highlight(text, tokens) {
  const lower = text.toLocaleLowerCase();
  const marks = new Array(text.length).fill(false);
  tokens.forEach(token => {
    for (let i = lower.indexOf(token); token && i >= 0; i = lower.indexOf(token, i + token.length)) {
      for (let k = i; k < i + token.length; k++) marks[k] = true;
    }
  });
  let html = "";
  let open = false;
  [...text].forEach((ch, i) => {
    if (marks[i] !== open) { html += marks[i] ? "<mark>" : "</mark>"; open = marks[i]; }
    html += escapeHtml(ch);
  });
  return open ? html + "</mark>" : html;
}

function linkAttrs(tool) {
  const action = actionOf(tool);
  return `href="${escapeHtml(action.href)}" data-track="${tool.id}"${action.external ? ' target="_blank" rel="noopener noreferrer"' : ""}`;
}
function starButton(tool) {
  const on = favorites.has(tool.id);
  return `<button class="star" type="button" data-star="${tool.id}" aria-pressed="${on}" aria-label="${on ? "取消收藏" : "收藏"}：${escapeHtml(tool.title)}">${on ? "★" : "☆"}</button>`;
}

function renderTile(tool) {
  return `<li class="tile">
    <span class="tile-glyph" aria-hidden="true">${tool.icon}</span>
    <div class="tile-text">
      <a class="tile-title stretch" ${linkAttrs(tool)}>${escapeHtml(tool.title)}</a>
      <p>${escapeHtml(tool.description)}</p>
    </div>
    ${starButton(tool)}
  </li>`;
}
function renderRow(tool, tokens = [], context = false) {
  const action = actionOf(tool);
  return `<li class="row row-${kindOf(tool)}${tool.subdued ? " row-subdued" : ""}" title="${escapeHtml(tool.description)}">
    ${context ? `<span class="row-kind">${escapeHtml(categoryName(tool.category))}・${kindNames[kindOf(tool)]}</span>` : ""}
    <a class="row-title stretch" ${linkAttrs(tool)}>${highlight(tool.title, tokens)}</a>
    ${context ? `<span class="row-desc">${escapeHtml(tool.description)}</span>` : ""}
    <span class="row-meta">${escapeHtml(action.label)}${action.external ? ' <span aria-hidden="true">↗</span>' : ""}</span>
    ${starButton(tool)}
  </li>`;
}

function renderRecent() {
  const items = recent.map(toolById).slice(0, 5);
  $("#recent").hidden = !items.length;
  $("#recent-list").innerHTML = items.map(tool => `<li><a class="chip-link" ${linkAttrs(tool)}><span aria-hidden="true">${tool.icon}</span>${escapeHtml(tool.title)}</a></li>`).join("");
}

function renderTabs() {
  const count = id => id === "favorites" ? favorites.size : tools.filter(tool => tool.category === id).length;
  const name = id => id === "favorites" ? "★ 收藏" : categoryName(id);
  $("#tabs").innerHTML = tabIds.map(id =>
    `<button type="button" role="tab" id="tab-${id}" data-tab="${id}" aria-controls="panel" aria-selected="${tab === id}" tabindex="${tab === id ? 0 : -1}">${name(id)}<span>${count(id)}</span></button>`).join("");
}

// Each category fits one screen: tools, info pages, articles and links sit side by side.
function renderPanel() {
  const items = tools.filter(tool => tab === "favorites" ? favorites.has(tool.id) : tool.category === tab);
  const groups = ["tool", "info", "article", "link"].map(kind => [kind, items.filter(tool => kindOf(tool) === kind)]).filter(([, entries]) => entries.length);
  $("#panel").setAttribute("aria-labelledby", `tab-${tab}`);
  if (!items.length) {
    $("#panel").innerHTML = emptyState(tab === "favorites"
      ? ["還沒有收藏", "在任何項目旁按下 ☆，它就會集中到這個分頁。"]
      : ["這個分類還是空的", "看看其他分類吧。"]);
    return;
  }
  if (!groups.some(([kind]) => kind === pane)) pane = groups[0][0];
  const block = ([kind, entries]) => `<section class="block block-${kind}" data-kind="${kind}" ${pane === kind ? "data-current" : ""} aria-label="${kindNames[kind]}">
      <h2>${kindNames[kind]}<span>${entries.length}</span></h2>
      ${kind === "tool" || kind === "info"
        ? `<ul class="tiles">${entries.map(renderTile).join("")}</ul>`
        : `<ul class="rows">${entries.map(tool => renderRow(tool)).join("")}</ul>`}
    </section>`;
  $("#panel").innerHTML = `
    <div class="panes" role="group" aria-label="切換類型">${groups.map(([kind, entries]) =>
      `<button type="button" data-pane="${kind}" aria-pressed="${pane === kind}">${kindNames[kind]}<span>${entries.length}</span></button>`).join("")}</div>
    <div class="board board-${groups.length}${groups.filter(([kind]) => kind === "tool" || kind === "info").length === 2 ? " board-paired" : ""}">${groups.map(block).join("")}</div>`;
}

function emptyState([title, text]) {
  return `<div class="empty"><p class="empty-title">${title}</p><p>${text}</p></div>`;
}

function searchResults(query) {
  const tokens = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return {
    tokens,
    items: tools
      .map(tool => {
        const title = tool.title.toLocaleLowerCase();
        const haystack = [tool.title, tool.description, tool.keywords, toolCategoryLabel(tool)].join(" ").toLocaleLowerCase();
        if (!tokens.every(token => haystack.includes(token))) return null;
        const score = tokens.reduce((sum, token) => sum + (title.startsWith(token) ? 20 : title.includes(token) ? 10 : 1), 0) + (kindOf(tool) === "tool" ? 2 : 0);
        return { tool, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.tool),
  };
}

function renderSearch(query) {
  const { tokens, items } = searchResults(query);
  activeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
  $("#search-status").textContent = items.length ? `在所有分類找到 ${items.length} 項・↑↓ 選擇、Enter 開啟、Esc 清除` : "沒有符合的項目";
  $("#results").innerHTML = items.length
    ? `<ul class="rows rows-search" id="search-list" role="listbox" aria-label="搜尋結果">${items.map(tool => renderRow(tool, tokens, true)).join("")}</ul>`
    : emptyState([`找不到「${escapeHtml(query)}」`, "試試更短的關鍵字，例如「價格」、「RO」、「掉落」。"]);
  updateActive();
}

function updateActive() {
  const rows = [...document.querySelectorAll("#search-list .row")];
  rows.forEach((row, index) => {
    row.classList.toggle("active", index === activeIndex);
    row.setAttribute("aria-selected", String(index === activeIndex));
  });
  rows[activeIndex]?.scrollIntoView({ block: "nearest" });
}

function renderHome() {
  const query = $("#search").value.trim();
  const searching = Boolean(query);
  document.body.classList.toggle("is-searching", searching);
  $("#results").hidden = !searching;
  $("#browse").hidden = searching;
  renderRecent();
  if (searching) { renderSearch(query); return; }
  $("#search-status").textContent = "";
  renderTabs();
  renderPanel();
}

function selectTab(id, focus = false) {
  tab = id;
  storage.write("saketora.homeTab", id);
  renderHome();
  if (focus) $(`#tab-${id}`).focus();
}

$("#search").addEventListener("input", () => { activeIndex = 0; renderHome(); });
$("#search").addEventListener("keydown", event => {
  const rows = [...document.querySelectorAll("#search-list .row")];
  if (event.key === "ArrowDown" && rows.length) { event.preventDefault(); activeIndex = (activeIndex + 1) % rows.length; updateActive(); }
  else if (event.key === "ArrowUp" && rows.length) { event.preventDefault(); activeIndex = (activeIndex - 1 + rows.length) % rows.length; updateActive(); }
  else if (event.key === "Enter" && rows[activeIndex]) { event.preventDefault(); rows[activeIndex].querySelector("a").click(); }
  else if (event.key === "Escape" && $("#search").value) { $("#search").value = ""; renderHome(); }
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey &&
      !document.querySelector("dialog[open]") && !event.target.closest("input, textarea, [contenteditable]")) {
    event.preventDefault();
    $("#search").focus();
    $("#search").select();
  }
});
$("#tabs").addEventListener("click", event => {
  const button = event.target.closest("[data-tab]");
  if (button) selectTab(button.dataset.tab);
});
$("#tabs").addEventListener("keydown", event => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  event.preventDefault();
  selectTab(tabIds[(tabIds.indexOf(tab) + step + tabIds.length) % tabIds.length], true);
});
$("#panel").addEventListener("click", event => {
  const button = event.target.closest("[data-pane]");
  if (!button) return;
  pane = button.dataset.pane;
  renderPanel();
});

let toastTimeout;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { $("#toast").hidden = true; }, 3500);
}
document.addEventListener("click", event => {
  const star = event.target.closest("[data-star]");
  if (star) {
    const id = star.dataset.star;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    const saved = storage.write("saketora.favorites", JSON.stringify([...favorites]));
    renderHome();
    (document.querySelector(`[data-star="${id}"]`) ?? $(`#tab-${tab}`))?.focus();
    toast(saved ? (favorites.has(id) ? "已加入收藏" : "已取消收藏") : "瀏覽器無法儲存設定；收藏僅保留在本次使用。");
    return;
  }
  const link = event.target.closest("[data-track]");
  if (link) {
    recent = [link.dataset.track, ...recent.filter(id => id !== link.dataset.track)].slice(0, 8);
    storage.write("saketora.recent", JSON.stringify(recent));
    renderRecent();
  }
});

document.querySelectorAll("[data-open-dialog]").forEach(button => button.addEventListener("click", () => $(`#${button.dataset.openDialog}`).showModal()));
$("#year").textContent = new Date().getFullYear();
renderHome();

const dialog = $("#tool-dialog");
let activeToolId = null;
function updateToolBookmark(id) {
  const url = new URL(window.location.href);
  url.hash = id ? `tool=${encodeURIComponent(id)}` : "";
  if (url.href !== window.location.href) window.history.pushState(null, "", url);
}
function closeTool(updateBookmark = true) {
  stopTimer();
  stopLaboratoryTimers();
  dialog.close();
  activeToolId = null;
  if (updateBookmark && window.location.hash.startsWith("#tool=")) updateToolBookmark(null);
}
$("#close-dialog").addEventListener("click", () => closeTool());
// Escape uses the same cleanup as the close button for every tool.
dialog.addEventListener("cancel", event => {
  event.preventDefault();
  closeTool();
});
function openTool(id, updateBookmark = true) {
  const tool = tools.find(item => item.id === id);
  if (!tool || tool.url) return;
  if (tool.page) { window.location.href = tool.page; return; }
  if (activeToolId === id && dialog.open) return;
  stopTimer();
  stopLaboratoryTimers();
  $("#dialog-title").textContent = tool.title;
  $("#dialog-category").textContent = toolCategoryLabel(tool);
  dialog.classList.toggle("dialog-wide", ["ragnarok-glacier-weapon", "ragnarok-reform-material", "ragnarok-grade-material"].includes(id));
  renderers[id]();
  dialog.showModal();
  activeToolId = id;
  if (updateBookmark) updateToolBookmark(id);
}
function syncToolBookmark() {
  let id = null;
  if (window.location.hash.startsWith("#tool=")) {
    try { id = decodeURIComponent(window.location.hash.slice(6)); }
    catch { /* Ignore malformed bookmarks. */ }
  }
  const tool = tools.find(item => item.id === id && !item.url);
  if (tool?.page) {
    window.location.replace(tool.page);
  } else if (tool && Object.hasOwn(renderers, tool.id)) {
    openTool(tool.id, false);
  } else if (dialog.open) {
    closeTool(false);
  }
}
function formatDuration(seconds) {
  const sign = seconds < 0 ? "-" : "";
  seconds = Math.abs(seconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const rest = Math.floor(seconds % 60);
  return sign + (hours ? String(hours).padStart(2, "0") + ":" : "") + String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
}

const durationKey = "saketora.ragnarok-timer.seconds";
const validDuration = value => Number.isInteger(value) && value >= 1 && value <= 86400;
const savedDuration = Number(storage.read(durationKey, "55"));
const initialDuration = validDuration(savedDuration) ? savedDuration : 55;
const timer = { duration: initialDuration, remaining: initialDuration, state: "idle", deadline: null, interval: null };
const originalPageTitle = document.title;

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
async function playTimerButtonSound(action, targetAlarm = alarm) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!targetAlarm.context || targetAlarm.context.state === "closed") targetAlarm.context = new AudioContextClass();
    const context = targetAlarm.context;
    await context.resume();
    const notes = { start: [520, 780], pause: [440, 440], stop: [390, 260] }[action];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * .09;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.09, start + .008);
      gain.gain.exponentialRampToValueAtTime(.001, start + .075);
      oscillator.connect(gain).connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start);
      oscillator.stop(start + .08);
    });
  } catch {
    // Button feedback is optional; audio failures must not interrupt the timer.
  }
}
function remainingSeconds() {
  return ["running", "finished"].includes(timer.state) ? Math.ceil((timer.deadline - Date.now()) / 1000) : timer.remaining;
}
function updateTimerTitle() {
  const parts = [];
  if (timer.state !== "idle") {
    parts.push(`${remainingSeconds()} 秒${timer.state === "paused" ? "（已暫停）" : ""}`);
  }
  laboratoryTimers.forEach((item, index) => {
    if (["running", "finished"].includes(item.state)) {
      parts.push(`王${index + 1}：${Math.ceil((item.deadline - Date.now()) / 1000)} 秒`);
    }
  });
  const title = parts.length ? `${parts.join(" / ")}｜${originalPageTitle}` : originalPageTitle;
  if (document.title !== title) document.title = title;
}
function updateTimerView() {
  updateTimerTitle();
  if (!$("#timer-form")) return;
  $("#timer-display").textContent = formatDuration(remainingSeconds());
  $("#timer-duration").disabled = timer.state !== "idle";
  $("#timer-start").disabled = !["idle", "paused"].includes(timer.state) || !$("#timer-duration").validity.valid;
  $("#timer-pause").disabled = timer.state !== "running";
  $("#timer-stop").disabled = timer.state === "idle";
  $("#timer-stop").classList.toggle("timer-stop-active", timer.state !== "idle");
  const message = { idle: "準備就緒", running: "計時中", paused: "已暫停", finished: "時間到！" }[timer.state];
  $("#timer-status").textContent = message;
}
function tickTimer() {
  if (timer.state === "running" && remainingSeconds() <= 0) {
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
    void playTimerButtonSound("start");
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
    void playTimerButtonSound("pause");
    updateTimerView();
  });
  $("#timer-stop").addEventListener("click", () => {
    if (timer.state === "idle") return;
    stopTimer();
    void playTimerButtonSound("stop");
  });
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
  const jobTranslations = [
    ["劍士 Warrior", "狂戰士 Fighter", "十字軍 Crusader", "英雄 Hero"],
    ["劍士 Warrior", "見習騎士 Page", "騎士 White Knight", "聖騎士 Paladin"],
    ["劍士 Warrior", "槍騎兵 Spearman", "龍騎士 Dragon Knight", "黑騎士 Dark Knight"],
    ["法師 Magician", "火毒巫師 Wizard (Fire, Poison)", "火毒魔導士 Mage (Fire, Poison)", "火毒大魔導 Archmage (Fire, Poison)"],
    ["法師 Magician", "冰雷巫師 Wizard (Ice, Lightning)", "冰雷魔導士 Mage (Ice, Lightning)", "冰雷大魔導 Archmage (Ice, Lightning)"],
    ["法師 Magician", "僧侶 Cleric", "祭司 Priest", "主教 Bishop"],
    ["弓箭手 Bowman", "獵人 Hunter", "遊俠 Ranger", "箭神 Bowmaster"],
    ["弓箭手 Bowman", "弩弓手 Crossbowman", "狙擊手 Sniper", "神射手 Marksman"],
    ["盜賊 Thief", "刺客 Assassin", "暗殺者 Hermit", "夜使者 Night Lord"],
    ["盜賊 Thief", "俠盜 Bandit", "神偷 Chief Bandit", "暗影神偷 Shadower"],
    ["海盜 Pirate", "打手 Brawler", "格鬥家 Marauder", "拳霸 Buccaneer"],
    ["海盜 Pirate", "槍手 Gunslinger", "神槍手 Outlaw", "槍神 Corsair"],
  ];
  const locationStep = (label, locations, expanded = false) => `<details class="job-location-details"${expanded ? " open" : ""}><summary>${label} <span class="job-location-toggle"><span class="job-location-show">展開地點</span><span class="job-location-hide">收合地點</span></span></summary>${locations}</details>`;
  $("#tool-content").innerHTML = `<div class="job-info">
    <p class="job-stage-placeholder">請選擇左側轉職階段，查看條件與步驟。</p>
    <details name="job-stage" class="job-stage">
      <summary id="job-stage-1">一轉</summary>
      <div class="job-stage-content" role="region" aria-labelledby="job-stage-1" tabindex="0">
      <div class="job-table-scroll" role="region" aria-label="一轉條件與轉職地點" tabindex="0">
        <table class="job-table">
          <caption class="sr-only">一轉條件與轉職地點</caption>
          <thead><tr><th scope="col">職業</th><th scope="col">等級需求</th><th scope="col">能力值需求</th><th scope="col">轉職地點</th></tr></thead>
          <tbody>${firstJobs.map(job => `<tr><th scope="row">${job.name}</th><td>${job.level}</td><td>${job.stat} ${job.requirement}</td><td>${job.location}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      </div>
    </details>
    <details name="job-stage" class="job-stage">
      <summary id="job-stage-2">二轉</summary>
      <div class="job-stage-content" role="region" aria-labelledby="job-stage-2" tabindex="0">
      <p class="job-level">等級需求：30</p>
      <ol class="job-steps">
        <li>${locationStep("找尋一轉轉職教官", firstInstructorLocations)}</li>
        <li>${locationStep("找尋二轉轉職教官", secondInstructorLocations, true)}</li>
        <li>打倒轉職地圖的魔物，蒐集黑珠 <strong>30 顆</strong>。</li>
        <li>交付黑珠給二轉轉職教官，取得英雄的證明。</li>
        <li>找尋一轉轉職教官，交付英雄的證明並進行二轉。</li>
      </ol>
      <div class="job-table-scroll" role="region" aria-label="職業名稱翻譯清單" tabindex="0">
        <table class="job-table job-translation-table">
          <caption>職業名稱翻譯清單</caption>
          <thead><tr><th scope="col">一轉</th><th scope="col">二轉</th><th scope="col">三轉</th><th scope="col">四轉</th></tr></thead>
          ${[...new Set(jobTranslations.map(jobs => jobs[0]))].map(firstJob => {
            const paths = jobTranslations.filter(jobs => jobs[0] === firstJob);
            const formatJob = job => {
              const separator = job.indexOf(" ");
              return `${job.slice(0, separator)}<br><span class="muted" lang="en">${job.slice(separator + 1)}</span>`;
            };
            return `<tbody>${paths.map((jobs, index) => `<tr>${index === 0 ? `<th scope="rowgroup" rowspan="${paths.length}">${formatJob(firstJob)}</th>` : ""}${jobs.slice(1).map(job => `<td>${formatJob(job)}</td>`).join("")}</tr>`).join("")}</tbody>`;
          }).join("")}
        </table>
      </div>
      </div>
    </details>
    <details name="job-stage" class="job-stage">
      <summary id="job-stage-3">三轉</summary>
      <div class="job-stage-content" role="region" aria-labelledby="job-stage-3" tabindex="0">
      <p class="job-level">等級需求：70</p>
      <ol class="job-steps">
        <li>準備至少 <strong>1 顆黑暗水晶</strong>，用於後續雪原聖地的考試。</li>
        <li>${locationStep("找尋一轉轉職教官", firstInstructorLocations)}</li>
        <li>${locationStep("找尋次元之門", dimensionDoorLocations, true)}</li>
        <li>進入次元之門，打倒一轉轉職教官分身並取得黑符。</li>
        <li>找尋一轉轉職教官，交付黑符並取得力量項鍊。</li>
        <li>找尋三轉轉職教官。</li>
        <li>找尋雪原聖地（位於尖銳的絕壁 II 右上方木門）。</li>
        <li>與雪原聖地的石碑對話，完成考試並取得智慧項鍊。
          <a href="https://chronostorydex.com/3rd-job-qa" target="_blank" rel="noopener noreferrer" aria-label="三轉考試題庫（另開分頁）">考試題庫 ↗</a>
        </li>
        <li>找尋三轉轉職教官，交付力量項鍊與智慧項鍊並進行三轉。</li>
      </ol>
      </div>
    </details>
    <details name="job-stage" class="job-stage">
      <summary id="job-stage-4">四轉</summary>
      <div class="job-stage-content" role="region" aria-labelledby="job-stage-4" tabindex="0">
      <p class="job-level">等級需求：120</p>
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
      </div>
    </details>
  </div>`;
}
const renderers = { "chronostory-support-info": renderChronostorySupportInfo, "ragnarok-timer": renderTimer, "ragnarok-glacier-weapon": renderGlacierWeapon, "ragnarok-reform-material": renderReformMaterial, "ragnarok-grade-material": renderGradeMaterial, "chronostory-job-info": renderChronostoryJobInfo };

window.addEventListener("hashchange", syncToolBookmark);
window.addEventListener("popstate", syncToolBookmark);
syncToolBookmark();
