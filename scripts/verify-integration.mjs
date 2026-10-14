import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createServer } from 'vite'

// Test-only transport fixtures. These are never imported by browser code and never call a backend.
const suite = process.argv[2] ?? 'all'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let checks = 0
const check = (description, fn) => { fn(); checks++; console.log('PASS ' + description) }
try {
  const { store } = await server.ssrLoadModule('/src/app/store.ts')
  const { login, logout } = await server.ssrLoadModule('/src/features/auth/authSlice.ts')
  const { ROLES } = await server.ssrLoadModule('/src/features/auth/authTypes.ts')
  const { roleConfig } = await server.ssrLoadModule('/src/constants/roles.ts')
  const { navigationFor } = await server.ssrLoadModule('/src/constants/navigation.ts')
  const { authTransport, apiClient, configureApiAuth } = await server.ssrLoadModule('/src/services/apiClient.ts')
  const { normalizeApiError } = await server.ssrLoadModule('/src/services/apiError.ts')
  const { endpoints } = await server.ssrLoadModule('/src/services/backend/schema.ts')
  const { backendApi, canCall, executeOperation, routeFor } = await server.ssrLoadModule('/src/services/backend/operations.ts')
  const reply = (config, data = {}, status = 200) => ({ data, status, statusText: String(status), headers: {}, config })
  const reject = (config, status, data) => Promise.reject({ isAxiosError: true, config, response: { data, status, config } })
  let activeRole = 'ADMIN'
  const me = () => ({ id: 1, username: 'test-user', fullName: 'Test User', email: 'test@example.invalid', role: activeRole, branchId: ['TRAINEE', 'BRANCH_MANAGER'].includes(activeRole) ? 2 : null, status: 'ACTIVE', permissions: [] })
  authTransport.defaults.adapter = async config => {
    if (config.url === '/auth/login') { const body = JSON.parse(config.data); assert.equal(body.username, 'test-user'); assert.equal('email' in body, false); return reply(config, { accessToken: 'test-access', refreshToken: 'test-refresh', user: me() }) }
    if (config.url === '/auth/me') { assert.match(config.headers.get('Authorization'), /^Bearer /); return reply(config, me()) }
    throw Error('Unexpected auth operation: ' + config.url)
  }
  apiClient.defaults.adapter = async config => reply(config, { items: [], page: 1, size: 20, total: 0 })
  if (suite === 'all' || suite === 'auth') {
    check('eight exact backend roles and unique preserved route prefixes', () => { assert.equal(ROLES.length, 8); assert.equal(new Set(Object.values(roleConfig).map(r => r.prefix)).size, 8); assert(!ROLES.includes('BARISTA')); assert(!ROLES.includes('STORE_MANAGER')) })
    for (const role of ROLES) {
      activeRole = role
      const result = await store.dispatch(login({ username: 'test-user', password: 'TEST_ONLY_PASSWORD' }))
      check('login/me wire mapping and role navigation ' + role, () => { assert(login.fulfilled.match(result)); assert.equal(store.getState().auth.user.role, role); assert.equal(store.getState().auth.refreshToken, 'test-refresh'); assert.equal(store.getState().auth.user.name, 'Test User'); assert(navigationFor(role).length >= 5) })
      store.dispatch(logout())
    }
    const envelope = normalizeApiError({ isAxiosError: true, response: { status: 409, data: { code: 'MSG-E09', message: 'Author cannot approve', rule: 'BR-12', details: [{ field: 'approvedBy', issue: 'equals createdBy' }], traceId: 'TEST_TRACE' } } })
    check('BE error envelope retains field errors, code, rule and trace', () => { assert.equal(envelope.rule, 'BR-12'); assert.equal(envelope.traceId, 'TEST_TRACE'); assert.deepEqual(envelope.validationErrors.approvedBy, ['equals createdBy']) })
    let token = 'old-token', generation = 10, refreshCalls = 0, expired = 0
    configureApiAuth(() => token, () => { expired++ }, async () => { refreshCalls++; await new Promise(resolve => setTimeout(resolve, 20)); token = 'new-token'; return token }, () => generation)
    apiClient.defaults.adapter = async config => config.headers.get('Authorization') === 'Bearer old-token' ? reject(config, 401, { code: 'UNAUTHENTICATED', message: 'Expired', details: [] }) : reply(config, { ok: true })
    await Promise.all([apiClient.get('/branches'), apiClient.get('/products'), apiClient.get('/users')])
    check('concurrent 401s rotate once and retry with the new Bearer', () => { assert.equal(refreshCalls, 1); assert.equal(expired, 0) })
    configureApiAuth(() => token, () => { expired++ }, async () => { throw new Error('Refresh revoked') }, () => generation)
    apiClient.defaults.adapter = async config => reject(config, 401, { message: 'Expired' })
    await assert.rejects(apiClient.get('/branches'), /Refresh revoked/)
    check('revoked refresh expires session instead of faking success', () => assert.equal(expired, 1))
    let release
    configureApiAuth(() => token, () => { expired++ }, undefined, () => generation)
    apiClient.defaults.adapter = config => new Promise(resolve => { release = () => resolve(reply(config, { private: true })) })
    const pending = apiClient.get('/users')
    await new Promise(resolve => setTimeout(resolve, 0)); generation++; release()
    await assert.rejects(pending, /Phiên đăng nhập đã thay đổi/)
    check('late response from old session cannot reach next user', () => assert.equal(expired, 1))
    // Reconnect actual store callbacks for cache/logout test using an auth session already issued.
    activeRole = 'ADMIN'; await store.dispatch(login({ username: 'test-user', password: 'TEST_ONLY_PASSWORD' }))
    configureApiAuth(() => store.getState().auth.accessToken, () => store.dispatch(logout()), undefined, () => store.getState().auth.generation)
    apiClient.defaults.adapter = async config => reply(config, { items: [me()], page: 1, size: 20, total: 1 })
    const read = store.dispatch(backendApi.endpoints.read.initiate({ operation: 'Users.List', query: { page: 1 } }))
    await read.unwrap(); store.dispatch(logout())
    check('logout clears tokens, user and all RTK Query server cache', () => { assert.equal(store.getState().auth.user, null); assert.equal(store.getState().auth.refreshToken, null); assert.equal(Object.keys(store.getState().backendApi.queries).length, 0) })
    read.unsubscribe()
  }
  if (suite === 'all' || suite === 'business') {
    const { validateRequest } = await server.ssrLoadModule('/src/services/backend/validation.ts')
    const { requestFields } = await server.ssrLoadModule('/src/services/backend/formValues.ts')
    const { practicalBookingIssue, canManagePractical } = await server.ssrLoadModule('/src/features/training/practicalRules.ts')
    const cycle = { state: 'ELIGIBLE', enrolledAt: '2026-10-14T00:00:00Z' }, pass = { passed: true, attemptedAt: '2026-10-14T01:00:00Z' }
    check('practical opens after quiz in the current ELIGIBLE cycle, not certification', () => { assert.equal(practicalBookingIssue(cycle,[pass],[]),null); assert(practicalBookingIssue(cycle,[],[])); assert(practicalBookingIssue({...cycle,state:'PASSED'},[pass],[])); assert(practicalBookingIssue(cycle,[{...pass,attemptedAt:'2026-10-13T00:00:00Z'}],[])) })
    check('open appointment blocks duplicates; cancelled/completed history permits a new appointment', () => { assert(practicalBookingIssue(cycle,[pass],[{status:'SCHEDULED'}])); assert.equal(practicalBookingIssue(cycle,[pass],[{status:'CANCELLED'},{status:'COMPLETED'}]),null) })
    check('practical actions require the owning trainer and an open appointment', () => { const s={status:'SCHEDULED',trainerId:12}; assert(canManagePractical(s,'TRAINER','12')); assert(!canManagePractical(s,'TRAINER','13')); assert(!canManagePractical(s,'TRAINEE','12')); assert(!canManagePractical({...s,status:'COMPLETED'},'TRAINER','12')) })
    check('160 actual routes, no SOP phantom endpoint or legacy roles', () => { assert.equal(Object.keys(endpoints).length, 160); for (const ep of Object.values(endpoints)) { assert(ep.path.startsWith('/api/v1/')); assert(!ep.roles.includes('BARISTA')); assert(!ep.roles.includes('STORE_MANAGER')) } assert(!Object.values(endpoints).some(ep => ep.path.startsWith('/api/v1/sops'))) })
    const matrix = fs.readFileSync('../backend/tests/BrewForge.Api.Tests/AuthorizationMatrix.cs','utf8')
    const fromTests = [...matrix.matchAll(/new\("(GET|POST|PUT|DELETE)",\s*"([^"]+)"/g)].map(m => m[1] + ' /api/v1' + m[2]).sort()
    const fromClient = Object.values(endpoints).map(e => e.method + ' ' + e.path.replace(/\{\*\*([^}]+)\}/g, '{$1}').replace(/:long/g, '')).sort()
    check('endpoint map exactly matches backend route matrix', () => assert.deepEqual(fromClient,fromTests))
    check('role gates respect class AND method attributes; ADMIN has no superuser bypass', () => { assert.equal(canCall('RecipeVersions.Release','ADMIN'), false); assert.equal(canCall('BranchAudits.Create','BRANCH_MANAGER'), false); assert.equal(canCall('BranchAudits.Create','QUALITY_AUDITOR'), true); assert.equal(canCall('TrainingClasses.List','TRAINING_MANAGER'),false) })
    check('path substitution validates safe IDs and preserves evidence catch-all slashes', () => { assert.equal(routeFor({operation:'BranchAudits.Evidence',params:{key:'2026/10/abc.png'}}),'/branch-audits/evidence/2026/10/abc.png'); assert.equal(routeFor({operation:'RecipeVersions.Release',params:{id:12}}),'/recipe-versions/12/release'); assert.throws(()=>routeFor({operation:'Courses.Get',params:{id:'invalid'}})); assert.throws(()=>routeFor({operation:'Courses.Get',params:{id:9007199254740992}})) })
    check('user validation matches branch scope, email and password length', () => { const issues=validateRequest('CreateUserRequest',{username:'test',email:'x',fullName:'Example',password:'short',role:'TRAINEE',branchId:null},true); assert(issues.some(i=>i.field==='password')); assert(issues.some(i=>i.field==='branchId')); assert(issues.some(i=>i.field==='email')) })
    check('recipe nested validation detects self dependency, order and precision', () => { const issues=validateRequest('RecipeContentRequest',{steps:[{stepOrder:2,actionText:'Action',ingredients:[{ingredientId:1,quantity:1.0001,unit:'g'}],dependsOn:[{stepOrder:2}]}]}); assert(issues.some(i=>i.field==='steps[0].stepOrder')); assert(issues.some(i=>i.field==='steps[0].dependsOn')); assert(issues.some(i=>i.field==='steps[0].ingredients[0].quantity')) })
    check('manual repair validates nested patch before submission', () => { const issues=validateRequest('RepairRequest',{mode:'MANUAL',patch:{steps:[{stepOrder:1,actionText:'',ingredients:[],dependsOn:[]}]}}); assert(issues.some(i=>i.field==='patch.steps[0].actionText')) })
    check('PRODUCT course requires released SOP selection; assignment requires roster/allTrainees', () => { assert(validateRequest('CreateCourseRequest',{title:'Training',courseType:'PRODUCT',recipeVersionId:null}).length); assert(validateRequest('AssignmentRequest',{courseId:1,branchId:2,employeeIds:[],allTrainees:false}).some(i=>i.field==='employeeIds')) })
    check('quiz options and correct keys validated without fabricated answer grading', () => { const issues=validateRequest('QuizQuestionRequest',{courseModuleId:1,questionText:'Question',options:[{key:'A',text:'One'},{key:'A',text:'Two'}],correctOption:'Z'}); assert(issues.some(i=>i.field==='options')); assert(issues.some(i=>i.field==='correctOption')) })
    check('DTO -> request projection removes response fields and uses step order dependencies', () => { const input=requestFields('RecipeContentRequest',{id:1,steps:[{id:10,stepOrder:1,actionText:'Brew',ingredients:[{ingredientId:2,ingredientCode:'I',ingredientName:'Tea',quantity:3,unit:'g'}],dependsOn:[{stepId:7,stepOrder:1,type:'FINISH_TO_START'}]}]}); assert(!('id'in input)); assert(!('ingredientName'in input.steps[0].ingredients[0])); assert.equal(input.steps[0].dependsOn[0].stepId,null) })
    let last
    configureApiAuth(() => null, () => {})
    apiClient.defaults.adapter = async config => { last=config; return reply(config,{accepted:1,rejected:0}) }
    const booking = { scheduledAt: '2026-10-15T03:00:00.000Z', location: 'Training room', note: null }
    await executeOperation('PracticalSchedules.Create',{params:{id:34},body:booking})
    check('practical booking sends actual enrollment route and ISO/location/note body without trainer field',()=>{assert.equal(last.url,'/enrollments/34/practical-schedules');assert.deepEqual(JSON.parse(last.data),booking);assert.equal(last.headers.get('Idempotency-Key'),undefined)})
    let failedWrites=0
    apiClient.defaults.adapter=async config=>{failedWrites++;return reject(config,503,{code:'UNAVAILABLE',message:'Temporary failure',details:[]})}
    await assert.rejects(executeOperation('PracticalSchedules.Create',{params:{id:34},body:booking}),/Temporary failure/)
    check('non-idempotent booking is not retried after a server failure',()=>assert.equal(failedWrites,1))
    let testToken='TEST_ONLY_EXPIRED', refreshCount=0, expired=0, postCount=0
    configureApiAuth(()=>testToken,()=>expired++,async()=>{refreshCount++;testToken='TEST_ONLY_ROTATED';return testToken})
    apiClient.defaults.adapter=async config=>{postCount++;return reject(config,401,{code:'UNAUTHORIZED',message:'Expired',details:[]})}
    await assert.rejects(executeOperation('PracticalSchedules.Create',{params:{id:34},body:booking}),/xác nhận lại/)
    check('401 refresh preserves session but does not replay a non-idempotent mutation',()=>{assert.equal(refreshCount,1);assert.equal(postCount,1);assert.equal(expired,0)})
    let getCount=0;testToken='TEST_ONLY_EXPIRED'
    apiClient.defaults.adapter=async config=>{getCount++;return reject(config,getCount===1?401:409,{code:'CONFLICT',message:getCount===1?'Expired':'Business refusal after refresh',details:[]})}
    await assert.rejects(executeOperation('Users.List'),/Business refusal/)
    check('business error on a retried read does not log out the refreshed session',()=>{assert.equal(getCount,2);assert.equal(expired,0)})
    let replayCount=0;testToken='TEST_ONLY_EXPIRED'
    apiClient.defaults.adapter=async config=>{replayCount++;assert.equal(config.headers.get('Idempotency-Key'),'TEST_ONLY_STABLE_KEY');return replayCount===1?reject(config,401,{message:'Expired'}):reply(config,{accepted:1,rejected:0})}
    const replayForm=new FormData();replayForm.append('file',new Blob(['TEST_ONLY']),'test.csv')
    await executeOperation('Sales.Import',{body:replayForm,idempotencyKey:'TEST_ONLY_STABLE_KEY'})
    check('supported POS idempotency replays once after refresh with the same key',()=>{assert.equal(replayCount,2);assert.equal(expired,0)})
    configureApiAuth(()=>null,()=>{})
    apiClient.defaults.adapter = async config => { last=config; return reply(config,{accepted:1,rejected:0}) }
    const form = new FormData();form.append('file',new Blob(['TEST_ONLY']), 'test.csv')
    await executeOperation('Sales.Import',{body:form,idempotencyKey:'TEST_KEY'})
    check('POS upload field, real route and idempotency header',()=>{assert.equal(last.url,'/sales/import');assert.equal(last.headers.get('Idempotency-Key'),'TEST_KEY');assert(last.data instanceof FormData);assert(last.data.has('file'))})
    apiClient.defaults.adapter=async config=>reject(config,409,{code:'CONFLICT',message:'No retakes left',rule:'BR-33',details:[]})
    await assert.rejects(executeOperation('Enrollments.AttemptQuiz',{params:{id:1},body:{answers:[]}}),/No retakes left/)
    checks++;console.log('PASS business refusal propagates from real adapter path')
  }
  console.log(`Completed ${checks} behavioral checks; all network transports were test-only adapters.`)
} finally { await server.close() }
