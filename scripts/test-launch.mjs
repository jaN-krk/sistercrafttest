import {build} from 'esbuild';
import assert from 'node:assert/strict';
const settings={checkoutEnabled:true,shippingConfigured:true,legalReviewed:false,business:{}};
globalThis.__launchEnv={IYZICO_API_KEY:'test',IYZICO_SECRET_KEY:'test',IYZICO_MODE:'live',APP_ORIGIN:'https://store.example',IYZICO_VERIFIED:'false',EMAIL_TEST_MODE:'true',DB:{prepare(){return{bind(){return{async first(){return{value:JSON.stringify(settings)}}}}}}}};
const built=await build({entryPoints:['lib/server.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'test-env',setup(b){b.onResolve({filter:/^@store\/runtime$/},()=>({path:'runtime',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__launchEnv;',loader:'js'}));}}]});
const server=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
let checks=0;const check=(v,m)=>{assert(v,m);checks++;};
check((await server.publicConfig()).orderingReady,'owner can open with administrative warnings');
check(!server.legalReady(await server.getSettings()),'opening does not mark legal readiness complete');
check(globalThis.__launchEnv.IYZICO_VERIFIED==='false','opening does not claim payment tests passed');
settings.checkoutEnabled=false;check(!(await server.publicConfig()).orderingReady,'owner can pause immediately');settings.checkoutEnabled=true;
settings.shippingConfigured=false;check(!(await server.publicConfig()).orderingReady,'shipping configuration is required');settings.shippingConfigured=true;
for(const [key,value] of [['IYZICO_API_KEY',''],['IYZICO_SECRET_KEY',''],['IYZICO_MODE','sandbox'],['APP_ORIGIN',''],['ADMIN_BOOTSTRAP_PRIVATE','true']]){const old=globalThis.__launchEnv[key];globalThis.__launchEnv[key]=value;check(!(await server.publicConfig()).orderingReady,'technical safeguard: '+key);globalThis.__launchEnv[key]=old;}
console.log(JSON.stringify({ok:true,checks,scope:'Launch policy only; no payment or external requests'}));
