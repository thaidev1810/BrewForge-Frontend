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
    const state=window.__regression={calls:[],defer:false,waiting:[],course,run:null,reads:[],attempts:[],flow:false,lessonState:'ASSIGNED',notices:[{id:81,subject:'TEST_ONLY notice',message:'TEST_ONLY message without deep link',createdAt:'2026-10-19T00:00:00Z',readAt:null,read:false}],classState:'PLANNED'};
    const learning=()=>({id:70,userId:1,courseId:101,courseTitle:'TEST_ONLY Learning',courseType:'PRODUCT',trainingClassId:null,recipeVersionId:201,enrolledAt:state.reset?'2026-10-19T01:00:00Z':'2026-10-19T00:00:00Z',dueDate:'2026-11-01',progressPercent:state.reads.length===2?100:0,state:state.lessonState,overdue:false});
    const path=()=>({userId:1,username:'TEST_ONLY',fullName:'TEST_ONLY Learner',role:'TRAINEE',branchId:2,stages:[{courseType:'INDUCTION',prerequisiteType:null,blocked:false,regulationId:1,dueDays:7,courses:[{courseId:101,title:'TEST_ONLY Learning',status:'ENROLLED',enrollmentId:70,enrollmentState:state.lessonState,dueDate:'2026-11-01',certificateId:null,recipeVersionId:201}]},{courseType:'PRODUCT',prerequisiteType:'INDUCTION',blocked:true,regulationId:2,dueDays:7,courses:[{courseId:102,title:'TEST_ONLY Blocked',status:'BLOCKED',enrollmentId:null,enrollmentState:null,dueDate:null,certificateId:null,recipeVersionId:201}]}]});
    const reply=(config,data)=>({config,data:structuredClone(data),status:200,statusText:'OK',headers:{}});const fail=(config,status,data)=>Promise.reject({isAxiosError:true,config,response:{config,status,data}});
    apiClient.defaults.adapter=async config=>{
      const url=config.url,method=config.method;state.calls.push({url,method,params:config.params,body:typeof config.data==='string'?JSON.parse(config.data):null});
      if(url==='/me/notifications/unread-count')return reply(config,{count:state.notices.filter(n=>!n.read).length});
      if(url==='/me/notifications')return reply(config,{items:state.notices.filter(n=>!config.params?.unread||!n.read),page:config.params?.page??1,size:20,total:state.notices.filter(n=>!config.params?.unread||!n.read).length});
      if(url==='/me/notifications/81/read'){Object.assign(state.notices[0],{read:true,readAt:'2026-10-19T01:00:00Z'});return reply(config,state.notices[0])}
      if(url==='/me/notifications/read-all'){const count=state.notices.filter(n=>!n.read).length;state.notices.forEach(n=>Object.assign(n,{read:true,readAt:'2026-10-19T01:00:00Z'}));return reply(config,{count})}
      if(url==='/enrollments/70')return reply(config,learning());
      if(url==='/enrollments/70/modules')return reply(config,[{module:{id:1001,courseId:101,moduleType:'SOP',moduleOrder:1,source:'AUTHORED',durationMinutes:5,state:'COMPLETE',lessons:[8001,8002].map(id=>({id,title:'TEST_ONLY Lesson '+id,content:'TEST_ONLY lesson prose',reference:null,mediaUrl:null,media:[]}))},completed:state.reads.length===2,completedAt:null,lessonsRead:state.reads.length,lessonsTotal:2,readLessonIds:state.reads}]);
      if(url?.startsWith('/enrollments/70/lessons/')&&url.endsWith('/complete')){const id=Number(url.split('/')[4]);if(!state.reads.includes(id))state.reads.push(id);state.lessonState=state.reads.length===2?'ELIGIBLE':'IN_PROGRESS';return reply(config,{enrollment:learning(),courseModuleId:1001,moduleCompleted:state.reads.length===2})}
      if(url==='/enrollments/70/eligibility')return reply(config,{eligible:state.lessonState==='ELIGIBLE',missingModules:state.reads.length===2?[]:[{courseModuleId:1001,moduleType:'SOP'}],attendancePct:100,minAttendancePct:80,attendanceStillReachable:true,retakesLeft:Math.max(0,2-state.attempts.length),regulationId:1,state:state.lessonState});
      if(url==='/enrollments/70/quiz')return reply(config,{quizId:401,title:'TEST_ONLY draw',passScore:80,retakesLeft:1,attemptNo:state.attempts.length+1,questions:[{id:91,questionText:'TEST_ONLY question',options:[{key:'A',text:'One'},{key:'B',text:'Two'}]}]});
      if(url==='/enrollments/70/quiz-attempts'){if(method==='post'){state.reads=[];state.lessonState=state.attempts.length?'LOCKED':'IN_PROGRESS';state.attempts.push({attemptNo:state.attempts.length+1,score:0,passed:false,passScore:80,retakesLeft:state.lessonState==='LOCKED'?0:1,enrollmentState:state.lessonState,perModule:[{moduleType:'SOP',correct:0,total:1}],attemptedAt:'2026-10-19T00:30:00Z',certificateId:null});return reply(config,state.attempts.at(-1))}return reply(config,state.attempts)}
      if(url==='/enrollments/70/reset'){state.reset=true;state.reads=[];state.lessonState='ASSIGNED';return reply(config,learning())}
      if(url==='/me/learning-path'||url==='/learning-paths/1')return reply(config,path());
      if(url==='/learning-paths/1/assign')return reply(config,{path:path(),enrollmentIds:[]});
      if(url==='/training-classes/401/cancel'){state.classState='CANCELLED';state.lessonState='CLOSED';return reply(config,{id:401,name:'TEST_ONLY class',state:state.classState,courseId:101,branchId:2,sessions:[]})}
      if(method==='get'&&url==='/courses/101'){if(state.defer)await new Promise(r=>state.waiting.push(r));return reply(config,structuredClone(course))}
      if(method==='get'&&url==='/recipe-versions/201')return reply(config,{id:201,recipeId:301,steps:[{id:501,stepOrder:1,actionText:'TEST_ONLY step'}]});
      if(url==='/courses/101/quiz')return reply(config,course.quiz);
      if(url==='/courses/101/quiz/questions')return reply(config,[]);
      if(url==='/courses/101/submit')return fail(config,409,{code:'TEST_ONLY_CODE',message:'Concurrent server validation',rule:'BR-31',details:[{field:'modules[TECHNIQUE]',issue:'has no content'},{field:'modules[COMMON_MISTAKES]',issue:'has no duration'}],traceId:'TEST_ONLY_TRACE'});
      if(method==='put'&&url==='/lessons/2004'){Object.assign(course.modules[4].lessons[0],JSON.parse(config.data));return reply(config,course.modules[4].lessons[0])}
      if(url==='/ingredients')return reply(config,{items:[{id:901,name:'TEST_ONLY Ingredient',ingredientCode:'TEST_ONLY_I'}],page:1,size:100,total:1});
      if(url==='/branches')return reply(config,{items:[{id:2,name:'TEST_ONLY Branch 2'},{id:3,name:'TEST_ONLY Branch 3'}],page:1,size:100,total:2});
      if(url==='/courses')return reply(config,{items:[{id:101,title:'TEST_ONLY course',state:'PUBLISHED'}],page:1,size:100,total:1});
      if(url==='/users/lookup')return reply(config,{items:[{id:state.flow?1:config.params?.q?223:config.params?.page===2?222:221,username:'TEST_ONLY',fullName:config.params?.q?'TEST_ONLY Search result':config.params?.page===2?'TEST_ONLY Page two':'TEST_ONLY Selected name',role:'TRAINEE',branchId:config.params?.branchId??2,branchName:'TEST_ONLY Branch',active:true}],page:config.params?.page??1,size:20,total:config.params?.q?1:40});
      if(url==='/training-classes/401')return reply(config,{id:401,name:'TEST_ONLY class',state:state.classState,courseId:101,branchId:2,sessions:[]});
      if(url==='/courses/101/eligible-trainers')return reply(config,[{id:7,fullName:'TEST_ONLY Eligible trainer',branchId:3,eligible:true,reason:null},{id:8,fullName:'TEST_ONLY Ineligible trainer',branchId:2,eligible:false,reason:'not certified on recipe version 201'}]);
      if(method==='post'&&url==='/impact-analysis'){state.run={runId:'11111111111111111111111111111111',trigger:{entityType:'Ingredient',entityId:901},affected:{recipeVersions:[],courses:[],certificates:[],liveBranches:[]},committed:false};return reply(config,state.run)}
      if(url?.startsWith('/impact-analysis/')&&method==='get')return reply(config,state.run);
      if(url?.endsWith('/commit')){state.run.committed=true;return fail(config,409,{code:'RULE_VIOLATION',rule:'IMPACT_ALREADY_COMMITTED',message:'Already committed by another client',details:[],traceId:'TEST_ONLY_IMPACT'})}
      if(url==='/assignments')return reply(config,{items:state.flow?[{enrollmentId:70,userId:1,fullName:'TEST_ONLY Learner',courseTitle:'TEST_ONLY Learning',dueDate:'2026-11-01',stage:'LOCKED',isOverdue:false,enrollmentState:'LOCKED'}]:[{enrollmentId:701,fullName:'TEST_ONLY trainee',courseTitle:'TEST_ONLY course',dueDate:'2026-11-01',stage:'QUIZ_PASSED',isOverdue:false,enrollmentState:'ELIGIBLE'}],page:config.params?.page??1,size:20,total:60});
      if(url==='/corrective-actions/801')return reply(config,{id:801,branchAuditId:601,branchId:2,status:'OPEN',description:'TEST_ONLY correction',retrainingRequired:true,employeeIds:[777]});
      if(url==='/branch-audits/601')return reply(config,{id:601,branchId:2,recipeVersionId:201});
      if(url==='/unused-test-only-trace')return reply(config,{courses:[{id:1101,title:'TEST_ONLY recertification',courseType:'RECERTIFICATION',state:'PUBLISHED'},{id:1102,title:'TEST_ONLY draft',courseType:'PRODUCT',state:'DRAFT'}],certifiedStaff:[{userId:999,fullName:'HISTORY_ONLY_NOT_ROSTER'}]});
      if(url==='/corrective-actions/801/retraining-options')return reply(config,{correctiveActionId:801,branchAuditId:601,auditedRecipeVersionId:201,employeeIds:[777],courses:[{courseId:1101,title:'TEST_ONLY recertification',courseType:'RECERTIFICATION',recipeVersionId:201,currentVersion:true}]});
      if(url==='/corrective-actions/801/assign-retraining')return reply(config,{courseId:1101,enrollmentIds:[9901],alreadyEnrolled:[]});
      return reply(config,{items:[],total:0,page:1,size:20});
    };
    window.__asRole=async(role,branchId=null)=>{store.dispatch(auth.logout());const arg={username:'TEST_ONLY',password:'TEST_ONLY'};store.dispatch(auth.login.pending('TEST_ONLY',arg));store.dispatch(auth.login.fulfilled({accessToken:'TEST_ONLY_NOT_A_REAL_TOKEN',refreshToken:'TEST_ONLY',user:{id:'1',name:'TEST_ONLY',email:'test@example.invalid',role,branchId}},'TEST_ONLY',arg))};
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
  await delay(150)
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
  await evaluate('window.__navigate("/trainer/assignments")');await until('!!document.querySelector("#filter-stage")')
  await evaluate('var s=document.querySelector("#filter-stage");s.value="QUIZ_PASSED";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await click('Áp dụng');await until('!!document.querySelector("#sort")');await evaluate('var s=document.querySelector("#sort");s.value="dueDate,desc";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await until('window.__regression.calls.some(c=>c.url==="/assignments"&&c.params?.stage==="QUIZ_PASSED"&&c.params?.sort==="dueDate,desc")')
  pass('assignment UI sends stage and sort together')
  await until(`!!document.querySelector('[aria-label="Trang sau"]') && !document.querySelector('[aria-label="Trang sau"]').disabled`)
  await evaluate(`document.querySelector('[aria-label="Trang sau"]').click()`)
  await until('window.__regression.calls.some(c=>c.url==="/assignments"&&c.params?.page===2&&c.params?.sort==="dueDate,desc")')
  await evaluate('var s=document.querySelector("#filter-stage");s.value="LOCKED";s.dispatchEvent(new Event("change",{bubbles:true}))');await click('Áp dụng')
  await until('window.__regression.calls.some(c=>c.url==="/assignments"&&c.params?.stage==="LOCKED"&&c.params?.page===1&&c.params?.sort==="dueDate,desc")')
  pass('changing stage resets pagination to page one while retaining sort')
  await evaluate('var s=document.querySelector("#filter-overdue");s.value="true";s.dispatchEvent(new Event("change",{bubbles:true}))');await click('Áp dụng')
  await until('window.__regression.calls.some(c=>c.url==="/assignments"&&c.params?.stage==="LOCKED"&&c.params?.overdue==="true"&&c.params?.sort==="dueDate,desc"&&c.params?.page===1)')
  assert(await evaluate('!window.__regression.calls.filter(c=>c.url==="/assignments").some(c=>"status" in c.params)'))
  pass('overdue is sent separately from stage without the retired status parameter')
  await click('Thêm mới')
  await until('[...document.querySelectorAll("[role=dialog] select")].some(s=>s.getAttribute("aria-label")==="Chi nhánh" && [...s.options].some(o=>o.value==="2"))')
  await evaluate(`var s=document.querySelector('[role=dialog] select[aria-label="Chi nhánh"]');s.value="2";s.dispatchEvent(new Event("change",{bubbles:true}))`)
  await until('[...document.querySelectorAll("[role=dialog] select[multiple] option")].some(o=>o.value==="221")')
  await evaluate('var s=document.querySelector("[role=dialog] select[multiple]");s.options[0].selected=true;s.dispatchEvent(new Event("change",{bubbles:true}))')
  await evaluate(`document.querySelector('[aria-label="Trang nhân viên sau"]').click()`)
  await until('[...document.querySelectorAll("[role=dialog] select[multiple] option")].some(o=>o.value==="222")')
  assert(await evaluate('[...document.querySelectorAll("[role=dialog] select[multiple] option")].some(o=>o.value==="221" && o.selected && o.textContent.includes("Selected name"))'))
  pass('directory picker pages on server and retains selected name from the preceding page')
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
  await delay(150)
  if (!await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth')) console.log('TEST_ONLY mobile overflow', await evaluate('[...document.querySelectorAll("body *")].filter(e=>!e.closest(".table-wrap") && e.getBoundingClientRect().right>390).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,50)})).slice(0,15)'))
  assert(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'))
  assert(await evaluate('var table=document.querySelector(".table-wrap");table.scrollLeft=100;table.scrollLeft>0'))
  pass('paged staff picker with selected labels fits the mobile viewport')
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  await evaluate(`var s=document.querySelector('[role=dialog] select[aria-label="Chi nhánh"]');s.value="3";s.dispatchEvent(new Event("change",{bubbles:true}))`)
  await until('window.__regression.calls.some(c=>c.url==="/users/lookup"&&c.params?.branchId===3) && document.querySelector("[role=dialog] select[multiple]")?.selectedOptions.length===0')
  pass('changing assignment branch clears previously selected staff')
  await evaluate(`document.querySelector('[role=dialog] input[placeholder="Tìm tên hoặc tên đăng nhập…"]').focus()`)
  await command('Input.insertText',{text:'TEST_ONLY Search'})
  await until('window.__regression.calls.some(c=>c.url==="/users/lookup"&&c.params?.q==="TEST_ONLY Search"&&c.params?.page===1&&c.params?.size===20)')
  pass('debounced picker search goes to directory and resets pagination')
  await click('Hủy');await evaluate('window.__navigate("/trainer/classes/401")');await until('document.body.textContent.includes("TEST_ONLY class")')
  await click('Thêm buổi học')
  await until('[...document.querySelectorAll("[role=dialog] select option")].some(o=>o.value==="7")')
  assert(await evaluate('[...document.querySelectorAll("[role=dialog] select option")].some(o=>o.value==="8" && o.disabled && o.textContent.includes("not certified"))'))
  await evaluate('var s=[...document.querySelectorAll("[role=dialog] select")].find(s=>[...s.options].some(o=>o.value==="7"));s.value="7";s.dispatchEvent(new Event("change",{bubbles:true}))')
  assert(await evaluate('[...document.querySelectorAll("[role=dialog] select")].some(s=>s.value==="7")'))
  pass('session picker allows another eligible trainer and disables server-ineligible trainers')
  await click('Hủy')
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
  pass('auditor retraining uses dedicated SOP courses and action staff without ADMIN users or history roster')
  await click('Đóng');await evaluate('window.__regression.flow=true;window.__asRole("TRAINEE",2)');await evaluate('window.__navigate("/barista/learning/70")')
  await until('document.body.textContent.includes("TEST_ONLY Lesson 8001")')
  assert(await evaluate('![...document.querySelectorAll("button")].some(b=>b.textContent==="Đánh dấu đã học xong")'))
  await click('Đánh dấu hoàn thành bài');await until('document.querySelectorAll("button:disabled").length>0 && window.__regression.reads.length===1')
  await until('[...document.querySelectorAll("button")].some(b=>b.textContent==="Đánh dấu hoàn thành bài" && !b.disabled)')
  await click('Đánh dấu hoàn thành bài');await until('document.body.textContent.includes("100% hoàn thành") && document.body.textContent.includes("Đủ điều kiện")')
  assert(await evaluate('!window.__regression.calls.some(c=>c.method==="post"&&c.url.includes("/modules/")&&c.url.endsWith("/complete"))'))
  pass('learner marks each lesson and GET refresh displays server module completion and eligibility')
  await evaluate('window.__navigate("/barista/learning/70/quiz")');await until('document.body.textContent.includes("TEST_ONLY question")');await click('Nộp bài kiểm tra')
  await until('window.__regression.reads.length===0 && document.body.textContent.includes("Cần học/đọc lại")')
  await evaluate('window.__navigate("/barista/learning/70")');await until('[...document.querySelectorAll("button")].filter(b=>b.textContent==="Đánh dấu hoàn thành bài"&&!b.disabled).length===2')
  pass('quiz failure refresh removes prior lesson checkmarks and shows missing module')
  await evaluate('window.__navigate("/barista/learning-path")');await until('document.body.textContent.includes("TEST_ONLY Blocked")')
  assert(await evaluate('![...document.querySelectorAll(".lesson-card")].find(e=>e.textContent.includes("TEST_ONLY Blocked")).querySelector("a") && [...document.querySelectorAll("a")].some(a=>a.getAttribute("href")==="/barista/learning/70")'))
  assert(await evaluate('!window.__regression.calls.some(c=>c.url==="/learning-paths/1/assign")'))
  pass('learner path links only actual enrollment and does not auto-assign blocked courses')
  await evaluate('window.__asRole("TRAINING_MANAGER")');await evaluate('window.__navigate("/training-manager/learning-path")')
  await until('[...document.querySelectorAll("select option")].some(o=>o.value==="1")')
  await evaluate('var s=[...document.querySelectorAll("select")].find(s=>s.getAttribute("aria-label")==="Nhân viên");s.value="1";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await until('document.body.textContent.includes("TEST_ONLY Blocked")');await click('Giao các khóa đang mở');await click('Xác nhận')
  await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")')
  assert(await evaluate('window.__regression.calls.some(c=>c.method==="post"&&c.url==="/learning-paths/1/assign")'))
  pass('manager path picker and assign action use actual endpoint and display dedup result')
  await click('Đóng')
  await evaluate('window.__navigate("/training-manager/courses/pending")')
  await until('window.__regression.calls.some(c=>c.url==="/courses"&&c.params?.state==="PENDING_APPROVAL") && document.body.textContent.includes("Khóa chờ duyệt")')
  pass('training-manager pending-review route sends actual state filter without a bogus detail ID')
  await evaluate('window.__regression.lessonState="LOCKED";window.__asRole("TRAINING_MANAGER")');await evaluate('window.__navigate("/training-manager/assignments")')
  await until('document.body.textContent.includes("TEST_ONLY Learning")');await click('Xem chi tiết →');await click('Mở lại đăng ký bị khóa');await click('Xác nhận')
  await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")');await click('Đóng')
  await evaluate('window.__asRole("TRAINEE",2)');await evaluate('window.__navigate("/barista/learning/70")')
  await until('document.body.textContent.includes("0% hoàn thành") && [...document.querySelectorAll("button")].filter(b=>b.textContent==="Đánh dấu hoàn thành bài"&&!b.disabled).length===2')
  pass('training-manager reset uses actual endpoint and next account sees fresh lesson progress')
  await evaluate('window.__navigate("/barista/notifications")');await until('document.body.textContent.includes("TEST_ONLY notice")')
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(150)
  assert(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'))
  pass('inbox and unread bell fit the mobile viewport independently of push permission')
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  assert(await evaluate('!document.querySelector(".panel a")'))
  await click('Đánh dấu đã đọc');await click('Xác nhận');await until(`document.querySelector('[aria-label="Số thông báo chưa đọc"]')?.textContent==="0"`)
  pass('notification mark-read refreshes unread badge without guessing a deep link')
  await click('Đóng');await click('Đánh dấu tất cả đã đọc');await click('Xác nhận');await until('window.__regression.calls.some(c=>c.url==="/me/notifications/read-all")');await click('Đóng')
  await evaluate('window.__regression.notices=[];window.__asRole("TRAINER",2)');await evaluate('window.__navigate("/trainer/notifications")');await until('document.body.textContent.includes("Không có thông báo phù hợp")')
  assert(await evaluate('!document.body.textContent.includes("TEST_ONLY notice")'))
  pass('read-all uses endpoint and account switch clears the preceding inbox')
  await evaluate('window.__navigate("/trainer/assignments")');await until('document.body.textContent.includes("Giao khóa & tiến độ")');await click('Thêm mới')
  await until('[...document.querySelectorAll("[role=dialog] select")].some(s=>s.getAttribute("aria-label")==="Chi nhánh" && s.disabled && s.value==="2")')
  assert(await evaluate('!document.querySelector("#filter-branchId")'))
  pass('branch trainer cannot choose another branch in filter or assignment form')
  await click('Hủy');await evaluate('window.__navigate("/trainer/training-progress")');await until('window.__regression.calls.some(c=>c.url.includes("training-progress")&&c.params?.branchId===2)')
  assert(await evaluate('!document.querySelector("#filter-branchId") && window.__regression.calls.some(c=>c.url.includes("training-progress")&&c.params?.branchId===2)'))
  pass('trainer training dashboard hides branch selector and sends confined branch query')
  await evaluate('window.__navigate("/trainer/classes/401")');await until('document.body.textContent.includes("TEST_ONLY class")');await click('Hủy lớp')
  await evaluate('document.querySelector("#reason").focus()');await command('Input.insertText',{text:'TEST_ONLY cancel reason'});await click('Xác nhận')
  await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")')
  assert(await evaluate('window.__regression.calls.some(c=>c.url==="/training-classes/401/cancel"&&c.body.reason==="TEST_ONLY cancel reason") && document.body.textContent.includes("Đã hủy")'))
  pass('cancel class keeps reason, renders server state and refreshes dependent training data')
  await click('Đóng');await evaluate('window.__asRole("TRAINEE",2)');await evaluate('window.__navigate("/barista/learning/70")')
  await until('document.body.textContent.includes("Đăng ký đã đóng")')
  assert(await evaluate('![...document.querySelectorAll("button")].some(b=>b.textContent.includes("Đánh dấu hoàn thành bài"))'))
  pass('closed enrollment remains readable and offers no lesson completion action')
  assert.deepEqual(exceptions,[]);pass('no unhandled browser exceptions in isolated authoring regressions')
  console.log(`Completed ${checks} browser checks using TEST_ONLY transport fixtures. No backend business requests were sent.`)
} finally {socket?.close();browser.kill()}
