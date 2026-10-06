"use strict";

(() => {
  // BMP uses bottom-up BGR rows padded to multiples of four bytes.
  function encodeBmp({ width, height, data }, threshold = 128) {
    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 255) throw new Error("透明度門檻請輸入 0–255 的整數。");
    const stride = Math.ceil(width * 3 / 4) * 4;
    const size = 54 + stride * height;
    const buffer = new ArrayBuffer(size);
    const view = new DataView(buffer);
    view.setUint16(0, 0x4d42, true);
    view.setUint32(2, size, true);
    view.setUint32(10, 54, true);
    view.setUint32(14, 40, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true);
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(34, stride * height, true);
    const bytes = new Uint8Array(buffer);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const source = (y * width + x) * 4;
        const target = 54 + (height - 1 - y) * stride + x * 3;
        const keep = data[source + 3] >= threshold;
        const r = keep ? data[source] : 255;
        const g = keep ? data[source + 1] : 0;
        const b = keep ? data[source + 2] : 255;
        bytes[target] = b;
        bytes[target + 1] = g;
        bytes[target + 2] = r;
      }
    }
    return { buffer };
  }

  function normalizeThreshold(value) {
    const number = String(value).trim() === "" ? NaN : Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(255, Math.round(number))) : 128;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { encodeBmp, normalizeThreshold };
  if (typeof document === "undefined") return;
  const $ = selector => document.querySelector(selector);
  const fileInput = $("#bmp-file");
  const thresholdInput = $("#bmp-threshold");
  const downloads = [$("#bmp-download-single"), $("#bmp-download-kafra"), $("#bmp-download-zonda")];
  const original = document.createElement("canvas");
  let source = null;
  let output = null;
  let filename = "";
  let revision = 0;

  function updateNavigation() {
    $("#bmp-home-link").hidden = new URLSearchParams(window.location.hash.slice(1)).get("no") === "1";
  }
  updateNavigation();
  window.addEventListener("hashchange", updateNavigation);

  function status(message, error = false) {
    $("#bmp-status").textContent = message;
    $("#bmp-status").dataset.error = String(error);
    $("#bmp-status").hidden = !error;
  }
  function convert() {
    output = null;
    downloads.forEach(button => { button.disabled = true; });
    thresholdInput.value = normalizeThreshold(thresholdInput.value);
    if (!source) return;
    try {
      const converted = encodeBmp(source, Number(thresholdInput.value));
      output = converted.buffer;
      downloads.forEach(button => { button.disabled = false; });
      status(`${filename} · ${source.width} × ${source.height} 像素（原圖尺寸）· 可下載 BMP。`);
    } catch (error) {
      status(error instanceof Error ? error.message : "轉換失敗，請嘗試尺寸較小的圖片。", true);
    }
  }
  thresholdInput.addEventListener("input", convert);
  fileInput.addEventListener("change", async () => {
    const current = ++revision;
    source = null;
    output = null;
    downloads.forEach(button => { button.disabled = true; });
    const file = fileInput.files[0];
    if (!file) return status("請先選擇圖片。");
    if (!(["image/png", "image/webp"].includes(file.type) || (!file.type && /\.(png|webp)$/i.test(file.name)))) {
      return status("請選擇支援透明背景的 PNG 或 WebP 圖片。", true);
    }
    status("正在讀取圖片…");
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      if (current !== revision) return;
      // Bound allocations for the source canvas, RGBA data, and BMP output.
      if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth > 16384 || img.naturalHeight > 16384 || img.naturalWidth * img.naturalHeight > 16000000) {
        throw new Error("圖片過大，請使用不超過 1,600 萬像素且單邊不超過 16,384 像素的圖片。");
      }
      original.width = img.naturalWidth;
      original.height = img.naturalHeight;
      const ctx = original.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      source = ctx.getImageData(0, 0, original.width, original.height);
      filename = file.name;
      convert();
    } catch (error) {
      if (current === revision) status(error instanceof Error ? error.message : "無法讀取圖片，請選擇有效的 PNG 或 WebP 檔案。", true);
    } finally {
      URL.revokeObjectURL(url);
    }
  });
  function downloadFiles(names) {
    if (!output) return;
    const url = URL.createObjectURL(new Blob([output], { type: "image/bmp" }));
    try {
      for (const name of names) {
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
      }
      status(`已送出 ${names.length} 份圖檔的下載請求。${names.length > 1 ? "若未收到全部檔案，請允許瀏覽器下載多個檔案後重試。" : ""}`);
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }
  downloads[0].addEventListener("click", () => downloadFiles([`${filename.replace(/\.[^.]+$/, "") || "image"}_modified.bmp`]));
  downloads[1].addEventListener("click", () => downloadFiles([
    ...Array.from({ length: 9 }, (_, index) => `kafra_${String(index + 1).padStart(2, "0")}.bmp`), "kafra_do01.bmp",
  ]));
  downloads[2].addEventListener("click", () => downloadFiles(["zonda_01.bmp", "zonda_do01.bmp"]));
})();
