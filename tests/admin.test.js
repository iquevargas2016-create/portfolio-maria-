const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const content = require('../content.json');
const V = require('../shared/view');
const script = file => fs.readFileSync(require.resolve('../' + file), 'utf8');
const settle = () => new Promise(resolve => setTimeout(resolve, 20));
async function admin() {
  const dom = new JSDOM(script('admin/index.html'), { url: 'https://preview.test/admin/?demo=1', runScripts: 'outside-only' });
  const w = dom.window, requests = [];
  w.structuredClone = structuredClone; w.confirm = () => true;
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  w.fetch = async url => {
    requests.push(url);
    assert.ok(['/content.json', '/styles.css', '/shared/view.js', '/site.js', '/photo.jpg'].includes(url));
    const bytes = url === '/content.json' ? null : fs.readFileSync(require.resolve('..' + url));
    return { ok: true, json: async () => structuredClone(content), text: async () => bytes.toString(), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  };
  w.eval(script('shared/view.js')); w.eval(script('admin/admin.js')); await settle();
  return { dom, w, d: w.document, requests };
}
test('demo edits and persists a draft, compares it, and cannot publish', async () => {
  const { dom, w, d, requests } = await admin();
  assert.equal(d.querySelector('#app').hidden, false); assert.equal(d.querySelector('#publish').disabled, true);
  const input = [...d.querySelectorAll('textarea[data-path]')].find(n => n.dataset.path === '["pt","summary"]');
  input.value = 'Resumo revisado no rascunho.'; input.dispatchEvent(new w.Event('input', { bubbles: true }));
  const saved = JSON.parse(w.localStorage.getItem('maria-draft-v2-demo')); assert.equal(saved.content.pt.summary, input.value);
  d.querySelector('#open-preview').click();
  assert.match(d.querySelector('iframe').srcdoc, /Resumo revisado no rascunho/);
  const version = d.querySelector('#preview-source'); version.value = 'published'; version.dispatchEvent(new w.Event('change', { bubbles: true }));
  assert.ok(d.querySelector('iframe').srcdoc.includes(content.pt.summary));
  assert.ok(requests.every(url => !url.startsWith('/api/'))); dom.window.close();
});
test('manual ChatGPT suggestion only changes draft after explicit acceptance', async () => {
  const { dom, d, w, requests } = await admin();
  d.querySelector('[data-tab="assistant"]').click();
  d.querySelector('[data-edit-ai]').click(); assert.ok(d.querySelector('#ai-dialog').open);
  assert.equal(d.querySelector('#paid-test').disabled, true); assert.equal(d.querySelector('#generate-ai').disabled, true);
  d.querySelector('#ai-result').value = 'Sugestão revisada pela autora.';
  assert.equal(w.localStorage.getItem('maria-draft-v2-demo'), null);
  d.querySelector('#accept-ai').click();
  assert.equal(JSON.parse(w.localStorage.getItem('maria-draft-v2-demo')).content.pt.summary, 'Sugestão revisada pela autora.');
  assert.ok(requests.every(url => !url.startsWith('/api/'))); dom.window.close();
});
test('assistant test does not enable the published feature or invoke a model', async () => {
  const { dom, d, w, requests } = await admin();
  d.querySelector('[data-tab="assistant"]').click(); assert.equal(d.querySelector('#assistant-enabled').checked, false);
  d.querySelector('[data-test-assistant]').click();
  const html = d.querySelector('iframe').srcdoc, page = new JSDOM(html, { url: 'https://preview.test/pt/', runScripts: 'outside-only' });
  const pw = page.window; pw.eval(script('shared/view.js')); pw.eval(script('site.js'));
  const helper = pw.document.querySelector('#portfolio-helper'); assert.equal(helper.open, false); helper.open = true;
  helper.querySelector('input').value = 'eletroquimioterapia'; helper.querySelector('form').dispatchEvent(new pw.Event('submit', { bubbles: true, cancelable: true }));
  assert.ok(helper.querySelector('[data-results]').textContent.includes(content.collections.projects[0].desc.pt));
  helper.querySelector('input').value = 'xyzsemresultado'; helper.querySelector('form').dispatchEvent(new pw.Event('submit', { bubbles: true, cancelable: true }));
  assert.match(helper.querySelector('[data-results]').textContent, /Não encontrei/);
  assert.equal(w.localStorage.getItem('maria-draft-v2-demo'), null); assert.ok(requests.every(url => !url.startsWith('/api/'))); page.window.close(); dom.window.close();
});
test('editing an existing project preserves its permanent address and other languages', async () => {
  const { dom, d, w } = await admin(); d.querySelector('[data-tab="projects"]').click();
  const field = [...d.querySelectorAll('textarea')].find(n => n.dataset.path === '["collections","projects",0,"desc","pt"]');
  field.value = 'Descrição revisada.'; field.dispatchEvent(new w.Event('input', { bubbles: true }));
  const draft = JSON.parse(w.localStorage.getItem('maria-draft-v2-demo')).content;
  assert.equal(draft.collections.projects[0].slug, 'electrode-durability'); assert.equal(draft.collections.projects[0].desc.en, content.collections.projects[0].desc.en); dom.window.close();
});
