import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditFailures } from './check-dependency-audit.mjs';
const report={metadata:{vulnerabilities:{}},vulnerabilities:{tool:{severity:'high',nodes:['node_modules/tool'],via:[{url:'https://example.test/advisory'}]}}};
const exception={package:'tool',url:'https://example.test/advisory',versions:['1.0.0'],expires:'2026-11-13T00:00:00Z'};
test('audit policy blocks runtime, critical, new versions and expired exceptions',()=>{
  const policy={exceptions:[exception]},now=Date.parse('2026-10-14');
  assert.deepEqual(auditFailures(report,policy,()=> '1.0.0',now),[]);
  assert.equal(auditFailures(report,policy,()=> '1.0.0',now,true).length,1);
  assert.equal(auditFailures(report,policy,()=> '1.0.1',now).length,1);
  assert.equal(auditFailures(report,policy,()=> '1.0.0',Date.parse('2026-11-14')).length,1);
  assert.equal(auditFailures(report,{exceptions:[]},()=> '1.0.0',now).length,1);
  const critical=structuredClone(report);critical.vulnerabilities.tool.severity='critical';
  assert.equal(auditFailures(critical,policy,()=> '1.0.0',now).length,1);
  assert.equal(auditFailures({error:{}},policy,()=> '1.0.0',now).length,1);
});
