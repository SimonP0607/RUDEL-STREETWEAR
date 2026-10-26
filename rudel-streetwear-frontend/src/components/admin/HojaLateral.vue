<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'

const props = defineProps<{ abierta: boolean; titulo: string }>()
const emit = defineEmits<{ cerrar: [] }>()

function cerrarConEscape(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && props.abierta) emit('cerrar')
}

onMounted(() => window.addEventListener('keydown', cerrarConEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', cerrarConEscape))

watch(
  () => props.abierta,
  (abierta) => {
    document.body.style.overflow = abierta ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="hoja">
      <div v-if="abierta" class="hoja">
        <div class="hoja__fondo" @click="emit('cerrar')" />
        <section class="hoja__panel tema-oscuro" role="dialog" aria-modal="true" :aria-label="titulo">
          <header class="hoja__cabecera">
            <h2 class="hoja__titulo">{{ titulo }}</h2>
            <button type="button" class="hoja__cerrar" aria-label="Cerrar" @click="emit('cerrar')">✕</button>
          </header>
          <div class="hoja__cuerpo">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.hoja {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;

  &__fondo {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
  }

  &__panel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(100%, 34rem);
    height: 100%;
    background: var(--superficie);
    color: var(--texto);
    border-left: $borde solid var(--linea);
    box-shadow: -14px 0 40px rgba(0, 0, 0, 0.4);
    overflow-y: auto;
  }

  &__cabecera {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.2rem 1.6rem;
    background: var(--superficie);
    border-bottom: $borde solid var(--linea);
  }

  &__titulo {
    @include display(1.8rem, 4vw, 2.4rem, 800);
  }

  &__cerrar {
    @include borde;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 50%;
    transition:
      background $transicion,
      color $transicion;

    &:hover {
      background: var(--texto);
      color: var(--fondo);
    }
  }

  &__cuerpo {
    padding: 1.6rem;
  }
}

.hoja-enter-active,
.hoja-leave-active {
  transition: opacity 0.22s ease;

  .hoja__panel {
    transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
}

.hoja-enter-from,
.hoja-leave-to {
  opacity: 0;

  .hoja__panel {
    transform: translateX(100%);
  }
}
</style>
