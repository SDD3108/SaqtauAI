#!/usr/bin/env node
// Read-only production connectivity test. Never sends tokens or private data.
const parsed=process.env.EXPO_PUBLIC_INVITE_BASE_URL;
if(!parsed){ console.error('Set EXPO_PUBLIC_INVITE_BASE_URL before testing.'); process.exit(2); }
let base;
try { base=new URL(parsed); }catch{ console.error('Invalid invite URL.'); process.exit(2); }
if(base.protocol!=='https:'||base.username||base.password){console.error('HTTPS is required.'); process.exit(2);}
const expected='5QZMMBZ7R7.com.sd3108.Saqtau-AI';
const aasa=new URL('/.well-known/apple-app-site-association',base.origin);
const timeoutMs=7000;
let failures=0;
try{
 const response=await fetch(aasa,{redirect:'manual',signal:AbortSignal.timeout(timeoutMs),headers:{Accept:'application/json'}});
 console.log('AASA status:',response.status,'Content-Type:',response.headers.get('content-type'));
 if(response.status!==200 || response.redirected || (response.status>=300&&response.status<400)){ failures++;console.error('AASA must return HTTP 200 without redirect.');}
 if(response.ok){
   const text=await response.text();
   let obj;try {obj=JSON.parse(text);}catch{failures++;console.error('AASA is not valid JSON.');}
   const encoded=JSON.stringify(obj||{});
   if(!encoded.includes(expected)){failures++;console.error('AASA does not include expected app ID (verify Team ID prefix).');}
   if(!encoded.includes('/family/invite/')){failures++;console.error('AASA does not include /family/invite/ route.');}
 }
}catch(error){failures++;console.error('AASA request failed:',error.message);}
try {
  const probe=new URL('/family/invite/invalid-release-probe-token',base.origin);
  const response=await fetch(probe,{redirect:'manual',signal:AbortSignal.timeout(timeoutMs)});
  console.log('Web fallback HTTP status:',response.status);
  if(response.status>=500 || response.status===404) { failures++; console.error('Public invite landing page is missing or server errored.'); }
}catch(error){failures++;console.error('Landing page request failed:',error.message);}
console.log(failures ? `FAIL: ${failures} link checks failed` : 'PASS: Basic Universal Links hosting checks passed; test iOS interception on a device.');
if(failures) process.exitCode=1;
