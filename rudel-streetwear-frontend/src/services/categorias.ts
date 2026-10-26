import type { Categoria, CategoriaEntrada } from '@/types'
import { enviarJson, peticion } from './http'

export const categoriasApi = {
  listar: () => peticion<Categoria[]>('/categorias'),

  crear: (datos: CategoriaEntrada) => peticion<Categoria>('/categorias', enviarJson('POST', datos)),

  actualizar: (id: string, datos: CategoriaEntrada) =>
    peticion<Categoria>(`/categorias/${encodeURIComponent(id)}`, enviarJson('PUT', datos)),

  eliminar: (id: string) => peticion<void>(`/categorias/${encodeURIComponent(id)}`, enviarJson('DELETE')),
}
