const crypto = require('node:crypto');
const buckets = new Map();
const error = (status, message) => Object.assign(new Error(message), { status });
function bodyOf(req, max = 750000) {
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw) > max) throw error(413, 'Conteúdo muito grande.');
  try { const body = JSON.parse(raw); if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error(); return body; }
  catch { throw error(400, 'Dados inválidos.'); }
}
function verifyToken(token, secret = process.env.SESSION_SECRET) {
  if (!secret || typeof token !== 'string') return false;
  const [expiry, signature, extra] = token.split('.');
  if (extra || !/^\d{13}$/.test(expiry) || !/^[a-f0-9]{64}$/.test(signature || '') || Date.now() >= Number(expiry) || Number(expiry) > Date.now() + 14400000) return false;
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), crypto.createHmac('sha256', secret).update(expiry).digest());
}
function issueToken() {
  const expiry = String(Date.now() + 14400000);
  return `${expiry}.${crypto.createHmac('sha256', process.env.SESSION_SECRET).update(expiry).digest('hex')}`;
}
function authenticate(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!verifyToken(token)) throw error(401, 'Sessão expirada. Entre novamente; seu rascunho foi preservado.');
  return token;
}
function sameOrigin(req) {
  if (!req.headers.origin) return;
  try { if (new URL(req.headers.origin).host !== req.headers.host) throw new Error(); }
  catch { throw error(403, 'Origem da solicitação inválida.'); }
}
function rateLimit(key, limit, interval = 3600000) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.until <= now) buckets.delete(k);
  if (buckets.size > 2000) buckets.delete(buckets.keys().next().value);
  const record = buckets.get(key) || { count: 0, until: now + interval };
  if (++record.count > limit) throw error(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
  buckets.set(key, record);
}
function endpoint(handler, methods = ['GET', 'POST']) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!methods.includes(req.method)) { res.setHeader('Allow', methods.join(', ')); return res.status(405).json({ error: 'Método não permitido.' }); }
    try { if (req.method !== 'GET') sameOrigin(req); await handler(req, res); }
    catch (err) { res.status(err.status || 502).json({ error: err.status ? err.message : 'Não foi possível concluir a operação. Tente novamente.' }); }
  };
}
module.exports = { error, bodyOf, verifyToken, issueToken, authenticate, sameOrigin, rateLimit, endpoint };
