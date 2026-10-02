"use strict";

(() => {
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase().trim();
  const text = value => typeof value === "string" && value.trim().length > 0;
  const valueIsValid = value => value === null || typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
  const dateIsValid = value => value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
  function officialUrlIsValid(value) {
    if (!text(value)) return false;
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
    } catch { return false; }
  }

  // Fail visibly for malformed data, rather than silently omitting records or sources.
  function validateData(data) {
    const errors = [];
    if (!data || data.schemaVersion !== 1) return ["資料格式版本必須為 1。"];
    const collections = ["jobs", "skills", "versions", "announcements", "records"];
    for (const name of collections) {
      if (!Array.isArray(data[name])) errors.push(`${name} 必須為陣列。`);
    }
    if (errors.length) return errors;
    const ids = {};
    for (const name of collections) {
      ids[name] = new Set();
      for (const entry of data[name]) {
        if (!entry || !text(entry.id)) errors.push(`${name} 的每筆資料必須有 id。`);
        else if (ids[name].has(entry.id)) errors.push(`${name} 有重複 id：${entry.id}`);
        else ids[name].add(entry.id);
      }
    }
    if (errors.length) return errors;
    if (!data.meta || typeof data.meta.isDemo !== "boolean" || !text(data.meta.server) ||
        !ids.versions.has(data.meta.currentVersionId) || !dateIsValid(data.meta.updatedAt) || data.meta.updatedAt === null) {
      errors.push("meta 必須設定 isDemo、server、有效的 currentVersionId 及 updatedAt 日期。");
    }
    if (data.meta?.notice !== undefined && typeof data.meta.notice !== "string") errors.push("meta.notice 必須為文字。");
    if (data.meta?.source && (!text(data.meta.source.title) || !officialUrlIsValid(data.meta.source.url) ||
        !officialUrlIsValid(data.meta.source.sectionUrl) || !dateIsValid(data.meta.source.updatedAt) || data.meta.source.updatedAt === null)) {
      errors.push("meta.source 必須有來源標題、文章與職業章節網址、更新日期。");
    }
    const orders = new Set();
    for (const job of data.jobs) {
      if (!text(job.name)) errors.push(`職業 ${job.id} 缺少名稱。`);
    }
    for (const version of data.versions) {
      if (!text(version.name) || !Number.isInteger(version.order) || orders.has(version.order) || !dateIsValid(version.releasedAt)) {
        errors.push(`版本 ${version.id} 必須有名稱、不重複的整數 order 及 releasedAt 日期或 null。`);
      }
      orders.add(version.order);
      if (version.status !== undefined && !["released", "planned"].includes(version.status)) errors.push(`版本 ${version.id} 的 status 不正確。`);
      if (version.status === "planned" && (version.releasedAt !== null || !dateIsValid(version.announcedAt) || version.announcedAt === null ||
          version.id === data.meta?.currentVersionId)) errors.push(`預告版本 ${version.id} 必須有 announcedAt、不得設定實裝日期或作為現行版本。`);
    }
    const skillIds = new Set();
    for (const skill of data.skills) {
      if (!(skill.skillId === null || (Number.isInteger(skill.skillId) && skill.skillId >= 0)) ||
          (skill.skillId !== null && skillIds.has(skill.skillId))) errors.push(`技能 ${skill.id} 的 skillId 必須為不重複的非負整數或 null。`);
      if (skill.skillId !== null) skillIds.add(skill.skillId);
      if (!skill.names || !text(skill.names.zhHant) || ["ko", "en", "ja"].some(key =>
        skill.names[key] !== undefined && skill.names[key] !== null && typeof skill.names[key] !== "string")) errors.push(`技能 ${skill.id} 的多語名稱格式不正確。`);
      if (!Array.isArray(skill.jobIds) || new Set(skill.jobIds).size !== skill.jobIds.length ||
          skill.jobIds.some(id => !ids.jobs.has(id))) errors.push(`技能 ${skill.id} 的 jobIds 必須對應到已存在的職業。`);
    }
    const announcementVersions = new Map();
    for (const announcement of data.announcements) {
      announcementVersions.set(announcement.id, announcement.versionId);
      if (!ids.versions.has(announcement.versionId) || !text(announcement.title) || !dateIsValid(announcement.publishedAt) ||
          !(announcement.url === null || officialUrlIsValid(announcement.url))) errors.push(`公告 ${announcement.id} 的版本、標題、日期或網址格式不正確。`);
    }
    for (const record of data.records) {
      if (!ids.skills.has(record.skillId) || !ids.versions.has(record.versionId)) errors.push(`記錄 ${record.id} 的技能或版本不存在。`);
      if (!Array.isArray(record.announcementIds) || !record.announcementIds.length ||
          new Set(record.announcementIds).size !== record.announcementIds.length || record.announcementIds.some(id =>
            !ids.announcements.has(id) || announcementVersions.get(id) !== record.versionId)) errors.push(`記錄 ${record.id} 必須關聯同版本的公告。`);
      if (!Array.isArray(record.changes) || !record.changes.length || record.changes.some(change =>
        !change || !text(change.item) || !valueIsValid(change.before) || !valueIsValid(change.after) ||
        (change.unit !== undefined && typeof change.unit !== "string") ||
        (change.note !== undefined && typeof change.note !== "string"))) errors.push(`記錄 ${record.id} 的調整項目格式不正確。`);
      if (record.evidence !== undefined && !["article", "player-test"].includes(record.evidence)) errors.push(`記錄 ${record.id} 的 evidence 不正確。`);
    }
    return errors;
  }

  function findSkills(data, { jobId = "", query = "" } = {}) {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    return data.skills.filter(skill => {
      const names = normalize([skill.names.zhHant, skill.names.ko, skill.names.en, skill.names.ja, skill.skillId].join(" "));
      return (!jobId || skill.jobIds.includes(jobId)) && tokens.every(token => names.includes(token));
    });
  }

  function findRecords(data, skillId, versionId = "") {
    const orders = new Map(data.versions.map(version => [version.id, version.order]));
    return data.records.filter(record => record.skillId === skillId && (!versionId || record.versionId === versionId))
      .sort((a, b) => orders.get(b.versionId) - orders.get(a.versionId));
  }

  function formatValue(value, unit = "") {
    return value === null || value === undefined ? "未記載" : `${value}${unit}`;
  }

  const tableColumns = [
    { key: "version", label: "版本", min: 110, max: 320 },
    { key: "item", label: "調整項目", min: 80, max: 240 },
    { key: "before", label: "舊版本資料", min: 104, max: 360 },
    { key: "after", label: "新版本資料", min: 104, max: 360 },
    { key: "note", label: "備註", min: 88, max: 480 },
  ];
  const estimateTextWidth = value => Array.from(String(value)).reduce((width, char) =>
    width + (char.codePointAt(0) >= 0x2e80 ? 13 : 7), 0);

  // Use all visible records to give every table the same content-aware column widths.
  function calculateColumnWidths(data, records, { includeVersion = false, availableWidth = 640 } = {}, measureText = estimateTextWidth) {
    const columns = tableColumns.filter(column => includeVersion || column.key !== "version");
    const preferred = new Map(columns.map(column => [column.key, Math.max(column.min, measureText(column.label) + 16)]));
    const versionMap = new Map(data.versions.map(version => [version.id, version]));
    const grow = (key, width) => preferred.set(key, Math.max(preferred.get(key), width));
    for (const record of records) {
      if (includeVersion) {
        const version = versionMap.get(record.versionId);
        const badgeLabel = version.id === data.meta.currentVersionId ? "現行版本" : version.status === "planned" ? "預告・尚未實裝" : "";
        const badgeWidth = badgeLabel ? measureText(badgeLabel) + 22 : 0;
        grow("version", Math.max(measureText(version.name) + badgeWidth, measureText(version.releasedAt || version.announcedAt || "")) + 16);
      }
      for (const change of record.changes) {
        grow("item", measureText(change.item) + 16);
        grow("before", measureText(formatValue(change.before, change.unit)) + 16);
        grow("after", measureText(formatValue(change.after, change.unit)) + 16);
        grow("note", measureText(change.note || "—") + 16);
      }
    }
    const desired = columns.map(column => Math.min(column.max, preferred.get(column.key)));
    const minimum = columns.reduce((total, column) => total + column.min, 0);
    const totalDesired = desired.reduce((total, width) => total + width, 0);
    const width = Math.max(includeVersion ? 640 : 460, availableWidth, minimum);
    return columns.map((column, index) => {
      // Keep short columns readable; wrap unusually long content instead of letting it consume the table.
      const pixels = width < totalDesired
        ? column.min + (desired[index] - column.min) * (width - minimum) / (totalDesired - minimum)
        : desired[index] * width / totalDesired;
      return { key: column.key, label: column.label, width: Number((pixels / width * 100).toFixed(4)) };
    });
  }

  function mount(root, data) {
    const $ = selector => root.querySelector(selector);
    const errors = validateData(data);
    if (errors.length) {
      $("#skill-result-status").textContent = `無法載入技能資料：${errors.join(" ")}`;
      ["#skill-job", "#skill-query", "#skill-version", "#skill-reset"].forEach(selector => { $(selector).disabled = true; });
      return;
    }
    const state = { jobId: "", query: "", versionId: "", selectedSkillId: "" };
    const jobs = new Map(data.jobs.map(job => [job.id, job]));
    const versions = new Map(data.versions.map(version => [version.id, version]));
    const sortedVersions = [...data.versions].sort((a, b) => b.order - a.order);
    const resultsContainer = $("#skill-results");
    const mergedTableMinWidth = 720;
    let resultsWidth = resultsContainer.getBoundingClientRect().width;
    let mergeVersions = resultsWidth >= mergedTableMinWidth;
    let columnLayout = [];
    const measurement = document.createElement("canvas").getContext("2d");
    if (measurement) measurement.font = `600 13px ${window.getComputedStyle(resultsContainer).fontFamily}`;
    const measureText = measurement ? value => measurement.measureText(String(value)).width : estimateTextWidth;
    const isCurrent = version => version.id === data.meta.currentVersionId;
    const currentBadge = version => isCurrent(version) ? ' <span class="skill-current-badge">現行版本</span>' :
      version.status === "planned" ? ' <span class="skill-planned-badge">預告・尚未實裝</span>' : "";
    const date = value => value ? `<time datetime="${escape(value)}">${escape(value)}</time>` : "";
    const versionDate = version => version.status === "planned" ? `<span class="skill-version-date">公布：${date(version.announcedAt)}</span>` : date(version.releasedAt);
    const jobNames = skill => skill.jobIds.map(id => jobs.get(id).name).join("、") || "(缺少技能所屬職業)";
    const skillIdLabel = skill => skill.skillId === null ? "(缺少技能 ID)" : `ID ${skill.skillId}`;
    function sourceLinks(entries) {
      const linked = entries.filter(entry => entry.url);
      if (!linked.length) return '<p class="skill-pending-source">官方維護公告連結待補。</p>';
      return `<ul class="skill-announcement-links">${linked.map(entry => `<li><a href="${escape(entry.url)}" target="_blank" rel="noopener noreferrer">${escape(entry.title)} ↗<span class="muted">（另開分頁）</span></a>${date(entry.publishedAt)}</li>`).join("")}</ul>`;
    }
    function renderRows(record, includeVersion = false) {
      const version = versions.get(record.versionId);
      return `<tbody data-record="${escape(record.id)}" class="skill-version-rows${isCurrent(version) ? " is-current" : ""}">${record.changes.map((change, index) => `<tr>${includeVersion && index === 0
        ? `<th class="skill-version-cell" scope="rowgroup" rowspan="${record.changes.length}"><div class="skill-version-title"><span>${escape(version.name)}</span>${currentBadge(version)}</div>${versionDate(version)}</th>` : ""}<th scope="row">${escape(change.item)}</th><td>${escape(formatValue(change.before, change.unit))}</td><td class="skill-new-value">${escape(formatValue(change.after, change.unit))}</td><td class="skill-change-note">${escape(change.note || "—")}</td></tr>`).join("")}</tbody>`;
    }
    function renderTable(records, skill, includeVersion = false) {
      const label = `${skill.names.zhHant} ${includeVersion ? "所有版本" : versions.get(records[0].versionId).name}調整表`;
      return `<div class="skill-table-scroll" tabindex="0" role="region" aria-label="${escape(label)}，可橫向捲動">
        <table class="skill-change-table${includeVersion ? " skill-merged-table" : ""}" aria-label="${escape(label)}"><colgroup>${columnLayout.map(column => `<col data-column="${column.key}" style="width:${column.width}%">`).join("")}</colgroup><thead><tr>${columnLayout.map(column => `<th scope="col">${column.label}</th>`).join("")}</tr></thead>${records.map(record => renderRows(record, includeVersion)).join("")}</table>
      </div>`;
    }
    function renderRecord(record, skill) {
      const version = versions.get(record.versionId);
      return `<section class="skill-version-record${isCurrent(version) ? " is-current" : ""}">
        <div class="skill-version-heading"><h4>${escape(version.name)}</h4>${currentBadge(version)}${versionDate(version)}</div>
        ${renderTable([record], skill)}
      </section>`;
    }
    function renderSkill(skill) {
      const records = findRecords(data, skill.id, state.versionId);
      const metadata = [[jobNames(skill), ""], [skillIdLabel(skill), ""],
        ...[["ko", "韓文"], ["ja", "日文"], ["en", "英文"]].map(([key, label]) =>
          text(skill.names[key]) ? [skill.names[key], key] : [`(缺少技能${label}名稱)`, ""])];
      return `<article class="skill-card"><h3>${escape(skill.names.zhHant)}</h3>
        <p class="skill-metadata">${metadata.map(([value, lang]) => `<span${lang ? ` lang="${lang}"` : ""}>${escape(value)}</span>`).join(' <span class="skill-metadata-separator" aria-hidden="true">‧</span> ')}</p>
        ${records.length ? (!state.versionId && mergeVersions ? renderTable(records, skill, true) : records.map(record => renderRecord(record, skill)).join("")) : `<p class="skill-empty">${state.versionId ? "此技能在所選版本未收錄調整記錄。可切換「所有版本」查看歷史。" : "此技能尚未收錄調整記錄。"}</p>`}
      </article>`;
    }
    function renderResults() {
      const candidates = findSkills(data, state);
      const visible = state.selectedSkillId ? candidates.filter(skill => skill.id === state.selectedSkillId) : candidates;
      const records = visible.flatMap(skill => findRecords(data, skill.id, state.versionId));
      columnLayout = calculateColumnWidths(data, records, {
        includeVersion: !state.versionId && mergeVersions,
        availableWidth: resultsWidth - 64,
      }, measureText);
      resultsContainer.innerHTML = visible.length ? visible.map(renderSkill).join("") : '<p class="skill-empty">沒有符合條件的技能。可使用「重設篩選」重新查詢。</p>';
    }
    function render() {
      const candidates = findSkills(data, state);
      if (!candidates.some(skill => skill.id === state.selectedSkillId)) state.selectedSkillId = "";
      const visible = state.selectedSkillId ? candidates.filter(skill => skill.id === state.selectedSkillId) : candidates;
      $("#skill-count").textContent = `${candidates.length} 個`;
      $("#skill-show-all").disabled = !state.selectedSkillId;
      $("#skill-list").innerHTML = candidates.length ? candidates.map(skill => `<button type="button" class="skill-choice" data-skill="${escape(skill.id)}" aria-pressed="${skill.id === state.selectedSkillId}" aria-controls="skill-results"><span>${escape(skill.names.zhHant)}</span><small>${escape(jobNames(skill))} ‧ ${escape(skillIdLabel(skill))}</small></button>`).join("") : '<p class="muted">找不到符合的技能，請調整職業或搜尋文字。</p>';
      const recordCount = visible.reduce((total, skill) => total + findRecords(data, skill.id, state.versionId).length, 0);
      $("#skill-result-status").textContent = `顯示 ${visible.length} 個技能、${recordCount} 筆調整記錄 · ${state.versionId ? versions.get(state.versionId).name : "所有版本"}`;
      renderResults();
      $("#skill-announcement-list").innerHTML = sortedVersions.filter(version => !state.versionId || version.id === state.versionId).map(version =>
        `<section class="skill-announcement-version${isCurrent(version) ? " is-current" : ""}"><div class="skill-version-heading"><h3>${escape(version.name)}</h3>${currentBadge(version)}${versionDate(version)}</div>${sourceLinks(data.announcements.filter(entry => entry.versionId === version.id))}</section>`).join("");
    }
    $("#skill-job").innerHTML = '<option value="">所有職業</option>' + data.jobs.map(job => `<option value="${escape(job.id)}">${escape(job.name)}</option>`).join("");
    $("#skill-version").innerHTML = '<option value="">所有版本</option>' + sortedVersions.map(version => `<option value="${escape(version.id)}">${escape(version.name)}${isCurrent(version) ? "（現行版本）" : version.status === "planned" ? "（預告・尚未實裝）" : ""}</option>`).join("");
    const notice = document.querySelector("#skill-data-notice");
    notice.hidden = !data.meta.isDemo && !data.meta.notice;
    notice.textContent = data.meta.isDemo ? "目前為工具雛形：技能名稱、ID、版本與調整數值皆為示範資料，並非實際遊戲資訊；官方公告連結待補。" : data.meta.notice || "";
    const source = document.querySelector("#skill-source");
    source.hidden = !data.meta.source;
    source.innerHTML = data.meta.source ? `資料來源：<a href="${escape(data.meta.source.sectionUrl)}" target="_blank" rel="noopener noreferrer">${escape(data.meta.source.title)}（職業章節） ↗</a> · <a href="${escape(data.meta.source.url)}" target="_blank" rel="noopener noreferrer">版本索引 ↗</a> · 文章更新：${escape(data.meta.source.updatedAt)}` : "";
    document.querySelector("#skill-current-version").textContent = `${data.meta.server} · 現行版本：${versions.get(data.meta.currentVersionId).name} · 資料更新：${data.meta.updatedAt}`;
    $("#skill-job").addEventListener("change", event => { state.jobId = event.target.value; render(); });
    $("#skill-query").addEventListener("input", event => { state.query = event.target.value; render(); });
    $("#skill-version").addEventListener("change", event => { state.versionId = event.target.value; render(); });
    $("#skill-list").addEventListener("click", event => {
      const button = event.target.closest("button[data-skill]");
      if (!button) return;
      state.selectedSkillId = button.dataset.skill;
      render();
      Array.from($("#skill-list").querySelectorAll("button[data-skill]")).find(item => item.dataset.skill === state.selectedSkillId)?.focus({ preventScroll: true });
    });
    $("#skill-show-all").addEventListener("click", () => {
      state.selectedSkillId = "";
      render();
      $("#skill-list").querySelector("button[data-skill]")?.focus({ preventScroll: true });
    });
    $("#skill-reset").addEventListener("click", () => {
      Object.assign(state, { jobId: "", query: "", versionId: "", selectedSkillId: "" });
      ["#skill-job", "#skill-query", "#skill-version"].forEach(selector => { $(selector).value = ""; });
      render();
      $("#skill-job").focus({ preventScroll: true });
    });
    render();
    function updateTableLayout(width) {
      const next = width >= mergedTableMinWidth;
      if (next === mergeVersions && Math.abs(width - resultsWidth) < 1) return;
      resultsWidth = width;
      mergeVersions = next;
      renderResults();
    }
    if (window.ResizeObserver) {
      const observer = new window.ResizeObserver(entries => {
        const entry = entries.find(item => item.target === resultsContainer);
        if (entry) updateTableLayout(entry.contentRect.width);
      });
      observer.observe(resultsContainer);
    } else {
      window.addEventListener("resize", () => updateTableLayout(resultsContainer.getBoundingClientRect().width));
    }
  }

  window.ragnarokSkillChanges = Object.freeze({ validateData, findSkills, findRecords, formatValue, calculateColumnWidths, mount });
  const root = document.querySelector("#skill-changes-tool");
  if (root) mount(root, window.ragnarokSkillChangeData);
})();
