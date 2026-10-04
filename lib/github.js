const { error } = require('./http');
function config() {
  const { GITHUB_TOKEN: token, GITHUB_OWNER: owner, GITHUB_REPO: repo } = process.env;
  if (!token || !owner || !repo) throw error(503, 'A conexão com o GitHub ainda não está configurada na Vercel.');
  return { token, base: `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, branch: process.env.GITHUB_BRANCH || 'main' };
}
async function request(path, options = {}) {
  const { token, base } = config();
  const response = await fetch(base + path, { ...options, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'maria-portfolio-admin', 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw error(response.status === 409 || response.status === 422 ? 409 : 502, response.status === 409 || response.status === 422 ? 'O site mudou durante a edição. Recarregue a versão publicada e compare com o seu rascunho.' : 'A conexão com o GitHub falhou. Seu rascunho continua salvo neste navegador.');
  return response.json();
}
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
async function head() { return (await request(`/git/ref/heads/${encodeURIComponent(config().branch)}`)).object.sha; }
const contentCache = new Map();
async function contentAt(revision) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw error(400, 'Versão inválida.');
  const key = config().base + ':' + revision;
  if (!contentCache.has(key)) {
    const pending = request(`/contents/content.json?ref=${revision}`).then(data => JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')));
    contentCache.set(key,pending);
    pending.catch(() => { if(contentCache.get(key)===pending)contentCache.delete(key); });
    if(contentCache.size>8)contentCache.delete(contentCache.keys().next().value);
  }
  return structuredClone(await contentCache.get(key));
}
async function snapshot(revision) { const sha = revision || await head(); return { revision: sha, content: await contentAt(sha) }; }
async function history() {
  const commits = await request(`/commits?sha=${encodeURIComponent(config().branch)}&path=content.json&per_page=20`);
  return commits.map(c => ({ revision: c.sha, date: c.commit.committer.date, message: c.commit.message.split('\n')[0] }));
}
async function publish(content, revision, photo) {
  if (!/^[a-f0-9]{40}$/.test(revision || '')) throw error(400, 'Carregue a versão atual antes de publicar.');
  if (await head() !== revision) throw error(409, 'Há uma versão mais recente no GitHub. Carregue a versão publicada e compare antes de publicar.');
  const current = await request(`/git/commits/${revision}`);
  const entries = [{ path: 'content.json', mode: '100644', type: 'blob', content: JSON.stringify(content, null, 2) + '\n' }];
  if (photo) { const blob = await post('/git/blobs', { content: photo, encoding: 'base64' }); entries.push({ path: 'photo.jpg', mode: '100644', type: 'blob', sha: blob.sha }); }
  const tree = await post('/git/trees', { base_tree: current.tree.sha, tree: entries });
  const commit = await post('/git/commits', { message: 'Publish reviewed portfolio content', tree: tree.sha, parents: [revision] });
  await request(`/git/refs/heads/${encodeURIComponent(config().branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
  return commit.sha;
}
module.exports = { snapshot, history, publish };
