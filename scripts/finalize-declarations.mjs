import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export async function finalizeDeclaration(file) {
  const source=await readFile(file,'utf8');
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const literals=[];
  function visit(node){
    if ((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))literals.push(node.moduleSpecifier);
    if(ts.isImportTypeNode(node)&&ts.isLiteralTypeNode(node.argument)&&ts.isStringLiteral(node.argument.literal))literals.push(node.argument.literal);
    ts.forEachChild(node,visit);
  }
  visit(ast);
  const edits=[];
  for(const literal of literals){
    const value=literal.text;
    if(!value.startsWith('.')||/\.(?:[cm]?js|json|css)$/.test(value))continue;
    const stem=value.replace(/\.(?:tsx?|d\.ts)$/,'');
    const target=path.resolve(path.dirname(file),stem);
    let resolved;
    for(const [candidate,suffix]of [[target+'.d.ts','.js'],[path.join(target,'index.d.ts'),'/index.js']]){
      try{if((await stat(candidate)).isFile()){resolved=stem+suffix;break}}catch{/* try directory index */}
    }
    if(!resolved)throw new Error(`Unresolved declaration import in ${file}: ${value}`);
    edits.push({start:literal.getStart(ast)+1,end:literal.end-1,text:resolved});
  }
  let next=source;
  for(const edit of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,edit.start)+edit.text+next.slice(edit.end);
  if(next!==source)await writeFile(file,next);
}
async function walk(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const file=path.join(directory,entry.name);
    if(entry.isDirectory())await walk(file);else if(entry.name.endsWith('.d.ts'))await finalizeDeclaration(file);
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await walk(fileURLToPath(new URL('../dist/',import.meta.url)));
