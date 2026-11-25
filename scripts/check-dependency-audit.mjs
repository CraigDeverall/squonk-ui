import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
export function auditFailures(audit, policy, versions, now=Date.now(), production=false) {
  const failures=[];
  if(audit.error||!audit.metadata?.vulnerabilities) return ['Audit did not return a valid vulnerability report'];
  for(const [name,v]of Object.entries(audit.vulnerabilities??{})){
    if(production||v.severity==='critical'){failures.push(`${name}: ${v.severity} ${production?'runtime':'development'} dependency`);continue;}
    for(const advisory of v.via.filter(value=>typeof value==='object')){
      const exception=policy.exceptions.find(e=>e.package===name&&e.url===advisory.url&&Date.parse(e.expires)>now&&v.nodes.every(node=>e.versions.includes(versions(node))));
      if(!exception)failures.push(`${name}: new, expired or changed advisory ${advisory.url}`);
    }
  }
  return failures;
}
if(import.meta.url===new URL(process.argv[1]??'', 'file:').href){
  const policy=JSON.parse(readFileSync(new URL('./dependency-audit-policy.json',import.meta.url)));
  // With a cold npm cache (every CI job) the full development audit spends about
  // a minute of CPU working out fixes for ~1,700 packages, so allow it five.
  const timeout=5*60*1000;
  for(const production of [true,false]){
    const result=spawnSync('npm',['audit','--json','--userconfig=/dev/null',production?'--omit=dev':'--include=dev'],{encoding:'utf8',timeout,killSignal:'SIGKILL',maxBuffer:16*1024*1024});
    if(result.error?.code==='ETIMEDOUT')throw new Error(`Dependency audit timed out after ${timeout/1000}s; delivery blocked`);
    if(result.error)throw new Error('Dependency audit unavailable; delivery blocked');
    let audit;try{audit=JSON.parse(result.stdout)}catch{throw new Error('Invalid dependency audit response; delivery blocked')}
    const failures=auditFailures(audit,policy,node=>JSON.parse(readFileSync(node+'/package.json')).version,Date.now(),production);
    if(failures.length)throw new Error(failures.join('\n'));
    console.log(`${production?'Runtime':'Full development'} audit passed policy (${audit.metadata.vulnerabilities.total} known entries)`);
  }
}
