export function getLowStockThreshold(minStock: number | undefined, globalThreshold: number): number {
  return Math.max(0, Number(minStock) || 0, Number(globalThreshold) || 0)
}

export function isLowStock(stock: number | undefined, minStock: number | undefined, globalThreshold: number): boolean {
  return (Number(stock) || 0) <= getLowStockThreshold(minStock, globalThreshold)
}
