"use strict";

// Delegated, so back-to-top buttons rendered later (such as in data sections) work too.
document.addEventListener("click", event => {
  if (!event.target.closest("[data-to-top]")) return;
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
});
