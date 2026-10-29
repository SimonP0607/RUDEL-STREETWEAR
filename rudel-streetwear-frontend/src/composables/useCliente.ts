import { computed, ref } from 'vue'
import type { Cliente, SesionCliente } from '@/types'
import { clientesApi } from '@/services/clientes'
import { guardarTokenCsrfCliente } from '@/services/http'
import { cargarCarritoDelCliente, descartarCarritoLocal } from '@/composables/useCarrito'

const cliente = ref<Cliente | null>(null)
const verificada = ref(false)
const favoritos = ref<Set<string>>(new Set())

async function aplicar(sesion: SesionCliente | null) {
  cliente.value = sesion?.cliente ?? null
  guardarTokenCsrfCliente(sesion?.csrfToken ?? null)
  verificada.value = true
  if (!sesion) {
    favoritos.value = new Set()
    descartarCarritoLocal()
    return
  }
  const [lista] = await Promise.all([clientesApi.favoritos().catch(() => []), cargarCarritoDelCliente()])
  favoritos.value = new Set(lista.map((p) => p._id))
}

export function useCliente() {
  const haySesion = computed(() => cliente.value !== null)
  const totalFavoritos = computed(() => favoritos.value.size)

  async function verificar() {
    if (verificada.value) return haySesion.value
    try {
      await aplicar(await clientesApi.sesion())
    } catch {
      await aplicar(null)
    }
    return haySesion.value
  }

  async function registrar(nombre: string, correo: string, contrasena: string) {
    await aplicar(await clientesApi.registrar(nombre.trim(), correo.trim(), contrasena))
  }

  async function iniciarSesion(correo: string, contrasena: string) {
    await aplicar(await clientesApi.iniciarSesion(correo.trim(), contrasena))
  }

  async function cerrarSesion() {
    try {
      await clientesApi.cerrarSesion()
    } finally {
      await aplicar(null)
    }
  }

  function expirar() {
    void aplicar(null)
  }

  const esFavorito = (id: string) => favoritos.value.has(id)

  async function alternarFavorito(id: string) {
    const eraFavorito = favoritos.value.has(id)
    const siguiente = new Set(favoritos.value)
    if (eraFavorito) siguiente.delete(id)
    else siguiente.add(id)
    favoritos.value = siguiente
    try {
      if (eraFavorito) await clientesApi.quitarFavorito(id)
      else await clientesApi.agregarFavorito(id)
    } catch (e) {
      const revertido = new Set(favoritos.value)
      if (eraFavorito) revertido.add(id)
      else revertido.delete(id)
      favoritos.value = revertido
      throw e
    }
  }

  return { cliente, haySesion, totalFavoritos, verificar, registrar, iniciarSesion, cerrarSesion, expirar, esFavorito, alternarFavorito }
}
