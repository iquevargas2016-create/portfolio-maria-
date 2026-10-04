const crypto = require('node:crypto');
const { endpoint, bodyOf, error, issueToken, rateLimit } = require('../lib/http');
module.exports = endpoint(async (req, res) => {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) throw error(503, 'O acesso administrativo ainda não está configurado na Vercel.');
  rateLimit(`login:${String(req.headers['x-forwarded-for'] || '').split(',')[0]}`, 12, 600000);
  const { password, includeContent } = bodyOf(req, 2000);
  if (typeof password !== 'string') throw error(401, 'Senha incorreta.');
  const digest = v => crypto.createHash('sha256').update(v).digest();
  if (!crypto.timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD))) throw error(401, 'Senha incorreta.');
  const result={token:issueToken()};
  if(includeContent===true){const ai=require('../lib/ai').aiConfig();Object.assign(result,await require('../lib/github').snapshot(),{canPublish:process.env.VERCEL_ENV==='production',ai:{configured:!!ai,model:ai?.model || null}});}
  res.status(200).json(result);
}, ['POST']);
