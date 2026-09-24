"use strict";

// Conversion rules from reformMaterialCalc.html and its companion script.
const reformLevels = ["下級", "中級", "高級", "頂級"];
const reformFees = [20000, 10000, 20000, 50000];
const reformOreFees = [10000, 20000, 50000, 100000];
// Append new inputs to preserve the indices of previously saved quantities.
const reformDefaults = [50000, 100, 100, 100, 100, 10000];
const reformStorageKey = "saketora.reform-material.inputs";
// Bound totals below Number.MAX_SAFE_INTEGER, including top-tier conversion fees.
function validReformValue(value, index) {
  return Number.isInteger(value) && value >= 0 && value <= (index === 0 || index === 5 ? 1000000000 : 100000);
}
function loadReformValues() {
  try {
    const saved = JSON.parse(localStorage.getItem(reformStorageKey));
    if (Array.isArray(saved)) return reformDefaults.map((value, index) => validReformValue(saved[index], index) ? saved[index] : value);
  } catch { /* Use defaults when local storage is unavailable or corrupt. */ }
  return [...reformDefaults];
}
const reformState = { values: loadReformValues() };
function calculateReformMaterials(price) {
  let previous = price;
  return reformLevels.map((level, index) => {
    const stone = previous * (index === 0 ? 1 : 3) + reformFees[index];
    previous = stone;
    return { stone, ore: (stone - reformOreFees[index]) / 5, metal: 3 ** index };
  });
}
function renderReformMaterial() {
  const content = document.querySelector("#tool-content");
  const format = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 });
  content.innerHTML = `
    <form class="tool-form" id="reform-form" novalidate>
      <div class="reform-prices">
      <label class="field" for="reform-ore-price">影子神秘原石
        <input id="reform-ore-price" data-reform-index="5" type="number" min="0" max="1000000000" step="1" required value="${reformState.values[5]}">
      </label>
      <label class="field" for="reform-price">影子神秘金屬
        <input id="reform-price" data-reform-index="0" type="number" min="0" max="1000000000" step="1" required value="${reformState.values[0]}">
      </label>
      </div>
      <div class="reform-messages">
        <p class="helper reform-help reform-warning">注意：可能有惡意商家以相似名稱或圖示誘導購買錯誤商品，交易前請確認是「影子神秘原石」或「影子神秘金屬」，並核對數量與單價。</p>
        <p class="helper reform-help" id="reform-recommendation" aria-live="polite"></p>
      </div>
      <div class="actions reform-actions"><button type="button" id="reform-reset" class="secondary-button">重設為預設值</button></div>
      <div class="reform-table-scroll" tabindex="0" role="region" aria-label="快速試算，可左右捲動">
        <table class="reform-table reform-quick-table" aria-label="改造素材成本與直接購入上限價格">
          <thead><tr><th scope="col">素材</th><th scope="col">數量</th><th scope="col">合計成本</th><th scope="col">影子神秘金屬數量</th><th scope="col">強化石購入上限</th><th scope="col">強化原石購入上限</th></tr></thead>
          <tbody>${reformLevels.map((level, index) => `<tr>
            <th scope="row">強化石(${level})
              <small class="reform-formula">1 個 ＝ ${index === 0 ? "1 個影子神秘金屬" : `3 個強化石(${reformLevels[index - 1]})`} ＋ ${format.format(reformFees[index])} Zeny</small>
              <small class="reform-formula">1 個 ＝ 5 個強化原石(${level}) ＋ ${format.format(reformOreFees[index])} Zeny</small>
            </th>
            <td><label class="field"><span class="sr-only">強化石(${level})需求數量</span><input data-reform-index="${index + 1}" type="text" inputmode="numeric" pattern="[0-9]+" maxlength="6" required value="${reformState.values[index + 1]}"></label></td>
            <td><output id="reform-total-${index}"></output></td>
            <td><output id="reform-metal-${index}"></output></td>
            <td><output id="reform-stone-${index}"></output></td>
            <td><output id="reform-ore-${index}"></output></td>
          </tr>`).join("")}</tbody>
        </table>
      </div>
      <p class="helper reform-help" id="reform-status" role="status"></p>
    </form>`;
  const form = content.querySelector("form");
  const inputs = [...form.querySelectorAll("[data-reform-index]")].sort((a, b) => Number(a.dataset.reformIndex) - Number(b.dataset.reformIndex));
  const validInput = (input, index) => input.validity.valid && input.value !== "" && validReformValue(Number(input.value), index);
  function update() {
    const valid = inputs.map(validInput);
    inputs.forEach((input, index) => input.setAttribute("aria-invalid", String(!valid[index])));
    const price = Number(inputs[0].value);
    const materials = valid[0] ? calculateReformMaterials(price) : null;
    const show = (id, value) => { content.querySelector(id).textContent = value === null ? "無法計算" : format.format(value); };
    const orePrice = Number(inputs[5].value);
    const synthesisCost = orePrice * 20;
    const recommendation = content.querySelector("#reform-recommendation");
    if (!valid[0] || !valid[5]) {
      recommendation.textContent = "購買建議：請填入有效的原石與金屬單價，才能比較成本。";
    } else {
      const method = price < synthesisCost ? "建議直接購買影子神秘金屬" : price > synthesisCost ? "建議購買影子神秘原石合成" : "直接購買影子神秘金屬與原石合成成本相同，可自由選擇";
      recommendation.textContent = `${method}（金屬 ${format.format(price)} Zeny／個；以 20 個原石合成 1 個金屬，成本 ${format.format(synthesisCost)} Zeny／個）。`;
    }
    reformLevels.forEach((level, index) => {
      const quantity = Number(inputs[index + 1].value);
      show(`#reform-total-${index}`, materials && valid[index + 1] ? materials[index].stone * quantity : null);
      show(`#reform-metal-${index}`, valid[index + 1] ? quantity * 3 ** index : null);
      show(`#reform-stone-${index}`, materials ? materials[index].stone : null);
      show(`#reform-ore-${index}`, materials ? materials[index].ore : null);
    });
    const status = content.querySelector("#reform-status");
    status.textContent = valid.every(Boolean) ? "" : "部分欄位未填寫或數值不合理，相關結果無法計算。";
    status.hidden = valid.every(Boolean);
  }
  function save() {
    try { localStorage.setItem(reformStorageKey, JSON.stringify(reformState.values)); }
    catch { toast("無法保存改造素材設定，設定僅保留在本次使用。"); }
  }
  form.addEventListener("submit", event => event.preventDefault());
  inputs.forEach((input, index) => input.addEventListener("input", () => {
    if (validInput(input, index)) {
      reformState.values[index] = Number(input.value);
      save();
    }
    update();
  }));
  content.querySelector("#reform-reset").addEventListener("click", () => {
    reformState.values = [...reformDefaults];
    inputs.forEach((input, index) => { input.value = reformDefaults[index]; });
    save();
    update();
  });
  update();
}
