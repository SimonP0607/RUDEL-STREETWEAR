import type { Sesion } from '@/types'
import { enviarJson, peticion } from './http'

export const authApi = {
  iniciarSesion: (usuario: string, contrasena: string) =>
    peticion<Sesion>('/auth/login', enviarJson('POST', { usuario, contrasena })),

  cerrarSesion: () => peticion<void>('/auth/logout', enviarJson('POST')),

  sesion: () => peticion<Sesion>('/auth/sesion'),
}
