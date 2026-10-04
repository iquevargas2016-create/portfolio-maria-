const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {RELOAD_POSITION_SCRIPT}=require('../shared/view');
function page(type){const dom=new JSDOM('<html><body></body></html>',{url:'https://example.test/pt/?demo=1#education',runScripts:'outside-only'});const w=dom.window,calls=[];w.performance.getEntriesByType=()=>[{type}];w.scrollTo=value=>calls.push(value);w.eval(RELOAD_POSITION_SCRIPT);return{dom,w,calls};}
test('reload starts at top and removes the old section while preserving query parameters',()=>{
 const {dom,w,calls}=page('reload');assert.equal(w.location.hash,'');assert.equal(w.location.search,'?demo=1');assert.equal(w.history.scrollRestoration,'manual');assert.equal(calls[0].top,0);
 w.dispatchEvent(new w.Event('load'));assert.equal(calls.length,2);
 w.dispatchEvent(new w.Event('wheel'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));assert.equal(calls.length,2);dom.window.close();
});
test('normal section links and browser back navigation retain their requested section',()=>{
 for(const type of ['navigate','back_forward']){const {dom,w,calls}=page(type);assert.equal(w.location.hash,'#education');assert.equal(calls.length,0);dom.window.close();}
});
