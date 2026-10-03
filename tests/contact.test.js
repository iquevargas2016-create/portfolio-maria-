const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const handler = require('../api/contact');
const V = require('../shared/view');
const content = require('../content.json');
const originalFetch = global.fetch, env = { ...process.env };
let ip = 0;
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const result = () => ({ setHeader() {}, status(n) { this.code = n; return this; }, json(v) { this.body = v; } });
const body = () => ({ name: 'Pessoa Teste', email: 'visitor@example.com', organization: 'Universidade', message: 'Gostaria de conversar sobre pesquisa.', intent: 'research', language: 'pt', website: '', turnstileToken: 'test-token', requestId: crypto.randomUUID() });
const request = (data = body()) => ({ method: 'POST', headers: { host: 'site.test', origin: 'https://site.test', 'x-forwarded-for': `192.0.2.${++ip}` }, body: data });
test.beforeEach(() => { Object.assign(process.env, { CONTACT_EMAIL_ENABLED: 'true', CONTACT_FROM_EMAIL: 'site@mail.example.com', RESEND_API_KEY: 'secret-test-resend', TURNSTILE_SITE_KEY: 'public-site-key', TURNSTILE_SECRET_KEY: 'secret-test-turnstile' }); });
test.afterEach(() => { global.fetch = originalFetch; for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key]; Object.assign(process.env, env); });
test('contact configuration exposes only the public site key and fails closed without credentials', async () => {
  const r = result(); await handler({ method: 'GET', headers: {} }, r); assert.deepEqual(r.body, { configured: true, siteKey: 'public-site-key' });
  delete process.env.RESEND_API_KEY; const disabled = result(); await handler(request(), disabled); assert.equal(disabled.code, 503);
});
test('contact rejects invalid fields, honeypots and cross-origin requests before contacting providers', async () => {
  let calls = 0; global.fetch = async () => { calls++; throw Error(); };
  for (const edit of [b => b.email = 'bad\r\nBcc: attacker@example.com', b => b.message = 'x'.repeat(1801), b => b.website = 'bot', b => b.intent = 'malicious', b => b.requestId = 'bad']) {
    const b = body(); edit(b); const r = result(); await handler(request(b), r); assert.ok([400, 403].includes(r.code));
  }
  const req = request(); req.headers.origin = 'https://evil.test'; const r = result(); await handler(req, r); assert.equal(r.code, 403); assert.equal(calls, 0);
});
test('server validates challenge hostname and action before sending', async () => {
  for (const challenge of [{ success: false }, { success: true, hostname: 'evil.test', action: 'contact' }, { success: true, hostname: 'site.test', action: 'login' }]) {
    let calls = 0; global.fetch = async url => { calls++; assert.match(url, /siteverify$/); return response(challenge); };
    const r = result(); await handler(request(), r); assert.equal(r.code, 403); assert.equal(calls, 1);
  }
});
test('send uses fixed recipient, verified sender and visitor reply-to with stable retry deduplication', async () => {
  const sent = [], payload = body(); payload.to = 'attacker@example.com'; payload.from = 'attacker@example.com';
  global.fetch = async (url, options) => {
    if (url.includes('siteverify')) return response({ success: true, hostname: 'site.test', action: 'contact' });
    assert.equal(url, 'https://api.resend.com/emails'); sent.push(options); return response({ id: 'test-message-id' });
  };
  for (let i = 0; i < 2; i++) { const r = result(); await handler(request({ ...payload, turnstileToken: `token-${i}` }), r); assert.deepEqual(r.body, { ok: true }); }
  const mail = JSON.parse(sent[0].body); assert.deepEqual(mail.to, [content.en.contact_email_value]); assert.equal(mail.reply_to, payload.email); assert.equal(mail.from, 'Site Maria Miranda <site@mail.example.com>'); assert.equal(mail.html, undefined);
  assert.equal(sent[0].headers['Idempotency-Key'], sent[1].headers['Idempotency-Key']);
});
test('provider failures never produce a false successful send', async () => {
  global.fetch = async url => url.includes('siteverify') ? response({ success: true, hostname: 'site.test', action: 'contact' }) : response({ error: 'provider-secret-detail' }, 500);
  const r = result(); await handler(request(), r); assert.equal(r.code, 502); assert.notEqual(r.body.ok, true); assert.ok(!JSON.stringify(r.body).includes('provider-secret-detail'));
});
async function page({ configured = true, sendOK = true, editor = false } = {}) {
  const dom = new JSDOM(V.renderPage(content, { lang: 'pt', preview: true, contactDemo: editor }), { url: 'https://site.test/pt/', runScripts: 'outside-only' });
  const w = dom.window, calls = []; let challenge;
  w.turnstile = { render(selector, options) { challenge = options; queueMicrotask(() => options.callback('token')); return 'widget'; }, reset() {} };
  w.fetch = async (url, options) => { calls.push({ url, options }); if (!options?.method) return response({ configured, siteKey: 'test-public' }); return response(sendOK ? { ok: true } : {}, sendOK ? 200 : 502); };
  w.eval(fs.readFileSync(require.resolve('../shared/view'), 'utf8')); w.eval(fs.readFileSync(require.resolve('../site.js'), 'utf8'));
  const d = w.document, form = d.querySelector('#contact-form');
  form.closest('details').open = true; await new Promise(r => setTimeout(r, 15));
  for (const [key, value] of Object.entries({ name: 'Visitante', email: 'visitor@example.com', organization: 'Instituição', message: 'Mensagem para teste.' })) form.elements.namedItem(key).value = value;
  return { dom, w, d, form, calls, challenge };
}
test('direct form sends without mailto navigation and clears fields only after success', async () => {
  for (const success of [false, true]) {
    const { dom, w, d, form, calls } = await page({ sendOK: success });
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await new Promise(r => setTimeout(r, 10));
    assert.equal(calls.filter(c => c.options?.method === 'POST').length, 1); assert.equal(w.location.pathname, '/pt/');
    assert.equal(form.elements.namedItem('message').value, success ? '' : 'Mensagem para teste.'); assert.match(d.querySelector('#contact-status').textContent, success ? /Mensagem enviada/ : /Não foi possível/); dom.window.close();
  }
});
test('unconfigured and editor-preview forms never send or invoke CAPTCHA', async () => {
  for (const settings of [{ configured: false }, { editor: true }]) {
    const { dom, d, calls, challenge } = await page(settings);
    assert.equal(d.querySelector('#contact-form [type="submit"]').disabled, true); assert.equal(challenge, undefined); assert.equal(calls.filter(c => c.options?.method === 'POST').length, 0); dom.window.close();
  }
});
