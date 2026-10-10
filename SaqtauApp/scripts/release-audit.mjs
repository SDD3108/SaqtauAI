#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditProject } from './lib/release-audit-core.mjs';

const args=new Set(process.argv.slice(2));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const checks=auditProject({root,requireEnv:args.has('--require-env')});
const failures=checks.filter(x=>x.status==='FAIL');
const warnings=checks.filter(x=>x.status==='WARN'||x.status==='MANUAL');
if(args.has('--json')) {
  process.stdout.write(JSON.stringify({checks,summary:{passed:checks.filter(x=>x.status==='PASS').length,failed:failures.length,warnings:warnings.length}},null,2)+'\n');
} else {
  for (const c of checks) {
    const symbol={PASS:'✓',FAIL:'✗',WARN:'!',MANUAL:'?'}[c.status];
    console.log(`${symbol} ${c.status.padEnd(6)} ${c.message}`);
    if(c.status!=='PASS'&&c.guidance) console.log('          '+c.guidance);
  }
  console.log(`\n${checks.length} checks — ${failures.length} blocking failures, ${warnings.length} warnings/manual review items`);
  if(!args.has('--require-env'))console.log('Hint: use EAS production env, then run with --require-env to check production URLs.');
}
if(failures.length)process.exitCode=1;
