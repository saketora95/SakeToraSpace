"use strict";

const laboratoryTimers = [
  { label: "第一隻 Boss（進入中心觸發對話後）", duration: 160 },
  { label: "第二隻 Boss（擊殺第一隻 Boss 後）", duration: 80 },
  { label: "第三隻 Boss（擊殺第二隻 Boss 後）", duration: 160 },
].map(item => ({ ...item, state: "idle", deadline: null,
  alarm: { context: null, source: null, gain: null, generation: 0 } }));
let laboratoryInterval = null;

function laboratoryPassword(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const password = (month + day) * 5;
  const bits = password.toString(2).padStart(8, "0");
  const targets = [...bits].reverse().flatMap((bit, index) => bit === "1" ? [index + 1] : []);
  return { date: `${date.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    password, binary: `${bits.slice(0, 4)} ${bits.slice(4)}`, targets: targets.join("、") || "無" };
}
function updateLaboratoryTimers() {
  if (!document.querySelector("#laboratory-timers")) return;
  const today = laboratoryPassword();
  document.querySelector("#laboratory-date").textContent = today.date;
  document.querySelector("#laboratory-password").textContent = today.password;
  document.querySelector("#laboratory-binary").textContent = today.binary;
  document.querySelector("#laboratory-targets").textContent = today.targets;
  laboratoryTimers.forEach((item, index) => {
    const remaining = item.state === "running" ? Math.max(0, Math.ceil((item.deadline - Date.now()) / 1000))
      : item.state === "finished" ? 0 : item.duration;
    if (item.state === "running" && remaining === 0) {
      item.state = "finished";
      item.deadline = null;
      if (item.alarm.gain) item.alarm.gain.gain.setValueAtTime(.2, item.alarm.context.currentTime);
    }
    document.querySelector(`#laboratory-display-${index}`).textContent = formatDuration(remaining);
    document.querySelector(`#laboratory-status-${index}`).textContent = { idle: "準備就緒", running: "計時中", finished: "時間到！" }[item.state];
    document.querySelector(`#laboratory-start-${index}`).disabled = item.state !== "idle";
    document.querySelector(`#laboratory-stop-${index}`).disabled = item.state === "idle";
  });
}
function resetLaboratoryTimer(item) {
  item.state = "idle";
  item.deadline = null;
  stopAlarm(item.alarm);
}
function stopLaboratoryTimers() {
  clearInterval(laboratoryInterval);
  laboratoryInterval = null;
  laboratoryTimers.forEach(resetLaboratoryTimer);
}
function renderLaboratoryTimers() {
  document.querySelector("#tool-content").insertAdjacentHTML("beforeend", `
    <details id="laboratory-timers" class="laboratory-timers">
      <summary>中央實驗室（三王）專用倒數計時</summary>
      <div class="laboratory-content">
        <dl class="laboratory-passwords">
          <div><dt>今日日期</dt><dd id="laboratory-date"></dd></div>
          <div><dt>密碼</dt><dd id="laboratory-password"></dd></div>
          <div><dt>轉換密碼</dt><dd id="laboratory-binary"></dd></div>
          <div><dt>開啟目標</dt><dd id="laboratory-targets"></dd></div>
        </dl>
        <p class="helper laboratory-note">日期取自使用者電腦；若電腦日期或時間設定有誤，密碼可能不正確。<br>開啟目標由右至左編號，第 1 位為最右側。</p>
        ${laboratoryTimers.map((item, index) => `<section class="laboratory-boss" aria-labelledby="laboratory-label-${index}">
          <h3 id="laboratory-label-${index}">${item.label}</h3>
          <div class="laboratory-clock"><output id="laboratory-display-${index}" aria-label="剩餘時間"></output><div class="laboratory-clock-meta"><span class="helper">固定 ${item.duration} 秒</span><span class="helper" id="laboratory-status-${index}" role="status"></span></div></div>
          <div class="actions"><button type="button" id="laboratory-start-${index}" class="primary-button">開始</button><button type="button" id="laboratory-stop-${index}" class="secondary-button">停止</button></div>
        </section>`).join("")}
      </div>
    </details>`);
  laboratoryTimers.forEach((item, index) => {
    document.querySelector(`#laboratory-start-${index}`).addEventListener("click", () => {
      if (item.state !== "idle") return;
      item.state = "running";
      item.deadline = Date.now() + item.duration * 1000;
      void prepareAlarm(item, item.alarm);
      updateLaboratoryTimers();
    });
    document.querySelector(`#laboratory-stop-${index}`).addEventListener("click", () => {
      resetLaboratoryTimer(item);
      updateLaboratoryTimers();
    });
  });
  updateLaboratoryTimers();
  laboratoryInterval = setInterval(updateLaboratoryTimers, 100);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) updateLaboratoryTimers(); });
