const { endpoint, authenticate, bodyOf, rateLimit } = require('../lib/http');
const { suggest } = require('../lib/ai');
module.exports = endpoint(async (req, res) => {
  const token = authenticate(req);
  rateLimit(`ai:${token}`, 30);
  res.status(200).json(await suggest(bodyOf(req, 30000)));
}, ['POST']);
