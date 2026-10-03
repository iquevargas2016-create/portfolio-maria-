const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const V = require('../shared/view');
const content = require('../content.json');
function dom(type) {
 const d = new JSDOM(V.renderPage(content, { lang:'pt',type,preview:true,contactDemo:true }), { url:'https://example.test/pt/'+(type==='cv'?'cv/':''),runScripts:'outside-only' });
 d.window.Portfolio=V; d.window.eval(fs.readFileSync('site.js','utf8')); return d;
}
test('research search and themes filter without inventing results', () => {
 const d=dom('home'), w=d.window, input=w.document.getElementById('research-search');
 input.value='inexistente';input.dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelector('#research-results li').hidden,true);assert.equal(w.document.getElementById('research-empty').hidden,false);
 input.value='eletrodos';input.dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelector('#research-results li').hidden,false);d.window.close();
});
test('CV focus changes order, deselection changes printable content', () => {
 const d=dom('cv'),w=d.window,focus=w.document.getElementById('cv-focus');focus.value='research';focus.dispatchEvent(new w.Event('change'));
 assert.ok(w.document.getElementById('projects').compareDocumentPosition(w.document.getElementById('education')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
 const input=w.document.querySelector('[data-cv-include]');input.checked=false;input.dispatchEvent(new w.Event('change'));assert.ok(input.closest('li').classList.contains('cv-excluded'));assert.equal(new URL(w.location.href).searchParams.get('focus'),'research');w.close();
});
test('public pages have no phone, experience links resolve and conference QR exists', () => {
 for (const lang of V.LANGS) {
  for (const type of ['home','cv','card','event']) { const html=V.renderPage(content,{lang,type});assert.ok(!html.includes('tel:'));assert.ok(!html.includes(content[lang].contact_phone_value)); }
  const doc=new JSDOM(V.renderPage(content,{lang})).window.document;
  for(const b of doc.querySelectorAll('.experience-share')) assert.ok(doc.getElementById(new URL(b.dataset.copy).hash.slice(1)));
  const event=V.renderPage(content,{lang,type:'event'});assert.ok(event.includes(`/${lang}/profile-qr.svg`));
 }
});
test('opportunity inbox requires authentication and rejects cross-origin writes', async () => {
 const handler=require('../api/opportunities');const res=()=>({statusCode:0,setHeader(){},status(n){this.statusCode=n;return this;},json(x){this.body=x;return this;}});
 const a=res();await handler({method:'GET',headers:{}},a);assert.equal(a.statusCode,401);
 const b=res();await handler({method:'POST',headers:{host:'a.test',origin:'https://b.test'},body:{}},b);assert.equal(b.statusCode,403);
});
