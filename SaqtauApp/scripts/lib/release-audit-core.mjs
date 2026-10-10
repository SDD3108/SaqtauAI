import fs from 'node:fs';
import path from 'node:path';

const isFile=(root,relative)=>fs.existsSync(path.join(root,relative));
function parse(root,relative){try{return JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));}catch{return null;}}
function url(value){try{const result=new URL(value);if(result.protocol!=='https:'||result.username||result.password||/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(result.hostname))return null;return result;}catch{return null;}}
function plugin(plugins,name){return Array.isArray(plugins)&&plugins.some(p=>(Array.isArray(p)?p[0]:p)===name);}
function keys(root,lang){const f=path.join(root,`src/features/localization/messages/${lang}.js`);if(!fs.existsSync(f))return null;const text=fs.readFileSync(f,'utf8');return [...text.matchAll(/^\s*'([\w.]+)'\s*:/gm)].map(m=>m[1]);}

export function auditProject({root,env=process.env,requireEnv=false}={}){
 if(!root)throw new Error('root is required');
 const all=[];
 const add=(id,ok,message,guidance='',severity='FAIL')=>all.push({id,status:ok?'PASS':severity,message,guidance});
 const app=parse(root,'app.json')?.expo;
 const pkg=parse(root,'package.json');
 const eas=parse(root,'eas.json');
 add('package',Boolean(pkg),'package.json is valid','Run from a SaqtauApp project.');
 add('expo-config',Boolean(app),'app.json contains a valid expo config','Preserve the existing config.');
 if(!app)return all;
 const ios=app.ios||{},plugins=app.plugins||[],production=eas?.build?.production||{};
 add('sdk',/^~?57\./.test(String(pkg?.dependencies?.expo||'')),'Expo SDK matches the Part 14 SDK 57 baseline','After upgrading Expo, reverify native Screen Time extension.','WARN');
 add('app-version',/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(app.version||''),'App version follows semantic versioning','Set expo.version to a valid value such as 1.0.0.');
 add('bundle-id',ios.bundleIdentifier==='com.sd3108.Saqtau-AI','iOS bundle ID matches the Screen Time extension','Do not change the bundle ID without migrating the extension.');
 add('scheme',app.scheme==='saqtau','Custom deep link scheme is saqtau','Update expo.scheme.');
 add('apple-team',ios.appleTeamId==='5QZMMBZ7R7','Apple Team ID is set explicitly','Make sure main and extension use the same team.','WARN');
 add('associated-domains',ios.associatedDomains?.includes('applinks:links.saqtau.ai'),'Associated Domains includes invitation host','Use exactly the domain configured in Universal Links.');
 add('ipad',ios.supportsTablet!==true,'iPad support is not enabled without separate QA','Test layouts on iPad if supportsTablet=true.','WARN');
 for(const name of ['expo-router','expo-notifications','expo-audio','expo-localization','./plugins/with-saqtau-screen-time'])add('plugin:'+name,plugin(plugins,name),`Expo plugin ${name} is configured`,'Merge this plugin into existing expo.plugins.');
 for(const [id,file] of [
  ['screen-time-plugin-file','plugins/with-saqtau-screen-time.js'],
  ['screen-time-extension','plugins/screen-time-extension/SaqtauDeviceActivityMonitor.swift'],
  ['screen-time-native','modules/saqtau-screen-time/ios/SaqtauScreenTimeModule.swift']
 ])add(id,isFile(root,file),`${file} exists`,'Keep native code from Part 12.');
 add('eas-json',Boolean(eas),'eas.json is valid','Merge the Part 14 example into your current eas.json.');
 if(eas){
  add('eas-production',Boolean(eas.build?.production),'EAS production build profile exists','Add build.production.');
  add('eas-store',!production.developmentClient&&production.distribution!=='internal'&&production.ios?.simulator!==true,'Production profile does not build a dev client or simulator artifact','Use distribution=store with no developmentClient/simulator.');
  add('eas-production-env',production.environment==='production','EAS production profile uses the production environment','Set build.production.environment to production.','WARN');
  add('eas-versioning',Boolean(production.autoIncrement||ios.buildNumber),'Build numbers can advance','Use EAS autoIncrement=true or increment ios.buildNumber.','WARN');
  add('eas-team',!eas.submit?.production?.ios?.appleTeamId||eas.submit.production.ios.appleTeamId==='5QZMMBZ7R7','EAS Submit Apple Team ID matches current team','Check the correct team in App Store Connect.','WARN');
  add('eas-project',Boolean(app.extra?.eas?.projectId),'Expo EAS projectId present','Keep the existing linked projectId.','WARN');
 }
 const missing=requireEnv?'FAIL':'WARN';
 const api=url(env.EXPO_PUBLIC_API_URL),invites=url(env.EXPO_PUBLIC_INVITE_BASE_URL),privacy=url(env.EXPO_PUBLIC_PRIVACY_POLICY_URL),support=url(env.EXPO_PUBLIC_SUPPORT_URL);
 add('env-api',Boolean(api),'Production API has a valid HTTPS URL','Set EXPO_PUBLIC_API_URL in EAS production.',missing);
 if(api){
  add('api-path',api.pathname.replace(/\/$/,'').endsWith('/api/v1'),'API URL includes /api/v1','Verify your Django API prefix.','WARN');
  add('api-domain',!/(?:sslip\.io|nip\.io)$/i.test(api.hostname),'API uses a stable controlled domain','Dynamic DNS hosts are useful in dev but need production review.','WARN');
 }
 add('env-invites',Boolean(invites),'Invite links have an HTTPS base URL','Set EXPO_PUBLIC_INVITE_BASE_URL for production.',missing);
 if(invites)add('env-invite-domain',ios.associatedDomains?.includes('applinks:'+invites.hostname),'Invite hostname matches Associated Domains','Change either the domain or associatedDomains.');
 add('env-privacy',Boolean(privacy),'Privacy policy URL configured','Set a real public HTTPS privacy policy URL.',missing);
 add('env-support',Boolean(support),'Support website URL configured','Set a reachable HTTPS support page.','WARN');
 const icon=ios.icon||app.icon;
 add('app-icon',Boolean(icon&&isFile(root,icon)),'App icon exists','Ensure configured icon is present at that relative path.');
 const en=keys(root,'en')||[];
 for(const lang of ['en','ru','kk']){
  const set=keys(root,lang);
  add('lang:'+lang,Boolean(set?.length),`Translation catalog ${lang} is present`,'Copy localized files from Parts 13–14.');
  add('duplicates:'+lang,Boolean(set&&new Set(set).size===set.length),`Translation ${lang} has no duplicate keys`,'Remove duplicated keys.');
  const same=Boolean(set&&en.length&&set.length===en.length&&en.every(k=>set.includes(k)));
  add('parity:'+lang,same,`Translation ${lang} key set matches en`,'Keep exactly the same keys in all three catalogs.');
 }
 for(const f of ['src/features/release/components/AboutSaqtauScreen.jsx','src/app/(app)/settings/about.jsx','src/features/ai/components/VoiceRecordingScreen.jsx','src/features/connectivity/components/NetworkGate.jsx'])add('file:'+f,isFile(root,f),`Source file ${f} exists`,'Verify Parts 11–14 are merged.');
 all.push({id:'manual-appstore',status:'MANUAL',message:'App Store age rating, App Privacy, screenshots, health claims and review notes need manual review',guidance:'Read RELEASE_CHECKLIST.md.'});
 all.push({id:'manual-signing',status:'MANUAL',message:'Family Controls distribution and Screen Time extension signing need actual Xcode/EAS verification',guidance:'Inspect both entitlements/provisioning profiles.'});
 all.push({id:'manual-server',status:'MANUAL',message:'Confirm backend raw audio/video cleanup and AI provider retention before publishing policy',guidance:'Have backend owner verify retention and deletion semantics.'});
 return all;
}
