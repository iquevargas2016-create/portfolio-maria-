const { endpoint, authenticate, error } = require('../lib/http');
const github = require('../lib/github');
const { aiConfig } = require('../lib/ai');
module.exports = endpoint(async (req, res) => {
  authenticate(req);
  const action = req.query?.action || 'current';
  if (action === 'history') return res.status(200).json({ versions: await github.history() });
  if (action === 'version') { if (typeof req.query?.revision !== 'string') throw error(400, 'Versão inválida.'); return res.status(200).json(await github.snapshot(req.query.revision)); }
  if (action !== 'current') throw error(400, 'Ação inválida.');
  const ai = aiConfig();
  res.status(200).json({ ...await github.snapshot(), canPublish: process.env.VERCEL_ENV === 'production', ai: { configured: !!ai, model: ai?.model || null } });
}, ['GET']);
