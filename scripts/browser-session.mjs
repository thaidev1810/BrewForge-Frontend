// TEST_ONLY CDP network interception survives full page reload. No request is forwarded to BE.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {spawn} from 'node:child_process'
const origin=process.env.FE_SMOKE_URL??'http://127.0.0.1:5174'
assert(['localhost','127.0.0.1'].includes(new URL(origin).hostname))
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'brewforge-session-'))
const browser=spawn(process.env.CHROME_PATH??'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'})
const delay=ms=>new Promise(r=>setTimeout(r,ms))
let socket,checks=0
const pass=name=>{checks++;console.log('PASS '+name)}
try {
  let port
  for(let i=0;i<100&&!port;i++){try{port=Number((await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0])}catch{await delay(100)}}
  assert(port)
  const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl)
  await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})})
  let loads=0;let seq=0,role='TRAINER',expired=false,revoked=false,unavailable=false,hold=false,held,refreshes=0,mes=0,revision=1
  const pending=new Map(),exceptions=[],calls=[],cancelledRequests=new Set()
  const me=()=>({id:9,username:'TEST_ONLY',fullName:'TEST_ONLY User',email:'test@example.invalid',role,branchId:role==='TRAINER'?2:null,status:'ACTIVE',permissions:[]})
  const course=()=>({id:101,title:'TEST_ONLY Review course',courseType:'PRODUCT',recipeVersionId:null,state:courseState,modules:[],quiz:{title:'TEST_ONLY',questionCount:1},practicalChecklist:[]})
  let courseState='PENDING_APPROVAL'
  function command(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}))})}
  const fulfill=(id,status,data)=>command('Fetch.fulfillRequest',{requestId:id,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origin},{name:'Access-Control-Allow-Headers',value:'Authorization,Content-Type,Accept,Idempotency-Key'},{name:'Access-Control-Allow-Methods',value:'GET,POST,OPTIONS'}],body:Buffer.from(data===undefined?'':JSON.stringify(data)).toString('base64')})
  async function intercept(params) {
    const request=params.request,url=new URL(request.url),p=url.pathname.replace('/api/v1',''),method=request.method
    if(url.origin===origin&&!url.pathname.startsWith('/api/'))return command('Fetch.continueRequest',{requestId:params.requestId})
    if(method==='OPTIONS'){await fulfill(params.requestId,200,{});return}
    calls.push({p,method,body:request.postData?.startsWith('{')?JSON.parse(request.postData):null})
    if(p==='/auth/login')return fulfill(params.requestId,200,{accessToken:'TEST_ONLY_access_'+revision,refreshToken:'TEST_ONLY_refresh_'+revision,user:me()})
    if(p==='/auth/refresh'){refreshes++;if(revoked)return fulfill(params.requestId,401,{message:'TEST_ONLY revoked',code:'UNAUTHENTICATED',details:[]});expired=false;revision++;return fulfill(params.requestId,200,{accessToken:'TEST_ONLY_access_'+revision,refreshToken:'TEST_ONLY_refresh_'+revision,user:me()})}
    if(p==='/auth/logout')return fulfill(params.requestId,204)
    if(p==='/auth/me'){mes++;if(hold){held=()=>fulfill(params.requestId,200,me());return}return fulfill(params.requestId,unavailable?503:expired?401:200,unavailable||expired?{message:'TEST_ONLY unavailable',details:[]}:me())}
    if(p==='/courses')return fulfill(params.requestId,200,{items:[course()],page:1,size:20,total:1})
    if(p==='/courses/101')return fulfill(params.requestId,200,course())
    if(p==='/courses/101/approve'||p==='/courses/101/return'){
      if(role!=='TRAINING_MANAGER')return fulfill(params.requestId,403,{message:'TEST_ONLY forbidden',details:[]})
      courseState=p.endsWith('/approve')?'PUBLISHED':'DRAFT';return fulfill(params.requestId,200,course())
    }
    if(p==='/me/notifications/unread-count')return fulfill(params.requestId,200,{count:0})
    return fulfill(params.requestId,200,{items:[],page:1,size:20,total:0})
  }
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Network.loadingFailed'&&m.params.canceled)cancelledRequests.add(m.params.requestId);if(m.method==='Page.loadEventFired')loads++;if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);if(m.method==='Fetch.requestPaused')void intercept(m.params).catch(async error=>{await delay(50);if(error.message==='Invalid InterceptionId.'&&cancelledRequests.has(m.params.networkId))return;exceptions.push(error.message)});const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}})
  const evaluate=async expression=>{const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value}
  async function until(expression){for(let i=0;i<120;i++){if(await evaluate(expression))return;await delay(100)}throw Error('TEST_ONLY browser wait: '+expression)}
  async function click(text){await until(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled)`);await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled).click()`)}
  async function loginUI(){await until('!!document.querySelector("#username")');await evaluate('document.querySelector("#username").focus()');await command('Input.insertText',{text:'TEST_ONLY'});await evaluate('document.querySelector("#password").focus()');await command('Input.insertText',{text:'TEST_ONLY'});await click('Đăng nhập')}
  async function reload(){const previous=loads;await command('Page.reload');for(let i=0;i<100;i++){if(loads>previous)return;await delay(25)}throw Error('TEST_ONLY page did not reload')}
  async function navigate(p){const previous=loads;await command('Page.navigate',{url:origin+p});for(let i=0;i<100;i++){if(loads>previous)return;await delay(25)}throw Error('TEST_ONLY page did not load')}
  await command('Network.enable');await command('Network.setCacheDisabled',{cacheDisabled:true});await command('Page.enable');await command('Runtime.enable')
  await command('Fetch.enable',{patterns:[{urlPattern:'http*'}]})
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  const deep='/trainer/courses/101?tab=modules#lesson'
  await navigate(deep);await loginUI();await until('location.pathname==="/trainer/courses/101" && document.body.textContent.includes("TEST_ONLY Review course")')
  assert(await evaluate(`location.pathname+location.search+location.hash===${JSON.stringify(deep)}`));pass('login returns to permitted pathname, query and hash')
  const beforeMe=mes;await reload();await until('document.body.textContent.includes("TEST_ONLY Review course")')
  assert.equal(mes-beforeMe,1);assert(await evaluate(`location.pathname+location.search+location.hash===${JSON.stringify(deep)}`));pass('F5 restores through one me call under StrictMode and retains exact deep link')
  expired=true;const beforeRefresh=refreshes;await reload();await until('document.body.textContent.includes("TEST_ONLY Review course")')
  assert.equal(refreshes-beforeRefresh,1);assert(await evaluate(`location.pathname+location.search+location.hash===${JSON.stringify(deep)}`));pass('expired access refreshes once on reload and retains the page')
  unavailable=true;await reload();await until('document.body.textContent.includes("Không khôi phục được phiên")')
  assert(await evaluate('!!sessionStorage.getItem("brewforge.session.v1") && !document.body.textContent.includes("TEST_ONLY Review course")'))
  unavailable=false;await click('Thử lại khôi phục phiên');await until('document.body.textContent.includes("TEST_ONLY Review course")');pass('bootstrap 503 blocks private content, preserves pair and Retry restores same URL')
  expired=true;revoked=true;await reload();await until('location.pathname==="/login" && !!document.querySelector("#username")')
  assert(await evaluate('sessionStorage.getItem("brewforge.session.v1")===null'));pass('revoked refresh sends login and removes stored session')
  expired=false;revoked=false;await loginUI();await until('location.pathname==="/trainer/courses/101"')
  hold=true;await reload();for(let i=0;i<100&&!held;i++)await delay(50);assert(held)
  await evaluate(`(async()=>{const {store}=await import('/src/app/store.ts');const {signOut}=await import('/src/features/auth/authSlice.ts');await store.dispatch(signOut())})()`)
  hold=false;await held();await until('location.pathname==="/login"');assert(await evaluate('sessionStorage.getItem("brewforge.session.v1")===null'));pass('logout during pending bootstrap does not resurrect an old session')
  const afterLogoutMe=mes;await reload();await until('!!document.querySelector("#username")');assert.equal(mes,afterLogoutMe);pass('reload after logout sends no me or refresh for the preceding account')
  await evaluate('sessionStorage.setItem("brewforge.session.v1","{broken")');await reload();await until('!!document.querySelector("#username")');assert(await evaluate('sessionStorage.getItem("brewforge.session.v1")===null'));pass('malformed storage reload is safe and remains on login')
  const beforeDenied=calls.length;role='RD_MANAGER';await loginUI();await until('location.pathname==="/rd-manager/dashboard"')
  await navigate('/rd-manager/courses');await until('document.body.textContent.includes("TEST_ONLY Review course")');await click('Xem chi tiết →');await until('location.pathname==="/rd-manager/courses/101" && !!document.querySelector("[role=tablist]") && document.body.textContent.includes("TEST_ONLY Review course")')
  assert(await evaluate('![...document.querySelectorAll("button")].some(b=>["Duyệt khóa học","Trả lại biên soạn"].includes(b.textContent.trim())) && ![...document.querySelectorAll("a")].some(a=>a.getAttribute("href")==="/rd-manager/courses/pending")'))
  assert(!calls.slice(beforeDenied).some(c=>['/courses/101/approve','/courses/101/return'].includes(c.p)))
  assert(calls.slice(beforeDenied).some(c=>c.p==='/courses/101'));pass('RD_MANAGER reads course detail but has no review actions or pending menu')
  await evaluate(`(async()=>{const {store}=await import('/src/app/store.ts');const {logout}=await import('/src/features/auth/authSlice.ts');store.dispatch(logout())})()`);await until('location.pathname==="/login"')
  role='TRAINING_MANAGER';courseState='PENDING_APPROVAL';await loginUI();await until('location.pathname==="/training-manager/dashboard"')
  await navigate('/training-manager/courses/101');await until('document.body.textContent.includes("TEST_ONLY Review course")');await click('Trả lại biên soạn')
  await evaluate('document.querySelector("#comment").focus()');await command('Input.insertText',{text:'TEST_ONLY return reason'});await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")')
  assert(calls.some(c=>c.p==='/courses/101/return'&&c.body.comment==='TEST_ONLY return reason'));pass('authorized current TRAINING_MANAGER sends return comment through real dialog')
  await click('Đóng');courseState='PENDING_APPROVAL';await reload();await until('document.body.textContent.includes("TEST_ONLY Review course")');await click('Duyệt khóa học');await click('Xác nhận');await until('document.querySelector("[role=dialog]")?.textContent.includes("Máy chủ đã xử lý")')
  assert(calls.some(c=>c.p==='/courses/101/approve'&&c.method==='POST'));pass('authorized approval uses actual POST and server result without authoring permissions')
  assert.deepEqual(exceptions,[]);pass('no unhandled exceptions during session reload and review regressions')
  console.log(`Completed ${checks} browser session checks; all BE HTTP requests fulfilled by TEST_ONLY CDP interception.`)
} finally {socket?.close();browser.kill()}
