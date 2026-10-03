const { endpoint, authenticate } = require('../lib/http');
module.exports = endpoint(async (req, res) => {
  authenticate(req);
  res.status(410).json({ error: 'A foto agora é salva junto com o rascunho. Atualize o painel e use Publicar.' });
}, ['POST']);
