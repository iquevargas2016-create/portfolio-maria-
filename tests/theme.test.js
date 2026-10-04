const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom'),V=require('../shared/view'),content=require('../content.json');
test('public theme follows device, persists manual choice and returns to automatic mode',()=>{
 const dom=new JSDOM(V.renderPage(content,{lang:'pt',preview:true}),{url:'https://preview.test/pt/',runScripts:'outside-only'}),w=dom.window;
 let change;const media={matches:true,addEventListener:(event,callback)=>{change=callback;}};
 w.matchMedia=()=>media;w.Portfolio=V;w.eval(fs.readFileSync(require.resolve('../site.js'),'utf8'));
 const button=w.document.querySelector('[data-theme-toggle]');assert.ok(button);assert.equal(w.document.documentElement.dataset.theme,'dark');
 button.click();assert.equal(w.localStorage.getItem('maria-theme'),'dark');media.matches=false;change();assert.equal(w.document.documentElement.dataset.theme,'dark');
 button.click();assert.equal(w.document.documentElement.dataset.theme,'light');assert.equal(w.localStorage.getItem('maria-theme'),'light');
 button.click();assert.equal(w.localStorage.getItem('maria-theme'),null);assert.match(button.textContent,/Automático/);media.matches=true;change();assert.equal(w.document.documentElement.dataset.theme,'dark');
 assert.equal(new JSDOM(V.renderPage(content,{lang:'pt',preview:true,contactDemo:true})).window.document.querySelector('[data-theme-toggle]'),null);dom.window.close();
});
