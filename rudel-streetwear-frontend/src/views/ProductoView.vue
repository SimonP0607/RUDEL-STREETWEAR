<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { Producto } from '@/types'
import { productosApi } from '@/services/productos'
import { useCarrito } from '@/composables/useCarrito'
import { useCliente } from '@/composables/useCliente'
import { colorACss, formatoPrecio } from '@/utils/formato'
import { imagenesDe } from '@/utils/imagen'
import ArteProducto from '@/components/ArteProducto.vue'
import SelectorTalla from '@/components/SelectorTalla.vue'
import BotonFavorito from '@/components/BotonFavorito.vue'

const ruta = useRoute()
const router = useRouter()
const carrito = useCarrito()
const cliente = useCliente()

const producto = ref<Producto | null>(null)
const categoria = computed(() => producto.value?.categoria ?? null)
const imagenFallida = ref(false)
const vista = ref(0)
const imagenes = computed(() => (producto.value ? imagenesDe(producto.value) : []))
const imagenActual = computed(() => imagenes.value[vista.value] ?? imagenes.value[0] ?? '')
const cargando = ref(true)
const error = ref('')

const tallaElegida = ref<string | null>(null)
const cantidad = ref(1)
const aviso = ref('')

const existenciasTalla = computed(
  () => producto.value?.tallas.find((t) => t.talla === tallaElegida.value)?.existencias ?? 0,
)
const agotado = computed(() => producto.value?.tallas.every((t) => t.existencias <= 0) ?? false)
const puedeAgregar = computed(() => !!tallaElegida.value && existenciasTalla.value > 0)

async function cargar(id: string) {
  cargando.value = true
  error.value = ''
  producto.value = null
  imagenFallida.value = false
  vista.value = 0
  tallaElegida.value = null
  cantidad.value = 1
  try {
    const encontrado = await productosApi.obtener(id)
    producto.value = encontrado
    const disponibles = encontrado.tallas.filter((t) => t.existencias > 0)
    if (disponibles.length === 1) tallaElegida.value = disponibles[0]?.talla ?? null
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar el producto'
  } finally {
    cargando.value = false
  }
}

async function agregarAlCarrito() {
  if (!(await cliente.verificar())) {
    router.push({ name: 'cuenta', query: { volver: ruta.fullPath, motivo: 'carrito' } })
    return
  }
  if (!producto.value || !tallaElegida.value) {
    aviso.value = 'Elige una talla para agregar la prenda.'
    return
  }
  const agregado = carrito.agregar(producto.value, tallaElegida.value, cantidad.value)
  aviso.value = agregado ? '' : 'Esa talla está agotada.'
}

watch(tallaElegida, () => {
  aviso.value = ''
  cantidad.value = Math.min(Math.max(1, cantidad.value), Math.max(1, existenciasTalla.value))
})

onMounted(() => cargar(String(ruta.params.id)))
watch(() => ruta.params.id, (id) => id && cargar(String(id)))
</script>

<template>
  <div class="contenedor detalle">
    <nav class="detalle__migas" aria-label="Ruta de navegación">
      <RouterLink to="/" class="enlace-texto">← Catálogo</RouterLink>
      <template v-if="categoria">
        <span aria-hidden="true">/</span>
        <RouterLink :to="{ name: 'catalogo', query: { categoria: categoria._id } }" class="enlace-texto">
          {{ categoria.nombre }}
        </RouterLink>
      </template>
    </nav>

    <p v-if="cargando" class="estado" role="status">Cargando la prenda…</p>

    <div v-else-if="error || !producto" class="estado">
      <p class="estado__titulo">Prenda no encontrada</p>
      <p>{{ error || 'Es posible que ya no esté en el catálogo.' }}</p>
    </div>

    <article v-else class="ficha">
      <div class="ficha__arte">
        <span class="ficha__esquina ficha__esquina--a" aria-hidden="true" />
        <span class="ficha__esquina ficha__esquina--b" aria-hidden="true" />
        <span class="ficha__esquina ficha__esquina--c" aria-hidden="true" />
        <span class="ficha__esquina ficha__esquina--d" aria-hidden="true" />
        <template v-if="imagenActual && !imagenFallida">
          <img
            :key="imagenActual"
            class="ficha__foto"
            :src="imagenActual"
            :alt="vista === 0 ? producto.nombre : `${producto.nombre}, segunda vista`"
            referrerpolicy="no-referrer"
            @error="imagenFallida = true"
          />
          <div v-if="imagenes.length > 1" class="ficha__miniaturas" role="group" aria-label="Fotos de la prenda">
            <button
              v-for="(url, i) in imagenes"
              :key="url"
              type="button"
              class="ficha__miniatura"
              :class="{ 'ficha__miniatura--activa': vista === i }"
              :aria-pressed="vista === i"
              :aria-label="`Ver foto ${i + 1} de ${imagenes.length}`"
              @click="vista = i"
            >
              <img :src="url" alt="" referrerpolicy="no-referrer" />
            </button>
          </div>
        </template>
        <ArteProducto v-else :categoria-nombre="categoria?.nombre ?? ''" :color="producto.color" :nombre="producto.nombre" />
        <p class="ficha__codigo">Ref. {{ (producto._id.length > 12 ? producto._id.slice(-8) : producto._id).toUpperCase() }}</p>
      </div>

      <div class="ficha__marbete">
        <p class="ficha__categoria">{{ categoria?.nombre ?? 'Sin categoría' }}</p>
        <div class="ficha__titulo">
          <h1 class="ficha__nombre">{{ producto.nombre }}</h1>
          <BotonFavorito :producto-id="producto._id" :nombre="producto.nombre" />
        </div>
        <p class="ficha__precio">{{ formatoPrecio(producto.precio) }}</p>

        <dl class="ficha__datos">
          <div class="ficha__dato">
            <dt>Color</dt>
            <dd>
              <span class="ficha__muestra" :style="{ background: colorACss(producto.color) }" aria-hidden="true" />
              {{ producto.color }}
            </dd>
          </div>
          <div class="ficha__dato">
            <dt>Disponibilidad</dt>
            <dd>{{ agotado ? 'Agotado en todas las tallas' : `${producto.tallas.filter((t) => t.existencias > 0).length} talla(s) con existencias` }}</dd>
          </div>
        </dl>

        <p class="ficha__descripcion">{{ producto.descripcion }}</p>

        <form class="ficha__compra" @submit.prevent="agregarAlCarrito">
          <SelectorTalla v-model="tallaElegida" :tallas="producto.tallas" />

          <div class="ficha__cantidad">
            <label for="cantidad" class="campo__etiqueta">Cantidad</label>
            <div class="ficha__cantidad-control">
              <button type="button" class="ficha__paso" :disabled="cantidad <= 1" aria-label="Disminuir cantidad" @click="cantidad--">−</button>
              <input
                id="cantidad"
                v-model.number="cantidad"
                type="number"
                min="1"
                :max="Math.max(1, existenciasTalla)"
                :disabled="!puedeAgregar"
                class="ficha__cantidad-valor"
              />
              <button
                type="button"
                class="ficha__paso"
                :disabled="!puedeAgregar || cantidad >= existenciasTalla"
                aria-label="Aumentar cantidad"
                @click="cantidad++"
              >
                +
              </button>
            </div>
          </div>

          <button type="submit" class="boton boton--acento boton--bloque ficha__agregar" :disabled="agotado">
            {{ agotado ? 'Agotado' : 'Agregar al carrito' }}
          </button>
          <p v-if="aviso" class="mensaje mensaje--error" role="alert">{{ aviso }}</p>
        </form>
      </div>
    </article>
  </div>
</template>

<style lang="scss" scoped>
.detalle {
  padding-block: 1.6rem 2rem;

  &__migas {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 1.6rem;
    color: var(--texto-suave);
  }
}

.ficha {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: start;

  @include hasta($tableta) {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }

  &__arte {
    @include borde;
    position: relative;
    padding: clamp(1.5rem, 5vw, 3.5rem);
    background: var(--superficie);
    box-shadow: $sombra-tag;

  }

  &__foto {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 5;
    object-fit: cover;
    animation: aparecer 0.3s ease;
  }

  &__miniaturas {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.9rem;
  }

  &__miniatura {
    width: 4.2rem;
    aspect-ratio: 4 / 5;
    padding: 0;
    overflow: hidden;
    border: $borde solid var(--linea-suave);
    border-radius: $radio;
    opacity: 0.6;
    transition:
      opacity $transicion,
      border-color $transicion;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:hover,
    &--activa {
      opacity: 1;
      border-color: var(--linea);
    }

    &--activa {
      box-shadow: 0 0 0 2px var(--acento);
    }
  }

  &__esquina {
    position: absolute;
    width: 0.9rem;
    height: 0.9rem;
    border-color: var(--linea);
    border-style: solid;
    border-width: 0;

    &--a { top: 0.6rem; left: 0.6rem; border-width: 1.5px 0 0 1.5px; }
    &--b { top: 0.6rem; right: 0.6rem; border-width: 1.5px 1.5px 0 0; }
    &--c { bottom: 0.6rem; left: 0.6rem; border-width: 0 0 1.5px 1.5px; }
    &--d { bottom: 0.6rem; right: 0.6rem; border-width: 0 1.5px 1.5px 0; }
  }

  &__codigo {
    @include etiqueta-texto(0.62rem);
    position: absolute;
    bottom: 0.9rem;
    left: 50%;
    transform: translateX(-50%);
    color: var(--texto-gris);
  }

  &__marbete {
    @include borde;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: clamp(1.4rem, 3vw, 2.2rem);
    background: var(--superficie);
    border-radius: $radio;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0.6rem;
      left: 0.6rem;
      right: 0.6rem;
      bottom: 0.6rem;
      border: 1px dashed var(--linea-suave);
      pointer-events: none;
    }
  }

  &__categoria {
    @include etiqueta-texto(0.7rem);
    color: var(--texto-suave);
  }

  &__titulo {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__nombre {
    @include display(2.4rem, 5.5vw, 4.4rem, 900);
  }

  &__precio {
    font-family: $fuente-mono;
    font-size: 1.35rem;
    font-weight: 700;
  }

  &__datos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
    margin: 0;
    padding-block: 0.9rem;
    border-top: 1px solid var(--linea-suave);
    border-bottom: 1px solid var(--linea-suave);

    @include hasta($movil) {
      grid-template-columns: 1fr;
    }
  }

  &__dato {
    dt {
      @include etiqueta-texto(0.62rem);
      color: var(--texto-gris);
      margin-bottom: 0.2rem;
    }

    dd {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.95rem;
    }
  }

  &__muestra {
    width: 0.95rem;
    height: 0.95rem;
    border: 1px solid var(--linea);
    border-radius: 50%;
  }

  &__descripcion {
    line-height: 1.6;
    color: var(--texto-suave);
  }

  &__compra {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    margin-top: 0.3rem;
  }

  &__cantidad {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__cantidad-control {
    display: inline-flex;
    width: fit-content;
    border: $borde solid var(--linea);
    border-radius: $radio;
    overflow: hidden;
    background: var(--superficie);
  }

  &__paso {
    width: 2.8rem;
    font-size: 1.2rem;
    transition:
      background $transicion,
      color $transicion;

    &:hover:not(:disabled) {
      background: var(--texto);
      color: var(--fondo);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__cantidad-valor {
    width: 3.6rem;
    text-align: center;
    border: 0;
    border-inline: $borde solid var(--linea);
    background: transparent;
    font-family: $fuente-mono;
    font-weight: 700;
    -moz-appearance: textfield;
    appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }

    &:focus {
      outline: none;
      background: var(--acento);
    }
  }

  &__agregar {
    min-height: 3.6rem;
    font-size: 0.9rem;
  }
}

@keyframes aparecer {
  from {
    opacity: 0.4;
  }

  to {
    opacity: 1;
  }
}
</style>
