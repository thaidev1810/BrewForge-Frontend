import { bindDomainService } from '@/services/domainService'
import { mockRecipeService } from './mockRecipeService'
const binding = bindDomainService('Recipes', mockRecipeService)
export const recipeService = binding.service
export const configureRecipeService = binding.configure
