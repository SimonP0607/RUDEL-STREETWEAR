<script setup lang="ts">
import type { Talla } from '@/types'

defineProps<{ tallas: Talla[] }>()

const modelo = defineModel<string | null>({ default: null })
</script>

<template>
  <fieldset class="tallas">
    <legend class="tallas__leyenda">Talla</legend>
    <div class="tallas__grupo">
      <label
        v-for="t in tallas"
        :key="t.talla"
        class="tallas__opcion"
        :class="{
          'tallas__opcion--activa': modelo === t.talla,
          'tallas__opcion--agotada': t.existencias <= 0,
        }"
      >
        <input
          v-model="modelo"
          type="radio"
          name="talla"
          :value="t.talla"
          :disabled="t.existencias <= 0"
          class="visualmente-oculto"
        />
        <span class="tallas__nombre">{{ t.talla }}</span>
        <span class="tallas__existencias">
          {{ t.existencias <= 0 ? 'agotada' : t.existencias === 1 ? 'queda 1' : `quedan ${t.existencias}` }}
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style lang="scss" scoped>
.tallas {
  margin: 0;
  padding: 0;
  border: 0;

  &__leyenda {
    @include etiqueta-texto(0.7rem);
    color: var(--texto-suave);
    padding: 0;
    margin-bottom: 0.6rem;
  }

  &__grupo {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__opcion {
    @include borde;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    min-width: 4.6rem;
    padding: 0.55rem 0.7rem;
    background: var(--superficie);
    border-radius: $radio;
    cursor: pointer;
    transition:
      background $transicion,
      color $transicion,
      transform $transicion;

    &:hover {
      transform: translateY(-2px);
    }

    &:has(input:focus-visible) {
      outline: 2px solid var(--acento-oscuro);
      outline-offset: 3px;
    }

    &--activa {
      background: var(--acento);
    }

    &--agotada {
      cursor: not-allowed;
      color: var(--texto-gris);
      border-color: var(--linea-suave);
      background: repeating-linear-gradient(-45deg, transparent 0 6px, color-mix(in srgb, var(--linea-suave) 45%, transparent) 6px 7px);

      &:hover {
        transform: none;
      }

      .tallas__nombre {
        text-decoration: line-through;
      }
    }
  }

  &__nombre {
    font-family: $fuente-display;
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
  }

  &__existencias {
    font-family: $fuente-mono;
    font-size: 0.6rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--texto-suave);
  }
}
</style>
