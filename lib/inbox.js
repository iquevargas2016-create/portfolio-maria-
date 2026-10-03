const { error } = require('./http');
function config() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return process.env.CONTACT_INBOX_ENABLED === 'true' && url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function command(args) {
  const c = config(); if (!c) throw error(503, 'Caixa de oportunidades não configurada.');
  const r = await fetch(c.url, { method: 'POST', headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw error(503, 'Caixa indisponível.');
  const data = await r.json(); if (data.error) throw error(503, 'Caixa indisponível.'); return data.result;
}
const key = id => `maria:inbox:item:${id}`;
async function save(item) {
  const inserted = await command(['SET', key(item.id), JSON.stringify(item), 'EX', 7776000, 'NX']);
  if (inserted) { await command(['ZADD', 'maria:inbox:index', Date.parse(item.createdAt), item.id]); await command(['ZREMRANGEBYRANK', 'maria:inbox:index', 0, -201]); }
}
async function list() {
  const ids = await command(['ZREVRANGE', 'maria:inbox:index', 0, 199]);
  if (!ids?.length) return [];
  const rows = await command(['MGET', ...ids.map(key)]);
  return rows.filter(Boolean).map(row => JSON.parse(row));
}
async function update(id, status) {
  const raw = await command(['GET', key(id)]); if (!raw) throw error(404, 'Mensagem não encontrada.');
  const item = JSON.parse(raw); item.status = status;
  await command(['SET', key(id), JSON.stringify(item), 'KEEPTTL', 'XX']); return item;
}
module.exports = { config, save, list, update };
