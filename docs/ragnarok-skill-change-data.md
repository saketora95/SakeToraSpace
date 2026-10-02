# 仙境傳說技能調整資料格式

查詢頁：`ragnarok-skill-changes.html`。資料檔：`assets/js/tools/ragnarok/skill-change-data.js`，以 `window.ragnarokSkillChangeData = { ... };` 載入，不需後端或建置程序。可直接開啟 HTML 或以既有靜態網站部署。

目前資料於 2026-10-02 匯入杜腐的[kRO 迄今技能調整／優化整理](https://forum.gamer.com.tw/C.php?bsn=4212&snA=436731)中[盧恩龍爵章節](https://forum.gamer.com.tw/Co.php?bsn=4212&sn=2901200)，來源文章更新於 2026-10-01。收錄 12 個技能、10 個版本、36 筆記錄，共 97 個調整項目；已移除介面示範資料。技能 ID 與韓文名稱對照 kRO 官方技能資料；各技能的 `metadataSourceUrl` 保留對應來源，英文、日文名稱尚未確認，維持 `null` 並顯示缺漏提示。

版本編號沿用作者分類，不代表官方版本編號。現行版本依來源文章設定為第 8 版本（2026-08-19）；第 9 版本是 2026-09-30 公布的預定調整，尚未實裝，保留獨立的預告標籤。只匯入此職業有調整的版本及來源文章指定的現行版本，並保留對應官方維護公告或開發者筆記連結。

數值、範圍、次數、技能效果與新增技能資訊分開儲存；條件倍率拆成多列，條件放在 `note`。來源未記載的舊值維持 `null`，不從其他版本推算；來源未標示的單位也不自行補上。活力之源第 8 版本的抗解除變化是文章引用的玩家測試，使用 `evidence: "player-test"` 並在備註說明官方更新清單未載明。原文「總倍率」與「基本倍率」數值可能不同，照原文保留，不能直接視為連續的同一數值。

公告 `url: null` 不列出公告標題；若版本尚無公告連結，顯示「官方維護公告連結待補」。填入官方維護公告完整網址後會在頁尾公告索引顯示連結。公告發表日未查證時使用 `publishedAt: null`，不以實裝日代替。

## 重新匯入

將文章首樓及四之一轉職業樓層存為 UTF-8 HTML，執行以下指令（Python 3.10 以上，僅使用標準函式庫）：

```sh
python3 scripts/import-ragnarok-skill-changes.py --index path/to/version-index.html --skills path/to/dragon-knight.html --date YYYY-MM-DD
python3 scripts/test-ragnarok-skill-import.py
node scripts/test-ragnarok-skill-changes.cjs
```

匯入器只取盧恩騎士／盧恩龍爵章節，會解開巴哈姆特轉址並保留官方網址。遇到未知技能、版本、調整格式、重複記錄或數量異常時停止，不寫入新資料；支援 `--output` 指定其他輸出檔案。技能 ID／韓文名稱的對照表在匯入器的 `SKILLS`，新增技能前需先確認官方對應。原有示範資料移至 `scripts/fixtures/ragnarok-skill-change-demo.js`，僅供介面測試使用。

## 頂層結構

| 欄位 | 用途 |
| --- | --- |
| `schemaVersion` | 固定為 `1`；資料結構變更時一併更新讀取程式。 |
| `meta` | 資料範圍、現行版本與更新日期。 |
| `jobs[]` | 職業目錄。 |
| `skills[]` | 技能名稱、遊戲 ID 與適用職業。 |
| `versions[]` | 版本目錄與排序。 |
| `announcements[]` | 官方維護公告，一個版本可有多份公告。 |
| `records[]` | 技能 × 版本的調整記錄，每筆可有多項調整及多份公告。 |

資料集限單一伺服器，避免混用 kRO、twRO 等不同改版進度。`meta.server` 可填 `kRO`；若日後加入其他伺服器，應使用獨立資料集或擴充伺服器關聯及篩選。

## 欄位規格

- `meta`：`isDemo`（布林值）、`server`（名稱）、`currentVersionId`（對應版本 `id`）、`updatedAt`（`YYYY-MM-DD`）。現行版本由 `currentVersionId` 明確指定，不從最新日期或最大 `order` 推測。`notice`（選填）顯示收錄範圍說明；`source`（選填）包含文章 `title`、`author`、`url`、職業章節 `sectionUrl`、來源更新 `updatedAt`。確認正式資料後才將 `isDemo` 設為 `false`。
- `jobs[]`：`id`（穩定字串）、`name`（顯示名稱）。陣列順序即職業選單順序。
- `skills[]`：`id`（內部穩定字串）、`skillId`（遊戲的整數 ID，未知可為 `null`）、`jobIds`（職業 `id` 陣列）、`names`（`zhHant` 必填；`ko`、`en`、`ja` 為韓文、英文、日文，可省略或為 `null`）。`jobIds` 明確列出所有相關職業，包括需要顯示該技能的進階職業；不自動推測技能繼承關係。同一技能只存一份，關聯多個職業。
- `versions[]`：`id`、`name`、`order`（唯一整數，越大越新）、`releasedAt`（實施日期，`YYYY-MM-DD` 或 `null`）。選填 `status` 可為 `released` 或 `planned`；預告版本必須設定 `announcedAt`（公布日期）、`releasedAt: null`，且不得設為現行版本。版本選單、公告及技能歷史皆依 `order` 降冪顯示；預告版本另有「預告・尚未實裝」標籤。
- `announcements[]`：`id`、`versionId`、`title`、`publishedAt`（公告日期，`YYYY-MM-DD` 或 `null`）、`url`（官方公告完整 `http://` 或 `https://` 網址，未知為 `null`）。公告日期與實施日期分開儲存。同版本內公告依陣列順序顯示；應連到支持調整內容的公告本身。
- `records[]`：`id`、`skillId`（對應 `skills[].id`，不是遊戲的整數 ID）、`versionId`、`announcementIds`（至少一份同版本公告）、`changes`（至少一個調整項目）。選填 `evidence` 為 `article` 或 `player-test`，後者需以備註清楚標明測試來源及未確認狀態。同版本可有多筆記錄，依資料中的先後順序顯示；適合補充修正公告。
- `changes[]`：`item`（調整項目）、`before`、`after`（必填，可為數字、字串或 `null`）、`unit`（選填字串）、`note`（選填備註字串）。`null` 代表「未記載」；數字 `0` 會正常顯示。

`unit` 直接附加於前後數值，例如 `{ before: 400, after: 450, unit: "%" }` 顯示 `400% → 450%`。單位不一致或公式、範圍、使用條件等內容，直接使用完整字串並省略 `unit`。

## 新增資料範例

以下同樣是假設資料，僅供說明欄位。將各筆加入對應陣列，並填入真實公告網址即可。

```js
// jobs
{ id: "knight", name: "騎士" }

// skills
{
  id: "example-skill",
  skillId: null, // 正式資料應填已確認的遊戲技能 ID
  jobIds: ["knight"],
  names: { zhHant: "範例技能", ko: null, en: null, ja: null }
}

// versions
{ id: "example-patch", name: "範例技能調整", order: 4, releasedAt: null }

// announcements
{
  id: "example-notice", versionId: "example-patch",
  title: "官方維護公告標題", publishedAt: null,
  url: null // 替換為公告完整網址；未確認時維持 null
}

// records
{
  id: "example-skill-patch",
  skillId: "example-skill",
  versionId: "example-patch",
  announcementIds: ["example-notice"],
  changes: [
    { item: "技能倍率", before: 400, after: 450, unit: "%" },
    { item: "發動機率", before: 10, after: 15, unit: "%", note: "僅適用於最高技能等級。" },
    { item: "技能範圍", before: "5 x 5", after: "9 x 9" },
    { item: "使用條件", before: "限定單手劍", after: "單手劍或雙手劍" }
  ]
}
```

版本上線時修改 `meta.currentVersionId`，同步更新 `meta.updatedAt`。各目錄的 `id` 必須在各自陣列內唯一，記錄與公告的版本必須一致。載入程式會驗證參照、日期、重複 ID、數值與網址格式；錯誤會顯示在頁面上，不會悄悄略過資料。網址格式驗證不代表來源真實性，整理資料時仍需確認其為相關官方公告。

## 查詢行為與驗證

職業及技能搜尋同時套用，支援部分多語名稱、技能 ID、大小寫及全形英數字。技能清單固定列出符合職業／名稱的全部已收錄技能，不受版本篩選縮減；點選技能查看單一技能，或按「查看全部符合技能」恢復全覽。

預設顯示全部版本。指定版本後，只顯示該版本記錄；沒有該版記錄的技能會顯示未收錄說明。金色區塊與「現行版本」標籤只套用到明確指定的現行版本，不將某技能的最新歷史記錄當成現行版本。這是變更記錄，並非推算後的完整現行技能數值。

技能標題下以一列顯示所屬職業、技能 ID、韓文、日文與英文名稱，欄位間以 `‧` 分隔，窄畫面可自然換行。未知 ID 使用 `null`，未知名稱可省略、填 `null` 或空字串，未知職業使用空 `jobIds`；分別顯示 `(缺少技能 ID)`、`(缺少技能韓文名稱)`、`(缺少技能日文名稱)`、`(缺少技能英文名稱)`、`(缺少技能所屬職業)`。

未指定版本且結果區寬度至少 720px 時，每個技能的所有版本合併為一張表格，以版本欄及群組列區分，現行版本列群組高亮。結果區較窄或指定版本時使用各版本獨立表格；縮放視窗會自動切換，保留目前篩選與技能選擇。調整表不重複列出公告，官方連結統一在頁尾顯示。

「現行版本」標籤在欄位空間足夠時排在版本名稱右側，空間不足才換行。所有調整表共用依目前顯示資料計算的欄寬；計算包含欄名、版本名稱與標籤、調整項目、前後數值及備註，保留基本可讀寬度並讓較長內容取得較多空間。特別長的內容會換行，避免單一欄位占滿表格；篩選、技能選擇與結果區寬度變更時會重新計算。

頁尾公告索引只受版本條件影響，避免因選擇職業或技能而隱藏同版本的其他官方公告。

```sh
node scripts/test-ragnarok-skill-changes.cjs
```
