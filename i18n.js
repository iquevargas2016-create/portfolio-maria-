// ---------------------------------------------------------
// Simple i18n: translates all elements with a [data-i18n] tag
// into English / Portuguese / Spanish. Content lives in
// content.json (editable via /admin) rather than hardcoded
// here, so text changes never need a code change.
// Auto-detects the visitor's language from their country
// (IP-based), falling back to their browser language, with a
// manual switcher that always wins and is remembered for next
// time.
// ---------------------------------------------------------

(function () {
  var translations = null;
  var STORAGE_KEY = "preferredLang";
  var SUPPORTED = ["en", "pt", "es"];

  // Countries where Spanish is the/a primary language.
  var SPANISH_COUNTRIES = [
    "AR", "ES", "MX", "CO", "CL", "PE", "VE", "EC", "GT", "CU",
    "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "GQ"
  ];

  function countryToLang(countryCode) {
    if (!countryCode) return null;
    var cc = countryCode.toUpperCase();
    if (cc === "BR" || cc === "PT") return "pt";
    if (SPANISH_COUNTRIES.indexOf(cc) !== -1) return "es";
    return "en";
  }

  function browserLangGuess() {
    var raw = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    if (raw.indexOf("pt") === 0) return "pt";
    if (raw.indexOf("es") === 0) return "es";
    return "en";
  }

  function applyLanguage(lang) {
    if (!translations) return; // content.json hasn't loaded yet
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    var dict = translations[lang] || translations.en;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
    });
    window.__currentLang = lang;
  }

  function getSavedLang() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* ignore — private browsing / storage blocked */
    }
  }

  // Manual switcher always wins and is remembered.
  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-lang");
      applyLanguage(lang);
      saveLang(lang);
    });
  });

  // 1) Load the editable content, then apply it: saved preference,
  //    else a quick browser-language guess.
  fetch("/content.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      translations = data;
      var saved = getSavedLang();
      applyLanguage(saved || browserLangGuess());

      // 2) If the visitor hasn't manually chosen a language before,
      //    refine the guess using their country (IP-based geolocation),
      //    in case it's more accurate than their browser/OS setting.
      if (!saved) {
        fetch("https://ipapi.co/json/", { cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (geo) {
            if (!geo || getSavedLang()) return; // a manual choice may have happened meanwhile
            var lang = countryToLang(geo.country_code);
            if (lang) applyLanguage(lang);
          })
          .catch(function () {
            /* geolocation lookup failed/blocked — keep the browser-language guess */
          });
      }
    })
    .catch(function () {
      /* content.json failed to load — page keeps its hardcoded English fallback text */
    });
})();
