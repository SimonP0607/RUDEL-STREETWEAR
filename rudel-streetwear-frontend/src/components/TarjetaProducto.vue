<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Producto } from '@/types'
import { formatoPrecio } from '@/utils/formato'
import ArteProducto from '@/components/ArteProducto.vue'

const props = defineProps<{
  producto: Producto
  categoriaNombre: string
  indice?: number
}>()

const giro = computed(() => {
  const i = props.indice ?? 0
  return `${(((i * 7) % 5) - 2) * 0.9}deg`
})

const imagenFallida = ref(false)

const agotado = computed(() => props.producto.tallas.every((t) => t.existencias <= 0))
</script>

<template>
  <article class="etiqueta" :style="{ '--giro': giro }">
    <span class="etiqueta__cordon" aria-hidden="true" />
    <RouterLink :to="{ name: 'producto', params: { id: producto._id } }" class="etiqueta__cuerpo">
      <span class="etiqueta__ojal" aria-hidden="true" />
      <span v-if="producto.destacado" class="etiqueta__sello">Destacado</span>
      <span v-else-if="agotado" class="etiqueta__sello etiqueta__sello--agotado">Agotado</span>

      <div class="etiqueta__arte">
        <img
          v-if="producto.imagenUrl && !imagenFallida"
          :src="producto.imagenUrl"
          :alt="producto.nombre"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="imagenFallida = true"
        />
        <ArteProducto v-else :categoria-nombre="categoriaNombre" :color="producto.color" :nombre="producto.nombre" />
      </div>

      <div class="etiqueta__datos">
        <p class="etiqueta__categoria">{{ categoriaNombre }} · {{ producto.color }}</p>
        <h3 class="etiqueta__nombre">{{ producto.nombre }}</h3>
        <div class="etiqueta__pie">
          <p class="etiqueta__precio">{{ formatoPrecio(producto.precio) }}</p>
          <ul class="etiqueta__tallas" aria-label="Tallas">
            <li
              v-for="t in producto.tallas"
              :key="t.talla"
              class="etiqueta__talla"
              :class="{ 'etiqueta__talla--agotada': t.existencias <= 0 }"
            >
              {{ t.talla }}
            </li>
          </ul>
        </div>
      </div>
    </RouterLink>
  </article>
</template>

<style lang="scss" scoped>
.etiqueta {
  position: relative;
  padding-top: 1.6rem;
  transform: rotate(var(--giro));
  transform-origin: 50% 0;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover,
  &:focus-within {
    transform: rotate(0deg) translateY(-6px);
    z-index: 2;
  }

  &__cordon {
    position: absolute;
    top: 0;
    left: 50%;
    width: 1.5px;
    height: 2.4rem;
    background: var(--linea);
    transform: translateX(-50%);
  }

  &__cuerpo {
    @include borde;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--superficie);
    border-radius: $radio;
    box-shadow: $sombra-tag;
    transition: box-shadow 0.3s ease;

    .etiqueta:hover & {
      box-shadow: 10px 14px 0 rgba(18, 18, 18, 0.16);
    }
  }

  &__ojal {
    position: absolute;
    top: 0.55rem;
    left: 50%;
    width: 0.8rem;
    height: 0.8rem;
    border: $borde solid var(--linea);
    border-radius: 50%;
    background: var(--fondo);
    transform: translateX(-50%);
  }

  &__sello {
    @include etiqueta-texto(0.6rem);
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.2rem 0.5rem;
    background: var(--acento);
    border: 1px solid var(--linea);
    border-radius: $radio;
    transform: rotate(3deg);

    &--agotado {
      background: var(--superficie-2);
      color: var(--texto-suave);
    }
  }

  &__arte {
    aspect-ratio: 1 / 1;
    padding: 1.6rem 1.4rem 0.4rem;
    border-bottom: 1px dashed var(--linea-suave);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: $radio;
    }
  }

  &__datos {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.85rem 1rem 1rem;
  }

  &__categoria {
    @include etiqueta-texto(0.62rem);
    color: var(--texto-suave);
  }

  &__nombre {
    font-size: 1.55rem;
    font-weight: 800;
  }

  &__pie {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.6rem;
    margin-top: 0.35rem;

    @include hasta($movil) {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.4rem;
    }
  }

  &__precio {
    font-family: $fuente-mono;
    font-size: 0.92rem;
    font-weight: 700;
  }

  &__tallas {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.2rem;

    @include hasta($movil) {
      justify-content: flex-start;
    }
  }

  &__talla {
    @include etiqueta-texto(0.58rem);
    padding: 0.1rem 0.32rem;
    border: 1px solid var(--linea);
    border-radius: $radio;

    &--agotada {
      color: var(--texto-gris);
      border-color: var(--linea-suave);
      text-decoration: line-through;
    }
  }
}
</style>
