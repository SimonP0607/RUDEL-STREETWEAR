export interface Categoria {
  _id: string
  nombre: string
  descripcion: string
  totalProductos?: number
  productosActivos?: number
}

export interface CategoriaResumen {
  _id: string
  nombre: string
}

export interface Talla {
  talla: string
  existencias: number
}

export interface Producto {
  _id: string
  nombre: string
  descripcion: string
  precio: number
  color: string
  imagenUrl: string
  imagenAlternaUrl: string
  categoria: CategoriaResumen | null
  tallas: Talla[]
  activo: boolean
  destacado: boolean
}

export type CategoriaEntrada = Pick<Categoria, 'nombre' | 'descripcion'>

export type ProductoEntrada = Omit<Producto, '_id' | 'categoria'> & { categoria: string }

export interface Administrador {
  _id: string
  nombre: string
  usuario: string
}

export interface Sesion {
  administrador: Administrador
  csrfToken: string
}

export interface ItemCarrito {
  productoId: string
  nombre: string
  talla: string
  precioUnitario: number
  cantidad: number
  existenciasDisponibles: number
}

export const TALLAS_VALIDAS = ['XS', 'S', 'M', 'L', 'XL', 'Única'] as const
