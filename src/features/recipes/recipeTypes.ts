import type { DomainService } from '@/types/domain'
export interface RecipeIngredient { name: string; quantity: number; unit: string }
export interface RecipeInput {
  productId: string
  name: string
  yieldServings: number
  ingredients: RecipeIngredient[]
  instructions: string[]
}
export interface Recipe extends RecipeInput { id: string; archived: boolean }
export type RecipeCommand =
  | { operation: 'create'; input: RecipeInput }
  | { operation: 'update'; id: string; input: RecipeInput }
  | { operation: 'archive'; id: string }
export type RecipeService = DomainService<Recipe, RecipeCommand>
