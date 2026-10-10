import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { auditProject } from '../lib/release-audit-core.mjs';

function fixture() {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'saqtau-release-test-'));
 const add=(name,contents)=>{const f=path.join(root,name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,contents);};
 add('package.json',JSON.stringify({dependencies:{expo:'~57.0.21'}}));
 add('app.json',JSON.stringify({expo:{name:'SaqtauAI',version:'1.0.0',scheme:'saqtau',icon:'icon.png',ios:{bundleIdentifier:'com.sd3108.Saqtau-AI',associatedDomains:['applinks:links.saqtau.ai']},plugins:['expo-router','expo-notifications','expo-audio','expo-localization','./plugins/with-saqtau-screen-time']}}));
 add('eas.json',JSON.stringify({build:{production:{distribution:'store',environment:'production'}},submit:{production:{ios:{}}}}));
 add('icon.png','placeholder');
 for(const lang of ['en','ru','kk'])add(`src/features/localization/messages/${lang}.js`,`export default {\n  'a.b': 'test',\n};\n`);
 for(const name of ['plugins/with-saqtau-screen-time.js','plugins/screen-time-extension/SaqtauDeviceActivityMonitor.swift','modules/saqtau-screen-time/ios/SaqtauScreenTimeModule.swift','src/features/release/components/AboutSaqtauScreen.jsx','src/app/(app)/settings/about.jsx','src/features/ai/components/VoiceRecordingScreen.jsx','src/features/connectivity/components/NetworkGate.jsx'])add(name,'stub');
 return {root,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}

test('release audit can pass key static checks',()=>{
 const f=fixture();try{
  const checks=auditProject({root:f.root,env:{EXPO_PUBLIC_API_URL:'https://api.example.com/api/v1',EXPO_PUBLIC_INVITE_BASE_URL:'https://links.saqtau.ai/family/invite',EXPO_PUBLIC_PRIVACY_POLICY_URL:'https://example.com/privacy',EXPO_PUBLIC_SUPPORT_URL:'https://example.com/support'},requireEnv:true});
  assert.equal(checks.find(x=>x.id==='env-api').status,'PASS');
  assert.equal(checks.find(x=>x.id==='env-invite-domain').status,'PASS');
  assert.equal(checks.find(x=>x.id==='lang:kk').status,'PASS');
 }finally{f.cleanup();}
});

test('missing privacy and incorrect AASA host cause blocking errors with --require-env',()=>{
 const f=fixture();try{
  const checks=auditProject({root:f.root,env:{EXPO_PUBLIC_API_URL:'http://localhost:8000/api/v1',EXPO_PUBLIC_INVITE_BASE_URL:'https://wrong.example/family/invite'},requireEnv:true});
  assert.equal(checks.find(x=>x.id==='env-api').status,'FAIL');
  assert.equal(checks.find(x=>x.id==='env-privacy').status,'FAIL');
  assert.equal(checks.find(x=>x.id==='env-invite-domain').status,'FAIL');
 }finally{f.cleanup();}
});

test('a translation key mismatch is detected',()=>{
 const f=fixture();try{
  fs.writeFileSync(path.join(f.root,'src/features/localization/messages/kk.js'),"export default {'different.key':'x'};");
  const checks=auditProject({root:f.root});
  assert.equal(checks.find(x=>x.id==='parity:kk').status,'FAIL');
 }finally{f.cleanup();}
});
