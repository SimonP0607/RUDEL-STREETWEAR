<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SitioHeader from '@/components/SitioHeader.vue'
import SitioFooter from '@/components/SitioFooter.vue'
import CintaMarquee from '@/components/CintaMarquee.vue'
import CarritoTiquete from '@/components/CarritoTiquete.vue'

const ruta = useRoute()

const esZonaAdmin = computed(() => ruta.meta.zona === 'admin')
</script>

<template>
  <div class="app" :class="{ 'tema-oscuro': esZonaAdmin }">
    <template v-if="esZonaAdmin">
      <RouterView />
    </template>

    <template v-else>
      <SitioHeader />
      <CintaMarquee />
      <main id="contenido" class="app__contenido">
        <RouterView v-slot="{ Component }">
          <Transition name="vista" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
      <SitioFooter />
      <CarritoTiquete />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;

  &__contenido {
    flex: 1;
  }
}

.vista-enter-active,
.vista-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.vista-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.vista-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
