const test=require('node:test'),assert=require('node:assert/strict');
const {issueToken}=require('../lib/http'),handler=require('../api/translate');
const original={...process.env}, originalFetch=global.fetch;
const res=()=>({setHeader(){},status(n){this.code=n;return this;},json(v){this.body=v;}});
const req=body=>({method:'POST',headers:{authorization:'Bearer '+issueToken(),host:'test',origin:'https://test'},body});
test.afterEach(()=>{process.env={...original};global.fetch=originalFetch;});
test('translation requires auth and never implicitly enables paid API',async()=>{
 process.env.SESSION_SECRET='translate-test';let calls=0;global.fetch=async()=>{calls++;};const a=res();await handler({method:'POST',headers:{}},a);assert.equal(a.code,401);
 process.env.DEEPL_API_KEY='paid-key';const b=res();await handler(req({source:'pt',texts:['Olá']}),b);assert.equal(b.code,503);assert.equal(calls,0);
});
test('translation preserves array order and empty fields and returns only complete results',async()=>{
 process.env.SESSION_SECRET='translate-test';process.env.DEEPL_API_KEY='secret:fx';let calls=0;
 global.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api-free.deepl.com/v2/translate');const data=JSON.parse(options.body);assert.deepEqual(data.text,['Olá','Pesquisa']);return {ok:true,json:async()=>({translations:data.text.map(text=>({text:data.target_lang+text}))})};};
 const r=res();await handler(req({source:'pt',texts:['Olá','','Pesquisa']}),r);assert.equal(r.code,200);assert.deepEqual(r.body.translations.en,['EN-USOlá','','EN-USPesquisa']);assert.deepEqual(r.body.translations.es,['ESOlá','','ESPesquisa']);assert.equal(calls,2);assert.ok(!JSON.stringify(r.body).includes('secret:fx'));
});
test('partial provider failure never returns translations as successful',async()=>{
 process.env.SESSION_SECRET='translate-test';process.env.DEEPL_API_KEY='secret:fx';let calls=0;global.fetch=async()=>++calls===1?{ok:true,json:async()=>({translations:[{text:'Hello'}]})}:{ok:false};const r=res();await handler(req({source:'pt',texts:['Olá']}),r);assert.equal(r.code,503);assert.equal(r.body.translations,undefined);
});
