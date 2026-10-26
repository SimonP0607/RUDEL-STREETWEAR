import { computed, ref } from 'vue'
import type { Administrador, Sesion } from '@/types'
import { authApi } from '@/services/auth'
import { guardarTokenCsrf } from '@/services/http'

const administrador = ref<Administrador | null>(null)
const verificada = ref(false)

function aplicar(sesion: Sesion | null) {
  administrador.value = sesion?.administrador ?? null
  guardarTokenCsrf(sesion?.csrfToken ?? null)
  verificada.value = true
}

export function useSesion() {
  const haySesion = computed(() => administrador.value !== null)

  async function verificar() {
    if (verificada.value) return haySesion.value
    try {
      aplicar(await authApi.sesion())
    } catch {
      aplicar(null)
    }
    return haySesion.value
  }

  async function iniciarSesion(usuario: string, contrasena: string) {
    aplicar(await authApi.iniciarSesion(usuario.trim(), contrasena))
  }

  async function cerrarSesion() {
    try {
      await authApi.cerrarSesion()
    } finally {
      aplicar(null)
    }
  }

  function expirar() {
    aplicar(null)
  }

  return { administrador, haySesion, verificar, iniciarSesion, cerrarSesion, expirar }
}
