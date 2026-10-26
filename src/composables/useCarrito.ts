import { computed, ref, watch } from 'vue'
import type { ItemCarrito, Producto } from '@/types'

const CLAVE = 'rudel-carrito'

function esItemValido(item: unknown): item is ItemCarrito {
  const i = item as ItemCarrito
  return (
    typeof i?.productoId === 'string' &&
    typeof i.nombre === 'string' &&
    typeof i.talla === 'string' &&
    Number.isFinite(i.precioUnitario) &&
    Number.isInteger(i.cantidad) &&
    i.cantidad > 0 &&
    Number.isInteger(i.existenciasDisponibles)
  )
}

function cargar(): ItemCarrito[] {
  try {
    const guardado = localStorage.getItem(CLAVE)
    const datos: unknown = guardado ? JSON.parse(guardado) : []
    return Array.isArray(datos) ? datos.filter(esItemValido) : []
  } catch {
    return []
  }
}

const items = ref<ItemCarrito[]>(cargar())
const abierto = ref(false)

watch(
  items,
  (valor) => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(valor))
    } catch {
      return
    }
  },
  { deep: true },
)

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
