const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS'])

let tokenCsrf: string | null = null
let alExpirarSesion: (() => void) | null = null

export function guardarTokenCsrf(token: string | null) {
  tokenCsrf = token
}

export function registrarExpiracionSesion(manejador: () => void) {
  alExpirarSesion = manejador
}

export class ErrorHttp extends Error {
  estado: number
  detalles: string[]

  constructor(estado: number, mensaje: string, detalles: string[] = []) {
    super(detalles.length ? `${mensaje}: ${detalles.join('. ')}` : mensaje)
    this.estado = estado
    this.detalles = detalles
  }
}

export async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const metodo = (opciones.method ?? 'GET').toUpperCase()
  const encabezados = new Headers(opciones.headers)
  if (opciones.body !== undefined) encabezados.set('Content-Type', 'application/json')
  if (!METODOS_SEGUROS.has(metodo) && tokenCsrf) encabezados.set('X-CSRF-Token', tokenCsrf)

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, method: metodo, headers: encabezados, credentials: 'include' })
  } catch {
    throw new ErrorHttp(0, 'No hay conexión con el servidor')
  }

  if (respuesta.status === 204) return undefined as T

  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    if (respuesta.status === 401 && !ruta.startsWith('/auth/')) alExpirarSesion?.()
    const mensaje = typeof datos?.error === 'string' ? datos.error : `Error ${respuesta.status}`
    const detalles = Array.isArray(datos?.detalles) ? datos.detalles.filter((d: unknown) => typeof d === 'string') : []
    throw new ErrorHttp(respuesta.status, mensaje, detalles)
  }
  return datos as T
}

export const enviarJson = (metodo: string, datos?: unknown): RequestInit => ({
  method: metodo,
  body: datos === undefined ? undefined : JSON.stringify(datos),
})
