import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord, requireText } from '@/services/mock/helpers'
import { mockProducts } from '@/features/products/mockProductService'
import type { Recipe, RecipeService } from './recipeTypes'

export const mockRecipes = new Map<string, Recipe>([
  ['recipe-latte', { id: 'recipe-latte', productId: 'product-latte', name: 'Standard latte', yieldServings: 1, ingredients: [{ name: 'Espresso', quantity: 30, unit: 'ml' }, { name: 'Milk', quantity: 180, unit: 'ml' }], instructions: ['Extract espresso.', 'Steam milk and pour.'], archived: false }],
])
export const mockRecipeService: RecipeService = {
  ...mockRead(mockRecipes),
  async execute(command, signal) {
    checkSignal(signal)
    if (command.operation === 'archive') {
      const recipe = { ...requireRecord(mockRecipes, command.id), archived: true }
      mockRecipes.set(recipe.id, recipe)
      return copy(recipe)
    }
    const input = copy(command.input)
    const product = requireRecord(mockProducts, input.productId)
    if (!product.active) throw new ApiError('Recipes require an active product.', 409)
    input.name = requireText(input.name, 'name')
    if (!Number.isInteger(input.yieldServings) || input.yieldServings < 1) throw new ApiError('Yield must be a positive whole number.', 400)
    if (!input.ingredients.length || !input.instructions.length) throw new ApiError('Ingredients and instructions are required.', 400)
    input.ingredients = input.ingredients.map((ingredient) => {
      if (!Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0) throw new ApiError('Ingredient quantities must be positive.', 400)
      return { ...ingredient, name: requireText(ingredient.name, 'ingredient.name'), unit: requireText(ingredient.unit, 'ingredient.unit') }
    })
    input.instructions = input.instructions.map((step) => requireText(step, 'instructions'))
    const previous = command.operation === 'update' ? requireRecord(mockRecipes, command.id) : undefined
    if (previous?.archived) throw new ApiError('Archived recipes cannot be edited.', 409)
    const recipe: Recipe = { ...input, id: previous?.id ?? crypto.randomUUID(), archived: false }
    mockRecipes.set(recipe.id, recipe)
    return copy(recipe)
  },
}
