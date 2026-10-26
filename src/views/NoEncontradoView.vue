<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="contenedor estado">
    <p class="estado__titulo">404 · Esta página no existe</p>
    <p>Revisa la dirección o vuelve al catálogo.</p>
    <p class="volver"><RouterLink to="/" class="boton boton--acento">Ir al catálogo</RouterLink></p>
  </div>
</template>

<style lang="scss" scoped>
.volver {
  margin-top: 1.4rem;
}
</style>
