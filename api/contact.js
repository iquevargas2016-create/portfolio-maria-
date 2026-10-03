const crypto = require('node:crypto');
const { endpoint, bodyOf, error, rateLimit } = require('../lib/http');
const { emailAddress } = require('../shared/view');
const content = require('../content.json');

function config() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const to = emailAddress(content.en.contact_email_value);
  return process.env.CONTACT_EMAIL_ENABLED === 'true' && key && emailAddress(from) && siteKey && secret && to ? { key, from, siteKey, secret, to } : null;
}

module.exports = endpoint(async (req, res) => {
  const settings = config();
  if (req.method === 'GET') return res.status(200).json({ configured: !!settings, ...(settings ? { siteKey: settings.siteKey } : {}) });
  if (!settings) throw error(503, 'Envio indisponível.');
  // Browser requests must come from this deployment; challenge hostname is checked too.
  let hostname;
  try { const origin = new URL(req.headers.origin); if (origin.protocol !== 'https:' || origin.host !== req.headers.host) throw new Error(); hostname = origin.hostname; }
  catch { throw error(403, 'Origem inválida.'); }
  const data = bodyOf(req, 18000);
  const field = (name, max, required = true) => {
    if (typeof data[name] !== 'string' || data[name].length > max || (required && !data[name].trim())) throw error(400, 'Confira os campos do formulário.');
    return data[name].trim();
  };
  const name = field('name', 100), email = field('email', 254), organization = field('organization', 150, false), message = field('message', 1800);
  const intent = field('intent', 20), language = field('language', 2), token = field('turnstileToken', 2048), requestId = field('requestId', 36);
  if (!emailAddress(email) || /[\r\n\x00-\x1f]/.test(name + email + organization) || !['research', 'academic', 'professional'].includes(intent) || !['pt', 'en', 'es'].includes(language) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)) throw error(400, 'Dados inválidos.');
  if (data.website !== '' && data.website != null) throw error(403, 'Não foi possível validar o envio.');
  const context = data.context == null ? '' : field('context', 180, false);
  const deadline = data.deadline == null ? '' : field('deadline', 10, false);
  if (/[\r\n\x00-\x1f]/.test(context) || (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))) throw error(400, 'Dados inválidos.');
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  rateLimit(`contact:${crypto.createHash('sha256').update(ip || hostname).digest('hex')}`, 5, 600000);
  const verified = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ secret: settings.secret, response: token, ...(ip ? { remoteip: ip } : {}) })
  });
  if (!verified.ok) throw error(502, 'Verificação indisponível.');
  const challenge = await verified.json();
  if (challenge.success !== true || challenge.hostname !== hostname || challenge.action !== 'contact') throw error(403, 'Verificação expirada ou inválida.');
  const topics = { research: 'Colaboração científica', academic: 'Oportunidade acadêmica', professional: 'Contato profissional' };
  const mail = {
    from: `Site Maria Miranda <${settings.from}>`, to: [settings.to], reply_to: email,
    subject: `[Site Maria Miranda] ${topics[intent]}`,
    text: `Nova mensagem pelo site\n\nNome: ${name}\nEmail: ${email}\nInstituição: ${organization || 'Não informada'}\nTipo: ${topics[intent]}\nIdioma do formulário: ${language}\nTema ou programa: ${context || 'Não informado'}\nPrazo: ${deadline || 'Não informado'}\n\n${message}\n\nUse Responder para falar diretamente com o remetente.`
  };
  const idempotencyKey = 'contact-' + crypto.createHash('sha256').update(JSON.stringify({ requestId, mail })).digest('hex');
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${settings.key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, signal: AbortSignal.timeout(15000), body: JSON.stringify(mail)
  });
  if (!sent.ok) throw error(sent.status === 429 ? 429 : 502, 'Não foi possível confirmar o envio.');
  const result = await sent.json();
  if (!result.id) throw error(502, 'Não foi possível confirmar o envio.');
  // Optional private inbox; never affects email delivery confirmation.
  if (process.env.CONTACT_INBOX_ENABLED === 'true' && process.env.VERCEL_ENV === 'production') {
    try { await require('../lib/inbox').save({ id: requestId, name, email, organization, message, intent, context, deadline, status: 'received', createdAt: new Date().toISOString() }); } catch { /* Email already accepted; do not induce duplicate retries. */ }
  }
  res.status(200).json({ ok: true });
}, ['GET', 'POST']);
