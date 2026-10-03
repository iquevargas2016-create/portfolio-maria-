// ---------------------------------------------------------
// Simple i18n: translates all elements with a [data-i18n] tag
// into English / Portuguese / Spanish. Content lives in
// content.json (editable via /admin) rather than hardcoded
// here, so text changes never need a code change.
//
// content.json also carries a "collections" object — repeatable
// lists (projects, publications, certificates, education, and any
// custom sections/"topics" Maria creates) that she can add to or
// remove from over time via the admin panel, without ever touching
// code. Each collection is rendered here from scratch on every
// language change.
//
// Uses the visitor’s saved preference or browser language.
// A manual choice is remembered without changing language mid-read.
// ---------------------------------------------------------

(function () {
  var translations = null;
  var collections = null;
  var STORAGE_KEY = "preferredLang";
  var SUPPORTED = ["en", "pt", "es"];

  function browserLangGuess() {
    var raw = ((navigator.languages && navigator.languages[0]) || navigator.language || "en").toLowerCase();
    if (raw.indexOf("pt") === 0) return "pt";
    if (raw.indexOf("es") === 0) return "es";
    return "en";
  }

  // Pulls a translated value out of a { en, pt, es } object, falling
  // back to English, then to whatever language is present, then "".
  function pick(field, lang) {
    if (!field || typeof field !== "object") return "";
    if (typeof field[lang] === "string" && field[lang]) return field[lang];
    if (typeof field.en === "string" && field.en) return field.en;
    for (var i = 0; i < SUPPORTED.length; i++) {
      if (typeof field[SUPPORTED[i]] === "string" && field[SUPPORTED[i]]) return field[SUPPORTED[i]];
    }
    return "";
  }

  function pickList(field, lang) {
    if (!field || typeof field !== "object") return [];
    if (Array.isArray(field[lang])) return field[lang];
    if (Array.isArray(field.en)) return field.en;
    for (var i = 0; i < SUPPORTED.length; i++) {
      if (Array.isArray(field[SUPPORTED[i]])) return field[SUPPORTED[i]];
    }
    return [];
  }

  // Curated catalog of languages Maria can pick from in the admin panel,
  // with the display name already translated for all 3 site languages —
  // no translation call needed for these, just a lookup.
  var LANGUAGE_NAMES = {
    pt: { en: "Portuguese", pt: "Português", es: "Portugués" },
    es: { en: "Spanish", pt: "Espanhol", es: "Español" },
    en: { en: "English", pt: "Inglês", es: "Inglés" },
    it: { en: "Italian", pt: "Italiano", es: "Italiano" },
    fr: { en: "French", pt: "Francês", es: "Francés" },
    de: { en: "German", pt: "Alemão", es: "Alemán" }
  };
  var LEVEL_LABELS = {
    native: { en: "Native", pt: "Nativo", es: "Nativo" },
    fluent: { en: "Fluent", pt: "Fluente", es: "Fluido" },
    advanced: { en: "Advanced", pt: "Avançado", es: "Avanzado" },
    intermediate: { en: "Intermediate", pt: "Intermediário", es: "Intermedio" },
    basic: { en: "Basic", pt: "Básico", es: "Básico" }
  };

  function renderLanguages(lang) {
    var container = document.getElementById("languages-list");
    if (!container || !collections) return;
    container.innerHTML = "";
    (collections.languages || []).forEach(function (entry) {
      if (!entry) return;
      var li = el("li", "language-item");
      var nameText = entry.code === "other"
        ? pick(entry.name, lang)
        : (LANGUAGE_NAMES[entry.code] && LANGUAGE_NAMES[entry.code][lang]) || entry.code;
      var levelText = (LEVEL_LABELS[entry.level] && LEVEL_LABELS[entry.level][lang]) || entry.level || "";
      li.appendChild(el("span", "language-name", nameText));
      li.appendChild(el("span", "language-level", levelText));
      container.appendChild(li);
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null && text !== "") node.textContent = text;
    return node;
  }

  // Builds one .project-card <li> used for all three collection
  // types (projects, publications, certificates) — same visual
  // language, different fields populated depending on what the
  // item has.
  function buildCard(item, lang, opts) {
    var li = el("li", "project-card");

    var periodText = (item && (item.period || item.year || item.date)) || "";
    if (periodText) li.appendChild(el("span", "project-period", periodText));

    var fullTitle = pick(item && item.title, lang);
    var titleText = pick(item && item.display_title, lang) || fullTitle;
    if (titleText) li.appendChild(el("h3", "project-title", titleText));

    var subtitleText = pick(item && (item.subtitle || item.venue || item.issuer), lang);
    if (subtitleText) li.appendChild(el("p", "project-subtitle", subtitleText));

    var descText = pick(item && item.desc, lang);
    if (descText) li.appendChild(el("p", "project-desc", descText));

    if (fullTitle && titleText !== fullTitle) {
      var details = el("details", "project-details");
      var label = translations && translations[lang] && translations[lang].project_full_title_label;
      details.appendChild(el("summary", "", label || "Full academic title"));
      details.appendChild(el("p", "project-full-title", fullTitle));
      li.appendChild(details);
    }

    var tags = pickList(item && item.tags, lang);
    if (tags.length) {
      var tagList = el("ul", "tag-list");
      tags.forEach(function (t) {
        if (t) tagList.appendChild(el("li", "tag", t));
      });
      li.appendChild(tagList);
    }

    if (item && item.link) {
      var linkRow = el("div", "project-link-row");
      var a = document.createElement("a");
      a.className = "project-link";
      a.href = item.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = (opts && opts.linkLabel) || "View";
      linkRow.appendChild(a);
      li.appendChild(linkRow);
    }

    return li;
  }

  // `hideTargetId` is the element to hide entirely while `items` is empty
  // (e.g. the "Certificates" block nested inside Education) — pass null
  // for a list that should always stay visible (Projects, Education).
  function renderList(containerId, hideTargetId, items, lang, opts) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    (items || []).forEach(function (item) {
      container.appendChild(buildCard(item, lang, opts));
    });

    if (hideTargetId) {
      var hideTarget = document.getElementById(hideTargetId);
      if (hideTarget) hideTarget.hidden = !items || items.length === 0;
    }
  }

  // Education entries use a visually distinct card (no top border/
  // shadow/tag pills — see .education-item in styles.css) rather than
  // the .project-card look, so they get their own small builder.
  function buildEducationCard(item, lang) {
    var li = el("li", "education-item");

    var periodText = (item && item.period) || "";
    if (periodText) li.appendChild(el("span", "project-period", periodText));

    var titleText = pick(item && item.title, lang);
    if (titleText) li.appendChild(el("h3", "education-degree", titleText));

    var subtitleText = pick(item && item.subtitle, lang);
    if (subtitleText) li.appendChild(el("p", "project-subtitle", subtitleText));

    var descText = pick(item && item.desc, lang);
    if (descText) li.appendChild(el("p", "project-desc", descText));

    return li;
  }

  function renderEducationList(lang) {
    var container = document.getElementById("education-list");
    if (!container) return;
    container.innerHTML = "";
    ((collections && collections.education) || []).forEach(function (item) {
      container.appendChild(buildEducationCard(item, lang));
    });
  }

  function renderCollections(lang) {
    if (!collections) return;
    var linkLabel = translations && translations[lang] && translations[lang].credential_link_label;
    var dict = translations[lang] || translations.en;
    renderList("projects-list", null, collections.projects, lang, { linkLabel: dict.project_link_label });
    renderEducationList(lang);
    // Certificates and Publications now live inside the Education section
    // as sub-blocks that only appear once Maria has added at least one item.
    renderList("certificates-list", "education-certificates-block", collections.certificates, lang, { linkLabel: linkLabel });
    renderList("publications-list", "education-publications-block", collections.publications, lang, { linkLabel: dict.publication_link_label });
    renderLanguages(lang);
  }

  // Builds one full <section> for a Maria-created custom "topic" —
  // its own heading, optional lead text, and a card grid of items
  // (same card shape as projects/publications/certificates).
  function buildCustomSection(sectionData, lang, index, opts) {
    var section = el("section", "section" + (index % 2 === 0 ? " section-alt" : ""));
    section.id = "custom-section-" + index;

    var container = el("div", "container");

    var titleText = pick(sectionData && sectionData.title, lang);
    if (titleText) container.appendChild(el("h2", "section-title", titleText));

    var leadText = pick(sectionData && sectionData.lead, lang);
    if (leadText) container.appendChild(el("p", "section-lead", leadText));

    var list = el("ul", "project-grid");
    ((sectionData && sectionData.items) || []).forEach(function (item) {
      list.appendChild(buildCard(item, lang, opts));
    });
    container.appendChild(list);

    section.appendChild(container);
    return section;
  }

  // Renders every custom section Maria has created via the admin
  // panel. A section only appears once it has at least one item, so
  // she can create and fill in a new topic without it going live
  // half-finished. These are not linked from the nav menu above,
  // since the list can grow to any number of topics.
  function renderCustomSections(lang) {
    var root = document.getElementById("custom-sections-container");
    if (!root) return;
    root.innerHTML = "";
    if (!collections || !Array.isArray(collections.custom_sections)) return;

    var linkLabel = translations && translations[lang] && translations[lang].credential_link_label;
    var visibleIndex = 0;
    collections.custom_sections.forEach(function (sectionData) {
      var items = (sectionData && sectionData.items) || [];
      if (!items.length) return; // hide incomplete/empty topics
      root.appendChild(buildCustomSection(sectionData, lang, visibleIndex, { linkLabel: linkLabel }));
      visibleIndex++;
    });
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
    document.querySelectorAll("[data-i18n-aria]").forEach(function (node) {
      var label = dict[node.getAttribute("data-i18n-aria")];
      if (label) node.setAttribute("aria-label", label);
    });
    var title = "Maria Eduarda Miranda — " + dict.eyebrow + " | Fundación H. A. Barceló";
    var description = "Maria Eduarda Miranda. " + dict.summary;
    document.title = title;
    ["meta[name='description']", "meta[property='og:description']", "meta[name='twitter:description']"].forEach(function (selector) {
      var meta = document.querySelector(selector);
      if (meta) meta.setAttribute("content", description);
    });
    ["meta[property='og:title']", "meta[name='twitter:title']"].forEach(function (selector) {
      var meta = document.querySelector(selector);
      if (meta) meta.setAttribute("content", title);
    });
    var locale = document.querySelector("meta[property='og:locale']");
    if (locale) locale.setAttribute("content", { en: "en_US", pt: "pt_BR", es: "es_AR" }[lang]);
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    // Email/phone are editable values (same across languages), so the
    // link targets are kept in sync with whatever the admin panel saved.
    var emailLink = document.getElementById("contact-email-link");
    if (emailLink && dict.contact_email_value) {
      emailLink.href = "mailto:" + dict.contact_email_value;
    }
    var phoneLink = document.getElementById("contact-phone-link");
    if (phoneLink && dict.contact_phone_value) {
      var telDigits = dict.contact_phone_value.replace(/[^\d+]/g, "");
      phoneLink.href = "tel:" + telDigits;
    }

    renderCollections(lang);
    renderCustomSections(lang);
    window.__currentLang = lang;
  }

  function getSavedLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.indexOf(saved) !== -1 ? saved : null;
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
      collections = data.collections || { projects: [], publications: [], certificates: [], education: [], custom_sections: [], languages: [] };
      var saved = getSavedLang();
      applyLanguage(saved || browserLangGuess());


    })
    .catch(function () {
      /* content.json failed to load — page keeps its hardcoded English fallback text */
    });
})();
