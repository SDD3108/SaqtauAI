import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function load({ endpoint='https://collector.example/v1/startup-reports', fetchImpl, probes=[], disk=new Map(), clock={now:Date.now()} }={}) {
  const code=fs.readFileSync(new URL('../../src/services/diagnostics/startup-reporter.js',import.meta.url),'utf8')
    .replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm,'').replace(/^export /gm,'');
  class Clock extends Date { constructor(...args){super(...(args.length?args:[clock.now]));} static now(){return clock.now;} }
  const result=vm.runInNewContext(`${code}\n;({ reportStartupFailure, flushStartupReports })`, {
    process:{env:{EXPO_PUBLIC_DIAGNOSTICS_URL:endpoint}},
    AsyncStorage:{getItem:async k=>disk.get(k),setItem:async(k,v)=>disk.set(k,v)},
    Application:{nativeApplicationVersion:'1.0',nativeBuildVersion:'2'},Device:{modelName:'test'},
    Network:{getNetworkStateAsync:async()=>({type:'WIFI',isConnected:true})},Platform:{OS:'ios',Version:'27.2'},
    fetch:fetchImpl || (async()=>({ok:true,status:200,headers:{get:()=>null}})),
    getSessionDiagnostics: () => probes,
    probeStartupConnectivity: async () => {},
    URL,AbortController,
    setTimeout: (fn, ms) => setTimeout(fn, ms === 12000 ? 15 : ms),
    clearTimeout,Date:Clock,
  });
  return {...result,disk,clock};
}
const requests=[{url:'https://185-129-48-150.sslip.io/api/v1/auth/guest/',method:'POST',code:'NETWORK',originalError:{message:'Network request failed'}}];
const entries=api=>JSON.parse(api.disk.get('saqtau.startup-diagnostics.v1')||'[]');
test('unconfigured reporter does nothing',async()=>{
  const api=load({endpoint:'',fetchImpl:()=>{throw new Error('must not run');}});
  await api.reportStartupFailure('SESSION-NETWORK',requests);
  assert.equal(api.disk.size,0);
});
test('report contains build and network, no bearer; success clears queue',async()=>{
  let calls=0;
  const api=load({fetchImpl:async(url,opt)=>{
    calls++; assert.equal(url,'https://collector.example/v1/startup-reports');
    assert.equal(opt.headers.Authorization,undefined);
    const body=JSON.parse(opt.body);assert.equal(body.app.build,'2');assert.equal(body.network.type,'WIFI');
    return {ok:true,status:200,headers:{get:()=>null}};
  }});
  await api.reportStartupFailure('SESSION-NETWORK',requests);
  assert.equal(calls,1);assert.equal(entries(api).length,0);
  await api.reportStartupFailure('SESSION-NETWORK',requests);assert.equal(calls,1);
});
test('collector outage keeps report across launches and later delivery clears it',async()=>{
  const disk=new Map();const clock={now:Date.now()};
  const api=load({disk,clock,fetchImpl:async()=>{throw new TypeError('offline');}});
  await api.reportStartupFailure('SESSION-NETWORK',requests);
  assert.equal(entries(api).length,1); assert.equal(entries(api)[0].attempts,1);
  clock.now+=61000;
  const recovered=load({disk,clock}); await recovered.flushStartupReports();
  assert.equal(entries(recovered).length,0);
});
test('retry-after is honored, requests are bounded and old reports expire',async()=>{
  let calls=0;
  const api=load({fetchImpl:async()=>{calls++;return {ok:false,status:429,headers:{get:()=> '120'}};}});
  await api.reportStartupFailure('SESSION-NETWORK',requests);
  api.clock.now+=61000;await api.flushStartupReports();assert.equal(calls,1);
  api.clock.now+=61000;await api.flushStartupReports();assert.equal(calls,2);
  api.clock.now+=86400001;await api.flushStartupReports();assert.equal(entries(api).length,0);
});
test('invalid report response drops item and local failures are not sent',async()=>{
  const api=load({fetchImpl:async()=>({ok:false,status:400,headers:{get:()=>null}})});
  await api.reportStartupFailure('SESSION-NETWORK',requests);assert.equal(entries(api).length,0);
  await api.reportStartupFailure('CHECKIN-LOCAL',requests);assert.equal(entries(api).length,0);
});
test('storage failures never escape into bootstrap',async()=>{
  const api=load({disk:{get(){throw new Error('disk');},set(){throw new Error('disk');}}});
  await api.reportStartupFailure('SESSION-NETWORK',requests);
  await api.flushStartupReports();
});

test('native collector hang does not permanently lock the reporting queue', {timeout: 1000}, async () => {
  const api = load({ fetchImpl: () => new Promise(() => {}) });
  await api.reportStartupFailure('SESSION-TIMEOUT', requests);
  assert.equal(entries(api)[0].attempts, 1);
  api.clock.now += 61000;
  await api.flushStartupReports();
  assert.equal(entries(api)[0].attempts, 2);
});
test('report keeps health probes separate from the original auth failure', async () => {
  const clock = { now: Date.now() };
  const probes = [{url:'https://185-129-48-150.sslip.io/api/v1/ready/',method:'GET',
    startedAtUtc: new Date(clock.now).toISOString(),httpStatus:503}];
  let payload;
  const api = load({ clock, probes, fetchImpl: async (_, opt) => {
    payload = JSON.parse(opt.body);
    return {ok:true,status:200,headers:{get:()=>null}};
  }});
  await api.reportStartupFailure('SESSION-TIMEOUT', [...probes, ...requests]);
  assert.equal(payload.requests.length, 1);
  assert.equal(payload.requests[0].method, 'POST');
  assert.equal(payload.connectivity.length, 1);
  assert.equal(payload.connectivity[0].httpStatus, 503);
});
