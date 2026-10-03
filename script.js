// Preserve native anchor URLs and keyboard navigation. CSS handles smooth
// scrolling and honors reduced-motion preferences.
(function () {
  var header = document.querySelector(".site-header");
  function updateHeaderHeight() {
    if (header) document.documentElement.style.setProperty("--header-height", header.getBoundingClientRect().height + "px");
  }
  updateHeaderHeight();
  if (header && "ResizeObserver" in window) {
    new ResizeObserver(updateHeaderHeight).observe(header);
  } else {
    window.addEventListener("resize", updateHeaderHeight);
  }

  function track(name, data) {
    if (typeof window.va === "function") {
      window.va("event", data ? { name: name, data: data } : { name: name });
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (link) {
      var href = link.getAttribute("href") || "";
      if (href.indexOf("mailto:") === 0) track("contact_email_click");
      if (href.indexOf("tel:") === 0) track("contact_phone_click");
      if (link.closest(".hero-actions") && href === "#projects") track("research_click");
    }
    var languageButton = event.target.closest(".lang-btn");
    if (languageButton) track("language_switch", { lang: languageButton.getAttribute("data-lang") });
  });
})();
