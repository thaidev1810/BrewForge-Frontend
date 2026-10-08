import assert from 'node:assert/strict'
import { configureStore } from '@reduxjs/toolkit'
import { createServer } from 'vite'

process.env.VITE_ENABLE_MOCK_SERVICES = 'true'
process.env.VITE_ENABLE_MOCK_AUTH = 'true'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const load = (path) => server.ssrLoadModule(`/src/${path}`)
try {
  const { store } = await load('app/store.ts')
  const { login, logout } = await load('features/auth/authSlice.ts')
  const { demoUsers, DEMO_PASSWORD } = await load('features/auth/mockAuthService.ts')
  const products = await load('features/products/productSlice.ts')
  const recipes = await load('features/recipes/recipeSlice.ts')
  const sops = await load('features/sops/sopSlice.ts')
  const courses = await load('features/courses/courseSlice.ts')
  const training = await load('features/training/trainingSlice.ts')
  const quizzes = await load('features/quizzes/quizSlice.ts')
  const assessments = await load('features/assessments/assessmentSlice.ts')
  const certificates = await load('features/certificates/certificateSlice.ts')
  const branches = await load('features/branches/branchSlice.ts')
  const { productSelectors } = await load('features/products/productSelectors.ts')
  const { selectPublishedSopVersions } = await load('features/sops/sopSelectors.ts')
  const { selectHasPassedQuiz } = await load('features/quizzes/quizSelectors.ts')
  const run = (thunk, argument) => store.dispatch(thunk(argument)).unwrap()
  const fails = async (thunk, argument, status) => {
    const action = await store.dispatch(thunk(argument))
    assert.equal(thunk.rejected.match(action), true)
    assert.equal(action.payload.status, status)
    return action
  }

  const productInput = { name: 'Test tea', description: 'Test fixture', category: 'Tea' }
  const pendingProduct = store.dispatch(products.mutateProduct({ operation: 'create', input: productInput }))
  assert.equal(store.getState().products.mutations.$create.status, 'loading')
  const product = await pendingProduct.unwrap()
  await run(products.fetchProducts)
  await run(products.fetchProduct, product.id)
  assert.equal(productSelectors.selectById(store.getState(), product.id).name, 'Test tea')
  assert.equal(productSelectors.selectList(store.getState()).some((item) => item.id === product.id), true)
  const invalidProduct = await fails(products.mutateProduct, { operation: 'update', id: product.id, input: { ...productInput, name: ' ' } }, 400)
  assert.deepEqual(invalidProduct.payload.validationErrors, { name: ['Required.'] })
  assert.equal(store.getState().products.entities[product.id].name, productInput.name)
  const { mockProductService } = await load('features/products/mockProductService.ts')
  const isolatedProduct = await mockProductService.get(product.id)
  isolatedProduct.name = 'External mutation'
  assert.equal((await mockProductService.get(product.id)).name, 'Test tea')

  const recipeInput = { productId: product.id, name: 'Test recipe', yieldServings: 1, ingredients: [{ name: 'Tea', quantity: 3, unit: 'g' }], instructions: ['Brew tea.'] }
  const recipe = await run(recipes.mutateRecipe, { operation: 'create', input: recipeInput })
  await run(recipes.fetchRecipe, recipe.id)
  await fails(recipes.mutateRecipe, { operation: 'update', id: recipe.id, input: { ...recipeInput, ingredients: [{ name: 'Tea', quantity: -1, unit: 'g' }] } }, 400)
  await run(recipes.mutateRecipe, { operation: 'archive', id: recipe.id })
  await fails(recipes.mutateRecipe, { operation: 'update', id: recipe.id, input: recipeInput }, 409)
  await run(products.mutateProduct, { operation: 'setActive', id: product.id, active: false })
  await fails(recipes.mutateRecipe, { operation: 'create', input: recipeInput }, 409)
  await fails(recipes.fetchRecipe, 'missing-recipe', 404)

  const content = { title: 'Test SOP', purpose: 'Test standards', steps: ['Perform safely.'], equipmentIds: ['espresso-machine'] }
  await fails(sops.mutateSopVersion, { operation: 'create', input: { ...content, equipmentIds: ['branch-only-equipment'] } }, 400)
  const draft = await run(sops.mutateSopVersion, { operation: 'create', input: content })
  await fails(sops.mutateSopVersion, { operation: 'publish', id: draft.id }, 409)
  await run(sops.mutateSopVersion, { operation: 'submitForReview', id: draft.id })
  await run(sops.mutateSopVersion, { operation: 'requestChanges', id: draft.id, comment: 'Add detail.' })
  await run(sops.mutateSopVersion, { operation: 'update', id: draft.id, input: { ...content, steps: ['Perform safely with detail.'] } })
  await run(sops.mutateSopVersion, { operation: 'submitForReview', id: draft.id })
  await run(sops.mutateSopVersion, { operation: 'approve', id: draft.id })
  const published = await run(sops.mutateSopVersion, { operation: 'publish', id: draft.id })
  await fails(sops.mutateSopVersion, { operation: 'update', id: draft.id, input: content }, 409)
  await run(sops.fetchSopVersions)
  assert.equal(selectPublishedSopVersions(store.getState()).some((version) => version.id === draft.id), true)

  const courseInput = { title: 'Test course', description: '', sopVersionIds: [published.id] }
  const course = await run(courses.mutateCourse, { operation: 'create', input: courseInput })
  assert.equal(course.quizPassingScore, 80)
  await fails(courses.mutateCourse, { operation: 'create', input: { ...courseInput, quizPassingScore: 101 } }, 400)
  const trainee = demoUsers.find((user) => user.role === 'BARISTA')
  const assessor = demoUsers.find((user) => user.role === 'TRAINER')
  const assignmentInput = { courseId: course.id, traineeId: trainee.id, branchId: 'demo-branch-1', dueAt: null }
  const assignment = await run(training.mutateTrainingAssignment, { operation: 'assign', input: assignmentInput })
  await fails(training.mutateTrainingAssignment, { operation: 'assign', input: assignmentInput }, 409)
  await run(training.mutateTrainingAssignment, { operation: 'start', id: assignment.id })
  await run(courses.mutateCourse, { operation: 'update', id: course.id, input: { ...courseInput, sopVersionIds: ['sop-latte-v1'], quizPassingScore: 95 } })
  assert.deepEqual((await run(training.fetchTrainingAssignment, assignment.id)).sopVersionIds, [published.id])

  const failedQuiz = await run(quizzes.recordQuizAttempt, { operation: 'record', input: { assignmentId: assignment.id, correctAnswers: 79, totalQuestions: 100 } })
  assert.equal(failedQuiz.passed, false)
  const criterion = { criterionId: 'safety', label: 'Safe handling', critical: true, passed: true }
  await fails(assessments.recordPracticalAssessment, { operation: 'record', input: { quizAttemptId: failedQuiz.id, assessorId: assessor.id, notes: '', criteria: [criterion] } }, 409)
  const passedQuiz = await run(quizzes.recordQuizAttempt, { operation: 'record', input: { assignmentId: assignment.id, correctAnswers: 8, totalQuestions: 10 } })
  assert.equal(passedQuiz.passed, true)
  assert.equal(passedQuiz.passingScore, 80)
  assert.deepEqual(passedQuiz.sopVersionIds, [published.id])
  await fails(quizzes.recordQuizAttempt, { operation: 'record', input: { assignmentId: assignment.id, correctAnswers: 0, totalQuestions: 0 } }, 400)
  await run(quizzes.fetchQuizAttempts)
  assert.equal(selectHasPassedQuiz(store.getState(), assignment.id), true)

  const failedAssessment = await run(assessments.recordPracticalAssessment, { operation: 'record', input: { quizAttemptId: passedQuiz.id, assessorId: assessor.id, notes: '', criteria: [{ ...criterion, passed: false }, ...Array.from({ length: 9 }, (_, index) => ({ criterionId: `other-${index}`, label: 'Other criterion', critical: false, passed: true }))] } })
  assert.equal(failedAssessment.criticalFailure, true)
  assert.equal(failedAssessment.passed, false)
  await fails(certificates.mutateCertificate, { operation: 'issue', input: { assessmentId: failedAssessment.id, sopVersionId: published.id } }, 409)
  const passedAssessment = await run(assessments.recordPracticalAssessment, { operation: 'record', input: { quizAttemptId: passedQuiz.id, assessorId: assessor.id, notes: '', criteria: [criterion] } })
  await fails(certificates.mutateCertificate, { operation: 'issue', input: { assessmentId: passedAssessment.id, sopVersionId: 'sop-latte-v1' } }, 409)
  const certificate = await run(certificates.mutateCertificate, { operation: 'issue', input: { assessmentId: passedAssessment.id, sopVersionId: published.id } })
  assert.equal(certificate.sopVersionId, published.id)
  await fails(certificates.mutateCertificate, { operation: 'issue', input: { assessmentId: passedAssessment.id, sopVersionId: published.id } }, 409)
  await run(sops.mutateSopVersion, { operation: 'deprecate', id: published.id })
  await fails(sops.mutateSopVersion, { operation: 'update', id: published.id, input: content }, 409)
  await fails(courses.mutateCourse, { operation: 'create', input: courseInput }, 409)
  const revised = await run(sops.mutateSopVersion, { operation: 'revise', id: published.id })
  assert.equal(revised.version, 2)
  assert.notEqual(revised.id, published.id)
  assert.deepEqual(revised.steps, published.steps)
  await fails(sops.mutateSopVersion, { operation: 'revise', id: published.id }, 409)
  assert.equal((await run(certificates.fetchCertificate, certificate.id)).sopVersionId, published.id)
  const revoked = await run(certificates.mutateCertificate, { operation: 'revoke', id: certificate.id, reason: 'Test revocation' })
  assert.ok(revoked.revokedAt)
  assert.equal(revoked.sopVersionId, published.id)

  const branch = await run(branches.mutateBranch, { operation: 'create', input: { name: 'Second branch', code: 'SECOND', address: 'Demo' } })
  assert.equal('equipment' in branch, false)
  await fails(branches.mutateBranch, { operation: 'create', input: { name: 'Duplicate', code: 'second', address: '' } }, 409)
  const standards = await run(branches.fetchSharedStandards)
  assert.equal(standards.sopScope, 'GLOBAL')
  await run(branches.mutateBranch, { operation: 'setActive', id: branch.id, active: false })
  await fails(training.mutateTrainingAssignment, { operation: 'assign', input: { ...assignmentInput, branchId: branch.id } }, 409)
  await run(training.mutateTrainingAssignment, { operation: 'complete', id: assignment.id })
  await fails(training.mutateTrainingAssignment, { operation: 'start', id: assignment.id }, 409)

  // All domains exercise their list and detail lifecycle, not just the shared helper.
  for (const [domain, listThunk, detailThunk] of [
    ['products', products.fetchProducts, products.fetchProduct], ['recipes', recipes.fetchRecipes, recipes.fetchRecipe],
    ['sops', sops.fetchSopVersions, sops.fetchSopVersion], ['courses', courses.fetchCourses, courses.fetchCourse],
    ['training', training.fetchTrainingAssignments, training.fetchTrainingAssignment], ['quizzes', quizzes.fetchQuizAttempts, quizzes.fetchQuizAttempt],
    ['assessments', assessments.fetchPracticalAssessments, assessments.fetchPracticalAssessment], ['certificates', certificates.fetchCertificates, certificates.fetchCertificate],
    ['branches', branches.fetchBranches, branches.fetchBranch],
  ]) {
    const pending = store.dispatch(listThunk())
    assert.equal(store.getState()[domain].list.status, 'loading')
    const list = await pending.unwrap()
    assert.ok(list.length)
    assert.equal(store.getState()[domain].list.status, 'succeeded')
    assert.equal(store.getState()[domain].listInvalidated, false)
    const detail = store.dispatch(detailThunk(list[0].id))
    assert.equal(store.getState()[domain].details[list[0].id].status, 'loading')
    await detail.unwrap()
    assert.equal(store.getState()[domain].details[list[0].id].status, 'succeeded')
  }
  await run(login, { email: trainee.email, password: DEMO_PASSWORD })
  assert.deepEqual(store.getState().products.entities, {})
  assert.equal(store.getState().branches.sharedStandards.data, null)
  await run(products.fetchProducts)
  store.dispatch(logout())
  for (const [domain, state] of Object.entries(store.getState())) {
    if (domain !== 'auth') assert.deepEqual(state.entities, {})
  }

  // Delayed service responses verify actual request races and duplicate-write protection.
  const { createDomainSlice } = await load('utils/createDomainSlice.ts')
  const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }
  const listQueue = []
  const detailQueue = []
  const writeQueue = []
  const domain = createDomainSlice('records', {
    list: () => { const item = deferred(); listQueue.push(item); return item.promise },
    get: () => { const item = deferred(); detailQueue.push(item); return item.promise },
    execute: () => { const item = deferred(); writeQueue.push(item); return item.promise },
  })
  const isolated = configureStore({ reducer: { records: domain.reducer } })
  const oldList = isolated.dispatch(domain.fetchList())
  const write = isolated.dispatch(domain.mutate({ operation: 'update', id: 'one' }))
  const skipped = await isolated.dispatch(domain.mutate({ operation: 'update', id: 'one' }))
  assert.equal(skipped.meta.condition, true)
  assert.equal(writeQueue.length, 1)
  writeQueue.shift().resolve({ id: 'one', name: 'Updated' })
  await write
  listQueue.shift().resolve([{ id: 'one', name: 'Stale' }])
  await oldList
  assert.equal(isolated.getState().records.entities.one.name, 'Updated')
  assert.equal(isolated.getState().records.listInvalidated, true)
  const first = isolated.dispatch(domain.fetchList())
  const second = isolated.dispatch(domain.fetchList())
  listQueue[1].resolve([{ id: 'one', name: 'Newest' }])
  await second
  listQueue[0].resolve([{ id: 'one', name: 'Older' }])
  await first
  assert.equal(isolated.getState().records.entities.one.name, 'Newest')
  const oldDetail = isolated.dispatch(domain.fetchDetail('one'))
  const newDetail = isolated.dispatch(domain.fetchDetail('one'))
  detailQueue[1].resolve({ id: 'one', name: 'Latest detail' })
  await newDetail
  detailQueue[0].resolve({ id: 'one', name: 'Old detail' })
  await oldDetail
  assert.equal(isolated.getState().records.entities.one.name, 'Latest detail')
  listQueue.length = 0
  detailQueue.length = 0
  const overlappingList = isolated.dispatch(domain.fetchList())
  const fresherDetail = isolated.dispatch(domain.fetchDetail('one'))
  detailQueue[0].resolve({ id: 'one', name: 'Fresh detail during list' })
  await fresherDetail
  listQueue[0].resolve([{ id: 'one', name: 'Stale list snapshot' }])
  await overlappingList
  assert.equal(isolated.getState().records.entities.one.name, 'Fresh detail during list')
  detailQueue.length = 0
  const late = isolated.dispatch(domain.fetchDetail('one'))
  isolated.dispatch(logout())
  detailQueue[0].resolve({ id: 'one', name: 'After logout' })
  await late
  assert.deepEqual(isolated.getState().records.entities, {})
  const cancelled = isolated.dispatch(domain.fetchList())
  cancelled.abort()
  await cancelled
  assert.equal(isolated.getState().records.list.status, 'idle')
  console.log('Passed: all nine domain lifecycles, SOP immutability/workflow, training snapshots, 80% threshold, quiz prerequisite, critical failure, exact-version certificates, shared branch standards, serializable validation errors, logout/session resets, stale responses, duplicate writes, and cancellation.')
} finally {
  await server.close()
}

// A fresh Vite module graph verifies API mode fails closed and accepts typed adapters.
process.env.VITE_ENABLE_MOCK_SERVICES = 'false'
const apiServer = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { store } = await apiServer.ssrLoadModule('/src/app/store.ts')
  const { fetchProducts } = await apiServer.ssrLoadModule('/src/features/products/productSlice.ts')
  const { configureProductService, productService } = await apiServer.ssrLoadModule('/src/features/products/productService.ts')
  for (const [file, thunkName] of [
    ['products/productSlice', 'fetchProducts'], ['recipes/recipeSlice', 'fetchRecipes'], ['sops/sopSlice', 'fetchSopVersions'],
    ['courses/courseSlice', 'fetchCourses'], ['training/trainingSlice', 'fetchTrainingAssignments'], ['quizzes/quizSlice', 'fetchQuizAttempts'],
    ['assessments/assessmentSlice', 'fetchPracticalAssessments'], ['certificates/certificateSlice', 'fetchCertificates'], ['branches/branchSlice', 'fetchBranches'],
  ]) {
    const module = await apiServer.ssrLoadModule(`/src/features/${file}.ts`)
    const action = await store.dispatch(module[thunkName]())
    assert.equal(action.payload.status, 501)
  }
  const product = { id: 'api-product', name: 'Adapter product', description: '', category: 'Test', active: true }
  configureProductService({ list: async () => [product], get: async () => product, execute: async () => product })
  assert.deepEqual(await productService.list(), [product])
  const loadedProducts = await store.dispatch(fetchProducts())
  assert.deepEqual(loadedProducts.payload, [product])
  const { fetchSharedStandards } = await apiServer.ssrLoadModule('/src/features/branches/branchSlice.ts')
  const standards = await store.dispatch(fetchSharedStandards())
  assert.equal(standards.payload.status, 501)
  console.log('Passed: API mode rejects unconfigured adapters and uses an explicitly configured adapter without inventing URLs.')
} finally {
  await apiServer.close()
}
