"use strict";

(() => {
  const panel = document.getElementById("welcome-panel");
  const closeButton = document.getElementById("welcome-close");
  const restoreButton = document.getElementById("welcome-restore");
  const storageKey = "saketora.simple-replacer.standalone.welcome.dismissed";

  function setDismissed(dismissed) {
    panel.hidden = dismissed;
    restoreButton.hidden = !dismissed;
  }
  function saveDismissed(dismissed) {
    try { localStorage.setItem(storageKey, String(dismissed)); }
    catch { /* Keep the controls usable when browser storage is unavailable. */ }
    setDismissed(dismissed);
  }

  let dismissed = false;
  try { dismissed = localStorage.getItem(storageKey) === "true"; }
  catch { /* Show the welcome message when browser storage is unavailable. */ }
  setDismissed(dismissed);

  closeButton.addEventListener("click", () => {
    saveDismissed(true);
    document.getElementById("replace-input").focus({ preventScroll: true });
  });
  restoreButton.addEventListener("click", () => {
    saveDismissed(false);
    closeButton.focus({ preventScroll: true });
    panel.scrollIntoView({ block: "start" });
  });
})();
