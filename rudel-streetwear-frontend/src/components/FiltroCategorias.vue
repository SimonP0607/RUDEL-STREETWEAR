<script setup lang="ts">
import type { Categoria } from '@/types'

defineProps<{
  categorias: Categoria[]
  seleccionada: string | null
  conteos: Record<string, number>
  total: number
}>()

const emit = defineEmits<{ seleccionar: [id: string | null] }>()
</script>

<template>
  <nav class="filtro" aria-label="Filtrar por categoría">
    <p class="filtro__titulo">Categorías</p>
    <ul class="filtro__lista">
      <li>
        <button
          type="button"
          class="filtro__boton"
          :class="{ 'filtro__boton--activo': seleccionada === null }"
          :aria-pressed="seleccionada === null"
          @click="emit('seleccionar', null)"
        >
          Todo <span class="filtro__conteo">{{ total }}</span>
        </button>
      </li>
      <li v-for="categoria in categorias" :key="categoria._id">
        <button
          type="button"
          class="filtro__boton"
          :class="{ 'filtro__boton--activo': seleccionada === categoria._id }"
          :aria-pressed="seleccionada === categoria._id"
          @click="emit('seleccionar', categoria._id)"
        >
          {{ categoria.nombre }} <span class="filtro__conteo">{{ conteos[categoria._id] ?? 0 }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style lang="scss" scoped>
.filtro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-block: 0.9rem;
  border-top: $borde solid var(--linea);
  border-bottom: $borde solid var(--linea);

  @include hasta($movil) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  &__titulo {
    @include etiqueta-texto(0.68rem);
    color: var(--texto-suave);
    flex-shrink: 0;
  }

  &__lista {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;

    @include hasta($movil) {
      flex-wrap: nowrap;
      overflow-x: auto;
      width: 100%;
      padding-bottom: 0.3rem;
      scrollbar-width: thin;
    }
  }

  &__boton {
    @include etiqueta-texto(0.7rem);
    @include borde;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.42rem 0.8rem;
    background: var(--superficie);
    border-radius: $radio;
    white-space: nowrap;
    transition:
      background $transicion,
      color $transicion,
      transform $transicion;

    &:hover {
      transform: translateY(-2px);
    }

    &--activo {
      background: var(--texto);
      color: var(--fondo);
    }
  }

  &__conteo {
    font-family: $fuente-mono;
    font-size: 0.64rem;
    letter-spacing: 0;
    opacity: 0.7;
  }
}
</style>
