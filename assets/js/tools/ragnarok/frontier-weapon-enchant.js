"use strict";

// Frontier and two-dimension weapons share the same random enchants, so both pages render them from here.
// `other` links to the page for the other weapon series: { label, href }.
function renderFrontierWeaponEnchant(container, other) {
  const enchant = window.ragnarokFrontierWeaponEnchantData;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  if (!enchant) {
    container.innerHTML = '<p class="notice">資料載入失敗，請重新整理頁面。</p>';
    return;
  }

  const table = rows => `<div class="enchant-table-scroll" tabindex="0"><table class="enchant-table">
    <thead><tr><th scope="col">效果</th><th scope="col">最低值</th><th scope="col">最高值</th></tr></thead>
    <tbody>${rows.map(([name, min, max]) => `<tr><td>${escape(name)}</td><td class="enchant-num">${min}</td><td class="enchant-num">${max}</td></tr>`).join("")}</tbody>
  </table></div>`;
  const categories = enchant.categories.map((category, index) => `<section class="enchant-block" data-category="${index}">
    <div class="enchant-block-head">
      <h2>${escape(category.name)}</h2>
    </div>
    <div class="enchant-lines-grid">
      ${category.lines.map((rows, line) => `<div>
        <h3>${line ? "第二條 & 第三條" : "第一條"}</h3>
        ${table(rows)}
      </div>`).join("")}
    </div>
  </section>`).join("");
  const filter = (value, label) => `<button type="button" data-category="${value}" aria-pressed="${value === ""}">${escape(label)}</button>`;
  container.innerHTML = `
    <p class="enchant-same"><strong>邊界武器與二次元武器的武器附魔相同</strong>，此處內容與「<a href="${escape(other.href)}">${escape(other.label)}</a>」頁面一致。</p>
    <ul class="enchant-notes">${enchant.notes.map(note => `<li>${escape(note)}</li>`).join("")}</ul>
    <div class="enchant-filter" role="group" aria-label="篩選武器分類">${filter("", "全部")}${enchant.categories.map((category, index) => filter(String(index), category.name)).join("")}</div>
    ${categories}`;

  const buttons = [...container.querySelectorAll(".enchant-filter button")];
  const blocks = [...container.querySelectorAll(".enchant-block")];
  container.querySelector(".enchant-filter").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    for (const other of buttons) other.setAttribute("aria-pressed", String(other === button));
    for (const block of blocks) block.hidden = Boolean(button.dataset.category) && block.dataset.category !== button.dataset.category;
  });
}
