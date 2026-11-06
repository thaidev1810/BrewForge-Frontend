import ts from 'typescript'
import fs from 'node:fs'
const findings=[]
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else if(/\.tsx?$/.test(p)&&!/(contracts|schema|LandingPage|mock|Slice|Service)/.test(p)){const s=fs.readFileSync(p,'utf8'),a=ts.createSourceFile(p,s,ts.ScriptTarget.Latest,true);function visit(n){if((ts.isStringLiteral(n)||ts.isJsxText(n))&&/\b(BE|FE|API|DTO|payload|enum|endpoint|schema|nullable|ISO|offset|traceId|enrollmentIds|lookup|backend|AVAILABLE|ELIGIBLE|PASSED|role)\b/.test(n.text)&&n.text.length>20&&n.text.includes(' '))findings.push({file:p,line:a.getLineAndCharacterOfPosition(n.pos).line+1,text:n.text.trim()});ts.forEachChild(n,visit)}visit(a)}}}
walk('src')
fs.mkdirSync('ui-test-results/OPS_20261106',{recursive:true})
fs.writeFileSync('ui-test-results/OPS_20261106/source-candidates.json',JSON.stringify(findings,null,2))
for(const f of findings) console.log(`${f.file}:${f.line} ${f.text.slice(0,220)}`)
console.log('Heuristic source candidates; not all are rendered or defects. Browser checks exclude closed support details and allow SOP, units, URLs for authorized resources.')
