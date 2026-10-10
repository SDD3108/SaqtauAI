#!/usr/bin/env node
// Safe GET-only smoke: does not mutate or print private responses.
const root=process.env.EXPO_PUBLIC_API_URL;
if(!root){console.error('Set EXPO_PUBLIC_API_URL');process.exit(2);}
let base; try {base=new URL(root.replace(/\/+$/,'')+'/');} catch{console.error('Invalid API URL');process.exit(2);}
if(base.protocol!=='https:'){console.error('API must use HTTPS for release');process.exit(2);}
const token=process.env.SAQTAU_TEST_ACCESS_TOKEN || '';
const cases=token
  ? [['auth/me/','Current account'],['measurements/','Measurements'],['family/','Family'],['notifications/','Notifications']]
  : [['auth/me/','Auth endpoint (401/403 expected without token)']];
let errors=0;
for(const [relative,label] of cases){
 const url=new URL(relative,base);
 try {
  const response=await fetch(url,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(8000)});
  const ok=token?response.ok:(response.status===401||response.status===403);
  console.log(`${ok?'PASS':'REVIEW'} ${label}: HTTP ${response.status}`);
  if(!ok)errors++;
  await response.body?.cancel?.();
 }catch(error){console.log(`FAIL ${label}: ${error.name}`);errors++;}
}
console.log(errors?'Backend smoke found issues.':'Backend smoke passed.');
if(errors)process.exitCode=1;
