import assert from 'node:assert/strict'
import { createServer } from 'vite'
const server=await createServer({server:{middlewareMode:true},appType:'custom'})
let checks=0
const check=(title,fn)=>{fn();checks++;console.log('PASS '+title)}
try {
 const {errorMessage,issueMessage,fieldFeedback}=await server.ssrLoadModule('/src/services/errorPresentation.ts')
 const {submitLabel,trainerReason,practicalActionNote,browserTimeZone}=await server.ssrLoadModule('/src/services/operationPresentation.ts')
 const {displayField}=await server.ssrLoadModule('/src/components/common/presentation.ts')
 const {notificationBody}=await server.ssrLoadModule('/src/services/notificationPresentation.ts')
 check('unknown server exception is never echoed into ordinary UI',()=>assert.doesNotMatch(errorMessage({status:500,message:'SQL TEST_ONLY stack trace payload'}),/SQL|stack|payload/))
 check('uncertain mutation does not claim absence of a write',()=>assert.match(errorMessage({status:500,message:'TEST_ONLY'},'Sales.Import'),/Chưa xác nhận.*kiểm tra lại/))
 check('required and nested errors name the correct one-based row',()=>{assert.equal(issueMessage('is required','ingredientCode'),'Nhập mã nguyên liệu.');assert.match(fieldFeedback('steps[1].ingredients[2].quantity','is required'),/Các bước thực hiện 2 · Nguyên liệu 3 · Định lượng/);assert.doesNotMatch(fieldFeedback('steps[1].ingredients[2].quantity','is required'),/steps|quantity|ingredients/)} )
 check('unknown field issue cannot expose SQL or wire names',()=>assert.doesNotMatch(issueMessage('TEST_ONLY SQL exception payload','trainerId'),/SQL|payload|trainerId/))
 check('409 rule remains specific while diagnostic envelope stays untouched',()=>{const e={status:409,rule:'RETRAINING_INCOMPLETE',traceId:'TEST_ONLY',message:'Server wording'};assert.match(errorMessage(e,'CorrectiveActions.Close'),/nhân viên.*học lại/);assert.equal(e.rule,'RETRAINING_INCOMPLETE');assert.equal(e.message,'Server wording')})
 check('uniqueness names email separately from a business code',()=>{assert.match(issueMessage('must be unique','email'),/^Email này/);assert.match(issueMessage('must be unique','ingredientCode'),/^Mã này/);assert.doesNotMatch(errorMessage({status:409},undefined),/đã nhập được giữ/)})
 check('action labels distinguish assignment, booking, approval and sales',()=>{assert.equal(submitLabel('LearningPath.Assign','X'),'Giao khóa học');assert.equal(submitLabel('PracticalSchedules.Create','X'),'Lưu lịch thực hành');assert.equal(submitLabel('Courses.Approve','X'),'Duyệt khóa học');assert.equal(submitLabel('Sales.Create','X'),'Ghi nhận doanh số')})
 check('readiness and assessment preserve distinct domain meanings',()=>{assert.equal(displayField('readinessState','READY'),'Đủ điều kiện mở bán');assert.equal(displayField('result','PASSED'),'Đạt');assert.equal(displayField('enrollmentState','ELIGIBLE'),'Đủ điều kiện dự thi')})
 check('trainer eligibility explains the verified backend reason',()=>{assert.match(trainerReason('belongs to another branch'),/chi nhánh khác/);assert.match(trainerReason('not certified on recipe version 201'),/chứng chỉ hiệu lực/);assert.doesNotMatch(trainerReason('SQL stack'),/SQL|stack/)})
 check('known notification template keeps title and due date, creates no link',()=>assert.match(notificationBody('Course due soon',"'TEST_ONLY' is due on 2026-11-10."),/TEST_ONLY.*10\/11\/2026/))
 check('unknown authored notification is not rewritten into invented facts',()=>assert.equal(notificationBody('TEST_ONLY','TEST_ONLY authored content'),'TEST_ONLY authored content'))
 check('practical cancellation and completion do not ask for nonexistent time inputs or claim certification',()=>{assert.doesNotMatch(practicalActionNote('PracticalSchedules.Cancel'),/Chọn giờ/);assert.match(practicalActionNote('PracticalSchedules.Complete'),/không chấm thực hành hoặc cấp chứng chỉ/);assert.match(browserTimeZone(),/^UTC[+−]\d/);assert.doesNotMatch(browserTimeZone(),/Etc\/|Asia\//)})
 console.log(`Completed ${checks} content behavior checks.`)
} finally {await server.close()}
