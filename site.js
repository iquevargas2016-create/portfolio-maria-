(() => {
  'use strict';
  const { UI, NAME } = window.Portfolio;
  const lang = document.body.dataset.lang || 'en', u = UI[lang];
  const preview = document.body.dataset.preview === 'true';
  if (document.body.dataset.contactDemo !== 'true') {
    const button=document.querySelector('[data-theme-toggle]'), media=window.matchMedia?.('(prefers-color-scheme: dark)');
    const names={pt:{auto:'Automático',dark:'Noturno',light:'Claro',help:'Tema: '},en:{auto:'Automatic',dark:'Dark',light:'Light',help:'Theme: '},es:{auto:'Automático',dark:'Nocturno',light:'Claro',help:'Tema: '}}[lang];
    let preference='auto';try{const stored=localStorage.getItem('maria-theme');if(['light','dark'].includes(stored))preference=stored;}catch{}
    function applyTheme(){document.documentElement.dataset.theme=preference==='auto'?(media?.matches?'dark':'light'):preference;if(button){button.textContent='◐ '+names[preference];button.setAttribute('aria-label',names.help+names[preference]);button.title=names.help+names[preference];}}
    button?.addEventListener('click',()=>{preference={auto:'dark',dark:'light',light:'auto'}[preference];try{if(preference==='auto')localStorage.removeItem('maria-theme');else localStorage.setItem('maria-theme',preference);}catch{}applyTheme();});
    media?.addEventListener?.('change',applyTheme);
    window.addEventListener('storage',event=>{if(event.key==='maria-theme'){preference=['light','dark'].includes(event.newValue)?event.newValue:'auto';applyTheme();}});
    applyTheme();
  }
  const status = document.getElementById('site-status');
  let statusTimer;
  function announce(message, persistent = false) {
    if (!status) return;
    status.textContent = message; status.hidden = false; clearTimeout(statusTimer);
    if (!persistent) statusTimer = setTimeout(() => { status.hidden = true; }, 5000);
  }
  function track(name) {
    if (preview || navigator.doNotTrack === '1') return;
    window.va?.('event', { name, data: { language: lang, page: document.body.dataset.page } });
    if (document.body.dataset.metrics === 'true') fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: name, language: lang }), keepalive: true }).catch(() => {});
  }
  async function copy(value) {
    try { await navigator.clipboard.writeText(value); announce(u.copied); return true; }
    catch { announce(u.failed); return false; }
  }
  document.addEventListener('click', async event => {
    const target = event.target.closest('a,button');
    if (!target) return;
    if (target.dataset.event) track(target.dataset.event);
    if (target.hasAttribute('data-copy')) { if (await copy(target.dataset.copy)) track(target.dataset.copy.startsWith('https://') ? 'share' : 'email_copy'); }
    if (target.hasAttribute('data-print')) { track('cv_print'); window.print(); }
    if (target.hasAttribute('data-share')) {
      const url = document.querySelector('link[rel="canonical"]')?.href || `${Portfolio.ORIGIN}${location.pathname}`;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url });
        else if (!await copy(url)) return;
        track('share');
      } catch (err) { if (err.name !== 'AbortError') announce(u.failed); }
    }
  });
  const contact = document.getElementById('contact-form');
  if (contact) {
    const button = contact.querySelector('[type="submit"]'), feedback = document.getElementById('contact-status'), retry = document.getElementById('contact-retry');
    let token = '', widget, busy = false, initialized = false, loading = false, requestId = '', previousPayload = '';
    const say = message => { feedback.textContent = message; };
    const editorDemo = document.body.dataset.contactDemo === 'true';
    async function initContact() {
      if (loading || initialized) return;
      if (editorDemo) { say(u.demoSend); return; }
      loading = true; retry.hidden = true; say(u.loading);
      try {
        const response = await fetch('/api/contact', { cache: 'no-store' });
        const config = await response.json();
        if (!response.ok || !config.configured) { say(u.unavailable); retry.hidden = false; return; }
        const privacy = document.getElementById('contact-privacy');
        if (privacy) privacy.textContent = config.inboxEnabled ? u.inboxHint : u.contactHint;
        if (!window.turnstile) await new Promise((resolve, reject) => {
          const script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true;
          const timeout = setTimeout(() => { script.remove(); reject(new Error('timeout')); }, 15000);
          script.onload = () => { clearTimeout(timeout); resolve(); }; script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('script')); }; document.head.append(script);
        });
        widget = window.turnstile.render('#contact-verification', {
          sitekey: config.siteKey, action: 'contact', language: lang, size: 'flexible',
          callback: value => { token = value; button.disabled = busy; if ([u.loading, u.verify].includes(feedback.textContent)) say(''); },
          'expired-callback': () => { token = ''; button.disabled = true; say(u.verify); },
          'error-callback': () => { token = ''; button.disabled = true; say(u.verify); retry.hidden = false; }
        });
        initialized = true; if (!token) say(u.verify);
      } catch { say(navigator.onLine ? u.failed : u.offlineSend); retry.hidden = false; }
      finally { loading = false; }
    }
    contact.closest('details')?.addEventListener('toggle', event => { if (event.target.open) initContact(); });
    retry.addEventListener('click', () => { if (initialized) { token = ''; button.disabled = true; window.turnstile.reset(widget); say(u.verify); retry.hidden = true; } else initContact(); });
    if (editorDemo) say(u.demoSend);
    contact.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || editorDemo || !contact.reportValidity()) return;
      if (!navigator.onLine) { say(u.offlineSend); return; }
      if (!token) { say(u.verify); return; }
      const data = new FormData(contact);
      const payload = Object.fromEntries(['name', 'email', 'organization', 'message', 'intent', 'website', 'context', 'deadline'].map(k => [k, String(data.get(k) || '')]));
      payload.language = lang;
      const fingerprint = JSON.stringify(payload);
      if (fingerprint !== previousPayload || !requestId) { requestId = crypto.randomUUID(); previousPayload = fingerprint; }
      busy = true; button.disabled = true; button.textContent = u.sending; say(u.sending);
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 35000);
      try {
        const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, requestId, turnstileToken: token }), signal: controller.signal });
        const result = await response.json();
        if (!response.ok || result.ok !== true) { say(response.status === 429 ? u.rate : response.status === 503 ? u.unavailable : response.status === 403 ? u.verify : u.failed); return; }
        contact.reset(); requestId = ''; previousPayload = ''; say(u.sent); track('contact_sent');
      } catch { say(navigator.onLine ? u.failed : u.offlineSend); }
      finally { clearTimeout(timeout); busy = false; token = ''; button.textContent = u.compose; button.disabled = true; if (window.turnstile && widget != null) window.turnstile.reset(widget); }
    });
  }
  const header = document.querySelector('.site-header');
  if (header && typeof ResizeObserver !== 'undefined') new ResizeObserver(() => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`)).observe(header);
  window.addEventListener('offline', () => announce(u.offline, true));
  window.addEventListener('online', () => announce(u.online));
  if (!navigator.onLine) announce(u.offline, true);
  let installEvent;
  const install = document.querySelector('[data-install]');
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event; if (install) install.hidden = false; });
  install?.addEventListener('click', async () => { if (!installEvent) return; await installEvent.prompt(); installEvent = null; install.hidden = true; });
  if (!preview && 'serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
  const helper = document.querySelector('#portfolio-helper');
  if (helper) {
    const form = helper.querySelector('form'), results = helper.querySelector('[data-results]');
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const entries = JSON.parse(document.getElementById('helper-content').textContent);
    helper.addEventListener('toggle', () => { if (helper.open) helper.querySelector('input')?.focus(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const query = normalize(new FormData(form).get('query') || '').split(/\W+/).filter(t => t.length > 2);
      const matches = query.length ? entries.map(item => ({ ...item, score: query.reduce((n, term) => n + (normalize(item.title + ' ' + item.text + ' ' + item.keywords).includes(term) ? 1 : 0), 0) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3) : entries.slice(0, 3);
      results.replaceChildren();
      if (!matches.length) {
        const p = document.createElement('p');
        p.textContent = { pt: 'Não encontrei esse assunto no perfil. Veja os atalhos abaixo ou entre em contato.', en: 'I could not find that topic in this profile. Use the links below or get in touch.', es: 'No encontré ese tema en el perfil. Usa los enlaces o ponte en contacto.' }[lang];
        results.append(p);
      }
      for (const item of matches) {
        const article = document.createElement('article'), a = document.createElement('a'), p = document.createElement('p');
        a.textContent = item.title; a.href = item.url; p.textContent = item.text; article.append(a, p); results.append(article);
      }
    });
  }
})();

(() => {
  const u = window.Portfolio.UI[document.body.dataset.lang || 'en'];
  const search = document.getElementById('research-search'), theme = document.getElementById('research-theme');
  function filter() {
    let count = 0;
    const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    document.querySelectorAll('#research-results > li').forEach(item => {
      item.hidden = !normalize(item.textContent).includes(normalize(search.value)) || (theme.value && ![...item.querySelectorAll('.tag')].some(t => t.textContent === theme.value));
      if (!item.hidden) count++;
    });
    document.getElementById('research-empty').hidden = count > 0;
  }
  search?.addEventListener('input', filter); theme?.addEventListener('change', filter);
  const focus = document.getElementById('cv-focus');
  if (focus) {
    const main = document.getElementById('main'), projects = document.getElementById('projects'), education = document.getElementById('education');
    const update = () => {
      document.querySelectorAll('[data-cv-include]').forEach(input => input.closest('[data-experience]').classList.toggle('cv-excluded', !input.checked));
      document.getElementById('cv-selection').textContent = `${document.querySelectorAll('[data-cv-include]:checked').length} / ${document.querySelectorAll('[data-cv-include]').length}`;
    };
    focus.addEventListener('change', () => {
      if (focus.value === 'research' || focus.value === 'professional') main.insertBefore(projects, education);
      else main.insertBefore(education, projects);
      const url = new URL(location.href); if (focus.value === 'all') url.searchParams.delete('focus'); else url.searchParams.set('focus', focus.value); try { history.replaceState(null, '', url); } catch { /* Sandboxed editor preview has an opaque origin. */ }
    });
    const value = new URL(location.href).searchParams.get('focus');
    if (['all','research','academic','professional'].includes(value)) { focus.value = value; focus.dispatchEvent(new Event('change')); }
    document.querySelectorAll('[data-cv-include]').forEach(input => input.addEventListener('change', update)); update();
  }
  const form = document.getElementById('contact-form');
  function context() {
    const intent = form.querySelector('[name=intent]:checked')?.value;
    const label = form.querySelector('[data-contact-context]');
    if (label) label.firstChild.textContent = intent === 'academic' ? u.program : intent === 'professional' ? u.program : u.subject;
  }
  form?.querySelectorAll('[name=intent]').forEach(input => input.addEventListener('change', context)); if (form) context();
})();
