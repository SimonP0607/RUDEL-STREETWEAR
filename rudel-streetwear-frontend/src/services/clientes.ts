import type { ItemCarrito, Producto, SesionCliente } from '@/types'
import { enviarJson, peticion } from './http'

export interface ItemCarritoEntrada {
  productoId: string
  talla: string
  cantidad: number
}

export const clientesApi = {
  registrar: (nombre: string, correo: string, contrasena: string) =>
    peticion<SesionCliente>('/clientes/registro', enviarJson('POST', { nombre, correo, contrasena })),

  iniciarSesion: (correo: string, contrasena: string) =>
    peticion<SesionCliente>('/clientes/login', enviarJson('POST', { correo, contrasena })),

  cerrarSesion: () => peticion<void>('/clientes/logout', enviarJson('POST')),

  sesion: () => peticion<SesionCliente>('/clientes/sesion'),

  favoritos: () => peticion<Producto[]>('/clientes/favoritos'),

  agregarFavorito: (id: string) => peticion<void>(`/clientes/favoritos/${encodeURIComponent(id)}`, enviarJson('POST')),

  quitarFavorito: (id: string) => peticion<void>(`/clientes/favoritos/${encodeURIComponent(id)}`, enviarJson('DELETE')),

  carrito: () => peticion<ItemCarrito[]>('/clientes/carrito'),

  guardarCarrito: (items: ItemCarritoEntrada[]) =>
    peticion<ItemCarrito[]>('/clientes/carrito', { ...enviarJson('PUT', { items }), keepalive: true }),
}
