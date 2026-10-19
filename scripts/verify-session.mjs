import assert from 'node:assert/strict'
import { createServer } from 'vite'
const values = new Map()
const storage = { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value), removeItem: key => values.delete(key) }
Object.defineProperty(globalThis,'sessionStorage',{value:storage,configurable:true})
const server=await createServer({server:{middlewareMode:true},appType:'custom'})
let checks=0
const check=(name,fn)=>{fn();checks++;console.log('PASS '+name)}
const reply=(config,data,status=200)=>({config,data,status,statusText:String(status),headers:{}})
const fail=(config,status)=>Promise.reject({isAxiosError:true,config,response:{config,status,data:{code:'TEST_ONLY',message:'TEST_ONLY refusal',details:[]}}})
const tick=()=>new Promise(r=>setTimeout(r,5))
const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await tick()}throw Error('TEST_ONLY adapter did not start')}
try {
  const {store,bootstrapAuth}=await server.ssrLoadModule('/src/app/store.ts')
  const {login,logout,signOut}=await server.ssrLoadModule('/src/features/auth/authSlice.ts')
  const {apiClient,authTransport}=await server.ssrLoadModule('/src/services/apiClient.ts')
  const {backendApi}=await server.ssrLoadModule('/src/services/backend/operations.ts')
  const {fetchProducts}=await server.ssrLoadModule('/src/features/products/productSlice.ts')
  const {SESSION_STORAGE_KEY,readStoredSession,writeStoredSession}=await server.ssrLoadModule('/src/features/auth/sessionStorage.ts')
  const {authDestination}=await server.ssrLoadModule('/src/features/auth/authRedirect.ts')
  const me=(role='TRAINER',branchId=2,id=9)=>({id,username:'TEST_ONLY',fullName:'TEST_ONLY',email:'test@example.invalid',role,branchId,status:'ACTIVE',permissions:[]})
  const old={accessToken:'TEST_ONLY_old',refreshToken:'TEST_ONLY_refresh_old'},fresh={accessToken:'TEST_ONLY_fresh',refreshToken:'TEST_ONLY_refresh_fresh'}
  const seed=tokens=>{store.dispatch(logout());writeStoredSession(tokens)}
  authTransport.defaults.adapter=async config=>reply(config,config.url==='/auth/me'?me():{...old,user:me()})
  seed(null);storage.setItem(SESSION_STORAGE_KEY,'{broken');await bootstrapAuth()
  check('malformed storage is removed and does not authenticate or crash',()=>{assert.equal(store.getState().auth.status,'unauthenticated');assert.equal(readStoredSession(),null)})
  await store.dispatch(login({username:'TEST_ONLY',password:'TEST_ONLY'}))
  check('login persists only the atomic token pair and version, no identity or business store',()=>{assert.equal(store.getState().auth.status,'authenticated');assert.deepEqual(Object.keys(JSON.parse(storage.getItem(SESSION_STORAGE_KEY))).sort(),['accessToken','refreshToken','version']);assert.deepEqual(readStoredSession(),old)})
  let calls=0
  seed(old);apiClient.defaults.adapter=async config=>{calls++;return reply(config,me('RD_MANAGER',null))}
  const first=bootstrapAuth(),second=bootstrapAuth();assert.equal(first,second);await first
  check('single-flight bootstrap validates identity via me rather than stored role',()=>{assert.equal(calls,1);assert.equal(store.getState().auth.user.role,'RD_MANAGER');assert.equal(store.getState().auth.user.branchId,null)})
  let refreshCalls=0,meCalls=0
  seed(old);apiClient.defaults.adapter=async config=>{meCalls++;return config.headers.get('Authorization')==='Bearer '+old.accessToken?fail(config,401):reply(config,me())}
  authTransport.defaults.adapter=async config=>{assert.equal(config.url,'/auth/refresh');refreshCalls++;return reply(config,{...fresh,user:me()})}
  await bootstrapAuth()
  check('expired access refreshes once, saves rotated pair and retries me exactly once',()=>{assert.equal(refreshCalls,1);assert.equal(meCalls,2);assert.equal(store.getState().auth.status,'authenticated');assert.deepEqual(readStoredSession(),fresh)})
  seed(old);apiClient.defaults.adapter=config=>fail(config,401);authTransport.defaults.adapter=config=>fail(config,401);await bootstrapAuth()
  check('invalid refresh clears persisted and Redux session instead of restoring it',()=>{assert.equal(store.getState().auth.status,'unauthenticated');assert.equal(readStoredSession(),null);assert.equal(Object.keys(store.getState().backendApi.queries).length,0)})
  for(const status of [503,undefined,403]) {
    seed(old);apiClient.defaults.adapter=config=>status?fail(config,status):Promise.reject(new Error('TEST_ONLY network'))
    await bootstrapAuth()
    check('bootstrap '+(status??'network')+' retains tokens and blocks protected content for Retry',()=>{assert.equal(store.getState().auth.status,'initializing');assert.equal(store.getState().auth.isAuthenticated,false);assert(store.getState().auth.bootstrapError);assert.deepEqual(readStoredSession(),old)})
    apiClient.defaults.adapter=async config=>reply(config,me());await bootstrapAuth()
    assert.equal(store.getState().auth.status,'authenticated')
  }
  for(const status of [503,undefined]) {
    seed(old);apiClient.defaults.adapter=config=>fail(config,401)
    authTransport.defaults.adapter=config=>status?fail(config,status):Promise.reject(new Error('TEST_ONLY refresh timeout'))
    await bootstrapAuth()
    check('refresh '+(status??'timeout')+' does not revoke a recoverable persisted session',()=>{assert.equal(store.getState().auth.status,'initializing');assert.equal(store.getState().auth.isAuthenticated,false);assert.deepEqual(readStoredSession(),old)})
  }
  seed(old);refreshCalls=0;let recovered=false
  apiClient.defaults.adapter=config=>config.headers.get('Authorization')==='Bearer '+old.accessToken?fail(config,401):recovered?Promise.resolve(reply(config,me())):fail(config,503)
  authTransport.defaults.adapter=async config=>{refreshCalls++;return reply(config,{...fresh,user:me()})}
  await bootstrapAuth();assert.deepEqual(readStoredSession(),fresh);recovered=true;await bootstrapAuth()
  check('me failure after rotation retries with the saved new pair, not a revoked old refresh',()=>{assert.equal(refreshCalls,1);assert.equal(store.getState().auth.status,'authenticated');assert.deepEqual(readStoredSession(),fresh)})
  seed(old);let releaseMe
  apiClient.defaults.adapter=config=>new Promise(resolve=>{releaseMe=()=>resolve(reply(config,me()))})
  const pendingMe=bootstrapAuth();await until(()=>releaseMe);store.dispatch(logout());releaseMe();await pendingMe
  check('logout while bootstrap me waits prevents late session resurrection',()=>{assert.equal(store.getState().auth.status,'unauthenticated');assert.equal(readStoredSession(),null)})
  seed(old);let releaseRefresh
  apiClient.defaults.adapter=config=>fail(config,401)
  authTransport.defaults.adapter=config=>new Promise(resolve=>{releaseRefresh=()=>resolve(reply(config,{...fresh,user:me()}))})
  const pendingRefresh=bootstrapAuth();await until(()=>releaseRefresh)
  store.dispatch(logout());const next={accessToken:'TEST_ONLY_next',refreshToken:'TEST_ONLY_next_refresh'}
  authTransport.defaults.adapter=async config=>reply(config,config.url==='/auth/me'?me('ADMIN',null,10):{...next,user:me('ADMIN',null,10)})
  await store.dispatch(login({username:'TEST_ONLY_next',password:'TEST_ONLY'}));releaseRefresh();await pendingRefresh
  check('late refresh from preceding account cannot overwrite new login or storage',()=>{assert.equal(store.getState().auth.user.id,'10');assert.deepEqual(readStoredSession(),next)})
  apiClient.defaults.adapter=async config=>reply(config,{items:[{id:1}],total:1,page:1,size:20})
  const read=store.dispatch(backendApi.endpoints.read.initiate({operation:'Users.List'}));await read.unwrap()
  let finishLogout;authTransport.defaults.adapter=config=>new Promise(resolve=>{finishLogout=()=>resolve(reply(config,null,204))})
  const remoteLogout=store.dispatch(signOut());await until(()=>finishLogout)
  check('signOut clears tokens and private caches before remote logout completes',()=>{assert.equal(readStoredSession(),null);assert.equal(store.getState().auth.status,'unauthenticated');assert.equal(Object.keys(store.getState().backendApi.queries).length,0)})
  finishLogout();await remoteLogout;read.unsubscribe();await bootstrapAuth()
  check('logout followed by reload bootstrap stays unauthenticated',()=>assert.equal(store.getState().auth.isAuthenticated,false))
  check('return URLs retain allowed path/query/hash and reject external or wrong-role pages',()=>{assert.equal(authDestination('/trainer/courses/101?tab=modules#lesson','TRAINER'),'/trainer/courses/101?tab=modules#lesson');for(const value of ['//evil.invalid','https://evil.invalid','/\\evil.invalid','/admin/users','/rd-manager/courses/101','/rd-manager/courses/pending'])assert.equal(authDestination(value,'RD_MANAGER'),'/rd-manager/dashboard')})
  authTransport.defaults.adapter=async config=>reply(config,config.url==='/auth/me'?me():{...old,user:me()})
  await store.dispatch(login({username:'TEST_ONLY',password:'TEST_ONLY'}));refreshCalls=0;let refreshMe=0
  apiClient.defaults.adapter=config=>config.headers.get('Authorization')==='Bearer '+old.accessToken?fail(config,401):Promise.resolve(reply(config,{ok:true}))
  authTransport.defaults.adapter=async config=>{if(config.url==='/auth/refresh'){refreshCalls++;await tick();return reply(config,{...fresh,user:me()})}refreshMe++;await tick();return reply(config,me())}
  await Promise.all([apiClient.get('/branches'),apiClient.get('/products'),apiClient.get('/users')])
  check('normal concurrent 401s share one refresh and one fresh identity validation',()=>{assert.equal(refreshCalls,1);assert.equal(refreshMe,1);assert.deepEqual(readStoredSession(),fresh)})
  authTransport.defaults.adapter=async config=>reply(config,config.url==='/auth/me'?me():{...old,user:me()});await store.dispatch(login({username:'TEST_ONLY',password:'TEST_ONLY'}))
  assert.equal(store.getState().auth.user.role,'TRAINER');assert.equal(store.getState().auth.accessToken,old.accessToken)
  apiClient.defaults.adapter=async config=>reply(config,{items:[],total:0});const cached=store.dispatch(backendApi.endpoints.read.initiate({operation:'Branches.List'}));await cached.unwrap()
  store.dispatch(fetchProducts.pending('TEST_ONLY_scope'))
  store.dispatch(fetchProducts.fulfilled([{id:'TEST_ONLY_private'}],'TEST_ONLY_scope'))
  assert.equal(Object.keys(store.getState().products.entities).length,1)
  apiClient.defaults.adapter=config=>config.headers.get('Authorization')==='Bearer '+old.accessToken?fail(config,401):Promise.resolve(reply(config,{ok:true}))
  authTransport.defaults.adapter=async config=>reply(config,config.url==='/auth/me'?me('RD_MANAGER',null):{...fresh,user:me('RD_MANAGER',null)})
  await assert.rejects(apiClient.get('/branches'))
  check('fresh identity scope change clears RTK and legacy caches without trusting stale role',()=>{assert.equal(store.getState().auth.user.role,'RD_MANAGER');assert.equal(store.getState().auth.status,'authenticated');assert.equal(Object.keys(store.getState().backendApi.queries).length,0);assert.equal(Object.keys(store.getState().products.entities).length,0);assert.equal(authDestination('/trainer/courses/101','RD_MANAGER'),'/rd-manager/dashboard')});cached.unsubscribe()
  Object.defineProperty(globalThis,'sessionStorage',{get(){throw Error('TEST_ONLY storage blocked')},configurable:true})
  check('blocked storage is handled without crashing',()=>{assert.equal(readStoredSession(),null);writeStoredSession(old)})
  Object.defineProperty(globalThis,'sessionStorage',{value:storage,configurable:true})
  console.log(`Completed ${checks} session/bootstrap regression checks with TEST_ONLY adapters.`)
} finally {await server.close();delete globalThis.sessionStorage}
