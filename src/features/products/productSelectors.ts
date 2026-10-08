import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const productSelectors = createDomainSelectors((state: RootState) => state.products)
