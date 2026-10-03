const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const content = require('../content.json');
const V = require('../shared/view');
const script = file => fs.readFileSync(require.resolve('../' + file), 'utf8');
const settle = () => new Promise(resolve => setTimeout(resolve, 20));
async function admin(enableAssistant = false) {
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
  w.eval(enableAssistant ? script('shared/view.js').replace('assistantUI: false', 'assistantUI: true') : script('shared/view.js')); w.eval(script('admin/i18n.js')); w.eval(script('admin/admin.js')); await settle();
  return { dom, w, d: w.document, requests };
}
test('demo edits and persists a draft, compares it, and cannot publish', async () => {
  const { dom, w, d, requests } = await admin();
  assert.equal(d.querySelector('#app').hidden, false); assert.equal(d.querySelector('#publish').disabled, true);
  w.dispatchEvent(new w.MessageEvent('message',{source:d.querySelector('iframe').contentWindow,data:{kind:'maria-edit-section',section:'profile'}}));
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
  const { dom, d, w, requests } = await admin(true);
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
  const { dom, d, w, requests } = await admin(true);
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
  const { dom, d, w } = await admin(); d.querySelector('[data-section="projects"]').click();
  const field = [...d.querySelectorAll('textarea')].find(n => n.dataset.path === '["collections","projects",0,"desc","pt"]');
  field.value = 'Descrição revisada.'; field.dispatchEvent(new w.Event('input', { bubbles: true }));
  const draft = JSON.parse(w.localStorage.getItem('maria-draft-v2-demo')).content;
  assert.equal(draft.collections.projects[0].slug, 'electrode-durability'); assert.equal(draft.collections.projects[0].desc.en, content.collections.projects[0].desc.en); dom.window.close();
});

test('assistant controls are absent by default in admin and every public preview', async () => {
  const { dom, d } = await admin();
  assert.equal(d.querySelector('[data-tab="assistant"]'), null);
  assert.equal(d.querySelector('[data-edit-ai]'), null);
  for (const lang of V.LANGS) for (const type of ['home', 'cv', 'card', 'project']) {
    const html = V.renderPage({ ...content, features: { assistant: true } }, { lang, type, slug: 'electrode-durability', preview: true });
    assert.equal(new JSDOM(html).window.document.querySelector('#portfolio-helper'), null);
  }
  dom.window.close();
});

test('visual editor selects only known text, saves a draft, switches all UI and previews appearance', async () => {
  const {dom,d,w,requests}=await admin();
  assert.ok(d.querySelector('#visual-edit'));
  const frame=d.querySelector('#preview-frame');
  const page=new JSDOM(frame.srcdoc); const selection=[...page.window.document.querySelectorAll('[data-visual-id]')].find(n=>n.textContent===content.pt.summary);
  assert.ok(selection);
  const location=page.window.document.querySelectorAll('.contact-value')[1];assert.ok(location.hasAttribute('data-visual-id'));
  w.dispatchEvent(new w.MessageEvent('message',{data:{kind:'maria-edit',id:Number(location.dataset.visualId)},source:frame.contentWindow}));assert.equal(d.querySelector('#visual-text').value,'Buenos Aires, Argentina');
  const message={kind:'maria-edit',id:Number(selection.dataset.visualId)};
  w.dispatchEvent(new w.MessageEvent('message',{data:message,source:w}));assert.equal(d.querySelector('#visual-text'),null);
  w.dispatchEvent(new w.MessageEvent('message',{data:message,source:frame.contentWindow}));
  d.querySelector('#visual-text').value='Novo resumo visual.';d.querySelector('#visual-save').click();
  assert.match(frame.srcdoc,/Novo resumo visual/);
  assert.equal(JSON.parse(w.localStorage.getItem('maria-draft-v2-demo')).content.pt.summary,'Novo resumo visual.');
  const device=d.querySelector('#visual-device');device.value='mobile';device.dispatchEvent(new w.Event('change',{bubbles:true}));assert.ok(d.querySelector('#preview-frame').classList.contains('mobile'));
  const color=d.querySelector('#visual-color');color.value='#225588';color.dispatchEvent(new w.Event('change',{bubbles:true}));assert.match(d.querySelector('#preview-frame').srcdoc,/--brand:#225588/);
  const theme=d.querySelector('#visual-theme');theme.value='dark';theme.dispatchEvent(new w.Event('change',{bubbles:true}));assert.match(d.querySelector('#preview-frame').srcdoc,/background:#090b0e/);assert.match(d.querySelector('#preview-frame').srcdoc,/color:#f0f3f6/);
  const lang=d.querySelector('#edit-language');lang.value='en';lang.dispatchEvent(new w.Event('change',{bubbles:true}));await settle();
  assert.equal(d.documentElement.lang,'en');assert.equal(d.querySelector('[data-tab="visual"]').textContent,'Edit on the website');assert.equal(d.querySelector('#publish').textContent,'Publish');assert.match(d.querySelector('iframe').srcdoc,/lang="en"/);
  assert.equal(d.querySelector('#publish').disabled,true);assert.ok(requests.every(url=>!url.startsWith('/api/')));
  page.window.close();dom.window.close();
});

test('fixed labels cannot be selected and education can only be added, completed or deleted', async () => {
  const {dom,d,w}=await admin();
  const page=new JSDOM(d.querySelector('iframe').srcdoc);
  for(const node of page.window.document.querySelectorAll('.contact-label,.hero-actions a:first-child,.hero-actions a:last-child')) assert.equal(node.hasAttribute('data-visual-id'),false);
  d.querySelector('[data-section="contact"]').click();
  for(const key of ['contact_email_label','contact_location_label','hero_research','hero_contact','languages_title']) assert.equal([...d.querySelectorAll('[data-path]')].some(n=>n.dataset.path===JSON.stringify(['pt',key])),false);
  d.querySelector('[data-section="education"]').click();assert.equal(d.querySelector('#panel textarea'),null);assert.ok(d.querySelector('[data-delete]'));
  d.querySelector('[data-add]').click();
  const title=[...d.querySelectorAll('textarea')].find(n=>n.dataset.path.endsWith(',"title","pt"]'));assert.ok(title);
  title.value='Nova formação';title.dispatchEvent(new w.Event('input',{bubbles:true}));
  d.querySelector('[data-finish-education]').click();assert.equal(d.querySelector('#panel textarea'),null);
  assert.match(d.querySelector('#panel').textContent,/Nova formação/);
  page.window.close();dom.window.close();
});
