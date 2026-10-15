import assert from 'node:assert/strict'
import { createServer } from 'vite'
const server=await createServer({server:{middlewareMode:true},appType:'custom'})
let checks=0
const check=(name,fn)=>{fn();checks++;console.log('PASS '+name)}
try {
  const {store}=await server.ssrLoadModule('/src/app/store.ts')
  const {apiClient,configureApiAuth}=await server.ssrLoadModule('/src/services/apiClient.ts')
  const {backendApi,executeOperation}=await server.ssrLoadModule('/src/services/backend/operations.ts')
  const {normalizeApiError}=await server.ssrLoadModule('/src/services/apiError.ts')
  const {errorMessage}=await server.ssrLoadModule('/src/services/errorPresentation.ts')
  const {changeQuestionField,courseReadiness}=await server.ssrLoadModule('/src/services/backend/authoringRules.ts')
  const {formDefaults}=await server.ssrLoadModule('/src/services/backend/formValues.ts')
  const {mutationTags}=await server.ssrLoadModule('/src/services/backend/cachePolicy.ts')
  configureApiAuth(()=>null,()=>{throw new Error('Business errors must not log out')})
  const reply=(config,data,status=200)=>({config,data,status,statusText:String(status),headers:{}})
  const fail=(config,status,data)=>Promise.reject({isAxiosError:true,config,response:{config,status,data}})
  const envelope={code:'TEST_ONLY_CODE',message:'Server course failure',rule:'BR-31',details:[{field:'modules[TECHNIQUE]',issue:'has no content'},{field:'modules[COMMON_MISTAKES]',issue:'has no duration'}],traceId:'TEST_ONLY_TRACE'}
  apiClient.defaults.adapter=config=>fail(config,409,envelope)
  let fromUnwrap
  try {await store.dispatch(backendApi.endpoints.execute.initiate({operation:'Courses.Submit',params:{id:101}})).unwrap()} catch(e){fromUnwrap=normalizeApiError(e)}
  check('actual RTK mutation unwrap retains dialog error metadata',()=>{assert.equal(fromUnwrap.status,409);assert.equal(fromUnwrap.message,envelope.message);assert.equal(fromUnwrap.rule,'BR-31');assert.equal(fromUnwrap.code,envelope.code);assert.equal(fromUnwrap.traceId,envelope.traceId);assert.deepEqual(fromUnwrap.details,envelope.details);assert.deepEqual(fromUnwrap.validationErrors['modules[TECHNIQUE]'],['has no content']);assert.match(errorMessage(fromUnwrap),/học phần/)})
  check('normalizing serialized errors twice does not duplicate issues',()=>assert.deepEqual(normalizeApiError(JSON.parse(JSON.stringify({message:fromUnwrap.message,...fromUnwrap}))).validationErrors,fromUnwrap.validationErrors))
  check('new quiz starts with two editable blank choices, not pretend server questions',()=>{const q=formDefaults('QuizQuestionRequest');assert.deepEqual(q.options,[{key:'A',text:''},{key:'B',text:''}]);assert.equal(q.correctOption,null)})
  check('renaming or deleting the correct key clears stale answer; other changes preserve it',()=>{const q={options:[{key:'A',text:'One'},{key:'B',text:'Two'}],correctOption:'A'};assert.equal(changeQuestionField('QuizQuestionRequest',q,'options',[{key:'C',text:'One'},{key:'B',text:'Two'}]).correctOption,null);assert.equal(changeQuestionField('QuizQuestionRequest',q,'options',[{key:'B',text:'Two'}]).correctOption,null);assert.equal(changeQuestionField('QuizQuestionRequest',q,'questionText','Updated').correctOption,'A')})
  const module=(source,content,durationMinutes=5)=>({id:1,moduleType:'TECHNIQUE',source,state:'COMPLETE',durationMinutes,lessons:[{id:2,title:'Example',content,reference:{step:1},generated:true}]})
  check('MIXED reference/media does not satisfy required instructor prose',()=>{const issues=courseReadiness({modules:[module('MIXED',' ')],quiz:{questionCount:1},practicalChecklist:[{}]});assert(issues.some(i=>i.field.includes('.content')))})
  check('GENERATED can lack prose but needs duration; authored cannot be media-only',()=>{assert.equal(courseReadiness({modules:[module('GENERATED',null)],quiz:{questionCount:1},practicalChecklist:[{}]}).length,0);assert(courseReadiness({modules:[module('GENERATED',null,null)],quiz:{questionCount:0},practicalChecklist:[]}).length===3)})
  check('valid saved authored content clears missing-content preflight',()=>assert.equal(courseReadiness({modules:[module('MIXED','Saved instructor content')],quiz:{questionCount:1},practicalChecklist:[{}]}).length,0))
  check('MIXED requires prose on every linked lesson, not only one edited lesson',()=>{const m=module('MIXED','Saved');m.lessons.push({id:3,title:'Second technique',content:null,reference:{step:2},generated:true});const issues=courseReadiness({modules:[m],quiz:{questionCount:1},practicalChecklist:[{}]});assert.equal(issues.length,1);assert.match(issues[0].field,/lessons\[3\]/)})
  check('user change invalidates server coverage, notification mutation does not evict course forms',()=>{assert(mutationTags('Users.Update').some(t=>t.id==='Coverage'));assert(!mutationTags('Notifications.Subscribe').some(t=>t.id==='Training'))})
  let last
  apiClient.defaults.adapter=async config=>{last=config;return reply(config,{items:[],page:1,size:20,total:0})}
  for(const direction of ['asc','desc']){await executeOperation('Assignments.List',{query:{status:'QUIZ_PASSED',sort:'dueDate,'+direction,page:2,size:20}});check('status filter and '+direction+' survive transport with page',()=>{assert.equal(last.params.status,'QUIZ_PASSED');assert.equal(last.params.sort,'dueDate,'+direction);assert.equal(last.params.page,2)})}
  let committed=false
  const run={runId:'11111111111111111111111111111111',trigger:{entityType:'Ingredient',entityId:1},affected:{recipeVersions:[],courses:[],certificates:[],liveBranches:[]},committed:false,warning:null}
  apiClient.defaults.adapter=async config=>{if(config.url.endsWith('/commit')){if(committed)return fail(config,409,{code:'RULE_VIOLATION',rule:'IMPACT_ALREADY_COMMITTED',message:'Already committed',details:[]});committed=true}return reply(config,{...run,committed})}
  const empty=await executeOperation('ImpactAnalysis.Get',{params:{runId:run.runId}})
  const applied=await executeOperation('ImpactAnalysis.Commit',{params:{runId:run.runId}})
  check('empty persisted impact can be read and committed with actual endpoint shape',()=>{assert.deepEqual(empty.affected,run.affected);assert.equal(applied.committed,true)})
  await assert.rejects(executeOperation('ImpactAnalysis.Commit',{params:{runId:run.runId}}),e=>e.status===409&&e.rule==='IMPACT_ALREADY_COMMITTED')
  check('second commit conflict retains specific server rule for UI',()=>assert.equal(committed,true))
  console.log(`Completed ${checks} additional authoring/RTK regression checks with test-only transports.`)
} finally {await server.close()}
