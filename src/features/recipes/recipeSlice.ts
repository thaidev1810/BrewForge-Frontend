import { createDomainSlice } from '@/utils/createDomainSlice'
import { recipeService } from './recipeService'
const domain = createDomainSlice('recipes', recipeService)
export const fetchRecipes = domain.fetchList
export const fetchRecipe = domain.fetchDetail
export const mutateRecipe = domain.mutate
export default domain.reducer
