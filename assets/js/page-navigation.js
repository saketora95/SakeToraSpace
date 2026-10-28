"use strict";

// A floating back-to-top button appears once the page is scrolled and hides again at the top.
(() => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "to-top";
  button.setAttribute("aria-label", "返回頂端");
  button.title = "返回頂端";
  button.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.append(button);

  const sync = () => button.classList.toggle("is-visible", window.scrollY > 200);
  window.addEventListener("scroll", sync, { passive: true });
  sync();

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  });
})();
