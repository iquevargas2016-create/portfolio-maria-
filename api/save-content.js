const { endpoint, authenticate, bodyOf, error } = require('../lib/http');
const { validate, photoData } = require('../lib/content');
const { publish } = require('../lib/github');
module.exports = endpoint(async (req, res) => {
  authenticate(req);
  if (process.env.VERCEL_ENV !== 'production') throw error(403, 'Esta é uma prévia. Publique pelo painel do site de produção.');
  const { content, revision, photo } = bodyOf(req, 2600000);
  if (Object.keys(content?.editorial?.translationPending || {}).length) throw error(400, 'Conclua as traduções antes de publicar.');
  const nextRevision = await publish(validate(content), revision, photoData(photo));
  res.status(200).json({ ok: true, revision: nextRevision, message: 'Alterações salvas. Seu site será atualizado em instantes.' });
}, ['POST']);
