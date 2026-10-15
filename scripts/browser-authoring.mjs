// Browser regressions only: all business transports are isolated fixtures, never sent to the BE.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {spawn} from 'node:child_process'
const origin=process.env.FE_SMOKE_URL??'http://127.0.0.1:5174'
assert(['localhost','127.0.0.1'].includes(new URL(origin).hostname))
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'brewforge-authoring-'))
const browser=spawn(process.env.CHROME_PATH??'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'})
const delay=ms=>new Promise(r=>setTimeout(r,ms))
let socket,checks=0
try {
  let port
  for(let i=0;i<100&&!port;i++){try{port=Number((await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0])}catch{await delay(100)}}
  assert(port)
  const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl)
  await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})})
  let seq=0;const pending=new Map(),exceptions=[]
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}})
  function command(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>reject(new Error('Timeout '+method)),15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}))})}
  async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value}
  async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(100)}console.log('TEST_ONLY diagnostic',await evaluate('({path:location.pathname,text:document.body.innerText.slice(-1000),calls:window.__regression?.calls.map(c=>c.url).slice(-5)})'));throw new Error('Not ready: '+expression)}
  const pass=name=>{checks++;console.log('PASS '+name)}
  const click=async text=>{await until(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled)`);await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled);b.click()})()`)}
  await command('Page.enable');await command('Runtime.enable');await command('Network.enable')
  // Block accidental browser network traffic to backend, even if a fixture misses a route.
  await command('Network.setBlockedURLs',{urls:['http://localhost:5113/*','http://127.0.0.1:5113/*']})
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  await command('Page.navigate',{url:origin+'/login'});await until('!!document.querySelector("#username")')
  await evaluate(`(async()=>{
    const {store}=await import('/src/app/store.ts');const auth=await import('/src/features/auth/authSlice.ts');const {apiClient}=await import('/src/services/apiClient.ts');const {backendApi}=await import('/src/services/backend/operations.ts');const {mutationTags}=await import('/src/services/backend/cachePolicy.ts');const {router}=await import('/src/app/router.tsx');
    const types=['PRODUCT_OVERVIEW','INGREDIENTS','EQUIPMENT','SOP','TECHNIQUE','COMMON_MISTAKES','EXCEPTION_HANDLING'];
    const course={id:101,title:'TEST_ONLY Course',courseType:'PRODUCT',state:'DRAFT',recipeVersionId:201,recipeId:301,modules:types.map((moduleType,i)=>({id:1000+i,courseId:101,moduleType,moduleOrder:i+1,source:i<4?'GENERATED':i===4?'MIXED':'AUTHORED',durationMinutes:5,state:'COMPLETE',lessons:[{id:2000+i,title:'TEST_ONLY '+moduleType,content:'Saved instructor prose',lessonOrder:1,recipeStepId:i===4?501:null,generated:i<=4,reference:i<=4?{stepOrder:1,actionText:'SOP reference'}:null}]})),quiz:{id:401,courseId:101,title:'TEST_ONLY quiz',passScore:80,questionCount:1},practicalChecklist:[{lessonId:2004,recipeStepId:501,actionText:'TEST_ONLY gate'}]};
    const state=window.__regression={calls:[],defer:false,waiting:[],course,run:null};
    const reply=(config,data)=>({config,data:structuredClone(data),status:200,statusText:'OK',headers:{}});const fail=(config,status,data)=>Promise.reject({isAxiosError:true,config,response:{config,status,data}});
    apiClient.defaults.adapter=async config=>{
      const url=config.url,method=config.method;state.calls.push({url,method,params:config.params,body:typeof config.data==='string'?JSON.parse(config.data):null});
      if(method==='get'&&url==='/courses/101'){if(state.defer)await new Promise(r=>state.waiting.push(r));return reply(config,structuredClone(course))}
      if(method==='get'&&url==='/recipe-versions/201')return reply(config,{id:201,recipeId:301,steps:[{id:501,stepOrder:1,actionText:'TEST_ONLY step'}]});
      if(url==='/courses/101/quiz')return reply(config,course.quiz);
      if(url==='/courses/101/quiz/questions')return reply(config,[]);
      if(url==='/courses/101/submit')return fail(config,409,{code:'TEST_ONLY_CODE',message:'Concurrent server validation',rule:'BR-31',details:[{field:'modules[TECHNIQUE]',issue:'has no content'},{field:'modules[COMMON_MISTAKES]',issue:'has no duration'}],traceId:'TEST_ONLY_TRACE'});
      if(method==='put'&&url==='/lessons/2004'){Object.assign(course.modules[4].lessons[0],JSON.parse(config.data));return reply(config,course.modules[4].lessons[0])}
      if(url==='/ingredients')return reply(config,{items:[{id:901,name:'TEST_ONLY Ingredient',ingredientCode:'TEST_ONLY_I'}],page:1,size:100,total:1});
      if(method==='post'&&url==='/impact-analysis'){state.run={runId:'11111111111111111111111111111111',trigger:{entityType:'Ingredient',entityId:901},affected:{recipeVersions:[],courses:[],certificates:[],liveBranches:[]},committed:false};return reply(config,state.run)}
      if(url?.startsWith('/impact-analysis/')&&method==='get')return reply(config,state.run);
      if(url?.endsWith('/commit')){state.run.committed=true;return fail(config,409,{code:'RULE_VIOLATION',rule:'IMPACT_ALREADY_COMMITTED',message:'Already committed by another client',details:[],traceId:'TEST_ONLY_IMPACT'})}
      if(url==='/assignments')return reply(config,{items:[{enrollmentId:701,fullName:'TEST_ONLY trainee',courseTitle:'TEST_ONLY course',dueDate:'2026-11-01',status:'QUIZ_PASSED',enrollmentState:'ELIGIBLE'}],page:config.params?.page??1,size:20,total:60});
      if(url==='/corrective-actions/801')return reply(config,{id:801,branchAuditId:601,branchId:2,status:'OPEN',description:'TEST_ONLY correction',retrainingRequired:true,employeeIds:[777]});
      if(url==='/branch-audits/601')return reply(config,{id:601,branchId:2,recipeVersionId:201});
      if(url==='/audit-log/trace/RecipeVersion/201')return reply(config,{courses:[{id:1101,title:'TEST_ONLY recertification',courseType:'RECERTIFICATION',state:'PUBLISHED'},{id:1102,title:'TEST_ONLY draft',courseType:'PRODUCT',state:'DRAFT'}],certifiedStaff:[{userId:999,fullName:'HISTORY_ONLY_NOT_ROSTER'}]});
      if(url==='/corrective-actions/801/assign-retraining')return reply(config,{courseId:1101,enrollmentIds:[9901],alreadyEnrolled:[]});
      return reply(config,{items:[],total:0,page:1,size:20});
    };
    window.__asRole=async role=>{store.dispatch(auth.logout());const arg={username:'TEST_ONLY',password:'TEST_ONLY'};store.dispatch(auth.login.pending('TEST_ONLY',arg));store.dispatch(auth.login.fulfilled({accessToken:'TEST_ONLY_NOT_A_REAL_TOKEN',refreshToken:'TEST_ONLY',user:{id:'1',name:'TEST_ONLY',email:'test@example.invalid',role,branchId:null}},'TEST_ONLY',arg))};
    window.__navigate=p=>router.navigate(p);window.__invalidate=()=>store.dispatch(backendApi.util.invalidateTags(mutationTags('Lessons.Update')));
    await window.__asRole('TRAINER');
  })()`)
  await until('location.pathname==="/trainer/dashboard"')
  await evaluate('window.__navigate("/trainer/courses/101")')
  await until('document.body.textContent.includes("Biên soạn học phần")')
  await click('Gửi duyệt');await click('Xác nhận')
  await until('document.querySelector("[role=dialog]")?.textContent.includes("TEST_ONLY_TRACE")')
  assert(await evaluate('document.querySelector("[role=dialog]").textContent.includes("TECHNIQUE") && document.querySelector("[role=dialog]").textContent.includes("thời lượng")'))
  pass('real RTK unwrap reaches Vietnamese dialog with module fields, rule and trace')
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
  assert(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'))
  pass('course server-error dialog remains within mobile viewport')
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  await click('Hủy');await click('Thêm câu hỏi')
  assert(await evaluate('!!document.getElementById("options[0].key") && !!document.getElementById("options[1].key") && document.querySelector("#correctOption").tagName==="SELECT"'))
  await evaluate('var s=document.querySelector("#correctOption");s.value="A";s.dispatchEvent(new Event("change",{bubbles:true}));document.getElementById("options[0].key").focus();document.getElementById("options[0].key").select()')
  await command('Input.insertText',{text:'C'})
  await until('document.querySelector("#correctOption").value==="" && [...document.querySelector("#correctOption").options].some(o=>o.value==="C")')
  await evaluate('var s=document.querySelector("#correctOption");s.value="B";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await evaluate('document.querySelectorAll("[role=dialog] fieldset.nested-card")[1].querySelector("button").click()')
  await until('document.querySelector("#correctOption").value==="" && ![...document.querySelector("#correctOption").options].some(o=>o.value==="B")')
  pass('quiz UI starts with two choices and clears correct answer after key rename/delete')
  await click('Hủy');await click('Chỉnh sửa')
  await evaluate('document.querySelector("textarea").focus();document.querySelector("textarea").select()')
  await command('Input.insertText',{text:'TEST_ONLY unsaved instructor content'})
  await evaluate('window.__regression.defer=true;window.__invalidate()')
  await until('window.__regression.waiting.length>0')
  assert(await evaluate('document.querySelector("[role=dialog]") && document.querySelector("textarea").value==="TEST_ONLY unsaved instructor content"'))
  pass('delayed background GET preserves mounted dialog and unsaved prose')
  await evaluate('window.__regression.defer=false;window.__regression.waiting.splice(0).forEach(r=>r())')
  await delay(200);assert(await evaluate('document.querySelector("textarea").value==="TEST_ONLY unsaved instructor content"'))
  await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")')
  await until('[...document.querySelectorAll(".module-card")].some(m=>m.textContent.includes("TEST_ONLY unsaved instructor content"))')
  assert(await evaluate('window.__regression.calls.some(c=>c.method==="put"&&c.url==="/lessons/2004"&&c.body.content==="TEST_ONLY unsaved instructor content")'))
  pass('lesson save payload, response and follow-up GET retain instructor prose and success dialog')
  await click('Đóng')
  await evaluate('window.__navigate("/trainer/assignments")');await until('!!document.querySelector("#filter-status")')
  await evaluate('var s=document.querySelector("#filter-status");s.value="QUIZ_PASSED";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await click('Áp dụng');await until('!!document.querySelector("#sort")');await evaluate('var s=document.querySelector("#sort");s.value="dueDate,desc";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await until('window.__regression.calls.some(c=>c.url==="/assignments"&&c.params?.status==="QUIZ_PASSED"&&c.params?.sort==="dueDate,desc")')
  pass('assignment UI sends status and sort together')
  await until(`!!document.querySelector('[aria-label="Trang sau"]') && !document.querySelector('[aria-label="Trang sau"]').disabled`)
  await evaluate(`document.querySelector('[aria-label="Trang sau"]').click()`)
  await until('window.__regression.calls.some(c=>c.url==="/assignments"&&c.params?.page===2&&c.params?.sort==="dueDate,desc")')
  await evaluate('var s=document.querySelector("#filter-status");s.value="LOCKED";s.dispatchEvent(new Event("change",{bubbles:true}))');await click('Áp dụng')
  await until('window.__regression.calls.some(c=>c.url==="/assignments"&&c.params?.status==="LOCKED"&&c.params?.page===1&&c.params?.sort==="dueDate,desc")')
  pass('changing status resets pagination to page one while retaining sort')
  await evaluate('window.__asRole("RD_MANAGER")');await evaluate('window.__navigate("/rd-manager/impact")');await until('document.body.textContent.includes("Phân tích ảnh hưởng")')
  await click('Phân tích thay đổi')
  await evaluate('var s=document.querySelector("#entityType");s.value="Ingredient";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await until('[...document.querySelectorAll("select")].some(s=>[...s.options].some(o=>o.value==="901"))')
  await evaluate('var s=[...document.querySelectorAll("select")].find(s=>[...s.options].some(o=>o.value==="901"));s.value="901";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")');await click('Đóng')
  assert(await evaluate('[...document.querySelectorAll("button")].some(b=>b.textContent==="Áp dụng ảnh hưởng")'))
  await evaluate('[...document.querySelectorAll("a")].find(a=>a.textContent.includes("Mở chi tiết lần phân tích")).click()')
  await until('location.pathname.includes("11111111111111111111111111111111") && document.body.textContent.includes("Không có tài nguyên downstream")')
  pass('empty persisted impact has detail link, GET and commit action')
  await click('Áp dụng ảnh hưởng');await click('Xác nhận')
  await until('document.body.textContent.includes("Đã áp dụng. Không thể gửi áp dụng lần nữa.")')
  assert(await evaluate('!document.querySelector("button[form=action-form]") && document.querySelector("[role=dialog]").textContent.includes("IMPACT_ALREADY_COMMITTED")'))
  pass('409 commit conflict refreshes persisted state and removes repeat submission')
  await click('Hủy');await evaluate('window.__asRole("QUALITY_AUDITOR")');await evaluate('window.__navigate("/quality-auditor/corrective-actions/801")')
  await until('!!document.querySelector("#retraining-course")')
  assert(await evaluate('![...document.querySelector("#retraining-course").options].some(o=>o.value==="1102") && !document.body.textContent.includes("HISTORY_ONLY_NOT_ROSTER")'))
  await evaluate('var s=document.querySelector("#retraining-course");s.value="1101";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await click('Giao học lại');await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")')
  assert(await evaluate('document.querySelector("[role=dialog]").textContent.replace(/[.,]/g,"").includes("9901")'))
  assert(await evaluate('window.__regression.calls.some(c=>c.url==="/corrective-actions/801/assign-retraining"&&c.body.courseId===1101) && !window.__regression.calls.some(c=>c.url==="/users")'))
  pass('auditor retraining uses published trace courses and action staff without ADMIN users or history roster')
  assert.deepEqual(exceptions,[]);pass('no unhandled browser exceptions in isolated authoring regressions')
  console.log(`Completed ${checks} browser checks using TEST_ONLY transport fixtures. No backend business requests were sent.`)
} finally {socket?.close();browser.kill()}
