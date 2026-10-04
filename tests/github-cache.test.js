const test=require('node:test');
const assert=require('node:assert/strict');
const github=require('../lib/github');
test('content cache reuses immutable revisions but checks current head and never caches failures',async()=>{
 const originalFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{GITHUB_TOKEN:'test',GITHUB_OWNER:'cache-test',GITHUB_REPO:'test'});
 let sha='a'.repeat(40),heads=0,reads=0,fail=false;
 global.fetch=async url=>{
  if(url.includes('/git/ref/')){heads++;return{ok:true,json:async()=>({object:{sha}})};}
  reads++;if(fail)return{ok:false,status:502};
  return{ok:true,json:async()=>({content:Buffer.from(JSON.stringify({name:sha})).toString('base64')})};
 };
 try{
  const first=await github.snapshot();first.content.name='changed locally';
  assert.equal((await github.snapshot()).content.name,sha);assert.equal(heads,2);assert.equal(reads,1);
  sha='b'.repeat(40);assert.equal((await github.snapshot()).content.name,sha);assert.equal(reads,2);
  sha='c'.repeat(40);fail=true;await assert.rejects(github.snapshot());fail=false;
  assert.equal((await github.snapshot()).content.name,sha);assert.equal(reads,4);
 }finally{global.fetch=originalFetch;for(const key of ['GITHUB_TOKEN','GITHUB_OWNER','GITHUB_REPO']){if(oldEnv[key]===undefined)delete process.env[key];else process.env[key]=oldEnv[key];}}
});
