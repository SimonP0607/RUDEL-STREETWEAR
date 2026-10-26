<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Categoria } from '@/types'
import { categoriasApi } from '@/services/categorias'
import HojaLateral from '@/components/admin/HojaLateral.vue'
import FormularioCategoria from '@/components/admin/FormularioCategoria.vue'

const categorias = ref<Categoria[]>([])
const cargando = ref(true)
const error = ref('')
const aviso = ref('')

const formularioAbierto = ref(false)
const categoriaEnEdicion = ref<Categoria | null>(null)
const confirmandoId = ref<string | null>(null)

const totalProductos = (categoria: Categoria) => categoria.totalProductos ?? 0

const ordenar = (lista: Categoria[]) => [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    categorias.value = await categoriasApi.listar()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar las categorías'
  } finally {
    cargando.value = false
  }
}

function mostrarAviso(texto: string) {
  aviso.value = texto
  window.setTimeout(() => (aviso.value = ''), 3500)
}

function nueva() {
  categoriaEnEdicion.value = null
  formularioAbierto.value = true
}

function editar(categoria: Categoria) {
  categoriaEnEdicion.value = categoria
  formularioAbierto.value = true
}

function alGuardar(categoria: Categoria) {
  const indice = categorias.value.findIndex((c) => c._id === categoria._id)
  const anterior = categorias.value[indice]
  const actualizada = { ...categoria, totalProductos: anterior?.totalProductos ?? 0, productosActivos: anterior?.productosActivos ?? 0 }
  categorias.value = ordenar(indice === -1 ? [...categorias.value, actualizada] : categorias.value.map((c) => (c._id === categoria._id ? actualizada : c)))
  formularioAbierto.value = false
  mostrarAviso(indice === -1 ? `Categoría "${categoria.nombre}" creada.` : `Categoría "${categoria.nombre}" actualizada.`)
}

async function eliminar(categoria: Categoria) {
  error.value = ''
  try {
    await categoriasApi.eliminar(categoria._id)
    categorias.value = categorias.value.filter((c) => c._id !== categoria._id)
    mostrarAviso(`Categoría "${categoria.nombre}" eliminada.`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo eliminar la categoría'
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
        <p class="seccion__sobre">Organización del catálogo</p>
        <h1 class="seccion__titulo">Categorías</h1>
        <p class="seccion__resumen">{{ categorias.length }} categoría(s)</p>
      </div>
      <button type="button" class="boton boton--acento" @click="nueva">+ Nueva categoría</button>
    </header>

    <p v-if="aviso" class="mensaje mensaje--exito" role="status">{{ aviso }}</p>
    <p v-if="error" class="mensaje mensaje--error" role="alert">{{ error }}</p>

    <p v-if="cargando" class="estado">Cargando categorías…</p>

    <div v-else-if="categorias.length === 0" class="estado">
      <p class="estado__titulo">Sin categorías</p>
      <p>Crea la primera con el botón "Nueva categoría".</p>
    </div>

    <div v-else class="tabla-envoltura">
      <table class="tabla">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Descripción</th>
            <th scope="col" class="tabla__numero">Productos</th>
            <th scope="col"><span class="visualmente-oculto">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="categoria in categorias" :key="categoria._id">
            <td class="fila__nombre">{{ categoria.nombre }}</td>
            <td class="fila__descripcion">{{ categoria.descripcion || '—' }}</td>
            <td class="tabla__numero">{{ totalProductos(categoria) }}</td>
            <td>
              <div v-if="confirmandoId === categoria._id" class="tabla__acciones">
                <span class="fila__pregunta">¿Eliminar?</span>
                <button type="button" class="boton boton--pequeno boton--peligro" @click="eliminar(categoria)">Sí, eliminar</button>
                <button type="button" class="boton boton--pequeno boton--fantasma" @click="confirmandoId = null">No</button>
              </div>
              <div v-else class="tabla__acciones">
                <button type="button" class="boton boton--pequeno" @click="editar(categoria)">Editar</button>
                <button
                  type="button"
                  class="boton boton--pequeno boton--fantasma"
                  :disabled="totalProductos(categoria) > 0"
                  :title="totalProductos(categoria) > 0 ? 'Tiene productos asociados; primero cámbialos de categoría o elimínalos.' : undefined"
                  @click="confirmandoId = categoria._id"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="seccion__nota">
      Una categoría con productos asociados no se puede eliminar; así ningún producto queda apuntando a una categoría
      que ya no existe.
    </p>

    <HojaLateral :abierta="formularioAbierto" :titulo="categoriaEnEdicion ? 'Editar categoría' : 'Nueva categoría'" @cerrar="formularioAbierto = false">
      <FormularioCategoria :categoria="categoriaEnEdicion" @guardado="alGuardar" @cancelar="formularioAbierto = false" />
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

  &__nota {
    font-size: 0.82rem;
    color: var(--texto-suave);
  }
}

.fila {
  &__nombre {
    font-weight: 600;
  }

  &__descripcion {
    color: var(--texto-suave);
    max-width: 34rem;
  }

  &__pregunta {
    @include etiqueta-texto(0.62rem);
    align-self: center;
    color: var(--alerta);
  }
}
</style>
