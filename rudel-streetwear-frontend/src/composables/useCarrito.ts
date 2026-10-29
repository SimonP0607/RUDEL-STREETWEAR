import { computed, ref, watch } from 'vue'
import type { ItemCarrito, Producto } from '@/types'
import { clientesApi } from '@/services/clientes'

const items = ref<ItemCarrito[]>([])
const abierto = ref(false)
const sincronizando = ref(false)
let activo = false
let temporizador: number | undefined

let ignorar = 0

function reemplazar(lista: ItemCarrito[]) {
  ignorar++
  items.value = lista
}

async function guardarEnServidor() {
  if (!activo) return
  try {
    const guardado = await clientesApi.guardarCarrito(
      items.value.map((i) => ({ productoId: i.productoId, talla: i.talla, cantidad: i.cantidad })),
    )
    const distinto =
      guardado.length !== items.value.length ||
      guardado.some((g, n) => g.cantidad !== items.value[n]?.cantidad || g.existenciasDisponibles !== items.value[n]?.existenciasDisponibles)
    if (distinto && temporizador === undefined) reemplazar(guardado)
  } catch {
    return
  }
}

watch(
  items,
  () => {
    if (ignorar > 0) {
      ignorar--
      return
    }
    if (!activo) return
    window.clearTimeout(temporizador)
    temporizador = window.setTimeout(async () => {
      temporizador = undefined
      sincronizando.value = true
      await guardarEnServidor()
      sincronizando.value = false
    }, 200)
  },
  { deep: true },
)

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (temporizador === undefined) return
    window.clearTimeout(temporizador)
    temporizador = undefined
    void guardarEnServidor()
  })
}

export async function cargarCarritoDelCliente() {
  try {
    reemplazar(await clientesApi.carrito())
  } catch {
    reemplazar([])
  }
  activo = true
}

export function descartarCarritoLocal() {
  activo = false
  window.clearTimeout(temporizador)
  temporizador = undefined
  items.value = []
  abierto.value = false
}

export function useCarrito() {
  const cantidadTotal = computed(() => items.value.reduce((suma, item) => suma + item.cantidad, 0))
  const total = computed(() => items.value.reduce((suma, item) => suma + subtotal(item), 0))

  function subtotal(item: ItemCarrito): number {
    return item.precioUnitario * item.cantidad
  }

  function buscar(productoId: string, talla: string) {
    return items.value.find((i) => i.productoId === productoId && i.talla === talla)
  }

  function agregar(producto: Producto, talla: string, cantidad = 1): boolean {
    const existencias = producto.tallas.find((t) => t.talla === talla)?.existencias ?? 0
    if (existencias <= 0) return false

    const existente = buscar(producto._id, talla)
    if (existente) {
      existente.existenciasDisponibles = existencias
      existente.precioUnitario = producto.precio
      existente.cantidad = Math.min(existente.cantidad + cantidad, existencias)
    } else {
      items.value.push({
        productoId: producto._id,
        nombre: producto.nombre,
        talla,
        precioUnitario: producto.precio,
        cantidad: Math.min(cantidad, existencias),
        existenciasDisponibles: existencias,
      })
    }
    abierto.value = true
    return true
  }

  function cambiarCantidad(productoId: string, talla: string, cantidad: number) {
    const item = buscar(productoId, talla)
    if (!item) return
    item.cantidad = Math.max(1, Math.min(Math.round(cantidad), item.existenciasDisponibles))
  }

  function quitar(productoId: string, talla: string) {
    items.value = items.value.filter((i) => !(i.productoId === productoId && i.talla === talla))
  }

  function abrir() {
    abierto.value = true
  }

  function cerrar() {
    abierto.value = false
  }

  return { items, abierto, cantidadTotal, total, subtotal, agregar, cambiarCantidad, quitar, abrir, cerrar }
}
