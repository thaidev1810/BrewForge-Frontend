import type { DomainService } from '@/types/domain'
export interface Product {
  id: string
  name: string
  description: string
  category: string
  active: boolean
}
export interface ProductInput { name: string; description: string; category: string }
export type ProductCommand =
  | { operation: 'create'; input: ProductInput }
  | { operation: 'update'; id: string; input: ProductInput }
  | { operation: 'setActive'; id: string; active: boolean }
export type ProductService = DomainService<Product, ProductCommand>
