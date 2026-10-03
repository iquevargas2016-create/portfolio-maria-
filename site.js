(() => {
  'use strict';
  const { UI, NAME } = window.Portfolio;
  const lang = document.body.dataset.lang || 'en', u = UI[lang];
  const preview = document.body.dataset.preview === 'true';
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
    if (target.hasAttribute('data-copy')) { if (await copy(target.dataset.copy)) track('email_copy'); }
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
  contact?.addEventListener('submit', event => {
    event.preventDefault();
    if (!contact.reportValidity()) return;
    const data = new FormData(contact), intent = data.get('intent');
    const subject = u[intent] || u.professional;
    const body = `${u.greeting}\n\n${data.get('message')}\n\n${u.from}: ${data.get('name')}${data.get('organization') ? `\n${u.org}: ${data.get('organization')}` : ''}`;
    track('contact_compose');
    location.href = `mailto:${contact.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
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
