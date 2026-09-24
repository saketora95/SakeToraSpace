"use strict";

// Material quantities follow the supplied calculator; prices are user-editable and saved locally.
const glacierWeaponMaterials = ["雪花魔力原石", "雪花魔石", "閃耀雪花魔石", "耀眼雪花魔石", "雪花的花葉", "魏格納商隊兌換證"];
// Keep stored price indices stable; only the visual input order changes.
const glacierWeaponInputOrder = [4, 0, 5, 1, 2, 3];
const glacierWeaponRecipes = [
  { name: "體屬種－體屬種－體屬種", counts: [50, 60, 30] },
  { name: "體屬種－三轉傷－體屬種", counts: [75, 65, 45] },
  { name: "體屬種－體屬種－四轉傷", counts: [75, 75, 70] },
];
const glacierWeaponPriceKey = "saketora.glacier-weapon.prices";
const glacierWeaponDefaults = [3500, 10000, 40000, 100000, 15000, 4000];
function validGlacierWeaponPrice(value, index) {
  return (index === 5 && value === "") || (Number.isInteger(value) && value >= 0 && value <= 1000000000000);
}
function loadGlacierWeaponPrices() {
  try {
    const saved = JSON.parse(localStorage.getItem(glacierWeaponPriceKey));
    if (Array.isArray(saved)) {
      return glacierWeaponDefaults.map((fallback, index) => validGlacierWeaponPrice(saved[index], index) ? saved[index] : fallback);
    }
  } catch { /* Unavailable or invalid storage falls back to the default prices. */ }
  return [...glacierWeaponDefaults];
}
const glacierWeaponState = { prices: loadGlacierWeaponPrices() };
function calculateGlacierWeaponQuote(prices) {
  const voucher = prices[5] === "" ? null : Number(prices[5]);
  const stones = [];
  for (let index = 0; index < 3; index++) {
    const options = [{ cost: prices[index + 1], material: index + 1, quantity: 1, fee: 0, upgrades: 0 }];
    if (index === 0) {
      options.push({ cost: prices[0] * 5, material: 0, quantity: 5, fee: 0, upgrades: 0 });
    } else {
      for (const source of stones[index - 1].sources) {
        options.push({ ...source, cost: source.cost * 5, quantity: source.quantity * 5, fee: source.fee * 5, upgrades: source.upgrades + 1 });
      }
    }
    if (voucher !== null) {
      const fee = [7500, 25000, 100000][index];
      options.push({ cost: voucher * (index + 1) + fee, material: 5, quantity: index + 1, fee, upgrades: 0 });
    }
    const cost = Math.min(...options.map(option => option.cost));
    const sources = options.filter(option => option.cost === cost);
    const methods = sources.map(source => {
      if (source.material === index + 1) return "直接購買";
      if (source.material === 5) return `以 ${source.quantity} 張魏格納商隊兌換證 ＋ ${source.fee.toLocaleString("zh-TW")} Zeny ${source.upgrades ? "兌換後升級" : "兌換"}`;
      const unit = source.material === 0 ? "個" : "顆";
      return `以 ${source.quantity} ${unit}${glacierWeaponMaterials[source.material]}${source.upgrades ? "逐級" : ""}兌換`;
    });
    stones.push({ cost, sources, methods });
  }
  const base = prices[4] * 500 + 150000 * 0.76;
  const totals = glacierWeaponRecipes.map(recipe => base + recipe.counts.reduce((total, count, index) => total + count * stones[index].cost, 0));
  return { base, stones, totals };
}
function calculateGlacierWeaponTotals(prices) {
  return calculateGlacierWeaponQuote(prices).totals;
}
function renderGlacierWeapon() {
  const content = document.querySelector("#tool-content");
  const format = new Intl.NumberFormat("zh-TW");
  content.innerHTML = `
    <form id="glacier-weapon-form" class="tool-form" novalidate>
      <div class="glacier-prices">${glacierWeaponInputOrder.map(index => `
        <label class="field" for="glacier-price-${index}">${glacierWeaponMaterials[index]}
          <input id="glacier-price-${index}" data-price-index="${index}" type="number" min="0" max="1000000000000" step="1" ${index === 5 ? 'placeholder="未填則不使用兌換"' : "required"} value="${glacierWeaponState.prices[index]}">
        </label>`).join("")}</div>
      <div class="actions glacier-actions"><button type="button" id="glacier-reset" class="secondary-button">重設為預設值</button></div>
      <div id="glacier-acquisition" class="glacier-acquisition" aria-live="polite"></div>
      <p id="glacier-base" class="helper glacier-help">基礎費用公式：雪花的花葉單價 × 500 ＋ 150,000 × 0.76</p>
      <div class="glacier-table-scroll" tabindex="0" role="region" aria-label="武器價格比較表，可左右捲動">
        <table class="glacier-table">
          <caption>+ 9 冰晶武器價格</caption>
          <thead><tr><th scope="col">附魔組合</th><th scope="col">基礎費用</th><th scope="col">雪花魔石</th><th scope="col">閃耀雪花魔石</th><th scope="col">耀眼雪花魔石</th><th scope="col">總價</th></tr></thead>
          <tbody>${glacierWeaponRecipes.map((recipe, index) => `<tr><th scope="row">${recipe.name}</th><td><span id="glacier-base-${index}"></span></td>${recipe.counts.map(count => `<td>${count}</td>`).join("")}<td><output id="glacier-total-${index}"></output></td></tr>`).join("")}</tbody>
        </table>
      </div>
    </form>`;
  const form = content.querySelector("form");
  const inputs = [...form.querySelectorAll("[data-price-index]")].sort((a, b) => Number(a.dataset.priceIndex) - Number(b.dataset.priceIndex));
  function update() {
    const valid = inputs.every(input => input.validity.valid);
    inputs.forEach(input => input.setAttribute("aria-invalid", String(!input.validity.valid)));
    const prices = inputs.map((input, index) => index === 5 && input.value === "" ? "" : Number(input.value));
    const quote = valid ? calculateGlacierWeaponQuote(prices) : null;
    const totals = quote?.totals;
    content.querySelector("#glacier-acquisition").innerHTML = glacierWeaponMaterials.slice(1, 4).map((material, index) => {
      const stone = quote?.stones[index];
      return stone
        ? `<div><strong>${material}</strong><span>${stone.methods.join(" ／ ")}${stone.methods.length > 1 ? "（同價）" : ""}</span><b>${format.format(stone.cost)} Zeny／顆</b></div>`
        : `<div><strong>${material}</strong><span>素材單價未填寫或數值不合理，無法計算兌換建議。</span><b>無法計算</b></div>`;
    }).join("");
    glacierWeaponRecipes.forEach((recipe, index) => {
      content.querySelector(`#glacier-base-${index}`).textContent = quote ? format.format(quote.base) : "—";
      content.querySelector(`#glacier-total-${index}`).textContent = totals ? format.format(totals[index]) : "—";
    });
  }
  form.addEventListener("submit", event => event.preventDefault());
  function savePrices() {
    try {
      localStorage.setItem(glacierWeaponPriceKey, JSON.stringify(glacierWeaponState.prices));
    } catch {
      toast("無法保存材料單價，設定僅保留在本次使用。");
    }
  }
  content.querySelector("#glacier-reset").addEventListener("click", () => {
    glacierWeaponState.prices = [...glacierWeaponDefaults];
    inputs.forEach((input, index) => { input.value = glacierWeaponDefaults[index]; });
    savePrices();
    update();
  });
  inputs.forEach((input, index) => input.addEventListener("input", () => {
    const value = index === 5 && input.value === "" ? "" : Number(input.value);
    if (input.validity.valid && validGlacierWeaponPrice(value, index)) {
      glacierWeaponState.prices[index] = value;
      savePrices();
    }
    update();
  }));
  update();
}
