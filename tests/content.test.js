const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');
const V = require('../shared/view');
const { validate, photoData } = require('../lib/content');
const content = require('../content.json');

test('all languages and document types render existing facts without invented credentials', () => {
  for (const lang of V.LANGS) for (const type of ['home', 'project', 'cv', 'card']) {
    const html = V.renderPage(content, { lang, type, slug: 'electrode-durability' });
    const dom = new JSDOM(html), doc = dom.window.document;
    assert.equal(doc.documentElement.lang, lang);
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.match(doc.title, /Maria Eduarda Miranda/);
    assert.equal(doc.querySelectorAll('link[hreflang]').length, 4);
    assert.ok(doc.querySelector('link[rel="canonical"]').href.includes(V.pathFor(lang, type, 'electrode-durability')));
    assert.equal(doc.querySelector('#portfolio-helper'), null);
    assert.equal(doc.querySelector('#education-publications-block'), null);
    assert.equal(new Set([...doc.querySelectorAll('[id]')].map(n => n.id)).size, doc.querySelectorAll('[id]').length);
    if (type === 'cv') assert.match(doc.querySelector('main').textContent, /2022 — 2028/);
    if (type === 'project') assert.ok(doc.querySelector('h1').textContent.includes(content.collections.projects[0].title[lang]));
    dom.window.close();
  }
});
test('render escapes HTML, structured data and rejects unsafe external URLs', () => {
  const c = structuredClone(content); c.pt.summary = '</script><img src=x onerror=alert(1)>';
  c.collections.projects[0].link = 'javascript:alert(1)'; c.collections.projects[0].title.pt = '<script>alert(1)</script>';
  const html = V.renderPage(c, { lang: 'pt', preview: true });
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelector('img[onerror]'), null);
  assert.equal(doc.querySelector('a[href^="javascript:"]'), null);
  assert.ok(doc.querySelector('.summary').textContent.includes('</script>'));
  assert.doesNotThrow(() => JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent));
  assert.doesNotThrow(() => JSON.parse(doc.querySelector('#helper-content').textContent));
});
test('validation rejects duplicate/perilous slugs, malformed translations, email and images', () => {
  assert.doesNotThrow(() => validate(content));
  for (const mutate of [c => c.collections.projects.push(c.collections.projects[0]), c => c.collections.projects[0].slug = '../../admin', c => c.pt.contact_email_value = 'bad\nemail', c => c.collections.education[0].title.es = '', c => c.collections.projects[0].tags.pt = 'bad']) {
    const c = structuredClone(content); mutate(c); assert.throws(() => validate(c));
  }
  assert.throws(() => photoData('data:image/jpeg;base64,YmFk'));
  assert.equal(photoData(null), null);
});
test('build generates all route targets, folded vCards, and an allowlisted offline cache', () => {
  execFileSync(process.execPath, ['scripts/build.js'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, VERCEL_ENV: 'preview' } });
  const out = path.resolve(__dirname, '../public');
  for (const lang of V.LANGS) for (const type of ['home', 'cv', 'card', 'project']) {
    const route = V.pathFor(lang, type, 'electrode-durability');
    const doc = new JSDOM(fs.readFileSync(path.join(out, route, 'index.html'), 'utf8')).window.document;
    assert.ok(doc.querySelector('meta[name="robots"]'));
    assert.equal(doc.querySelector('script[src*="insights"]'), null);
    for (const node of doc.querySelectorAll('a[href^="/"],script[src^="/"],link[href^="/"],img[src^="/"]')) {
      const value = (node.getAttribute('href') || node.getAttribute('src')).split('#')[0];
      assert.ok(fs.existsSync(path.join(out, value, value.endsWith('/') ? 'index.html' : '')), `Missing ${value}`);
    }
    const card = fs.readFileSync(path.join(out, lang, 'contact.vcf'), 'utf8');
    assert.match(card, /BEGIN:VCARD/); assert.match(card, /END:VCARD/);
    assert.ok(card.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
  }
  const sw = fs.readFileSync(path.join(out, 'sw.js'), 'utf8');
  assert.match(sw, /!FILES.includes\(url.pathname\)/);
  assert.ok(!sw.includes('/admin/') && !sw.includes('/api/'));
  assert.ok(!fs.existsSync(path.join(out, 'lib')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'content.json'))).editorial, undefined);
});
