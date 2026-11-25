import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
// Protect current source/configuration. Synthetic secret-boundary tests are
// intentional fixtures; historical git objects require operator revocation.
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const findings=[];
for(const file of files){
  if(/\.test\.[cm]?[jt]sx?$/.test(file)||/\.(png|jpg|gif|ico|woff2?|ttf)$/.test(file))continue;
  let source;try{source=readFileSync(file,'utf8')}catch{continue}
  const patterns=[/https:\/\/[A-Za-z0-9.-]+\.(?:logic\.azure\.com|api\.powerplatform\.com)[^\s"'`]*[?&]sig=[A-Za-z0-9%_-]+/g,/\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})/g];
  for(const pattern of patterns) for(const match of source.matchAll(pattern)) findings.push(`${file}:${source.slice(0,match.index).split('\n').length}`);
}
if(findings.length)throw new Error(`Credential-shaped literals found at ${findings.join(', ')}; values withheld`);
console.log('Current source credential-literal check passed');
