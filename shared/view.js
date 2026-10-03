(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Portfolio = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Change only when intentionally re-enabling assistant controls.
  const FEATURES = Object.freeze({ assistantUI: false });
  const LANGS = ['pt', 'en', 'es'];
  const NAME = 'Maria Eduarda Miranda';
  const ORIGIN = 'https://mariamirandamd.com';
  const UI = {
    pt: {
      cv: 'Currículo', cvTitle: 'Currículo acadêmico', print: 'Imprimir / salvar em PDF',
      back: 'Voltar ao perfil', details: 'Conhecer a pesquisa', overview: 'Sobre a pesquisa',
      share: 'Compartilhar', copy: 'Copiar email', copied: 'Copiado.', failed: 'Não foi possível copiar. Selecione o texto para copiar.',
      saved: 'Salvar contato', card: 'Cartão profissional', cardLead: 'Meu perfil, currículo e contato em um só lugar.',
      start: 'Envie uma mensagem', research: 'Colaboração científica', academic: 'Oportunidade acadêmica', professional: 'Contato profissional',
      name: 'Seu nome', organization: 'Instituição (opcional)', message: 'Mensagem', compose: 'Enviar mensagem',
      inboxHint: 'Seus dados serão usados para responder à sua mensagem e mantidos no painel privado por até 90 dias.', contactHint: 'Seus dados serão usados para responder à sua mensagem.',
      greeting: 'Olá, Maria!', from: 'Nome', org: 'Instituição', copiedLink: 'Link copiado.',
      offline: 'Você está offline. As páginas salvas continuam disponíveis.',
      online: 'Conexão restabelecida.', install: 'Salvar no dispositivo', updated: 'Novo conteúdo disponível. Recarregue para atualizar.',
      areas: 'Temas', profile: 'Perfil', external: 'Abrir referência', preview: 'Prévia do rascunho', noProject: 'Pesquisa não encontrada.'
    },
    en: {
      cv: 'CV', cvTitle: 'Academic CV', print: 'Print / save as PDF', back: 'Back to profile', details: 'Explore the research', overview: 'About the research',
      share: 'Share', copy: 'Copy email', copied: 'Copied.', failed: 'Could not copy. Select the text to copy it.',
      saved: 'Save contact', card: 'Professional card', cardLead: 'My profile, CV and contact details in one place.',
      start: 'Send a message', research: 'Research collaboration', academic: 'Academic opportunity', professional: 'Professional connection',
      name: 'Your name', organization: 'Institution (optional)', message: 'Message', compose: 'Send message',
      inboxHint: 'Your details will be used to reply to your message and kept in the private dashboard for up to 90 days.', contactHint: 'Your details will be used to reply to your message.', greeting: 'Hello, Maria!', from: 'Name', org: 'Institution',
      copiedLink: 'Link copied.', offline: 'You are offline. Saved pages are still available.', online: 'You are back online.',
      install: 'Save to device', updated: 'New content available. Reload to update.', areas: 'Topics', profile: 'Profile', external: 'Open reference', preview: 'Draft preview', noProject: 'Research not found.'
    },
    es: {
      cv: 'Currículum', cvTitle: 'Currículum académico', print: 'Imprimir / guardar como PDF', back: 'Volver al perfil', details: 'Conocer la investigación', overview: 'Sobre la investigación',
      share: 'Compartir', copy: 'Copiar email', copied: 'Copiado.', failed: 'No se pudo copiar. Selecciona el texto para copiarlo.',
      saved: 'Guardar contacto', card: 'Tarjeta profesional', cardLead: 'Mi perfil, currículum y contacto en un solo lugar.',
      start: 'Envía un mensaje', research: 'Colaboración científica', academic: 'Oportunidad académica', professional: 'Contacto profesional',
      name: 'Tu nombre', organization: 'Institución (opcional)', message: 'Mensaje', compose: 'Enviar mensaje',
      inboxHint: 'Tus datos se utilizarán para responder a tu mensaje y se conservarán en el panel privado hasta 90 días.', contactHint: 'Tus datos se utilizarán para responder a tu mensaje.', greeting: '¡Hola, Maria!', from: 'Nombre', org: 'Institución',
      copiedLink: 'Enlace copiado.', offline: 'Sin conexión. Las páginas guardadas siguen disponibles.', online: 'Conexión restablecida.',
      install: 'Guardar en el dispositivo', updated: 'Hay contenido nuevo. Recarga para actualizar.', areas: 'Temas', profile: 'Perfil', external: 'Abrir referencia', preview: 'Vista previa del borrador', noProject: 'Investigación no encontrada.'
    }
  };
  const TOOLS_UI = {
    pt: { focus: 'Currículo para sua oportunidade', focusHelp: 'Escolha um foco e as experiências que deseja incluir. O conteúdo permanece fiel ao perfil.', all: 'Perfil completo', research: 'Pesquisa', academic: 'Pós-graduação', professional: 'Colaboração', search: 'Buscar nas pesquisas', theme: 'Todos os temas', empty: 'Nenhuma pesquisa encontrada.', shareItem: 'Copiar link desta experiência', event: 'Perfil para congressos', qr: 'Baixar QR code', subject: 'Tema da colaboração', program: 'Programa ou oportunidade', deadline: 'Prazo (opcional)', include: 'Incluir no currículo' },
    en: { focus: 'A CV for your opportunity', focusHelp: 'Choose a focus and the experiences to include. All content comes from the profile.', all: 'Full profile', research: 'Research', academic: 'Graduate study', professional: 'Collaboration', search: 'Search research', theme: 'All topics', empty: 'No research found.', shareItem: 'Copy link to this experience', event: 'Conference profile', qr: 'Download QR code', subject: 'Collaboration topic', program: 'Program or opportunity', deadline: 'Deadline (optional)', include: 'Include in CV' },
    es: { focus: 'Currículum para tu oportunidad', focusHelp: 'Elige un enfoque y las experiencias que deseas incluir. El contenido proviene del perfil.', all: 'Perfil completo', research: 'Investigación', academic: 'Posgrado', professional: 'Colaboración', search: 'Buscar investigaciones', theme: 'Todos los temas', empty: 'No se encontraron investigaciones.', shareItem: 'Copiar enlace de esta experiencia', event: 'Perfil para congresos', qr: 'Descargar código QR', subject: 'Tema de colaboración', program: 'Programa u oportunidad', deadline: 'Plazo (opcional)', include: 'Incluir en el currículum' }
  };
  for (const lang of LANGS) Object.assign(UI[lang], TOOLS_UI[lang]);
  const CONTACT_UI = {
    pt: { topic: 'Tipo de contato', replyEmail: 'Seu email', loading: 'Preparando o envio…', sending: 'Enviando…', sent: 'Mensagem enviada. Obrigada pelo contato!', unavailable: 'O envio pelo site ainda não está disponível. Você pode usar o email informado acima.', failed: 'Não foi possível confirmar o envio. Seu texto foi preservado; tente novamente.', verify: 'Conclua a verificação para enviar.', offlineSend: 'Conecte-se à internet para enviar. Seu texto continua aqui.', demoSend: 'Prévia de edição: o envio fica disponível na página do site após a configuração.', retry: 'Tentar carregar novamente', rate: 'Muitas tentativas. Aguarde alguns minutos antes de enviar novamente.' },
    en: { topic: 'Type of enquiry', replyEmail: 'Your email', loading: 'Preparing the form…', sending: 'Sending…', sent: 'Message sent. Thank you for getting in touch!', unavailable: 'Sending from the website is not available yet. You can use the email address above.', failed: 'We could not confirm sending. Your text has been kept; please try again.', verify: 'Complete the verification to send.', offlineSend: 'Connect to the internet to send. Your text is still here.', demoSend: 'Editor preview: sending is available on the website once configured.', retry: 'Try loading again', rate: 'Too many attempts. Please wait a few minutes before trying again.' },
    es: { topic: 'Tipo de contacto', replyEmail: 'Tu email', loading: 'Preparando el envío…', sending: 'Enviando…', sent: 'Mensaje enviado. ¡Gracias por contactarme!', unavailable: 'El envío desde el sitio aún no está disponible. Puedes usar el email indicado arriba.', failed: 'No pudimos confirmar el envío. Tu texto se ha conservado; vuelve a intentarlo.', verify: 'Completa la verificación para enviar.', offlineSend: 'Conéctate a internet para enviar. Tu texto sigue aquí.', demoSend: 'Vista previa de edición: el envío estará disponible en el sitio cuando esté configurado.', retry: 'Volver a cargar', rate: 'Demasiados intentos. Espera unos minutos antes de volver a enviar.' }
  };
  for (const lang of LANGS) Object.assign(UI[lang], CONTACT_UI[lang]);
  const LANGUAGE_NAMES = {
    pt: { pt: 'Português', en: 'Inglês', es: 'Espanhol', fr: 'Francês', it: 'Italiano', de: 'Alemão' },
    en: { pt: 'Portuguese', en: 'English', es: 'Spanish', fr: 'French', it: 'Italian', de: 'German' },
    es: { pt: 'Portugués', en: 'Inglés', es: 'Español', fr: 'Francés', it: 'Italiano', de: 'Alemán' }
  };
  const LEVELS = {
    pt: { native: 'Nativo', fluent: 'Fluente', advanced: 'Avançado', intermediate: 'Intermediário', basic: 'Básico' },
    en: { native: 'Native', fluent: 'Fluent', advanced: 'Advanced', intermediate: 'Intermediate', basic: 'Basic' },
    es: { native: 'Nativo', fluent: 'Fluido', advanced: 'Avanzado', intermediate: 'Intermedio', basic: 'Básico' }
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const text = (value, lang) => typeof value === 'string' ? value : value?.[lang] || value?.en || value?.pt || value?.es || '';
  const slugify = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const projectSlug = (item, index = 0) => item.slug || item.id || `${slugify(text(item.display_title || item.title, 'en')) || 'research'}-${index + 1}`;
  const researchPath = lang => ({ pt: 'pesquisa', en: 'research', es: 'investigacion' })[lang];
  function pathFor(lang, type = 'home', slug = '') {
    if (type === 'project') return `/${lang}/${researchPath(lang)}/${encodeURIComponent(slug)}/`;
    return `/${lang}/${type === 'cv' ? 'cv/' : type === 'card' ? 'card/' : type === 'event' ? 'congress/' : ''}`;
  }
  function safeURL(value) {
    try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; }
    catch { return ''; }
  }
  const emailAddress = value => /^[^\s<>@?&#]+@[^\s<>@?&#]+\.[^\s<>@?&#]+$/.test(value || '') ? value : '';
  const phoneNumber = value => String(value || '').replace(/[^+0-9]/g, '');
  function tags(item, lang) {
    const list = item.tags?.[lang] || item.tags?.en || [];
    return list.length ? `<ul class="tag-list">${list.map(t => `<li class="tag">${escape(t)}</li>`).join('')}</ul>` : '';
  }
  function itemsHTML(items, lang, kind, { cv = false } = {}) {
    const u = UI[lang];
    return (items || []).map((item, index) => {
      const title = text(cv ? item.title : item.display_title || item.title, lang);
      const url = safeURL(item.link);
      const anchor = `${kind}-${slugify(item.id || title) || index}`;
      return `<li id="${escape(anchor)}" data-experience="${kind}" class="${kind === 'education' ? 'education-item' : 'project-card'}">
        <span class="project-period">${escape(item.period || item.year || item.date)}</span>
        <h3 class="${kind === 'education' ? 'education-degree' : 'project-title'}">${escape(title)}</h3>
        <p class="project-subtitle">${escape(text(item.subtitle || item.venue || item.issuer, lang))}</p>
        <p class="project-desc">${escape(text(item.desc, lang))}</p>${tags(item, lang)}
        ${kind === 'projects' && !cv ? `<p class="project-link-row"><a class="project-link" href="${pathFor(lang, 'project', projectSlug(item, index))}" data-event="research_open">${u.details} <span aria-hidden="true"> ↗</span></a></p>` : ''}
        ${cv ? `<label class="no-print cv-include"><input type="checkbox" data-cv-include checked> ${u.include}</label>` : `<button type="button" class="experience-share no-print" data-copy="${ORIGIN + pathFor(lang)}#${escape(anchor)}">${u.shareItem}</button>`}
        ${url ? `<p class="project-link-row"><a class="project-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${u.external} ↗</a></p>` : ''}
      </li>`;
    }).join('');
  }
  function languageHTML(content, lang) {
    return (content.collections?.languages || []).map(item => `<li class="language-item"><span class="language-name">${escape(item.code === 'other' ? text(item.name, lang) : LANGUAGE_NAMES[lang][item.code])}</span><span class="language-level">${escape(LEVELS[lang][item.level])}</span></li>`).join('');
  }
  function section(title, lead, body, id, number = '') {
    return `<section class="section" id="${escape(id)}" aria-labelledby="${escape(id)}-title"><div class="container"><div class="section-heading">${number ? `<span class="section-number" aria-hidden="true">${number}</span>` : ''}<h2 class="section-title" id="${escape(id)}-title">${escape(title)}</h2></div>${lead ? `<p class="section-lead">${escape(lead)}</p>` : ''}${body}</div></section>`;
  }
  function education(content, lang, cv = false) {
    const c = content.collections || {}, d = content[lang];
    let body = `<div class="education-layout"><ul class="education-list">${itemsHTML(c.education, lang, 'education', { cv })}</ul>${c.languages?.length ? `<aside class="languages-panel"><h3 class="sub-title">${escape(d.languages_title)}</h3><ul class="language-list">${languageHTML(content, lang)}</ul></aside>` : ''}</div>`;
    for (const kind of ['publications', 'certificates']) {
      if (c[kind]?.length) body += `<h3 class="sub-title">${escape(d[`${kind}_title`])}</h3><ul class="project-grid">${itemsHTML(c[kind], lang, kind, { cv })}</ul>`;
    }
    return section(d.education_title, '', body, 'education', cv ? '' : '02');
  }
  function customSections(content, lang, cv = false) {
    return (content.collections?.custom_sections || []).filter(s => s.items?.length).map((s, i) => section(text(s.title, lang), text(s.lead, lang), `<ul class="project-grid">${itemsHTML(s.items, lang, 'custom', { cv })}</ul>`, `custom-${i}`)).join('');
  }
  function actions(lang, email, type = 'home') {
    const u = UI[lang];
    return `<div class="tool-actions no-print"><a class="button button-outline" href="/${lang}/contact.vcf" download data-event="contact_save">${u.saved}</a><button type="button" class="button button-outline" data-copy="${escape(email)}">${u.copy}</button><button type="button" class="button button-outline" data-share>${u.share}</button>${type !== 'cv' ? `<a class="button button-outline" href="${pathFor(lang, 'cv')}" data-event="cv_open">${u.cv}</a>` : ''}</div>`;
  }
  function contact(content, lang) {
    const d = content[lang], u = UI[lang], email = emailAddress(d.contact_email_value);
    return `<section id="contact" class="section section-contact" aria-labelledby="contact-heading"><div class="container"><div class="section-heading"><span class="section-number" aria-hidden="true">03</span><h2 id="contact-heading" class="section-title">${escape(d.contact_title)}</h2></div><p class="section-lead">${escape(d.contact_lead)}</p>
      <ul class="contact-grid"><li><a class="contact-card" href="mailto:${escape(email)}" data-event="email_click"><span class="contact-text"><span class="contact-label">${escape(d.contact_email_label)}</span><span class="contact-value">${escape(email)}</span></span></a></li><li><div class="contact-card"><span class="contact-text"><span class="contact-label">${escape(d.contact_location_label)}</span><span class="contact-value">${escape(d.contact_location_value)}</span></span></div></li>${(content.collections?.contacts || []).filter(item=>safeURL(item.link)).map(item=>`<li><a class="contact-card" href="${escape(safeURL(item.link))}" target="_blank" rel="noopener noreferrer"><span class="contact-text"><span class="contact-label">${escape(text(item.title,lang))}</span><span class="contact-value">${escape(item.link)}</span></span></a></li>`).join('')}</ul>
      ${actions(lang, email)}
      <details class="contact-composer"><summary>${u.start}</summary><form id="contact-form" data-email="${escape(email)}">
      <fieldset><legend>${u.topic}</legend><div class="intent-options">${['research', 'academic', 'professional'].map((id, i) => `<label><input type="radio" name="intent" value="${id}" ${i === 0 ? 'checked' : ''}> ${u[id]}</label>`).join('')}</div></fieldset>
      <div class="form-grid"><label>${u.name}<input name="name" autocomplete="name" required maxlength="100"></label><label>${u.organization}<input name="organization" autocomplete="organization" maxlength="150"></label></div>
      <label>${u.replyEmail}<input name="email" type="email" autocomplete="email" required maxlength="254"></label><div class="contact-trap" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><label data-contact-context>${u.subject}<input name="context" maxlength="180"></label><label>${u.deadline}<input name="deadline" type="date"></label><label>${u.message}<textarea name="message" rows="4" maxlength="1800" required></textarea></label><p class="hint" id="contact-privacy">${u.contactHint}</p><div id="contact-verification"></div><p id="contact-status" class="hint" role="status" aria-live="polite">${u.loading}</p><button class="button button-solid" type="submit" disabled>${u.compose}</button><button class="button button-outline" type="button" id="contact-retry" hidden>${u.retry}</button></form></details>
    </div></section>`;
  }
  function helper(content, lang, preview) {
    const d = content[lang], u = UI[lang];
    const labels = {
      pt: ['Ativar para testar', 'Assistente do perfil', 'Busca no conteúdo publicado, sem IA generativa e sem envio de mensagens.', 'O que você procura?', 'Buscar'],
      en: ['Enable to try', 'Profile assistant', 'Search published content. No generative AI or message submission.', 'What are you looking for?', 'Search'],
      es: ['Activar para probar', 'Asistente del perfil', 'Busca en el contenido publicado. Sin IA generativa ni envío de mensajes.', '¿Qué buscas?', 'Buscar']
    }[lang];
    const entries = [
      { title: u.profile, text: d.summary, url: pathFor(lang), keywords: 'maria perfil profile sobre about quien quem' },
      { title: d.education_title, text: `${d.institution}. ${d.graduation}`, url: pathFor(lang) + '#education', keywords: 'formacao estudos university universidad medicina estudante student graduacao' },
      { title: d.contact_title, text: `${d.contact_lead} ${d.contact_email_value}`, url: pathFor(lang) + '#contact', keywords: 'email contato contact correo colaboracao collaboration' },
      { title: u.cv, text: u.cvTitle, url: pathFor(lang, 'cv'), keywords: 'curriculo curriculum cv resume pdf' },
      ...(content.collections?.projects || []).map((p, i) => ({ title: text(p.display_title || p.title, lang), text: text(p.desc, lang), url: pathFor(lang, 'project', projectSlug(p, i)), keywords: 'pesquisa research investigacion eletroquimioterapia electrochemotherapy' }))
    ];
    return `<details id="portfolio-helper" class="portfolio-helper"><summary>${preview ? labels[0] : labels[1]} <span aria-hidden="true">✦</span></summary><div class="helper-panel"><h2>${labels[1]}</h2><p class="hint">${labels[2]}</p><form><label>${labels[3]}<input name="query" type="search" maxlength="160" placeholder="${escape(d.nav_projects)}…"></label><button class="button button-solid" type="submit">${labels[4]}</button></form><div data-results role="status" aria-live="polite"></div><nav class="helper-links"><a href="${pathFor(lang)}#projects">${escape(d.nav_projects)}</a><a href="${pathFor(lang, 'cv')}">${u.cv}</a><a href="${pathFor(lang)}#contact">${escape(d.nav_contact)}</a></nav></div></details><script id="helper-content" type="application/json">${JSON.stringify(entries).replace(/</g, '\\u003c')}</script>`;
  }
  function renderPage(content, options = {}) {
    const lang = LANGS.includes(options.lang) ? options.lang : 'en';
    const type = options.type || 'home', d = content[lang], u = UI[lang], c = content.collections || {};
    const slug = options.slug || '', path = pathFor(lang, type, slug);
    const project = (c.projects || []).find((p, i) => projectSlug(p, i) === slug);
    const title = type === 'project' && project ? `${text(project.title, lang)} · ${NAME}` : type === 'cv' ? `${u.cvTitle} · ${NAME}` : type === 'event' ? `${u.event} · ${NAME}` : type === 'card' ? `${u.card} · ${NAME}` : `${NAME} | ${d.eyebrow}`;
    const description = type === 'project' && project ? text(project.desc, lang) : d.summary;
    const photo = options.photo && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(options.photo) ? options.photo : '/photo.jpg';
    let body = '';
    if (type === 'home') {
      body = `<section class="hero" aria-labelledby="hero-name"><div class="container hero-inner"><div class="hero-text"><span class="eyebrow">${escape(d.eyebrow)}</span><h1 class="name" id="hero-name">${NAME}</h1><p class="summary">${escape(d.summary)}</p><div class="hero-affiliation"><p class="institution">${escape(d.institution)}</p><p class="graduation">${escape(d.graduation)}</p></div><div class="hero-actions"><a class="button button-primary" href="#projects">${escape(d.hero_research)} ↗</a><a class="button button-secondary" href="${pathFor(lang, 'cv')}" data-event="cv_open">${u.cv}</a><a class="button button-secondary" href="#contact">${escape(d.hero_contact)}</a></div></div><div class="photo-frame"><img src="${photo}" alt="${NAME}" width="1023" height="1537" fetchpriority="high"></div></div></section>`;
      body += section(d.projects_title, d.projects_lead, `<div class="research-tools no-print"><label>${u.search}<input type="search" id="research-search"></label><label>${u.theme}<select id="research-theme"><option value="">${u.theme}</option>${[...new Set((c.projects || []).flatMap(p => p.tags?.[lang] || []))].map(t => `<option>${escape(t)}</option>`).join('')}</select></label></div><p id="research-empty" role="status" hidden>${u.empty}</p><ul class="project-grid" id="research-results">${itemsHTML(c.projects, lang, 'projects')}</ul>`, 'projects', '01');
      body += education(content, lang) + customSections(content, lang) + contact(content, lang);
    } else if (type === 'project') {
      body = project ? `<section class="section project-page"><div class="container narrow"><a href="${pathFor(lang)}#projects" class="back-link">← ${u.back}</a><p class="eyebrow ink">${escape(d.projects_title)} · ${escape(project.period || project.year)}</p><h1 class="page-title">${escape(text(project.title, lang))}</h1><p class="project-subtitle">${escape(text(project.subtitle, lang))}</p><h2 class="sub-title">${u.overview}</h2><p class="project-desc">${escape(text(project.desc, lang))}</p>${tags(project, lang)}${safeURL(project.link) ? `<p class="project-link-row"><a href="${escape(safeURL(project.link))}" rel="noopener noreferrer" target="_blank">${u.external} ↗</a></p>` : ''}<div class="tool-actions"><a class="button button-solid" href="${pathFor(lang)}#contact">${escape(d.hero_contact)}</a><button type="button" class="button button-outline" data-share>${u.share}</button></div></div></section>` : `<div class="container section"><h1>${u.noProject}</h1><a href="${pathFor(lang)}">${u.back}</a></div>`;
    } else if (type === 'cv') {
      body = `<div class="container cv-top"><a class="back-link no-print" href="${pathFor(lang)}">← ${u.back}</a><div class="cv-builder no-print"><h2>${u.focus}</h2><p>${u.focusHelp}</p><select id="cv-focus" aria-label="${u.focus}">${['all','research','academic','professional'].map(k => `<option value="${k}">${u[k]}</option>`).join('')}</select><p id="cv-selection" role="status"></p></div><div class="tool-actions no-print"><button type="button" class="button button-solid" data-print>${u.print}</button></div><p class="eyebrow ink">${u.cvTitle}</p><h1 class="page-title">${NAME}</h1><p>${escape(d.eyebrow)} · ${escape(d.graduation)}</p><p>${escape(d.institution)}</p><p class="cv-contact">${escape(d.contact_email_value)}</p><p class="cv-summary">${escape(d.summary)}</p></div>`;
      body += education(content, lang, true) + section(d.projects_title, '', `<ul class="project-grid">${itemsHTML(c.projects, lang, 'projects', { cv: true })}</ul>`, 'projects') + customSections(content, lang, true);
    } else if (type === 'card' || type === 'event') {
      body = `<section class="section"><div class="container"><article class="digital-card"><img src="${photo}" alt="${NAME}" width="120" height="150"><p class="eyebrow ink">${escape(d.eyebrow)}</p><h1 class="page-title">${NAME}</h1><p>${escape(d.institution)}</p><p class="section-lead">${u.cardLead}</p>${type === 'event' ? `<h2 class="sub-title">${escape(d.projects_title)}</h2><ul class="event-research">${(c.projects || []).map((p,i) => `<li><a href="${pathFor(lang,'project',projectSlug(p,i))}">${escape(text(p.display_title || p.title,lang))}</a></li>`).join('')}</ul><img class="event-qr" src="/${lang}/profile-qr.svg" alt="QR: ${ORIGIN + pathFor(lang,'event')}" width="180" height="180"><a class="button button-outline" href="/${lang}/profile-qr.svg" download="maria-miranda-${lang}.svg">${u.qr}</a>` : ''}<a href="mailto:${escape(emailAddress(d.contact_email_value))}" class="card-email" data-event="email_click">${escape(d.contact_email_value)}</a>${actions(lang, emailAddress(d.contact_email_value), 'card')}<a class="back-link" href="${pathFor(lang)}">${u.profile} ↗</a></article></div></section>`;
    }
    const structured = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: NAME, description: d.summary, url: ORIGIN + pathFor(lang), image: ORIGIN + '/photo.jpg' } }).replace(/</g, '\\u003c');
    if(type === 'home' && Array.isArray(content.appearance?.order)) { const parts=body.match(/<section\b[\s\S]*?<\/section>/g)||[]; const order=content.appearance.order; body=parts.map((html,i)=>({html,rank:i===0?-1:(order.includes((html.match(/id="([^"]+)"/)||[])[1])?order.indexOf((html.match(/id="([^"]+)"/)||[])[1]):999)})).sort((a,b)=>(a.rank<0?a.rank===-1?-1:999:a.rank)-(b.rank<0?b.rank===-1?-1:999:b.rank)).map(p=>p.html).join(''); }
    const appearance=content.appearance || {}, validColor=v=>/^#[0-9a-f]{6}$/i.test(v || '');
    const dark=!!options.contactDemo && appearance.theme==='dark';
    const color=(key,fallback)=>validColor(appearance[key])?appearance[key]:fallback;
    const brand=color('brand',dark?'#91badb':'#173f62'), background=dark?'#090b0e':color('background','#ffffff'), ink=dark?'#f0f3f6':color('text','#22374a'), cover=dark?'#121922':color('cover','#0d2542');
    const contrast=hex=>{const n=parseInt(hex.slice(1),16);return (((n>>16)&255)*.299+((n>>8)&255)*.587+(n&255)*.114)>150?'#101820':'#ffffff';};
    const fontFamilies={system:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',georgia:'Georgia,"Times New Roman",serif',arial:'Arial,Helvetica,sans-serif',trebuchet:'"Trebuchet MS",Arial,sans-serif'};
    const selectedFont=fontFamilies[appearance.font];
    const fontCSS=selectedFont?`<style>:root{--font-display:${selectedFont};--font-sans:${selectedFont}}body,button,input,textarea,select{font-family:${selectedFont}}</style>`:'';
    const paletteCSS=Object.keys(appearance).some(k=>k!=='order')?`<style>:root{--brand:${brand};--brand-strong:${brand};--ink:${ink};--bg:${background};--surface:${dark?'#151b23':background};--brand-soft:${dark?'#253343':'#e6edf2'};--brand-softer:${dark?'#151b23':background};--ink-muted:${dark?'#b5c0cd':ink};--muted:${dark?'#b5c0cd':ink};--border:${dark?'#35404c':'#cedbe4'};color-scheme:${dark?'dark':'light'}}body{background:${background};color:${ink}}.hero{background:${cover};color:${contrast(cover)}}.hero .summary,.hero .institution,.hero .graduation,.hero .eyebrow{color:inherit}.hero .button-primary{background:${brand};color:${contrast(brand)}}.hero .button-secondary{color:${contrast(cover)};border-color:currentColor}.section,.site-header,.site-footer,.digital-card{background:${background};color:${ink}}.section-contact,.project-card,.education-card,.contact-card{background:${dark?'#151b23':background};color:${ink}}h1,h2,h3,.section-title,.project-title,.project-subtitle,.institution,.graduation,.section-lead,.project-desc,.contact-text,.site-footer a{color:inherit}.research-tools,.cv-builder{background:${dark?'#151b23':background};color:${ink}}.research-tools input,.research-tools select,.cv-builder select,input,textarea,select{background:${dark?'#18212b':background};color:${ink};border-color:${dark?'#506174':'#a6b3bf'}}.button-solid{background:${brand};color:${contrast(brand)}}.tag{background:${dark?'#253343':'#e6edf2'};color:${dark?'#d8e8f5':'#173f62'}}a{color:${brand}}.hero a{color:${contrast(cover)}}</style>`:'';
    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#0d2542">
      ${options.preview ? '<meta name="robots" content="noindex,nofollow">' : `<link rel="canonical" href="${ORIGIN + path}">${LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${ORIGIN + pathFor(l, type, slug)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${ORIGIN + pathFor('en', type, slug)}">`}
      <meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${ORIGIN + path}"><meta property="og:type" content="website"><meta property="og:image" content="${ORIGIN}/og-image.png"><meta property="og:locale" content="${{ pt: 'pt_BR', en: 'en_US', es: 'es_AR' }[lang]}"><meta name="twitter:card" content="summary_large_image">
      <link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">${options.contactDemo ? '' : `<script>(function(){var preference='auto';try{preference=localStorage.getItem('maria-theme')||'auto'}catch(e){}var dark=preference==='dark'||(preference!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light'})();</script>`}<link rel="stylesheet" href="/styles.css">${paletteCSS}${fontCSS}
      <script type="application/ld+json">${structured}</script></head><body data-lang="${lang}" data-page="${type}" data-metrics="${!!options.metrics}" data-contact-demo="${!!options.contactDemo}" ${options.preview ? 'data-preview="true"' : ''}>
      <a class="skip-link" href="#main">${escape(d.skip_link)}</a>${options.preview ? `<div class="preview-strip">${u.preview}</div>` : ''}
      <header class="site-header"><div class="container header-inner"><a class="brand" href="${pathFor(lang)}">Maria Eduarda Miranda</a><nav class="site-nav" aria-label="${escape(d.nav_label)}"><ul><li><a href="${pathFor(lang)}#projects">${escape(d.nav_projects)}</a></li><li><a href="${pathFor(lang)}#education">${escape(d.nav_education)}</a></li><li><a href="${pathFor(lang)}#contact">${escape(d.nav_contact)}</a></li></ul></nav><nav class="lang-switch" aria-label="${escape(d.language_label)}">${LANGS.map(l => `<a class="lang-btn ${l === lang ? 'is-active' : ''}" lang="${l}" hreflang="${l}" href="${pathFor(l, type, slug)}" ${l === lang ? 'aria-current="page"' : ''} aria-label="${{ pt: 'Português', en: 'English', es: 'Español' }[l]}">${l.toUpperCase()}</a>`).join('')}</nav>${options.contactDemo ? '' : `<button class="theme-toggle" type="button" data-theme-toggle aria-label="${{pt:'Alterar tema',en:'Change theme',es:'Cambiar tema'}[lang]}">◐ ${{pt:'Automático',en:'Automatic',es:'Automático'}[lang]}</button>`}</div></header>
      <main id="main" tabindex="-1" class="${type === 'cv' ? 'cv-page' : ''}">${body}</main><footer class="site-footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} ${NAME}</span><span>${escape(d.footer_location)}</span><a href="${pathFor(lang, 'card')}">${u.card}</a><a href="${pathFor(lang,'event')}">${u.event}</a><button type="button" data-install hidden>${u.install}</button></div></footer><div id="site-status" role="status" aria-live="polite" class="site-status" hidden></div>
      ${FEATURES.assistantUI && (content.features?.assistant || options.preview) ? helper(content, lang, !!options.preview) : ''}<script src="/shared/view.js" defer></script><script src="/site.js" defer></script>${options.preview ? '' : '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script><script defer src="/_vercel/insights/script.js"></script>'}</body></html>`;
  }
  return { FEATURES, LANGS, UI, ORIGIN, NAME, escape, text, slugify, projectSlug, pathFor, safeURL, emailAddress, phoneNumber, renderPage };
});
