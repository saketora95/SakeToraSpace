"use strict";

// Theme follows the system until the visitor picks one. Each page's <head> applies the
// saved choice before paint; this wires the #theme-toggle button.
(() => {
  const key = "saketora.theme";
  const button = document.querySelector("#theme-toggle");
  const systemDark = () => matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : systemDark();

  function updateButton() {
    if (!button) return;
    const dark = isDark();
    button.setAttribute("aria-label", dark ? "切換為淺色主題" : "切換為深色主題");
    button.textContent = dark ? "☀" : "☾";
  }
  button?.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(key, next); } catch { /* The choice lasts for this visit only. */ }
    updateButton();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateButton);
  updateButton();
})();
