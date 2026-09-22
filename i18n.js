// ---------------------------------------------------------
// Simple i18n: translates all elements with a [data-i18n] tag
// into English / Portuguese / Spanish. Auto-detects the visitor's
// language from their country (IP-based), falling back to their
// browser language, with a manual switcher that always wins and
// is remembered for next time.
// ---------------------------------------------------------

(function () {
  var translations = {
    en: {
      skip_link: "Skip to content",
      nav_contact: "Contact",
      nav_projects: "Projects",
      nav_education: "Education",
      eyebrow: "Medical Student",
      institution: "Fundación H. A. Barceló — Buenos Aires, Argentina",
      graduation: "Expected graduation: 2028",
      summary: "Fifth-year medical student interested in electroporation-based cancer treatments and translational research, with a focus on improving electrochemotherapy through experimental research.",
      contact_title: "Contact",
      contact_lead: "Interested in research collaborations, academic opportunities, and professional networking.",
      contact_email_label: "Email",
      contact_phone_label: "Phone",
      contact_location_label: "Location",
      contact_location_value: "Buenos Aires, Argentina",
      projects_title: "Projects & Involvement",
      projects_lead: "Academic, research and volunteer work carried out alongside the medical programme.",
      project1_period: "2026",
      project1_title: "Electrode Needle Degradation and Strategies for Improving Electrode Durability in Electrochemotherapy",
      project1_subtitle: "Student Researcher · Fundación H. A. Barceló — Buenos Aires, Argentina",
      project1_desc: "Investigated electrode degradation during electrochemotherapy and developed strategies to improve electrode durability, treatment reproducibility, and overall therapeutic performance.",
      tag1: "Electroporation",
      tag2: "Electrochemotherapy",
      tag3: "Electrode Degradation",
      tag4: "Biomedical Engineering",
      education_title: "Education",
      edu1_period: "2022 — 2028 (expected)",
      edu1_degree: "Medical Student — 5th Year",
      edu1_subtitle: "Fundación H. A. Barceló — Instituto Universitario de Ciencias de la Salud · Buenos Aires, Argentina",
      edu1_desc: "Undergraduate medical program with integrated clinical training, hospital rotations, and a strong emphasis on research and evidence-based medicine.",
      languages_title: "Languages",
      lang_pt_name: "Portuguese",
      lang_pt_level: "Native",
      lang_es_name: "Spanish",
      lang_es_level: "Fluent",
      lang_en_name: "English",
      lang_en_level: "Professional Working Proficiency",
      footer_location: "Buenos Aires, Argentina"
    },
    pt: {
      skip_link: "Pular para o conteúdo",
      nav_contact: "Contato",
      nav_projects: "Projetos",
      nav_education: "Formação",
      eyebrow: "Estudante de Medicina",
      institution: "Fundación H. A. Barceló — Buenos Aires, Argentina",
      graduation: "Formatura prevista: 2028",
      summary: "Estudante de Medicina do quinto ano, com interesse em tratamentos oncológicos baseados em eletroporação e pesquisa translacional, com foco no aprimoramento da eletroquimioterapia por meio de pesquisa experimental.",
      contact_title: "Contato",
      contact_lead: "Interessada em colaborações de pesquisa, oportunidades acadêmicas e networking profissional.",
      contact_email_label: "Email",
      contact_phone_label: "Telefone",
      contact_location_label: "Localização",
      contact_location_value: "Buenos Aires, Argentina",
      projects_title: "Projetos e Atuação",
      projects_lead: "Trabalhos acadêmicos, de pesquisa e voluntariado realizados ao longo da graduação em Medicina.",
      project1_period: "2026",
      project1_title: "Degradação de Eletrodos e Estratégias para Melhorar a Durabilidade de Eletrodos em Eletroquimioterapia",
      project1_subtitle: "Pesquisadora Discente · Fundación H. A. Barceló — Buenos Aires, Argentina",
      project1_desc: "Investigação da degradação de eletrodos durante a eletroquimioterapia, com desenvolvimento de estratégias para melhorar a durabilidade dos eletrodos, a reprodutibilidade do tratamento e o desempenho terapêutico geral.",
      tag1: "Eletroporação",
      tag2: "Eletroquimioterapia",
      tag3: "Degradação de Eletrodos",
      tag4: "Engenharia Biomédica",
      education_title: "Formação",
      edu1_period: "2022 — 2028 (previsto)",
      edu1_degree: "Estudante de Medicina — 5º Ano",
      edu1_subtitle: "Fundación H. A. Barceló — Instituto Universitario de Ciencias de la Salud · Buenos Aires, Argentina",
      edu1_desc: "Graduação em Medicina com formação clínica integrada, estágios hospitalares e forte ênfase em pesquisa e medicina baseada em evidências.",
      languages_title: "Idiomas",
      lang_pt_name: "Português",
      lang_pt_level: "Nativo",
      lang_es_name: "Espanhol",
      lang_es_level: "Fluente",
      lang_en_name: "Inglês",
      lang_en_level: "Proficiência Profissional",
      footer_location: "Buenos Aires, Argentina"
    },
    es: {
      skip_link: "Saltar al contenido",
      nav_contact: "Contacto",
      nav_projects: "Proyectos",
      nav_education: "Formación",
      eyebrow: "Estudiante de Medicina",
      institution: "Fundación H. A. Barceló — Buenos Aires, Argentina",
      graduation: "Graduación prevista: 2028",
      summary: "Estudiante de quinto año de Medicina interesada en tratamientos oncológicos basados en electroporación e investigación traslacional, con foco en mejorar la electroquimioterapia mediante investigación experimental.",
      contact_title: "Contacto",
      contact_lead: "Interesada en colaboraciones de investigación, oportunidades académicas y networking profesional.",
      contact_email_label: "Correo electrónico",
      contact_phone_label: "Teléfono",
      contact_location_label: "Ubicación",
      contact_location_value: "Buenos Aires, Argentina",
      projects_title: "Proyectos y Participación",
      projects_lead: "Trabajos académicos, de investigación y voluntariado realizados junto con la carrera de Medicina.",
      project1_period: "2026",
      project1_title: "Degradación de Electrodos y Estrategias para Mejorar la Durabilidad de Electrodos en Electroquimioterapia",
      project1_subtitle: "Investigadora Estudiante · Fundación H. A. Barceló — Buenos Aires, Argentina",
      project1_desc: "Investigación de la degradación de electrodos durante la electroquimioterapia y desarrollo de estrategias para mejorar la durabilidad de los electrodos, la reproducibilidad del tratamiento y el rendimiento terapéutico general.",
      tag1: "Electroporación",
      tag2: "Electroquimioterapia",
      tag3: "Degradación de Electrodos",
      tag4: "Ingeniería Biomédica",
      education_title: "Formación",
      edu1_period: "2022 — 2028 (previsto)",
      edu1_degree: "Estudiante de Medicina — 5.º Año",
      edu1_subtitle: "Fundación H. A. Barceló — Instituto Universitario de Ciencias de la Salud · Buenos Aires, Argentina",
      edu1_desc: "Programa de grado en Medicina con formación clínica integrada, rotaciones hospitalarias y fuerte énfasis en investigación y medicina basada en evidencia.",
      languages_title: "Idiomas",
      lang_pt_name: "Portugués",
      lang_pt_level: "Nativo",
      lang_es_name: "Español",
      lang_es_level: "Fluido",
      lang_en_name: "Inglés",
      lang_en_level: "Competencia Profesional",
      footer_location: "Buenos Aires, Argentina"
    }
  };

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
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    var dict = translations[lang];
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

  // 1) Apply immediately: saved preference, else a quick browser-language
  //    guess, so there's no flash of the wrong language while we wait
  //    on the network for country detection.
  var saved = getSavedLang();
  applyLanguage(saved || browserLangGuess());

  // 2) If the visitor hasn't manually chosen a language before, refine
  //    the guess using their country (IP-based geolocation), in case
  //    it's more accurate than their browser/OS language setting.
  if (!saved) {
    fetch("https://ipapi.co/json/", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || getSavedLang()) return; // a manual choice may have happened meanwhile
        var lang = countryToLang(data.country_code);
        if (lang) applyLanguage(lang);
      })
      .catch(function () {
        /* geolocation lookup failed/blocked — keep the browser-language guess */
      });
  }

  // 3) Manual switcher always wins and is remembered.
  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-lang");
      applyLanguage(lang);
      saveLang(lang);
    });
  });
})();
