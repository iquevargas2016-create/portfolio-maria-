const { endpoint, authenticate, error, rateLimit } = require('../lib/http');
let cached;
module.exports = endpoint(async (req, res) => {
  authenticate(req);
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID || 'prj_2Iesno2gQouFpsMgmmKtqSOOgOzw';
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID || 'team_0uDuzbwkbTfQy8uWoGIGPtgf';
  if (!token || process.env.VERCEL_ENV !== 'production') return res.status(200).json({ configured: false });
  if (cached && cached.token === token && cached.projectId === projectId && cached.teamId === teamId && cached.until > Date.now()) return res.status(200).json(cached.data);
  rateLimit('vercel-analytics-read', 30, 600000);
  const until = new Date(), since = new Date(until.getTime() - 6 * 86400000); since.setUTCHours(0,0,0,0);
  const dimensions = ['day', 'requestPath', 'country', 'deviceType'];
  const rows = await Promise.all(dimensions.map(async by => {
    const url = new URL('https://api.vercel.com/v1/query/web-analytics/visits/aggregate');
    for (const [key,value] of Object.entries({projectId,teamId,since:since.toISOString(),until:until.toISOString(),by,limit:'10',filter:"environment eq 'production'"})) url.searchParams.set(key,value);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw error(503, response.status === 401 || response.status === 403 ? 'As estatísticas de visitas estão indisponíveis no momento.' : 'As estatísticas de visitas estão indisponíveis no momento.');
    const result = await response.json();
    if (!Array.isArray(result.data) || result.data.some(r => !Number.isFinite(r.pageviews) || r.pageviews < 0 || !Number.isFinite(r.visitors) || r.visitors < 0)) throw error(502, 'Resposta de estatísticas inválida.');
    return result.data.map(r => ({label:String(by === 'day' ? r.timestamp : r[by] ?? 'Não informado').slice(0,250),pageviews:r.pageviews,visitors:r.visitors}));
  }));
  const data = { configured:true,since:since.toISOString(),until:until.toISOString(),updatedAt:new Date().toISOString(),daily:rows[0],pages:rows[1],countries:rows[2],devices:rows[3] };
  cached = { token, projectId, teamId, until:Date.now()+300000, data }; res.status(200).json(data);
}, ['GET']);
