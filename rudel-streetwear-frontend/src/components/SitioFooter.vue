<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="pie">
    <div class="contenedor pie__fila">
      <p class="pie__marca">RUDEL Streetwear</p>
      <p class="pie__nota">Proyecto de aula · Desarrollo de Aplicaciones Web · 2026</p>
      <RouterLink to="/admin" class="enlace-texto">Panel de administración</RouterLink>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.pie {
  margin-top: 4rem;
  border-top: $borde solid var(--linea);
  background: var(--superficie-2);

  &__fila {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem 1.5rem;
    padding-block: 1.4rem;
  }

  &__marca {
    font-family: $fuente-display;
    font-weight: 900;
    font-size: 1.5rem;
    text-transform: uppercase;
  }

  &__nota {
    @include etiqueta-texto(0.66rem);
    color: var(--texto-suave);
  }
}
</style>
