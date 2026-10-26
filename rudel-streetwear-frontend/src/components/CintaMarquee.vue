<script setup lang="ts">
const frases = ['RUDEL Streetwear', 'Ropa urbana', 'Catálogo por categorías', 'Tallas XS a XL', 'Arma tu carrito']
const cinta = Array.from({ length: 3 }, () => frases).flat()
</script>

<template>
  <div class="cinta" aria-hidden="true">
    <div class="cinta__pista">
      <span v-for="(frase, i) in cinta" :key="i" class="cinta__item">{{ frase }}<i class="cinta__punto" /></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cinta {
  overflow: hidden;
  background: var(--acento);
  color: var(--sobre-acento);
  border-bottom: $borde solid var(--linea);

  &__pista {
    display: flex;
    width: max-content;
    animation: desplazar 32s linear infinite;
  }

  &__item {
    @include etiqueta-texto(0.7rem);
    display: inline-flex;
    align-items: center;
    padding: 0.42rem 0;
    white-space: nowrap;
  }

  &__punto {
    display: inline-block;
    width: 0.45rem;
    height: 0.45rem;
    margin-inline: 1.4rem;
    border-radius: 50%;
    background: currentColor;
  }
}

@keyframes desplazar {
  to {
    transform: translateX(-33.333%);
  }
}
</style>
