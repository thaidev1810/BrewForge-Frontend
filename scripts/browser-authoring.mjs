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
  let seq=0,acceptDialog=true;const pending=new Map(),exceptions=[]
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Page.javascriptDialogOpening')void command('Page.handleJavaScriptDialog',{accept:acceptDialog});if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}})
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
    const launchNoticeSubjects=['Training needed for a drink','Branch ready to open a drink','Drink on sale','Drink withdrawn','Pilot ended','Sales missing'];
    const state=window.__regression={calls:[],defer:false,waiting:[],course,run:null,reads:[],attempts:[],flow:false,lessonState:'ASSIGNED',notices:launchNoticeSubjects.map((subject,index)=>({id:81+index,subject,message:'TEST_ONLY launch notice body; rendered as text without guessed route or action',createdAt:'2026-10-19T00:00:00Z',readAt:null,read:false})),classState:'PLANNED'};
    const learning=()=>({id:70,userId:state.practicalDelta?2:1,courseId:101,courseTitle:'TEST_ONLY Learning',courseType:'PRODUCT',trainingClassId:null,recipeVersionId:201,enrolledAt:state.reset?'2026-10-19T01:00:00Z':'2026-10-19T00:00:00Z',dueDate:'2026-11-01',progressPercent:state.reads.length===2?100:0,state:state.lessonState,overdue:false});
    const path=()=>({userId:1,username:'TEST_ONLY',fullName:'TEST_ONLY Learner',role:'TRAINEE',branchId:2,stages:[{courseType:'INDUCTION',prerequisiteType:null,blocked:false,regulationId:1,dueDays:7,courses:[{courseId:101,title:'TEST_ONLY Learning',status:'ENROLLED',enrollmentId:70,enrollmentState:state.lessonState,dueDate:'2026-11-01',certificateId:null,recipeVersionId:201}]},{courseType:'PRODUCT',prerequisiteType:'INDUCTION',blocked:true,regulationId:2,dueDays:7,courses:[{courseId:102,title:'TEST_ONLY Blocked',status:'BLOCKED',enrollmentId:null,enrollmentState:null,dueDate:null,certificateId:null,recipeVersionId:201}]}]});
    const reply=(config,data)=>({config,data:structuredClone(data),status:200,statusText:'OK',headers:{}});const fail=(config,status,data)=>Promise.reject({isAxiosError:true,config,response:{config,status,data}});
    apiClient.defaults.adapter=async config=>{
      const url=config.url,method=config.method;state.calls.push({url,method,params:config.params,body:typeof config.data==='string'?JSON.parse(config.data):null});
      if(url==='/me/notifications/unread-count')return reply(config,{count:state.notices.filter(n=>!n.read).length});
      if(url==='/me/notifications')return reply(config,{items:state.notices.filter(n=>!config.params?.unread||!n.read),page:config.params?.page??1,size:20,total:state.notices.filter(n=>!config.params?.unread||!n.read).length});
      if(url==='/me/notifications/81/read'){Object.assign(state.notices[0],{read:true,readAt:'2026-10-19T01:00:00Z'});return reply(config,state.notices[0])}
      if(url==='/me/notifications/read-all'){const count=state.notices.filter(n=>!n.read).length;state.notices.forEach(n=>Object.assign(n,{read:true,readAt:'2026-10-19T01:00:00Z'}));return reply(config,{count})}
      if(url==='/enrollments/70')return state.wrongBranch?fail(config,404,{code:'NOT_FOUND',message:'TEST_ONLY branch scoped out',details:[]}):reply(config,learning());
      if(url==='/enrollments/70/practical-videos')return reply(config,state.practicalDelta?[{id:601,enrollmentId:70,uploadedBy:1,fileName:'TEST_ONLY old cycle video',uploadedAt:'2026-10-19T00:30:00Z',evaluationId:null}]:[]);
      if(url==='/enrollments/70/practical-schedules')return reply(config,[]);
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
      if(method==='get'&&url==='/recipe-versions/201')return reply(config,{id:201,recipeId:301,versionNo:1,state:'DRAFT',isImmutable:false,createdBy:2,steps:state.longUi?Array.from({length:25},(_,i)=>({id:501+i,stepOrder:i+1,actionText:'TEST_ONLY SOP step '+(i+1),ingredients:[],dependsOn:[]})):[{id:501,stepOrder:1,actionText:'TEST_ONLY step'}]});
      if(url==='/recipe-versions/201/validate')return reply(config,{versionId:201,passed:false,runAt:'2026-10-19T00:00:00Z',checks:[{checkType:'ORDERING',passed:false,violations:[{stepId:502,stepOrder:2,rule:'TEST_ONLY',code:'TEST_ONLY',message:'TEST_ONLY dependency issue',expected:'TEST_ONLY',actual:'TEST_ONLY'}]}]});
      if(url==='/courses/101/quiz')return reply(config,course.quiz);
      if(url==='/courses/101/quiz/questions')return reply(config,state.longUi?Array.from({length:25},(_,i)=>({id:9000+i,courseModuleId:1000,questionText:'TEST_ONLY Long question '+(i+1),options:[{key:'A',text:'One'},{key:'B',text:'Two'}],correctOption:'A'})):[]);
      if(url==='/courses/101/submit')return fail(config,409,{code:'TEST_ONLY_CODE',message:'Concurrent server validation',rule:'BR-31',details:[{field:'modules[TECHNIQUE]',issue:'has no content'},{field:'modules[COMMON_MISTAKES]',issue:'has no duration'}],traceId:'TEST_ONLY_TRACE'});
      if(method==='put'&&url==='/lessons/2004'){Object.assign(course.modules[4].lessons[0],JSON.parse(config.data));return reply(config,course.modules[4].lessons[0])}
      if(url==='/roles')return reply(config,['ADMIN','RD_SPECIALIST','RD_MANAGER','TRAINER','TRAINEE','QUALITY_AUDITOR','BRANCH_MANAGER','TRAINING_MANAGER'].map(role=>({role,permissions:[]})));
      if(url==='/sales/import'){state.posRequests??=[];state.posRequests.push({key:config.headers.get('Idempotency-Key'),file:config.data.get('file')});if(state.posRequests.length===1)throw new Error('TEST_ONLY lost upload response');return reply(config,{jobId:'TEST_ONLY_POS',fileName:'demo.csv',accepted:2,rejected:1,replaced:1,replayed:true,importedAt:'2026-10-22T00:00:00Z',errors:[{row:4,code:'TEST_ONLY_ROW',message:'TEST_ONLY rejected row'}]})}
      if(url==='/ingredients')return reply(config,{items:[{id:901,name:'TEST_ONLY Ingredient',ingredientCode:'TEST_ONLY_I'}],page:1,size:100,total:1});
      if(url==='/branches')return reply(config,{items:[{id:2,name:'TEST_ONLY Branch 2'},{id:3,name:'TEST_ONLY Branch 3'}],page:1,size:100,total:2});
      if(url==='/courses')return reply(config,{items:[{id:101,title:'TEST_ONLY course',state:'PUBLISHED'}],page:1,size:100,total:1});
      if(url==='/users/lookup'&&config.params?.ids)return reply(config,{items:String(config.params.ids).split(',').map(Number).filter(id=>id>0).map(id=>({id,username:'TEST_ONLY',fullName:id===221?'TEST_ONLY Selected name':id===222?'TEST_ONLY Page two':'TEST_ONLY Historical '+id,role:id===17?'TRAINER':'TRAINEE',branchId:2,branchName:'TEST_ONLY Branch',active:![17,779].includes(id)})),page:1,size:20,total:String(config.params.ids).split(',').length});
      if(url==='/users/lookup')return reply(config,{items:[{id:state.flow?1:config.params?.q?223:config.params?.page===2?222:221,username:'TEST_ONLY',fullName:config.params?.q?'TEST_ONLY Search result':config.params?.page===2?'TEST_ONLY Page two':'TEST_ONLY Selected name',role:'TRAINEE',branchId:config.params?.branchId??2,branchName:'TEST_ONLY Branch',active:true}],page:config.params?.page??1,size:20,total:config.params?.q?1:40});
      if(url==='/training-classes/401')return reply(config,{id:401,name:'TEST_ONLY class',state:state.classState,courseId:101,branchId:2,sessions:state.longUi?Array.from({length:25},(_,i)=>({id:5000+i,trainingClassId:401,sessionNo:i+1,scheduledDate:'2026-10-19',startTime:'09:00:00',durationMinutes:60,trainerId:state.pickerDelta?17:1,location:'TEST_ONLY Room',moduleIds:[1000]})):[]});
      if(url?.startsWith('/training-sessions/')&&url.endsWith('/attendance'))return reply(config,Array.from({length:65},(_,i)=>({enrollmentId:6000+i,userId:7000+i,fullName:'TEST_ONLY Student '+(i+1),status:'PRESENT',note:null,recordedAt:null,attendanceStillReachable:true})));
      if(url==='/courses/101/eligible-trainers'&&state.pickerDelta)return reply(config,{items:config.params?.q||config.params?.page===2?[{id:18,fullName:'TEST_ONLY Next trainer',branchId:2,eligible:true,reason:null}]:[{id:7,fullName:'TEST_ONLY Eligible trainer',branchId:2,eligible:true,reason:null},{id:8,fullName:'TEST_ONLY Not eligible',branchId:2,eligible:false,reason:'TEST_ONLY BR-34'}],page:config.params?.page??1,size:20,total:config.params?.q?1:21});
      if(url==='/courses/101/eligible-trainers')return reply(config,{items:[{id:7,fullName:'TEST_ONLY Eligible trainer',branchId:3,eligible:true,reason:null},{id:8,fullName:'TEST_ONLY Ineligible trainer',branchId:2,eligible:false,reason:'not certified on recipe version 201'}],page:1,size:20,total:2});
      if(method==='post'&&url==='/impact-analysis'){state.run={runId:'11111111111111111111111111111111',trigger:{entityType:'Ingredient',entityId:901},affected:{recipeVersions:[],courses:[],certificates:[],liveBranches:[]},committed:false};return reply(config,state.run)}
      if(url?.startsWith('/impact-analysis/')&&method==='get')return reply(config,state.run);
      if(url?.endsWith('/commit')){state.run.committed=true;return fail(config,409,{code:'RULE_VIOLATION',rule:'IMPACT_ALREADY_COMMITTED',message:'Already committed by another client',details:[],traceId:'TEST_ONLY_IMPACT'})}
      if(url==='/assignments')return reply(config,{items:state.flow?[{enrollmentId:70,userId:1,fullName:'TEST_ONLY Learner',courseTitle:'TEST_ONLY Learning',dueDate:'2026-11-01',stage:'LOCKED',isOverdue:false,enrollmentState:'LOCKED'}]:[{enrollmentId:701,fullName:'TEST_ONLY trainee',courseTitle:'TEST_ONLY course',dueDate:'2026-11-01',stage:'QUIZ_PASSED',isOverdue:false,enrollmentState:'ELIGIBLE'}],page:config.params?.page??1,size:20,total:60});
      if(url==='/corrective-actions/801')return reply(config,{id:801,branchAuditId:601,branchId:2,status:'OPEN',description:'TEST_ONLY correction',retrainingRequired:true,employeeIds:state.retrainDelta?[777,778,779,780,781]:[777]});
      if(url==='/branch-audits/601')return reply(config,{id:601,branchId:2,recipeVersionId:201});
      if(url==='/unused-test-only-trace')return reply(config,{courses:[{id:1101,title:'TEST_ONLY recertification',courseType:'RECERTIFICATION',state:'PUBLISHED'},{id:1102,title:'TEST_ONLY draft',courseType:'PRODUCT',state:'DRAFT'}],certifiedStaff:[{userId:999,fullName:'HISTORY_ONLY_NOT_ROSTER'}]});
      if(url==='/corrective-actions/801/retraining-options'&&state.retrainDelta)return reply(config,{correctiveActionId:801,branchAuditId:601,auditedRecipeVersionId:201,employeeIds:[777,778,779,780,781],courses:[{courseId:state.newOptions?1103:1101,title:'TEST_ONLY valid retraining',courseType:'RECERTIFICATION',recipeVersionId:201,currentVersion:true}]});
      if(url==='/corrective-actions/801/retraining-options')return reply(config,{correctiveActionId:801,branchAuditId:601,auditedRecipeVersionId:201,employeeIds:[777],courses:[{courseId:1101,title:'TEST_ONLY recertification',courseType:'RECERTIFICATION',recipeVersionId:201,currentVersion:true}]});
      if(url==='/corrective-actions/801/assign-retraining'&&state.retrainDelta){if(!state.newOptions){state.newOptions=true;return fail(config,409,{code:'RULE_VIOLATION',rule:'RETRAINING_COURSE_NOT_ALLOWED',message:'TEST_ONLY stale SOP choice',details:[{field:'courseId',issue:'reload them'}],traceId:'TEST_ONLY_SCOPE'})}return reply(config,{correctiveActionId:801,courseId:1103,results:[{employeeId:777,outcome:'ASSIGNED',enrollmentId:9901,reasonCode:null},{employeeId:778,outcome:'ALREADY_ENROLLED',enrollmentId:9900,reasonCode:null},{employeeId:779,outcome:'SKIPPED',enrollmentId:null,reasonCode:'INACTIVE'},{employeeId:780,outcome:'SKIPPED',enrollmentId:null,reasonCode:'WRONG_BRANCH'},{employeeId:781,outcome:'SKIPPED',enrollmentId:null,reasonCode:'NOT_FOUND'}],enrollmentIds:[9901],alreadyEnrolled:[778]})}
      if(url==='/corrective-actions/801/assign-retraining')return reply(config,{correctiveActionId:801,courseId:1101,enrollmentIds:[9901],alreadyEnrolled:[],results:[{employeeId:777,outcome:'ASSIGNED',enrollmentId:9901,reasonCode:null}]});
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
  await click('Hủy');await click('Quiz');await click('Thêm câu hỏi');await delay(120)
  assert(await evaluate('!!document.getElementById("options[0].key") && !!document.getElementById("options[1].key") && document.querySelector("#correctOption").tagName==="SELECT"'))
  await evaluate('var s=document.querySelector("#correctOption");s.value="A";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await until('document.querySelector("#correctOption").value==="A"')
  await evaluate('document.getElementById("options[0].key").focus();document.getElementById("options[0].key").select()')
  await command('Input.insertText',{text:'C'})
  await until('document.querySelector("#correctOption").value==="" && [...document.querySelector("#correctOption").options].some(o=>o.value==="C")')
  await evaluate('var s=document.querySelector("#correctOption");s.value="B";s.dispatchEvent(new Event("change",{bubbles:true}))')
  await evaluate('document.querySelectorAll("[role=dialog] fieldset.nested-card")[1].querySelector("button").click()')
  await until('document.querySelector("#correctOption").value==="" && ![...document.querySelector("#correctOption").options].some(o=>o.value==="B")')
  pass('quiz UI starts with two choices and clears correct answer after key rename/delete')
  await click('Hủy');await click('Nội dung học');await evaluate('document.querySelectorAll(".module-card").forEach(node=>node.open=true)');await evaluate('[...document.querySelectorAll(".module-card button")].find(b=>b.textContent==="Chỉnh sửa"&&b.closest(".module-card").textContent.includes("TECHNIQUE")).click()')
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
  await evaluate(`[...document.querySelectorAll("button")].find(button=>button.getAttribute("aria-label")==="Trang nhân viên sau").click()`)
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
  await click('Giao học lại');await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("Giao mới: 1")')
  assert(await evaluate('document.querySelector("[role=dialog]").textContent.replace(/[.,]/g,"").includes("9901")'))
  assert(await evaluate('window.__regression.calls.some(c=>c.url==="/corrective-actions/801/assign-retraining"&&c.body.courseId===1101) && !window.__regression.calls.some(c=>c.url==="/users")'))
  pass('auditor retraining uses dedicated SOP courses and action staff without ADMIN users or history roster')
  await click('Đóng');await evaluate('window.__regression.flow=true;window.__asRole("TRAINEE",2)');await evaluate('window.__navigate("/barista/learning/70")')
  await until('document.body.textContent.includes("TEST_ONLY Lesson 8001")')
  assert(await evaluate('![...document.querySelectorAll("button")].some(b=>b.textContent==="Đánh dấu đã học xong")'))
  await click('Đánh dấu hoàn thành bài');await until('document.querySelectorAll("button:disabled").length>0 && window.__regression.reads.length===1')
  await click('Bài tiếp theo →');await until('[...document.querySelectorAll("button")].some(b=>b.textContent==="Đánh dấu hoàn thành bài" && !b.disabled)')
  await click('Đánh dấu hoàn thành bài');await until('document.body.textContent.includes("100% hoàn thành") && document.body.textContent.includes("Đủ điều kiện")')
  assert(await evaluate('!window.__regression.calls.some(c=>c.method==="post"&&c.url.includes("/modules/")&&c.url.endsWith("/complete"))'))
  pass('learner marks each lesson and GET refresh displays server module completion and eligibility')
  await evaluate('window.__navigate("/barista/learning/70/quiz")');await until('document.body.textContent.includes("TEST_ONLY question")');await click('Nộp bài kiểm tra')
  await until('window.__regression.reads.length===0 && document.body.textContent.includes("Cần học/đọc lại")')
  await evaluate('window.__navigate("/barista/learning/70")');await until('[...document.querySelectorAll("button")].filter(b=>b.textContent==="Đánh dấu hoàn thành bài"&&!b.disabled).length===1')
  pass('quiz failure refresh removes prior lesson checkmarks and shows missing module')
  await evaluate('window.__navigate("/barista/learning-path")');await until('document.body.textContent.includes("TEST_ONLY Blocked")')
  assert(await evaluate('![...document.querySelectorAll(".lesson-card")].find(e=>e.textContent.includes("TEST_ONLY Blocked")).querySelector("a") && [...document.querySelectorAll("a")].some(a=>a.getAttribute("href")==="/barista/learning/70")'))
  assert(await evaluate('!window.__regression.calls.some(c=>c.url==="/learning-paths/1/assign")'))
  pass('learner path links only actual enrollment and does not auto-assign blocked courses')
  await evaluate('window.__asRole("TRAINING_MANAGER")');await evaluate('window.__navigate("/training-manager/learning-path")')
  await until('[...document.querySelectorAll(".lookup-control select")].some(s=>[...s.options].some(o=>o.textContent.includes("TEST_ONLY Selected name")))')
  await evaluate('(()=>{const picker=[...document.querySelectorAll(".lookup-control select")].find(select=>[...select.options].some(option=>option.textContent.includes("TEST_ONLY Selected name")));if(!picker)throw new Error("Learning-path staff picker was not rendered");picker.value="1";picker.dispatchEvent(new Event("change",{bubbles:true}))})()')
  await until('document.body.textContent.includes("TEST_ONLY Blocked")');await click('Giao các khóa đang mở');await click('Xác nhận')
  await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")')
  assert(await evaluate('window.__regression.calls.some(c=>c.method==="post"&&c.url==="/learning-paths/1/assign")'))
  pass('manager path picker and assign action use actual endpoint and display dedup result')
  await click('Đóng')
  await evaluate('window.__navigate("/training-manager/courses/pending")')
  await until('location.pathname==="/training-manager/dashboard"')
  pass('training-manager cannot open the RD_MANAGER-only pending-review route')
  await evaluate('window.__asRole("RD_MANAGER")');await evaluate('window.__navigate("/rd-manager/courses/pending")')
  await until('window.__regression.calls.some(c=>c.url==="/courses"&&c.params?.state==="PENDING_APPROVAL") && document.body.textContent.includes("Khóa chờ duyệt")')
  pass('RD manager pending-review route sends actual state filter without a bogus detail ID')
  await evaluate('window.__regression.lessonState="LOCKED";window.__asRole("TRAINING_MANAGER")');await evaluate('window.__navigate("/training-manager/assignments")')
  await until('document.body.textContent.includes("TEST_ONLY Learning")');await click('Xem chi tiết →');await click('Mở lại đăng ký bị khóa');await click('Xác nhận')
  await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")');await click('Đóng')
  await evaluate('window.__asRole("TRAINEE",2)');await evaluate('window.__navigate("/barista/learning/70")')
  await until('document.body.textContent.includes("0% hoàn thành") && [...document.querySelectorAll("button")].filter(b=>b.textContent==="Đánh dấu hoàn thành bài"&&!b.disabled).length===1')
  pass('training-manager reset uses actual endpoint and next account sees fresh lesson progress')
  await evaluate('window.__navigate("/barista/notifications")');await until('document.body.textContent.includes("Training needed for a drink") && document.body.textContent.includes("Sales missing")')
  assert(await evaluate('!document.querySelector(".panel a") && window.__regression.notices.every(n=>document.body.textContent.includes(n.subject))'))
  pass('all six launch notice subjects render as generic inbox content without fabricated navigation')
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(150)
  assert(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'))
  pass('inbox and unread bell fit the mobile viewport independently of push permission')
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  assert(await evaluate('!document.querySelector(".panel a")'))
  await click('Đánh dấu đã đọc');await click('Xác nhận');await until(`document.querySelector('[aria-label="Số thông báo chưa đọc"]')?.textContent==="5"`)
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

  for(const role of ['ADMIN','RD_SPECIALIST','RD_MANAGER','TRAINER','TRAINEE','QUALITY_AUDITOR','BRANCH_MANAGER','TRAINING_MANAGER']) {
    await evaluate('window.__asRole('+JSON.stringify(role)+',2)');
    const prefix=await evaluate('(async()=>{const {roleConfig}=await import("/src/constants/roles.ts");return roleConfig['+JSON.stringify(role)+'].prefix})()');
    await evaluate('window.__navigate('+JSON.stringify(prefix+'/dashboard')+')');
    await until('!!document.querySelector(".sidebar-footer")');await delay(60);
    const expected=await evaluate('(async()=>{const {navigationFor}=await import("/src/constants/navigation.ts");return navigationFor('+JSON.stringify(role)+').map(e=>e.title)})()');
    const actual=await evaluate('[...document.querySelectorAll(".sidebar-nav a")].map(a=>a.getAttribute("aria-label"))');assert.deepEqual(actual,expected);assert.equal(new Set(actual).size,actual.length);
    pass('role-specific sidebar without duplicate or unauthorized entries '+role);
  }
  await evaluate('window.__asRole("TRAINER",2)');await evaluate('window.__navigate("/trainer/courses/101?section=content&demo=keep#lesson")');await until('!!document.querySelector(".module-card")');
  assert.equal(await evaluate('document.querySelectorAll(".sidebar-nav .active").length'),1);pass('detail route highlights exactly one sidebar item');
  await evaluate('document.querySelector(".desktop-collapse").click()');assert(await evaluate('document.querySelector(".workspace-sidebar").classList.contains("is-collapsed")&&[...document.querySelectorAll(".sidebar-nav a")].every(a=>a.title)'));pass('desktop collapse has named icon links and persists per role');
  await evaluate('document.querySelector(".desktop-collapse").click()');
  await click('Quiz');await until('location.search.includes("section=quiz")');assert(await evaluate('location.search.includes("demo=keep")&&location.search.includes("section=quiz")&&location.hash==="#lesson"'));pass('detail tabs preserve other query parameters and hash');
  await evaluate('document.querySelector("[role=tab][aria-selected=true]").focus()');await command('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft'});await command('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft'});await delay(60);assert(await evaluate('document.activeElement.getAttribute("role")==="tab"&&document.activeElement.getAttribute("aria-selected")==="true"'));pass('tabs support keyboard selection and focus');
  await click('Nội dung học');await evaluate('document.querySelectorAll(".module-card").forEach(node=>node.open=true)');await evaluate('[...document.querySelectorAll(".module-card button")].find(b=>b.textContent==="Chỉnh sửa").click()');await until('!!document.querySelector("[role=dialog] textarea")');await evaluate('document.querySelector("[role=dialog] textarea").focus()');await command('Input.insertText',{text:'TEST_ONLY dirty draft'});
  await click('Quiz');assert(await evaluate('document.querySelector("[role=dialog] textarea").value.includes("TEST_ONLY dirty draft")'));pass('section changes preserve a mounted dialog draft');acceptDialog=false;await click('Hủy');await delay(80);assert(await evaluate('!!document.querySelector("[role=dialog] textarea")'));pass('canceling discard confirmation keeps dirty draft');acceptDialog=true;await click('Hủy');
  for(const width of [1440,768,390]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});await delay(80);assert(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'));pass('course detail fits viewport '+width);
  }
  await evaluate('document.querySelector(".mobile-sidebar-bar button").click()');assert(await evaluate('document.querySelector(".workspace-sidebar").classList.contains("drawer-open")&&!!document.querySelector(".sidebar-backdrop")'));await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await until('!document.querySelector(".sidebar-backdrop")');pass('mobile drawer opens with backdrop and closes with Escape');
  await evaluate('document.querySelector(".mobile-sidebar-bar button").click();document.querySelector(".sidebar-nav a").click()');await until('!document.querySelector(".sidebar-backdrop")');pass('mobile navigation closes drawer');
  await evaluate('window.__asRole("TRAINEE",2)');await evaluate('window.__regression.lessonState="ASSIGNED";window.__regression.reads=[];window.__navigate("/barista/learning/70?lesson=8002")');await until('!!document.querySelector(".lesson-reader")');assert.equal(await evaluate('document.querySelectorAll(".lesson-reader").length'),1);assert(await evaluate('document.querySelector(".lesson-reader").textContent.includes("TEST_ONLY Lesson 8002")'));pass('learner displays only selected lesson from deep link');
  await click('Danh mục bài học');assert(await evaluate('document.querySelector(".lesson-catalog").classList.contains("catalog-open")'));pass('learner mobile catalog opens independently of reading content');
  await evaluate('(async()=>{const {store}=await import("/src/app/store.ts");const {backendApi}=await import("/src/services/backend/operations.ts");store.dispatch(backendApi.util.invalidateTags(["Training"]))})()');await delay(100);assert(await evaluate('location.search.includes("lesson=8002")&&document.querySelector(".lesson-reader").textContent.includes("TEST_ONLY Lesson 8002")'));pass('background refetch retains selected lesson without marking complete');
  const screenshot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(path.join(os.tmpdir(),'brewforge-ui-mobile.png'),Buffer.from(screenshot.data,'base64'));


  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate('window.__regression.longUi=true;window.__asRole("TRAINER",2)');await evaluate('window.__navigate("/trainer/courses/101?section=quiz")');await until('document.querySelectorAll("[role=tabpanel]:not([hidden]) [aria-label] > details").length===25');assert.equal(await evaluate('document.querySelectorAll("[role=tabpanel]:not([hidden]) [aria-label] > details[open]").length'),0);pass('25 quiz questions are summarized and collapsed individually');
  await click('Nội dung học');await until('document.querySelectorAll(".module-card").length===7');assert.equal(await evaluate('document.querySelectorAll(".module-card[open]").length'),0);pass('long course has compact closed module summaries');
  const desktopShot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(path.join(os.tmpdir(),'brewforge-ui-desktop.png'),Buffer.from(desktopShot.data,'base64'));
  await evaluate('window.__asRole("RD_SPECIALIST")');await evaluate('window.__navigate("/rd-specialist/versions/201")');await until('!!document.getElementById("step-502")');assert.equal(await evaluate('document.querySelectorAll("details[id^=step-]").length'),25);assert(await evaluate('document.querySelector(".sidebar-nav .active").getAttribute("href").endsWith("/recipes")'));pass('long SOP uses one accordion per actual step');
  await click('Chạy kiểm tra');await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("TEST_ONLY dependency issue")');await click('Đóng');await click('Kết quả kiểm tra');await evaluate('[...document.querySelectorAll("a")].find(a=>a.textContent.includes("TEST_ONLY dependency issue")).click()');await until('document.getElementById("step-502")?.open&&location.search.includes("section=steps")&&location.hash==="#step-502"');pass('validation result opens and focuses the failing SOP step');
  await evaluate('window.__regression.classState="RUNNING";window.__asRole("TRAINER",2)');await evaluate('window.__navigate("/trainer/classes/401")');await until('document.querySelectorAll(".table-wrap tbody tr").length===10');await click('Sau');assert(await evaluate('document.querySelector(".pagination").textContent.includes("2/3")'));pass('25 class sessions paginate locally without changing server contracts');
  await click('Xem chi tiết →');await click('Học viên & điểm danh');await until('!!document.querySelector("#attendance-search") && document.querySelector("[role=tabpanel]:not([hidden])")?.querySelectorAll("tbody tr").length===20');assert.equal(await evaluate('document.querySelector("[role=tabpanel]:not([hidden])").querySelectorAll("tbody tr").length'),20);pass('65 attendance records remain a paginated comparison table');
  await evaluate('document.querySelector("#attendance-search").focus()');await command('Input.insertText',{text:'Student 65'});await until('document.querySelector("[role=tabpanel]:not([hidden])").querySelectorAll("tbody tr").length===1');await click('Ghi điểm danh');await until('!!document.querySelector("[role=dialog]")');assert.equal(await evaluate('document.querySelectorAll("[role=dialog] fieldset.nested-card").length'),65);pass('attendance filtering does not truncate the bulk edit draft');await click('Hủy');


  await evaluate('window.__regression.retrainDelta=true;window.__asRole("QUALITY_AUDITOR")');await evaluate('window.__navigate("/quality-auditor/corrective-actions/801?section=retraining")');await until('[...document.querySelectorAll("#retraining-course option")].some(option=>option.value==="1101")');await evaluate('var select=document.querySelector("#retraining-course");select.value="1101";select.dispatchEvent(new Event("change",{bubbles:true}))');await click('Giao học lại');await until('!!document.getElementById("deadline")');await delay(60);
  await evaluate('var input=document.getElementById("deadline");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"2099-01-31");input.dispatchEvent(new Event("input",{bubbles:true}))');await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("RETRAINING_COURSE_NOT_ALLOWED")');assert.equal(await evaluate('document.getElementById("deadline").value'),'2099-01-31');assert(await evaluate('document.querySelector("[role=dialog]").textContent.includes("TEST_ONLY_SCOPE")'));pass('stale SOP retraining conflict preserves deadline draft, rule, details and trace');
  await click('Tải lại lựa chọn học lại');await until('[...document.querySelectorAll("[role=dialog] select option")].some(option=>option.value==="1103")');assert.equal(await evaluate('document.getElementById("deadline").value'),'2099-01-31');await evaluate('var select=document.querySelector("[role=dialog] select");select.value="1103";select.dispatchEvent(new Event("change",{bubbles:true}))');await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("Giao mới: 1 · Đã có đăng ký: 1 · Bỏ qua: 3")');assert(await evaluate('!document.querySelector("[role=dialog] .success-box")&&["INACTIVE","WRONG_BRANCH","NOT_FOUND"].every(code=>document.querySelector("[role=dialog]").textContent.includes(code))'));assert(await evaluate('window.__regression.calls.some(call=>call.url==="/corrective-actions/801/assign-retraining"&&call.body.courseId===1103&&call.body.deadline==="2099-01-31")'));pass('retraining reloads valid options and reports all per-employee outcomes without skipped success');await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(60);assert(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'));pass('mixed retraining results fit mobile with internal table scrolling');await click('Đóng');await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate('window.__regression.pickerDelta=true;window.__asRole("TRAINER",2)');await evaluate('window.__navigate("/trainer/classes/401")');await until('document.querySelectorAll("tbody tr").length===10');await click('Xem chi tiết →');await click('Chỉnh buổi học');await until('[...[...document.querySelectorAll("[role=dialog] select")].find(select=>select.getAttribute("aria-label")==="Giảng viên").options].some(option=>option.value==="17"&&option.textContent.includes("TEST_ONLY Historical 17")&&option.disabled)');pass('stored trainer ID resolves an inactive historical name outside the first page');
  await evaluate('[...document.querySelectorAll("button")].find(button=>button.getAttribute("aria-label")==="Trang nhân viên sau").click()');await until('[...[...document.querySelectorAll("[role=dialog] select")].find(select=>select.getAttribute("aria-label")==="Giảng viên").options].some(option=>option.value==="18")');assert(await evaluate('window.__regression.calls.some(call=>call.url==="/courses/101/eligible-trainers"&&call.params.page===2&&call.params.size===20)'));pass('eligible trainer picker uses server pagination and preserves stored reference');await evaluate('document.querySelector("[role=dialog] input[placeholder]").focus()');await command('Input.insertText',{text:'Next'});await until('window.__regression.calls.some(call=>call.url==="/courses/101/eligible-trainers"&&call.params.q==="Next"&&call.params.page===1)');pass('eligible trainer search debounces and resets server page');await click('Hủy');
  for(const [role,prefix] of [['TRAINING_MANAGER','/training-manager'],['BRANCH_MANAGER','/store-manager']]){
    const before=await evaluate('window.__regression.calls.length');await evaluate('window.__asRole('+JSON.stringify(role)+',2)');await evaluate('window.__navigate('+JSON.stringify(prefix+'/enrollments/70')+')');await until('document.querySelector("main h1")?.textContent.includes("TEST_ONLY Learning")&&document.body.textContent.includes("Tóm tắt quiz")');await until('document.body.textContent.includes("Chu kỳ học hiện tại")');
    assert(await evaluate('!window.__regression.calls.slice('+before+').some(call=>["/quiz","/practical-videos","/practical-schedules"].some(suffix=>call.url.endsWith(suffix))||call.method!=="get")'));assert(await evaluate('![...document.querySelectorAll("button")].some(button=>/Đánh dấu hoàn thành bài|Nộp bài kiểm tra|Đánh giá thực hành/.test(button.textContent))'));pass('manager read page uses only authorized summaries without learner or evaluate access '+role);if(role==='BRANCH_MANAGER'){await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(60);assert(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'));pass('manager enrollment reader fits mobile');await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})}
  }
  await evaluate('window.__regression.wrongBranch=true;window.__asRole("BRANCH_MANAGER",3)');await evaluate('window.__navigate("/store-manager/enrollments/70")');await until('document.querySelector(".error-box")?.textContent.includes("NOT_FOUND")');assert(await evaluate('!!document.querySelector(".sidebar-footer")&&!document.querySelector("[role=tablist]")'));pass('wrong-branch enrollment 404 stays an error without logging out or showing a detail');await evaluate('window.__regression.wrongBranch=false');
  await evaluate('window.__regression.practicalDelta=true;window.__regression.reset=false;window.__regression.lessonState="ELIGIBLE";window.__regression.course.state="PUBLISHED";window.__regression.attempts=[{attemptNo:1,passed:true,attemptedAt:"2026-10-19T00:30:00Z"}];window.__asRole("TRAINER",2)');await evaluate('window.__navigate("/trainer/assessment/70")');await until('[...document.querySelectorAll("#evaluation-video option")].some(option=>option.value==="601")');await evaluate('var select=document.querySelector("#evaluation-video");select.value="601";select.dispatchEvent(new Event("change",{bubbles:true}))');await until('[...document.querySelectorAll("button")].some(button=>button.textContent==="Đánh giá thực hành"&&!button.disabled)');
  await evaluate('window.__regression.reset=true;window.__invalidate()');await until('document.querySelector("#evaluation-video").value===""&&[...document.querySelectorAll("button")].some(button=>button.textContent==="Đánh giá thực hành"&&button.disabled)');assert(await evaluate('[...document.querySelectorAll("button")].some(button=>button.textContent==="Đặt lịch"&&button.disabled)'));pass('reset refetch invalidates the selected old practical video and ignores the preceding quiz pass');

  await evaluate('window.__asRole("ADMIN")');await evaluate('window.__navigate("/admin/users")');await click('Thêm mới');await until('document.querySelector("select#role")?.options.length===9');assert(await evaluate('[...document.querySelector("select#role").options].some(option=>option.value==="RD_MANAGER")'));pass('user form loads all role choices from authenticated catalogue');await click('Hủy');
  await evaluate('window.__asRole("BRANCH_MANAGER",2)');await evaluate('window.__navigate("/store-manager/sales")');await click('Nhập CSV / XLSX');
  await evaluate('var transfer=new DataTransfer();transfer.items.add(new File(["TEST_ONLY_csv"],"demo.csv",{type:"text/csv"}));var input=document.querySelector("#upload-file");input.files=transfer.files;input.dispatchEvent(new Event("change",{bubbles:true}))');await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("Chưa xác định")');assert(await evaluate('window.__regression.posRequests.length===1'));await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("TEST_ONLY rejected row")');assert(await evaluate('window.__regression.posRequests.length===2&&window.__regression.posRequests[0].key===window.__regression.posRequests[1].key&&window.__regression.posRequests[0].file===window.__regression.posRequests[1].file'));pass('POS lost response preserves actual file/key for manual retry and displays replay with rejected rows');await click('Đóng');
  assert.deepEqual(exceptions,[]);pass('no unhandled browser exceptions in isolated authoring regressions')
  console.log(`Completed ${checks} browser checks using TEST_ONLY transport fixtures. No backend business requests were sent.`)
} finally {socket?.close();browser.kill()}
