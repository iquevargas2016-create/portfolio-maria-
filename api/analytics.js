const crypto = require('node:crypto');
const { endpoint, authenticate, bodyOf, error, rateLimit } = require('../lib/http');
const EVENTS = ['research_open', 'cv_open', 'cv_print', 'email_click', 'phone_click', 'contact_compose', 'contact_save', 'share', 'email_copy'];
function storage() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function commands(config, commands) {
  const response = await fetch(`${config.url}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(commands), signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw error(503, 'Contadores indisponíveis. Consulte o painel da Vercel.');
  const result = await response.json();
  if (!Array.isArray(result) || result.some(r => r.error)) throw error(503, 'Contadores indisponíveis.');
  return result;
}
module.exports = endpoint(async (req, res) => {
  const config = storage();
  if (req.method === 'GET') {
    authenticate(req);
    if (!config) return res.status(200).json({ configured: false });
    const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
    const data = await commands(config, days.map(day => ['HGETALL', `maria:events:${day}`]));
    const counts = Object.fromEntries(EVENTS.map(event => [event, 0]));
    for (const row of data) { const entries = Array.isArray(row.result) ? Array.from({ length: row.result.length / 2 }, (_, i) => [row.result[i * 2], row.result[i * 2 + 1]]) : Object.entries(row.result || {}); for (const [key, value] of entries) if (EVENTS.includes(key)) counts[key] += Number(value) || 0; }
    return res.status(200).json({ configured: true, counts });
  }
  if (!config || process.env.VERCEL_ENV !== 'production') return res.status(202).json({ recorded: false });
  const { event } = bodyOf(req, 1500);
  if (!EVENTS.includes(event)) throw error(400, 'Evento inválido.');
  const ipHash = crypto.createHash('sha256').update(String(req.headers['x-forwarded-for'] || '').split(',')[0]).digest('hex');
  rateLimit(`events:${ipHash}`, 100, 600000);
  const key = `maria:events:${new Date().toISOString().slice(0, 10)}`;
  await commands(config, [['HINCRBY', key, event, 1], ['EXPIRE', key, 5184000]]);
  res.status(202).json({ recorded: true });
});
