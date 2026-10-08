import { configureStore } from '@reduxjs/toolkit'
import authReducer, { logout } from '@/features/auth/authSlice'
import { configureApiAuth } from '@/services/apiClient'
import productsReducer from '@/features/products/productSlice'
import recipesReducer from '@/features/recipes/recipeSlice'
import sopsReducer from '@/features/sops/sopSlice'
import coursesReducer from '@/features/courses/courseSlice'
import trainingReducer from '@/features/training/trainingSlice'
import quizzesReducer from '@/features/quizzes/quizSlice'
import assessmentsReducer from '@/features/assessments/assessmentSlice'
import certificatesReducer from '@/features/certificates/certificateSlice'
import branchesReducer from '@/features/branches/branchSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    recipes: recipesReducer,
    sops: sopsReducer,
    courses: coursesReducer,
    training: trainingReducer,
    quizzes: quizzesReducer,
    assessments: assessmentsReducer,
    certificates: certificatesReducer,
    branches: branchesReducer,
  },
})
configureApiAuth(() => store.getState().auth.accessToken, () => { store.dispatch(logout()) })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
