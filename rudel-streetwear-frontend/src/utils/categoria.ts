import type { Producto } from '@/types'

export const idCategoria = (producto: Producto) => producto.categoria?._id ?? ''

export const nombreCategoria = (producto: Producto) => producto.categoria?.nombre ?? 'Sin categoría'
