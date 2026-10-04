const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { issueToken, verifyToken } = require('../lib/http');
const content = require('../content.json');
const originalFetch = global.fetch;
const initialEnv = { ...process.env };
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
function res() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
function req(method = 'POST', body = {}) { return { method, body, headers: { host: 'example.test', origin: 'https://example.test', authorization: `Bearer ${issueToken()}` }, query: {} }; }
test.beforeEach(() => { process.env.SESSION_SECRET = 'test-only-secret'; process.env.GITHUB_TOKEN = 'test-only-token'; process.env.GITHUB_OWNER = 'test'; process.env.GITHUB_REPO = 'test'; process.env.VERCEL_ENV = 'production'; });
test.afterEach(() => { global.fetch = originalFetch; for (const key of Object.keys(process.env)) if (!(key in initialEnv)) delete process.env[key]; Object.assign(process.env, initialEnv); });
test('tokens are signed, bounded and reject malformed or expired values', () => {
  assert.ok(verifyToken(issueToken()));
  for (const token of ['', 'x.x', issueToken() + '.extra', issueToken().replace(/.$/, 'z')]) assert.equal(verifyToken(token), false);
  const expiry = String(Date.now() - 1), signature = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(expiry).digest('hex');
  assert.equal(verifyToken(`${expiry}.${signature}`), false);
});
test('unauthenticated and cross-origin requests cannot publish', async () => {
  const handler = require('../api/save-content'); let calls = 0; global.fetch = async () => { calls++; throw Error(); };
  const a = req(); a.headers.authorization = ''; const ar = res(); await handler(a, ar); assert.equal(ar.code, 401);
  const b = req(); b.headers.origin = 'https://evil.test'; const br = res(); await handler(b, br); assert.equal(br.code, 403);
  assert.equal(calls, 0);
});
test('preview can never publish even with a valid session', async () => {
  process.env.VERCEL_ENV = 'preview'; const result = res(); let called = false; global.fetch = async () => { called = true; };
  await require('../api/save-content')(req(), result); assert.equal(result.code, 403); assert.equal(called, false);
});
test('publishing checks the loaded revision and updates the ref without force', async () => {
  const sha = 'a'.repeat(40), next = 'b'.repeat(40), calls = [];
  global.fetch = async (url, options) => { calls.push({ url, ...options }); if (url.includes('/git/ref/heads/')) return response({ object: { sha } }); if (url.endsWith(`/git/commits/${sha}`)) return response({ tree: { sha: 'tree' } }); if (url.endsWith('/git/trees')) return response({ sha: 'newtree' }); if (url.endsWith('/git/commits')) return response({ sha: next }); if (url.includes('/git/refs/heads/')) return response({}); throw Error(url); };
  const result = res(); await require('../api/save-content')(req('POST', { content, revision: sha }), result);
  assert.equal(result.code, 200); assert.equal(result.body.revision, next);
  const patch = calls.find(c => c.method === 'PATCH'); assert.deepEqual(JSON.parse(patch.body), { sha: next, force: false });
  const commit = calls.find(c => c.url.endsWith('/git/commits')); assert.deepEqual(JSON.parse(commit.body).parents, [sha]);
});
test('a stale revision is rejected before creating a commit', async () => {
  let calls = 0; global.fetch = async () => { calls++; return response({ object: { sha: 'c'.repeat(40) } }); };
  const result = res(); await require('../api/save-content')(req('POST', { content, revision: 'a'.repeat(40) }), result);
  assert.equal(result.code, 409); assert.equal(calls, 1);
});
test('concurrent update after reading the head returns a conflict, never forced', async () => {
  const sha = 'a'.repeat(40); global.fetch = async (url, options) => { if (url.includes('/git/ref/heads/')) return response({ object: { sha } }); if (url.endsWith(`/git/commits/${sha}`)) return response({ tree: { sha: 'tree' } }); if (url.includes('/git/refs/heads/')) { assert.equal(JSON.parse(options.body).force, false); return response({}, 422); } return response({ sha: 'b'.repeat(40) }); };
  const result = res(); await require('../api/save-content')(req('POST', { content, revision: sha }), result); assert.equal(result.code, 409);
});
test('paid AI is opt-in, authenticated, and does not call provider when disabled', async () => {
  delete process.env.AI_ENABLED; process.env.OPENAI_API_KEY = 'test-key'; let calls = 0; global.fetch = async () => { calls++; };
  const result = res(); await require('../api/ai')(req('POST', { text: 'Medical student', action: 'review', language: 'pt' }), result); assert.equal(result.code, 503); assert.equal(calls, 0);
});
test('AI returns suggestions only and handles incomplete output without applying it', async () => {
  process.env.AI_ENABLED = 'true'; process.env.OPENAI_API_KEY = 'test-key'; delete process.env.VERCEL_OIDC_TOKEN; delete process.env.AI_GATEWAY_API_KEY;
  global.fetch = async (url, options) => { assert.equal(url, 'https://api.openai.com/v1/responses'); const payload = JSON.parse(options.body); assert.equal(payload.store, false); assert.ok(payload.max_output_tokens <= 2400); return response({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Estudante de Medicina' }] }] }); };
  const result = res(); await require('../api/ai')(req('POST', { text: 'Medical student', action: 'translate', language: 'pt' }), result); assert.equal(result.code, 200); assert.equal(result.body.text, 'Estudante de Medicina');
  global.fetch = async () => response({ status: 'incomplete', output: [] }); const failed = res(); await require('../api/ai')(req('POST', { text: 'Medical student', action: 'review', language: 'pt' }), failed); assert.equal(failed.code, 502);
});
test('analytics never invents zero counts when storage is absent and requires login', async () => {
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.KV_REST_API_URL;
  const result = res(); await require('../api/analytics')(req('GET'), result); assert.deepEqual(result.body, { configured: false });
  const unauth = req('GET'); unauth.headers.authorization = ''; const denied = res(); await require('../api/analytics')(unauth, denied); assert.equal(denied.code, 401);
});

test('login can return authenticated content in the same response and rejects wrong passwords before repository access',async()=>{
 process.env.ADMIN_PASSWORD='test-password';process.env.GITHUB_REPO='login-speed-test';
 let calls=0;global.fetch=async url=>{calls++;return response(url.includes('/git/ref/')?{object:{sha:'d'.repeat(40)}}:{content:Buffer.from(JSON.stringify(content)).toString('base64')});};
 const bad=res();await require('../api/login')(req('POST',{password:'wrong',includeContent:true}),bad);assert.equal(bad.code,401);assert.equal(calls,0);
 const result=res();await require('../api/login')(req('POST',{password:'test-password',includeContent:true}),result);assert.equal(result.code,200);assert.ok(verifyToken(result.body.token));assert.equal(result.body.content.pt.summary,content.pt.summary);assert.equal(result.body.canPublish,true);assert.equal(calls,2);assert.equal(result.headers['Cache-Control'],'no-store');
});
