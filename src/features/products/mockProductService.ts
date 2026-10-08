import { checkSignal, copy, mockRead, requireRecord, requireText } from '@/services/mock/helpers'
import type { Product, ProductService } from './productTypes'

export const mockProducts = new Map<string, Product>([
  ['product-latte', { id: 'product-latte', name: 'Cafe Latte', description: 'Espresso and steamed milk.', category: 'Coffee', active: true }],
])
export const mockProductService: ProductService = {
  ...mockRead(mockProducts),
  async execute(command, signal) {
    checkSignal(signal)
    if (command.operation === 'setActive') {
      const product = requireRecord(mockProducts, command.id)
      const updated = { ...product, active: command.active }
      mockProducts.set(updated.id, updated)
      return copy(updated)
    }
    const input = { ...command.input, name: requireText(command.input.name, 'name'), category: requireText(command.input.category, 'category') }
    const product: Product = command.operation === 'create'
      ? { ...input, id: crypto.randomUUID(), active: true }
      : { ...requireRecord(mockProducts, command.id), ...input }
    mockProducts.set(product.id, product)
    return copy(product)
  },
}
