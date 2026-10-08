import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const recipeSelectors = createDomainSelectors((state: RootState) => state.recipes)
export const selectRecipesForProduct = createSelector(
  [recipeSelectors.selectList, (_: RootState, productId: string) => productId],
  (recipes, productId) => recipes.filter((recipe) => recipe.productId === productId),
)
