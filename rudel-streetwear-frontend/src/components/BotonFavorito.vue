<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCliente } from '@/composables/useCliente'

const props = defineProps<{ productoId: string; nombre: string }>()

const cliente = useCliente()
const router = useRouter()
const ruta = useRoute()
const ocupado = ref(false)

async function alternar() {
  if (!(await cliente.verificar())) {
    router.push({ name: 'cuenta', query: { volver: ruta.fullPath, motivo: 'favoritos' } })
    return
  }
  if (ocupado.value) return
  ocupado.value = true
  try {
    await cliente.alternarFavorito(props.productoId)
  } finally {
    ocupado.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="favorito"
    :class="{ 'favorito--activo': cliente.esFavorito(productoId) }"
    :aria-pressed="cliente.esFavorito(productoId)"
    :aria-label="cliente.esFavorito(productoId) ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`"
    @click.stop.prevent="alternar"
  >
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 2.6 4.5 6.3 4.5c2.1 0 3.8 1.2 5.7 3.3 1.9-2.1 3.6-3.3 5.7-3.3 3.7 0 5.4 3.8 3.9 7.3C19.5 16.4 12 21 12 21z"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style lang="scss" scoped>
.favorito {
  @include borde;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  background: var(--superficie);
  color: var(--texto);
  border-radius: 50%;
  transition:
    background $transicion,
    color $transicion,
    transform $transicion;
  @include foco;

  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }

  &:hover {
    background: var(--acento);
    color: var(--sobre-acento);
    transform: scale(1.08);
  }

  &--activo {
    background: var(--texto);
    color: var(--acento);

    svg {
      fill: currentColor;
    }

    &:hover {
      background: var(--texto);
      color: var(--acento);
    }
  }
}
</style>
