<script setup lang="ts">
const fotos = [
  'hope-frente',
  'acid-wash-gris-frente',
  'god-made-frente',
  'croptop-rosado-frente',
  'you-can-do-it-frente',
  'esqueleto-negro-frente',
  'freedom-frente',
  'paradise-frente',
  'acid-wash-carbon-frente',
]
const cinta = [...fotos, ...fotos]
</script>

<template>
  <div class="cinta-fotos" aria-hidden="true">
    <div class="cinta-fotos__pista">
      <img
        v-for="(foto, i) in cinta"
        :key="i"
        class="cinta-fotos__foto"
        :style="{ '--giro': `${((i % 4) - 1.5) * 1.6}deg` }"
        :src="`/productos/${foto}.webp`"
        alt=""
        width="800"
        height="1000"
        loading="lazy"
        decoding="async"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cinta-fotos {
  overflow: hidden;
  padding-block: 1.6rem;
  background: var(--texto);
  border-block: $borde solid var(--linea);

  &__pista {
    display: flex;
    gap: 1.1rem;
    width: max-content;
    animation: pasar 70s linear infinite;
  }

  &:hover &__pista {
    animation-play-state: paused;
  }

  &__foto {
    display: block;
    height: clamp(11rem, 22vw, 15rem);
    width: auto;
    aspect-ratio: 4 / 5;
    object-fit: cover;
    border: 4px solid var(--fondo);
    border-radius: $radio;
    transform: rotate(var(--giro));
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(0deg) scale(1.06);
    }
  }
}

@keyframes pasar {
  to {
    transform: translateX(calc(-50% - 0.55rem));
  }
}
</style>
