"use strict";

// 僅供 scripts/test-ragnarok-skill-changes.cjs 測試，不載入正式查詢頁。
// 以下全部為介面示範，技能 ID、名稱、版本、數值與公告標題都不是實際遊戲資料。
window.ragnarokSkillChangeData = {
  schemaVersion: 1,
  meta: {
    isDemo: true,
    server: "示範伺服器",
    currentVersionId: "demo-v3",
    updatedAt: "2026-10-02",
  },
  jobs: [
    { id: "swordsman", name: "劍士" },
    { id: "knight", name: "騎士" },
    { id: "mage", name: "魔法師" },
    { id: "wizard", name: "巫師" },
    { id: "archer", name: "弓箭手" },
  ],
  versions: [
    { id: "demo-v1", name: "示範版本 1", order: 1, releasedAt: null },
    { id: "demo-v2", name: "示範版本 2", order: 2, releasedAt: null },
    { id: "demo-v3", name: "示範版本 3", order: 3, releasedAt: null },
  ],
  announcements: [
    { id: "demo-notice-v1", versionId: "demo-v1", title: "初次技能調整（示範公告）", publishedAt: null, url: null },
    { id: "demo-notice-v2", versionId: "demo-v2", title: "技能平衡調整（示範公告）", publishedAt: null, url: null },
    { id: "demo-notice-v3", versionId: "demo-v3", title: "技能優化與範圍調整（示範公告）", publishedAt: null, url: null },
    { id: "demo-notice-v3-extra", versionId: "demo-v3", title: "追加修正說明（示範公告）", publishedAt: null, url: null },
  ],
  skills: [
    { id: "demo-slash", skillId: 900001, jobIds: ["swordsman", "knight"], names: { zhHant: "斬擊（示範）", ko: "베기 (예시)", en: "Slash (Demo)", ja: "斬撃（サンプル）" } },
    { id: "demo-combo", skillId: 900002, jobIds: ["knight"], names: { zhHant: "連續攻擊（示範）", ko: "연속 공격 (예시)", en: "Combo Attack (Demo)", ja: "連続攻撃（サンプル）" } },
    { id: "demo-fire", skillId: 900003, jobIds: ["mage", "wizard"], names: { zhHant: "火焰術（示範）", ko: "화염술 (예시)", en: "Fire Spell (Demo)", ja: "火炎術（サンプル）" } },
    { id: "demo-storm", skillId: 900004, jobIds: ["wizard"], names: { zhHant: "暴風術（示範）", ko: "폭풍술 (예시)", en: "Storm Spell (Demo)", ja: "暴風術（サンプル）" } },
    { id: "demo-arrow", skillId: 900005, jobIds: ["archer"], names: { zhHant: "精準射擊（示範）", ko: "정밀 사격 (예시)", en: "Precise Shot (Demo)", ja: "精密射撃（サンプル）" } },
  ],
  records: [
    { id: "demo-slash-v1", skillId: "demo-slash", versionId: "demo-v1", announcementIds: ["demo-notice-v1"], changes: [
      { item: "技能倍率", before: 350, after: 400, unit: "%" },
      { item: "發動機率", before: 5, after: 10, unit: "%" },
      { item: "技能範圍", before: "3 x 3", after: "5 x 5" },
    ] },
    { id: "demo-slash-v2", skillId: "demo-slash", versionId: "demo-v2", announcementIds: ["demo-notice-v2"], changes: [
      { item: "技能倍率", before: 400, after: 450, unit: "%" },
      { item: "發動機率", before: 10, after: 15, unit: "%", note: "以技能等級上限為例。" },
      { item: "技能範圍", before: "5 x 5", after: "9 x 9" },
    ] },
    { id: "demo-slash-v3", skillId: "demo-slash", versionId: "demo-v3", announcementIds: ["demo-notice-v3", "demo-notice-v3-extra"], changes: [
      { item: "技能倍率", before: 450, after: 500, unit: "%" },
      { item: "使用條件", before: "限定單手劍", after: "單手劍或雙手劍", note: "裝備限制放寬；實際適用條件待正式資料確認。" },
    ] },
    { id: "demo-combo-v2", skillId: "demo-combo", versionId: "demo-v2", announcementIds: ["demo-notice-v2"], changes: [
      { item: "攻擊次數", before: 2, after: 3, unit: "次" },
      { item: "技能冷卻", before: 1, after: 0, unit: "秒", note: "取消技能冷卻。" },
    ] },
    { id: "demo-fire-v1", skillId: "demo-fire", versionId: "demo-v1", announcementIds: ["demo-notice-v1"], changes: [
      { item: "技能倍率", before: "100% × 技能等級", after: "120% × 技能等級" },
    ] },
    { id: "demo-fire-v3", skillId: "demo-fire", versionId: "demo-v3", announcementIds: ["demo-notice-v3"], changes: [
      { item: "固定詠唱", before: 0.5, after: 0.3, unit: "秒" },
      { item: "消耗 SP", before: 30, after: 25 },
    ] },
    { id: "demo-storm-v3", skillId: "demo-storm", versionId: "demo-v3", announcementIds: ["demo-notice-v3"], changes: [
      { item: "技能範圍", before: "5 x 5", after: "9 x 9" },
      { item: "目標限制", before: "單體", after: "範圍內所有敵人" },
    ] },
    { id: "demo-arrow-v2", skillId: "demo-arrow", versionId: "demo-v2", announcementIds: ["demo-notice-v2"], changes: [
      { item: "射程", before: 7, after: 9, unit: "格" },
      { item: "技能倍率", before: null, after: 450, unit: "%", note: "未記載的舊數值使用 null，顯示為「未記載」。" },
    ] },
  ],
};
