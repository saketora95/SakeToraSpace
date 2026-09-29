"use strict";

const chronostorySupportJobs = (() => {
  const stance = ["格檔 Power Stance", "擊退抵抗 + 90%"];
  const focus = ["集中術 Focus", "命中 + 20"];
  const eyes = ["會心之眼 Sharp Eyes", "暴擊機率 + 15%、暴擊傷害 + 40%"];
  const meditation = [
    ["精神強化 Meditate", "魔法攻擊 + 30", null, { name: "進階精神強化 Meditation+", effect: "使精神強化追加額外效果、物理攻擊 + 10、魔法攻擊再 + 30" }],
  ];
  const haste = [
    ["速度激發 Haste", "移動速度 + 50、跳躍力 + 20", null, { name: "進階速度激發 Haste+", effect: "使速度激發追加額外效果、移動速度再 + 50、移動速度上限 + 50" }],
    ["幸運術 Meso Up", "楓幣掉落 + 50%"],
  ];
  const dice = [
    ["幸運骰子 Roll of the Dice", "依據骰子的數值，取得以下其中一種效果：", [
      "1：無效果", "2：物理防禦 + 100、魔法防禦 + 100", "3：MHP + 1000、MMP + 1000",
      "4：掉落率 + 30%", "5：EXP + 30%", "6：最終傷害 + 20%",
    ], { name: "灌鉛骰子 Loaded Dice", effect: "幸運骰子不再骰出 1（無效果）；骰到 2 的物理防禦與魔法防禦增加量變更為 400；骰到 3 的 MHP 與 MMP 增加量變更為 2000；額外可以骰到 7（暴擊機率 + 15%、暴擊傷害 + 40%）" }],
  ];
  return [
    { name: "英雄 Hero", skills: [["激勵 Rage", "物理攻擊 + 20"], stance] },
    { name: "聖騎士 Paladin", skills: [["魔防消除 Magic Crash", "無視敵人屬性抗性 + 50%"], stance] },
    { name: "黑騎士 Dark Knight", skills: [
      ["禦魔陣 Iron Will", "物理防禦 + 100、魔法防禦 + 100、擊退抵抗 + 10%"],
      ["神聖之火 Hyper Body", "MHP + 60%、MMP + 60%", null, { name: "神聖之火 Hyper Body+", effect: "MHP 再 + 40%、MMP 再 + 40%" }],
      stance,
    ] },
    { name: "火毒大魔導 Archmage (Fire, Poison)", skills: [...meditation,
      ["催化香薰 Catalytic Incense", "最終傷害 + 15%、每秒損失 100 HP"],
    ] },
    { name: "冰雷大魔導 Archmage (Ice, Lightning)", skills: [...meditation,
      ["電流波湧 Voltaic Surge", "攻擊速度 - 2、每秒損失 100 MP"],
    ] },
    { name: "主教 Bishop", skills: [
      ["天使祝福 Bless", "命中 + 20、迴避 + 20、物理防禦 + 20、魔法防禦 + 20", null, { name: "進階天使祝福 Bless+", effect: "使天使祝福追加額外效果、物理攻擊 + 20、魔法攻擊 + 20、命中再 + 10、迴避再 + 20、物理防禦再 + 280、魔法防禦再 + 280" }],
      ["神聖祈禱 Holy Symbol", "EXP + (同地圖活躍隊伍成員數量 × 20)%"],
    ] },
    { name: "箭神 Bowmaster", skills: [focus, eyes] },
    { name: "神射手 Marksman", skills: [focus, eyes] },
    { name: "夜使者 Night Lord", skills: [...haste,
      ["挑釁 Showdown", "EXP + 15%、掉落率 + 15%、敵人攻擊力 + 15%、敵人防禦力 + 15%"],
    ] },
    { name: "暗影神偷 Shadower", skills: [...haste,
      ["竊賊契約 Cutpurse Pact", "最終傷害 + 12.5%、每秒損失 200 楓幣"],
    ] },
    { name: "拳霸 Buccaneer", skills: [...dice,
      ["最終極速 Speed Infusion", "攻擊速度 - 2、每秒損失 100 MP"],
    ] },
    { name: "槍神 Corsair", skills: [...dice,
      ["雙重骰子 Double Down", "使幸運骰子可以一次骰出兩顆骰子"],
    ] },
  ];
})();

const chronostorySupportGroups = [
  { name: "劍士", jobs: [0, 1, 2] },
  { name: "法師", jobs: [3, 4, 5] },
  { name: "弓箭手", jobs: [6, 7] },
  { name: "盜賊", jobs: [8, 9] },
  { name: "海盜", jobs: [10, 11] },
];

const chronostorySupportSummaries = {
  "激勵 Rage": "提升物理攻擊",
  "格檔 Power Stance": "提升擊退抵抗",
  "魔防消除 Magic Crash": "無視部分敵人屬性抗性",
  "禦魔陣 Iron Will": "提升物理、魔法防禦與擊退抵抗",
  "神聖之火 Hyper Body": "提升最大 HP、MP",
  "神聖之火 Hyper Body+": "增加最大 HP、MP 的增加量",
  "精神強化 Meditate": "提升魔法攻擊",
  "進階精神強化 Meditation+": "增加魔法攻擊的增加量，額外增加物理攻擊",
  "催化香薰 Catalytic Incense": "提升最終傷害，持續消耗 HP",
  "電流波湧 Voltaic Surge": "提升攻擊速度，持續消耗 MP",
  "天使祝福 Bless": "提升命中、迴避與物理、魔法防禦",
  "進階天使祝福 Bless+": "增加命中、迴避、物理防禦與魔法防禦的增加量，額外增加物理攻擊與魔法攻擊",
  "神聖祈禱 Holy Symbol": "依同地圖活躍隊員數提升經驗值",
  "集中術 Focus": "提升命中",
  "會心之眼 Sharp Eyes": "提升暴擊機率與暴擊傷害",
  "速度激發 Haste": "提升移動速度與跳躍力",
  "進階速度激發 Haste+": "增加移動速度的增加量，額外增加移動速度上限",
  "幸運術 Meso Up": "提升楓幣掉落",
  "挑釁 Showdown": "提升經驗值與掉落率，同時提高敵人攻擊與防禦",
  "竊賊契約 Cutpurse Pact": "提升最終傷害，持續消耗楓幣",
  "幸運骰子 Roll of the Dice": "隨機取得防禦、最大 HP／MP、掉落率、經驗值或傷害效果，也可能無效果",
  "灌鉛骰子 Loaded Dice": "移除無效果結果，增加物理防禦、魔法防禦與最大 HP／MP 的增加量，額外增加暴擊機率與暴擊傷害效果",
  "最終極速 Speed Infusion": "提升攻擊速度，持續消耗 MP",
  "雙重骰子 Double Down": "同時擲出兩顆幸運骰子",
};

function formatSupportSkillName(name) {
  const separator = name.indexOf(" ");
  return `${name.slice(0, separator)}<br><span lang="en">${name.slice(separator + 1)}</span>`;
}

function formatSupportEffects(effect) {
  return effect.split("、").join("<br>");
}

function formatSupportUpgrade(upgrade, summary = false) {
  const name = upgrade.name.slice(0, upgrade.name.indexOf(" ")).replace(/^進階/, "");
  const effect = summary
    ? chronostorySupportSummaries[upgrade.name]
    : upgrade.effect.replace(/^使[^、]+追加額外效果、/, "");
  return `習得進階${name}後，${effect}`;
}

function renderChronostorySupportOverview() {
  const columns = Math.max(...chronostorySupportJobs.map(job => job.skills.length));
  return `<h3 id="support-content-heading">概要</h3>
    <table class="support-overview">
      <caption class="sr-only">各職業共享輔助狀態概要</caption>
      <thead><tr><th scope="col">職業</th>${Array.from({ length: columns }, (_, index) => `<th scope="col">輔助狀態 ${index + 1}</th>`).join("")}</tr></thead>
      ${chronostorySupportGroups.map(group => `<tbody>
        <tr class="support-group-heading"><th colspan="${columns + 1}" scope="rowgroup">${group.name}</th></tr>
        ${group.jobs.map(index => {
          const job = chronostorySupportJobs[index];
          return `<tr><th scope="row">${job.name}</th>${Array.from({ length: columns }, (_, skillIndex) => {
            const skill = job.skills[skillIndex];
            return skill ? `<td><strong>${skill[0]}</strong><span>${chronostorySupportSummaries[skill[0]]}</span>${skill[3] ? `<div class="support-upgrade">${formatSupportUpgrade(skill[3], true)}</div>` : ""}</td>` : '<td><span aria-label="無其他輔助狀態">—</span></td>';
          }).join("")}</tr>`;
        }).join("")}
      </tbody>`).join("")}
    </table>`;
}

function renderChronostorySupportInfo() {
  const container = document.querySelector("#tool-content");
  container.innerHTML = `<div class="support-info">
    <nav class="support-navigation" aria-label="輔助狀態職業選擇">
      <button type="button" class="secondary-button" data-support-view="overview" aria-controls="support-content" aria-pressed="true">概要</button>
      ${chronostorySupportGroups.map(group => `<details>
        <summary>${group.name}</summary>
        <div class="support-job-buttons">${group.jobs.map(index => `<button type="button" class="secondary-button" data-support-view="${index}" aria-controls="support-content" aria-pressed="false">${chronostorySupportJobs[index].name}</button>`).join("")}</div>
      </details>`).join("")}
    </nav>
    <section id="support-content" class="support-content" tabindex="0" aria-labelledby="support-content-heading">${renderChronostorySupportOverview()}</section>
  </div>`;
  const panel = container.querySelector("#support-content");
  const buttons = container.querySelectorAll("[data-support-view]");
  buttons.forEach(button => button.addEventListener("click", () => {
    buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    const view = button.dataset.supportView;
    if (view === "overview") {
      panel.innerHTML = renderChronostorySupportOverview();
    } else {
      const job = chronostorySupportJobs[Number(view)];
      panel.innerHTML = `<h3 id="support-content-heading">${job.name}</h3>
        <dl class="support-skill-list">${job.skills.map(([name, effect, notes, upgrade]) => `<div class="support-skill">
          <dt>${formatSupportSkillName(name)}</dt><dd>${formatSupportEffects(effect)}${notes ? `<ul>${notes.map(note => `<li>${note}</li>`).join("")}</ul>` : ""}${upgrade ? `<div class="support-upgrade">${formatSupportUpgrade(upgrade)}</div>` : ""}</dd>
        </div>`).join("")}</dl>`;
    }
    panel.scrollTop = 0;
    panel.scrollLeft = 0;
  }));
}
