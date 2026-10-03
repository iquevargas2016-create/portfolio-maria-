const { endpoint, authenticate, bodyOf, error } = require('../lib/http');
const inbox = require('../lib/inbox');
module.exports = endpoint(async (req, res) => {
  authenticate(req);
  if (process.env.VERCEL_ENV !== 'production' || !inbox.config()) return res.status(200).json({ configured: false });
  if (req.method === 'GET') return res.status(200).json({ configured: true, items: await inbox.list() });
  const { id, status } = bodyOf(req, 500);
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/i.test(id) || !['received', 'progress', 'replied'].includes(status)) throw error(400, 'Dados inválidos.');
  await inbox.update(id, status); res.status(200).json({ ok: true });
});
