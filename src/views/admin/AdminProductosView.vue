<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Categoria, Producto } from '@/types'
import { categoriasApi } from '@/services/categorias'
import { productosApi } from '@/services/productos'
import { formatoPrecio } from '@/utils/formato'
import { nombreCategoria } from '@/utils/categoria'
import HojaLateral from '@/components/admin/HojaLateral.vue'
import FormularioProducto from '@/components/admin/FormularioProducto.vue'

const productos = ref<Producto[]>([])
const categorias = ref<Categoria[]>([])
const cargando = ref(true)
const error = ref('')
const aviso = ref('')

const formularioAbierto = ref(false)
const productoEnEdicion = ref<Producto | null>(null)
const confirmandoId = ref<string | null>(null)

function existenciasTotales(producto: Producto): number {
  return producto.tallas.reduce((suma, t) => suma + t.existencias, 0)
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [lista, cats] = await Promise.all([productosApi.listarTodos(), categoriasApi.listar()])
    productos.value = lista
    categorias.value = cats
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar los productos'
  } finally {
    cargando.value = false
  }
}

function mostrarAviso(texto: string) {
  aviso.value = texto
  window.setTimeout(() => (aviso.value = ''), 3500)
}

function nuevo() {
  productoEnEdicion.value = null
  formularioAbierto.value = true
}

function editar(producto: Producto) {
  productoEnEdicion.value = producto
  formularioAbierto.value = true
}

function alGuardar(producto: Producto) {
  const indice = productos.value.findIndex((p) => p._id === producto._id)
  productos.value = indice === -1 ? [producto, ...productos.value] : productos.value.map((p) => (p._id === producto._id ? producto : p))
  formularioAbierto.value = false
  mostrarAviso(indice === -1 ? `Producto "${producto.nombre}" creado.` : `Producto "${producto.nombre}" actualizado.`)
}

async function eliminar(producto: Producto) {
  error.value = ''
  try {
    await productosApi.eliminar(producto._id)
    productos.value = productos.value.filter((p) => p._id !== producto._id)
    mostrarAviso(`Producto "${producto.nombre}" eliminado.`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo eliminar el producto'
  } finally {
    confirmandoId.value = null
  }
}

onMounted(cargar)
</script>

<template>
  <section class="seccion">
    <header class="seccion__cabecera">
      <div>
        <p class="seccion__sobre">Inventario</p>
        <h1 class="seccion__titulo">Productos</h1>
        <p class="seccion__resumen">
          {{ productos.length }} en total · {{ productos.filter((p) => p.activo).length }} activos ·
          {{ productos.filter((p) => !p.activo).length }} inactivos
        </p>
      </div>
      <button type="button" class="boton boton--acento" :disabled="categorias.length === 0" @click="nuevo">
        + Nuevo producto
      </button>
    </header>

    <p v-if="categorias.length === 0 && !cargando" class="mensaje">
      Antes de crear productos hay que registrar al menos una categoría.
    </p>
    <p v-if="aviso" class="mensaje mensaje--exito" role="status">{{ aviso }}</p>
    <p v-if="error" class="mensaje mensaje--error" role="alert">{{ error }}</p>

    <p v-if="cargando" class="estado">Cargando productos…</p>

    <div v-else-if="productos.length === 0" class="estado">
      <p class="estado__titulo">Sin productos</p>
      <p>Crea el primero con el botón "Nuevo producto".</p>
    </div>

    <div v-else class="tabla-envoltura">
      <table class="tabla">
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col">Categoría</th>
            <th scope="col" class="tabla__numero">Precio</th>
            <th scope="col">Tallas / existencias</th>
            <th scope="col">Estado</th>
            <th scope="col"><span class="visualmente-oculto">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="producto in productos" :key="producto._id" :class="{ 'fila--inactiva': !producto.activo }">
            <td>
              <p class="fila__nombre">{{ producto.nombre }}</p>
              <p class="fila__detalle">{{ producto.color }}</p>
            </td>
            <td>{{ nombreCategoria(producto) }}</td>
            <td class="tabla__numero">{{ formatoPrecio(producto.precio) }}</td>
            <td>
              <ul class="fila__tallas">
                <li v-for="t in producto.tallas" :key="t.talla" class="chip" :class="{ 'chip--inactivo': t.existencias === 0 }">
                  {{ t.talla }} · {{ t.existencias }}
                </li>
              </ul>
              <p class="fila__detalle">Total: {{ existenciasTotales(producto) }}</p>
            </td>
            <td>
              <span class="chip" :class="producto.activo ? 'chip--activo' : 'chip--inactivo'">
                {{ producto.activo ? 'Activo' : 'Inactivo' }}
              </span>
              <span v-if="producto.destacado" class="chip">Destacado</span>
            </td>
            <td>
              <div v-if="confirmandoId === producto._id" class="tabla__acciones">
                <span class="fila__pregunta">¿Eliminar?</span>
                <button type="button" class="boton boton--pequeno boton--peligro" @click="eliminar(producto)">Sí, eliminar</button>
                <button type="button" class="boton boton--pequeno boton--fantasma" @click="confirmandoId = null">No</button>
              </div>
              <div v-else class="tabla__acciones">
                <button type="button" class="boton boton--pequeno" @click="editar(producto)">Editar</button>
                <button type="button" class="boton boton--pequeno boton--fantasma" @click="confirmandoId = producto._id">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <HojaLateral :abierta="formularioAbierto" :titulo="productoEnEdicion ? 'Editar producto' : 'Nuevo producto'" @cerrar="formularioAbierto = false">
      <FormularioProducto
        :producto="productoEnEdicion"
        :categorias="categorias"
        @guardado="alGuardar"
        @cancelar="formularioAbierto = false"
      />
    </HojaLateral>
  </section>
</template>

<style lang="scss" scoped>
.seccion {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  &__cabecera {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 1.2rem;
    border-bottom: $borde solid var(--linea);
  }

  &__sobre {
    @include etiqueta-texto(0.66rem);
    color: var(--texto-suave);
  }

  &__titulo {
    @include display(2.6rem, 6vw, 4.2rem, 900);
  }

  &__resumen {
    @include etiqueta-texto(0.64rem);
    margin-top: 0.5rem;
    color: var(--texto-suave);
  }
}

.fila {
  &__nombre {
    font-weight: 600;
  }

  &__detalle {
    font-size: 0.78rem;
    color: var(--texto-suave);
    margin-top: 0.15rem;
  }

  &__tallas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  &__pregunta {
    @include etiqueta-texto(0.62rem);
    align-self: center;
    color: var(--alerta);
  }

  &--inactiva td {
    color: var(--texto-suave);
  }
}
</style>
