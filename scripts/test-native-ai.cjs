const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
const store=new Map();let calls=[],fail=0;const secure={WHEN_UNLOCKED_THIS_DEVICE_ONLY:1,getItemAsync:async k=>store.get(k)||null,setItemAsync:async(k,v)=>store.set(k,v),deleteItemAsync:async k=>store.delete(k)};
const deps={'react-native':{Platform:{OS:'android'}},'expo-secure-store':secure,'expo-crypto':{CryptoDigestAlgorithm:{SHA256:'sha256'},digestStringAsync:async(_,s)=>'hash-'+s}};
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync('src/lib/native-ai.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(k=>{if(!(k in deps))throw Error(k);return deps[k]},m,m.exports);
const ai=m.exports;
(async()=>{
 assert.equal(await ai.readAISettings('a'),null);await assert.rejects(ai.saveAISettings('guest',{provider:'gemini',model:'test'},'key'));
 await ai.saveAISettings('a',{provider:'gemini',model:'test-model'},'secret-key');assert.equal(await ai.hasAIKey('a','gemini'),true);assert.equal(await ai.hasAIKey('b','gemini'),false);assert.equal(await ai.readAISettings('b'),null);
 await assert.rejects(ai.saveAISettings('a',{provider:'gemini',model:'../evil?x=1'},''));
 const messages=[{id:'1',role:'user',text:'Explain anatomy'}];
 for(const provider of Object.keys(ai.AI_PROVIDERS)){
  const req=ai.buildAIRequest({provider,model:'my-model'},'test-key',messages,'study context');assert.ok(req.url.startsWith('https://'));assert.ok(!req.url.includes('test-key'));assert.ok(!req.url.includes('medonex'));assert.ok(JSON.stringify(req.body).includes('Explain anatomy'));assert.ok(!JSON.stringify(req.body).includes('test-key'));
 }
 global.fetch=async(url,init)=>{calls.push({url,init});if(fail)return new Response('{}',{status:fail,headers:{'content-type':'application/json'}});return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'Real provider answer'}]}}]}),{headers:{'content-type':'application/json'}})};
 const reply=await ai.directAIReply('a',messages,'Lecture reference',new AbortController().signal);assert.equal(reply.text,'Real provider answer');assert.equal(calls.length,1);assert.equal(calls[0].init.headers['x-goog-api-key'],'secret-key');assert.equal(calls[0].init.credentials,'omit');assert.equal(calls[0].init.redirect,'error');
 calls=[];fail=429;await assert.rejects(ai.directAIReply('a',messages,'',new AbortController().signal),/limit/);assert.equal(calls.length,1);
 calls=[];await assert.rejects(ai.directAIReply('b',messages,'',new AbortController().signal),/settings/);assert.equal(calls.length,0);
 await ai.removeAIKey('a','gemini');assert.equal(await ai.hasAIKey('a','gemini'),false);
 console.log('PASS native AI: account-isolated SecureStore, model validation, six fixed direct-provider requests, no URL/body key leaks, no app credentials/cookies, no fallback or auto-retry, missing-key no-network, provider errors and key removal. No paid inference sent.');
})().catch(e=>{console.error(e);process.exitCode=1});
