<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Categoria, Producto } from '@/types'
import { categoriasApi } from '@/services/categorias'
import { productosApi } from '@/services/productos'
import { nombreCategoria } from '@/utils/categoria'
import FiltroCategorias from '@/components/FiltroCategorias.vue'
import TarjetaProducto from '@/components/TarjetaProducto.vue'
import PortadaFotos from '@/components/PortadaFotos.vue'
import CintaFotos from '@/components/CintaFotos.vue'
import CategoriasFoto from '@/components/CategoriasFoto.vue'
import ManifiestoRudel from '@/components/ManifiestoRudel.vue'
import Lookbook from '@/components/Lookbook.vue'
import ComoComprar from '@/components/ComoComprar.vue'
import { vRevelar } from '@/directives/revelar'

const ruta = useRoute()
const router = useRouter()

const categorias = ref<Categoria[]>([])
const productos = ref<Producto[]>([])
const destacados = ref<Producto[]>([])
const cargando = ref(true)
const error = ref('')
let consultaActual = 0

const categoriaSeleccionada = computed<string | null>(() => {
  const valor = ruta.query.categoria
  return typeof valor === 'string' && valor !== '' ? valor : null
})

const conteos = computed<Record<string, number>>(() =>
  Object.fromEntries(categorias.value.map((c) => [c._id, c.productosActivos ?? 0])),
)

const totalActivos = computed(() => categorias.value.reduce((suma, c) => suma + (c.productosActivos ?? 0), 0))

const totalMostrado = ref(0)
let cuadro = 0

function contarHasta(meta: number) {
  cancelAnimationFrame(cuadro)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    totalMostrado.value = meta
    return
  }
  const inicio = totalMostrado.value
  const t0 = performance.now()
  const paso = (t: number) => {
    const avance = Math.min((t - t0) / 900, 1)
    totalMostrado.value = Math.round(inicio + (meta - inicio) * (1 - (1 - avance) ** 3))
    if (avance < 1) cuadro = requestAnimationFrame(paso)
  }
  cuadro = requestAnimationFrame(paso)
}

const tituloSeccion = computed(() => {
  if (!categoriaSeleccionada.value) return 'Todo el catálogo'
  return categorias.value.find((c) => c._id === categoriaSeleccionada.value)?.nombre ?? 'Catálogo'
})

async function cargarProductos() {
  const consulta = ++consultaActual
  cargando.value = true
  error.value = ''
  try {
    const lista = await productosApi.listar(categoriaSeleccionada.value ?? undefined)
    if (consulta === consultaActual) productos.value = lista
  } catch (e) {
    if (consulta === consultaActual) error.value = e instanceof Error ? e.message : 'No se pudo cargar el catálogo'
  } finally {
    if (consulta === consultaActual) cargando.value = false
  }
}

async function cargarCategorias() {
  try {
    const [listaCategorias, listaDestacados] = await Promise.all([categoriasApi.listar(), productosApi.destacados()])
    categorias.value = listaCategorias
    destacados.value = listaDestacados
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar las categorías'
  }
}

function seleccionarCategoria(id: string | null) {
  router.replace({ name: 'catalogo', query: id ? { categoria: id } : {} })
}

async function irACategoria(id: string) {
  await router.replace({ name: 'catalogo', query: { categoria: id } })
  await nextTick()
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })),
  )
}

onMounted(() => Promise.all([cargarCategorias(), cargarProductos()]))

watch(categoriaSeleccionada, cargarProductos)

watch(totalActivos, contarHasta)

onBeforeUnmount(() => cancelAnimationFrame(cuadro))

watch(categorias, (lista) => {
  if (categoriaSeleccionada.value && lista.length && !lista.some((c) => c._id === categoriaSeleccionada.value)) {
    seleccionarCategoria(null)
  }
})
</script>

<template>
  <div class="catalogo">
    <section class="portada contenedor" aria-labelledby="portada-titulo">
      <h1 id="portada-titulo" class="portada__titulo">
        <span class="portada__linea">Ropa</span>
        <span class="portada__linea portada__linea--acento">urbana</span>
        <span class="portada__linea">por talla</span>
      </h1>
      <PortadaFotos class="portada__foto" />
      <div class="portada__texto">
        <p class="portada__descripcion">Oversize, acid wash, croptops y esqueletos. Elige tu talla.</p>
        <p class="portada__dato">
          <span class="portada__numero">{{ totalMostrado }}</span> prendas en catálogo
        </p>
        <a href="#catalogo" class="boton boton--acento portada__ir">Ver el catálogo ↓</a>
      </div>
    </section>

    <CintaFotos />

    <CategoriasFoto v-if="!categoriaSeleccionada" :categorias="categorias" :productos="productos" @seleccionar="irACategoria" />

    <section v-if="destacados.length && !categoriaSeleccionada" class="destacados" aria-labelledby="destacados-titulo">
      <div class="contenedor">
        <h2 id="destacados-titulo" class="seccion-titulo">
          <span class="seccion-titulo__marca">Destacados</span>
          <span class="seccion-titulo__nota">Lo más nuevo del drop</span>
        </h2>
        <div class="destacados__pista">
          <TarjetaProducto
            v-for="(producto, i) in destacados"
            :key="producto._id"
            :producto="producto"
            :categoria-nombre="nombreCategoria(producto)"
            :indice="i + 2"
            v-revelar="i * 110"
            class="destacados__tarjeta"
          />
        </div>
      </div>
    </section>

    <ManifiestoRudel v-if="!categoriaSeleccionada" :total-prendas="totalActivos" :total-categorias="categorias.length" />

    <Lookbook v-if="!categoriaSeleccionada" />

    <ComoComprar v-if="!categoriaSeleccionada" />

    <section id="catalogo" class="contenedor catalogo__seccion" aria-labelledby="catalogo-titulo">
      <FiltroCategorias
        :categorias="categorias"
        :seleccionada="categoriaSeleccionada"
        :conteos="conteos"
        :total="totalActivos"
        @seleccionar="seleccionarCategoria"
      />

      <h2 id="catalogo-titulo" class="seccion-titulo">
        <span class="seccion-titulo__marca">{{ tituloSeccion }}</span>
        <span class="seccion-titulo__nota">{{ productos.length }} prenda(s)</span>
      </h2>

      <p v-if="cargando" class="estado" role="status">Cargando el catálogo…</p>
      <p v-else-if="error" class="mensaje mensaje--error">{{ error }}</p>
      <div v-else-if="productos.length === 0" class="estado">
        <p class="estado__titulo">Nada por aquí</p>
        <p>Todavía no hay prendas en esta categoría.</p>
      </div>
      <div v-else class="rejilla">
        <TarjetaProducto
          v-for="(producto, i) in productos"
          :key="producto._id"
          :producto="producto"
          :categoria-nombre="nombreCategoria(producto)"
          :indice="i"
          v-revelar="(i % 4) * 90"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.portada {
  display: grid;
  grid-template-columns: 1.35fr minmax(15rem, 0.75fr);
  grid-template-areas:
    'titulo foto'
    'texto foto';
  align-items: end;
  gap: 1.6rem 2.4rem;
  padding-block: 3.6rem 3rem;

  @include hasta($tableta) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'titulo'
      'foto'
      'texto';
    padding-block: 2rem 1.8rem;
  }

  &__foto {
    grid-area: foto;
    align-self: start;
    transform: rotate(1.5deg);
    animation: flotar linear both;
    animation-timeline: scroll(root);
    animation-range: 0 600px;

    @include hasta($tableta) {
      transform: none;
      animation: none;
    }
  }

  &__titulo {
    grid-area: titulo;
    @include display(3.6rem, 9vw, 8.5rem, 900);
    display: flex;
    flex-direction: column;
  }

  &__linea {
    display: block;
    animation: adelgazar linear both;
    animation-timeline: scroll(root);
    animation-range: 0 420px;

    &--acento {
      padding-inline: 0.12em;
      margin-left: 0.6em;
      background: var(--acento);
      width: fit-content;
    }

    &:last-child {
      margin-left: 1.5em;
    }
  }

  &__texto {
    grid-area: texto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 0.6rem;
  }

  &__ir {
    width: fit-content;
  }

  &__descripcion {
    max-width: 34rem;
    font-size: 1.05rem;
    line-height: 1.55;
    color: var(--texto-suave);
  }

  &__dato {
    @include etiqueta-texto(0.68rem);
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    color: var(--texto-suave);
  }

  &__numero {
    font-family: $fuente-display;
    font-size: 2.6rem;
    font-weight: 900;
    color: var(--texto);
    line-height: 1;
  }
}

@keyframes flotar {
  to {
    translate: 0 -2.5rem;
  }
}

@keyframes adelgazar {
  from {
    font-variation-settings: 'wght' 900;
  }

  to {
    font-variation-settings: 'wght' 350;
  }
}

.seccion-titulo {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1.6rem 1.2rem;

  &__marca {
    @include display(2rem, 4.5vw, 3.4rem, 800);
  }

  &__nota {
    @include etiqueta-texto(0.68rem);
    color: var(--texto-suave);
    white-space: nowrap;
  }
}

.catalogo__seccion {
  scroll-margin-top: 5rem;
  padding-top: 2.4rem;
}

.destacados {
  border-top: $borde solid var(--linea);
  background: var(--superficie-2);

  &__pista {
    display: flex;
    gap: 1.4rem;
    overflow-x: auto;
    padding: 0.8rem 0.9rem 2rem;
    scroll-snap-type: x mandatory;
    scrollbar-width: thin;
  }

  &__tarjeta {
    flex: 0 0 min(76vw, 17rem);
    scroll-snap-align: start;
  }
}

.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr));
  gap: 1.8rem 1.4rem;
  padding-bottom: 2rem;

  @include hasta($movil) {
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: 1.4rem 0.9rem;
  }
}
</style>
