<script setup lang="ts">
import { computed } from 'vue'
import type { Categoria, Producto } from '@/types'
import { vRevelar } from '@/directives/revelar'

const props = defineProps<{
  categorias: Categoria[]
  productos: Producto[]
}>()

const emit = defineEmits<{ seleccionar: [id: string] }>()

const tarjetas = computed(() =>
  props.categorias
    .filter((c) => (c.productosActivos ?? 0) > 0)
    .map((c) => ({
      id: c._id,
      nombre: c.nombre,
      total: c.productosActivos ?? 0,
      foto: props.productos.find((p) => p.categoria?._id === c._id && p.imagenUrl)?.imagenUrl ?? '',
    })),
)
</script>

<template>
  <section v-if="tarjetas.length" class="categorias" aria-labelledby="categorias-titulo">
    <div class="contenedor">
      <header class="categorias__cabecera">
        <h2 id="categorias-titulo" class="categorias__titulo">Compra por categoría</h2>
        <p class="categorias__nota">Elige una y te llevamos al catálogo</p>
      </header>

      <ul class="categorias__lista">
        <li v-for="(t, i) in tarjetas" :key="t.id" v-revelar="i * 90">
          <button type="button" class="tile" @click="emit('seleccionar', t.id)">
            <span class="tile__numero" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
            <img v-if="t.foto" class="tile__foto" :src="t.foto" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            <span class="tile__pie">
              <span class="tile__nombre">{{ t.nombre }}</span>
              <span class="tile__total">{{ t.total }} {{ t.total === 1 ? 'prenda' : 'prendas' }}</span>
            </span>
            <span class="tile__flecha" aria-hidden="true">→</span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.categorias {
  padding-block: 3.4rem 2.6rem;

  &__cabecera {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }

  &__titulo {
    @include display(2rem, 4.5vw, 3.4rem, 800);
  }

  &__nota {
    @include etiqueta-texto(0.68rem);
    color: var(--texto-suave);

    @include hasta($movil) {
      display: none;
    }
  }

  &__lista {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1.2rem;

    @include hasta($movil) {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.8rem;
    }
  }
}

.tile {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  padding: 0;
  overflow: hidden;
  text-align: left;
  background: var(--superficie-2);
  color: #faf8f3;
  border: $borde solid var(--linea);
  border-radius: $radio;
  box-shadow: $sombra-tag;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  @include foco;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(10, 10, 10, 0.82), rgba(10, 10, 10, 0) 58%);
    pointer-events: none;
  }

  &__foto {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  &__numero {
    @include etiqueta-texto(0.68rem);
    position: absolute;
    top: 0.7rem;
    left: 0.7rem;
    z-index: 1;
    padding: 0.2rem 0.5rem;
    background: var(--acento);
    color: var(--sobre-acento);
    border-radius: $radio;
  }

  &__pie {
    position: absolute;
    left: 0.9rem;
    right: 3.2rem;
    bottom: 0.9rem;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__nombre {
    @include display(1.6rem, 3.4vw, 2.3rem, 900);
  }

  &__total {
    @include etiqueta-texto(0.66rem);
    opacity: 0.85;
  }

  &__flecha {
    position: absolute;
    right: 0.8rem;
    bottom: 0.8rem;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 2.1rem;
    height: 2.1rem;
    font-size: 1.1rem;
    background: var(--acento);
    color: var(--sobre-acento);
    border-radius: 50%;
    transition: transform 0.25s ease;
  }

  &:hover {
    transform: translate(-2px, -3px) rotate(-0.6deg);
    box-shadow: 8px 11px 0 rgba(18, 18, 18, 0.16);
  }

  &:hover &__foto {
    transform: scale(1.07);
  }

  &:hover &__flecha {
    transform: translateX(3px);
  }
}
</style>
