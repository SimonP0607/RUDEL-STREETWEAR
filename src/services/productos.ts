import type { Producto, ProductoEntrada } from '@/types'
import { enviarJson, peticion } from './http'

function consulta(parametros: Record<string, string | undefined>) {
  const busqueda = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) if (valor) busqueda.set(clave, valor)
  const texto = busqueda.toString()
  return texto ? `?${texto}` : ''
}

export const productosApi = {
  listar: (categoriaId?: string) => peticion<Producto[]>(`/productos${consulta({ categoria: categoriaId })}`),

  destacados: () => peticion<Producto[]>(`/productos${consulta({ destacado: 'true' })}`),

  obtener: (id: string) => peticion<Producto>(`/productos/${encodeURIComponent(id)}`),

  listarTodos: () => peticion<Producto[]>('/productos/admin'),

  crear: (datos: ProductoEntrada) => peticion<Producto>('/productos', enviarJson('POST', datos)),

  actualizar: (id: string, datos: ProductoEntrada) =>
    peticion<Producto>(`/productos/${encodeURIComponent(id)}`, enviarJson('PUT', datos)),

  eliminar: (id: string) => peticion<void>(`/productos/${encodeURIComponent(id)}`, enviarJson('DELETE')),
}
