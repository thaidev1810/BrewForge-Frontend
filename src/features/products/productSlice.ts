import { createDomainSlice } from '@/utils/createDomainSlice'
import { productService } from './productService'
const domain = createDomainSlice('products', productService)
export const fetchProducts = domain.fetchList
export const fetchProduct = domain.fetchDetail
export const mutateProduct = domain.mutate
export default domain.reducer
