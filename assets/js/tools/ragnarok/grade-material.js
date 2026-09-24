"use strict";

// Conversion rules from gradeMaterialCalc.html and its companion script.
const gradeMaterials = [
  { name: "乙太魔石", stones: 0, fee: 100000, grade: "無", quantity: 0, rates: [0, 0, 0] },
  { name: "乙太天藍寶石", stones: 3, fee: 100000, gem: 6000, grade: "N → D", quantity: 5, rates: [10, 20, 70] },
  { name: "乙太黃寶石", stones: 6, fee: 200000, gem: 6000, grade: "D → C", quantity: 5, rates: [0, 20, 60] },
  { name: "乙太紫寶石", stones: 10, fee: 300000, gem: 6000, grade: "C → B", quantity: 5, rates: [0, 0, 50] },
  { name: "乙太琥珀", stones: 15, fee: 500000, gem: 4500, grade: "B → A", quantity: 10, rates: [0, 0, 40] },
];
const gradeStorageKey = "saketora.grade-material.inputs";
const validGradePrice = value => Number.isInteger(value) && value >= 0 && value <= 1000000000;
function loadGradeState() {
  try {
    const saved = JSON.parse(localStorage.getItem(gradeStorageKey));
    return {
      price: validGradePrice(saved?.price) ? saved.price : 20000,
      merchant: typeof saved?.merchant === "boolean" ? saved.merchant : true,
    };
  } catch { return { price: 20000, merchant: true }; }
}
const gradeState = loadGradeState();
function calculateGradeMaterials(price, merchant) {
  const stone = price * 5 + 100000;
  return gradeMaterials.map(material => material.stones
    ? stone * material.stones + material.fee + material.gem * (merchant ? 0.76 : 1)
    : stone);
}
function calculateGradeExpectation(unitPrice, quantity, rate) {
  return rate > 0 ? Math.ceil(unitPrice * quantity * 100 / rate) : null;
}
function renderGradeMaterial() {
  const content = document.querySelector("#tool-content");
  const format = new Intl.NumberFormat("zh-TW");
  const expectedFormat = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });
  content.innerHTML = `
    <form id="grade-form" class="tool-form" novalidate>
      <label class="field" for="grade-price">乙太星塵
        <input id="grade-price" type="text" inputmode="numeric" pattern="[0-9]+" maxlength="10" required value="${gradeState.price}" aria-describedby="grade-status">
      </label>
      <label class="grade-merchant" for="grade-merchant"><input id="grade-merchant" type="checkbox" ${gradeState.merchant ? "checked" : ""}>以「低價買進」購入寶石素材</label>
      <div class="actions reform-actions"><button id="grade-reset" type="button" class="secondary-button">重設為預設值</button></div>
      <div class="reform-table-scroll" tabindex="0" role="region" aria-label="升階素材價格，可左右捲動">
        <table class="reform-table grade-table" aria-label="升階素材單價與升階花費期望值">
          <thead><tr><th scope="col" rowspan="2">乙太寶石</th><th scope="col" rowspan="2">單價</th><th scope="col" rowspan="2">適用階級</th><th scope="colgroup" colspan="3">升階期望值</th></tr>
            <tr><th scope="col">+9</th><th scope="col">+10</th><th scope="col">+11</th></tr></thead>
          <tbody>${gradeMaterials.map((material, index) => `<tr>
            <th scope="row">${material.name}<small class="reform-formula">${index === 0 ? "5 個乙太星塵" : `${material.stones} 個乙太魔石`} ＋ ${format.format(material.fee)} Zeny${index === 0 ? "" : ` ＋ 寶石素材（原價 ${format.format(material.gem)} Zeny）`}</small></th>
            <td><output id="grade-result-${index}"></output></td>
            <td>${material.grade}</td>
            ${material.rates.map((rate, stage) => `<td>${rate ? `<output id="grade-expected-${index}-${stage}"></output><small class="grade-chance">${rate}%・${material.quantity} 顆／次</small>` : '<span aria-label="不適用">—</span>'}</td>`).join("")}
          </tr>`).join("")}</tbody>
        </table>
      </div>
      <p class="helper reform-help">升階期望值＝單價 × 每次顆數 ÷ 成功機率</p>
      <p id="grade-status" class="helper reform-help" role="status"></p>
    </form>`;
  const form = content.querySelector("form");
  const price = content.querySelector("#grade-price");
  const merchant = content.querySelector("#grade-merchant");
  const valid = () => price.value !== "" && price.validity.valid && validGradePrice(Number(price.value));
  function update() {
    const isValid = valid();
    price.setAttribute("aria-invalid", String(!isValid));
    const results = isValid ? calculateGradeMaterials(Number(price.value), merchant.checked) : null;
    gradeMaterials.forEach((material, index) => {
      content.querySelector(`#grade-result-${index}`).textContent = results ? format.format(results[index]) : "無法計算";
      material.rates.forEach((rate, stage) => {
        if (!rate) return;
        content.querySelector(`#grade-expected-${index}-${stage}`).textContent = results
          ? expectedFormat.format(calculateGradeExpectation(results[index], material.quantity, rate)) : "無法計算";
      });
    });
    content.querySelector("#grade-status").textContent = isValid ? "" : "請輸入 0 至 1,000,000,000 的整數單價。";
  }
  function save() {
    try { localStorage.setItem(gradeStorageKey, JSON.stringify(gradeState)); }
    catch { toast("無法保存升階素材設定，設定僅保留在本次使用。"); }
  }
  form.addEventListener("submit", event => event.preventDefault());
  price.addEventListener("input", () => {
    if (valid()) { gradeState.price = Number(price.value); save(); }
    update();
  });
  merchant.addEventListener("change", () => {
    gradeState.merchant = merchant.checked;
    save();
    update();
  });
  content.querySelector("#grade-reset").addEventListener("click", () => {
    gradeState.price = 20000;
    gradeState.merchant = true;
    price.value = gradeState.price;
    merchant.checked = gradeState.merchant;
    save();
    update();
  });
  update();
}
