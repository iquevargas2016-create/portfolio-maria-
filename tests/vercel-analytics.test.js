const test=require('node:test'),assert=require('node:assert/strict');
const http=require('../lib/http'), handler=require('../api/vercel-analytics');
const original={...process.env}, originalFetch=global.fetch;
function res(){return {setHeader(){},status(n){this.statusCode=n;return this;},json(v){this.body=v;}};}
const req=()=>({method:'GET',headers:{authorization:'Bearer '+http.issueToken()}});
test.afterEach(()=>{process.env={...original};global.fetch=originalFetch;});
test('metrics require login; absent token and previews make no provider calls',async()=>{
 process.env.SESSION_SECRET='analytics-test';let calls=0;global.fetch=async()=>{calls++;throw Error();};
 const a=res();await handler({method:'GET',headers:{}},a);assert.equal(a.statusCode,401);
 delete process.env.VERCEL_ANALYTICS_TOKEN;const b=res();await handler(req(),b);assert.deepEqual(b.body,{configured:false});
 process.env.VERCEL_ANALYTICS_TOKEN='test-private';process.env.VERCEL_ENV='preview';const c=res();await handler(req(),c);assert.deepEqual(c.body,{configured:false});assert.equal(calls,0);
});
test('provider rejection is unavailable, not fabricated zero traffic',async()=>{
 process.env.SESSION_SECRET='analytics-test';process.env.VERCEL_ANALYTICS_TOKEN='denied';process.env.VERCEL_ENV='production';global.fetch=async()=>({ok:false,status:403});const r=res();await handler(req(),r);assert.equal(r.statusCode,503);assert.ok(!JSON.stringify(r.body).includes('denied'));assert.equal(r.body.daily,undefined);
});
test('official queries are fixed to project, production and bounded interval; response cache hides token',async()=>{
 process.env.SESSION_SECRET='analytics-test';process.env.VERCEL_ANALYTICS_TOKEN='private-test-token';process.env.VERCEL_ENV='production';let calls=0;
 global.fetch=async(url,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer private-test-token');assert.equal(url.origin,'https://api.vercel.com');assert.equal(url.searchParams.get('filter'),"environment eq 'production'");assert.ok(url.searchParams.get('projectId'));const by=url.searchParams.get('by');return {ok:true,json:async()=>({data:[{[by==='day'?'timestamp':by]:by==='day'?'2026-10-03T00:00:00Z':'test',pageviews:5,visitors:3}]})};};
 const a=res();await handler(req(),a);assert.equal(a.statusCode,200);assert.equal(a.body.daily[0].pageviews,5);assert.ok(!JSON.stringify(a.body).includes('private-test-token'));const b=res();await handler(req(),b);assert.equal(calls,4);assert.deepEqual(a.body,b.body);
});
