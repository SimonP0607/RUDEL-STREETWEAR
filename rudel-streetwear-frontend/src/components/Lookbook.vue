<script setup lang="ts">
import { vRevelar } from '@/directives/revelar'

const fotos = [
  { src: 'portada-rudel', pie: 'Drop Acid Wash', alt: 'Modelos con las camisetas Acid Wash de RUDEL' },
  { src: 'god-made-frente', pie: 'God Made', alt: 'Modelo con la camiseta God Made' },
  { src: 'paradise-detalle', pie: 'Paradise · detalle', alt: 'Detalle del estampado de la camiseta Paradise' },
  { src: 'croptop-rosado-frente', pie: 'Croptop', alt: 'Modelo con el croptop oversize' },
  { src: 'hope-frente', pie: 'Hope', alt: 'Modelo con la camiseta Hope' },
  { src: 'esqueleto-negro-frente', pie: 'Esqueleto', alt: 'Modelo con el esqueleto negro' },
  { src: 'freedom-alterna', pie: 'Freedom', alt: 'Modelo con la camiseta Freedom' },
]
</script>

<template>
  <section class="lookbook" aria-labelledby="lookbook-titulo">
    <div class="contenedor">
      <header class="lookbook__cabecera">
        <h2 id="lookbook-titulo" class="lookbook__titulo">Lookbook</h2>
        <p class="lookbook__nota">Así se ve el drop puesto</p>
      </header>

      <ul class="lookbook__mosaico">
        <li v-for="(f, i) in fotos" :key="f.src" class="lookbook__celda" :class="`lookbook__celda--${i + 1}`" v-revelar="(i % 3) * 90">
          <figure class="foto">
            <img
              class="foto__imagen"
              :src="`/productos/${f.src}.webp`"
              :alt="f.alt"
              width="800"
              height="1000"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="foto__pie">{{ f.pie }}</figcaption>
          </figure>
        </li>
      </ul>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.lookbook {
  padding-block: 4rem 1rem;

  &__cabecera {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }

  &__titulo {
    @include display(2rem, 4.5vw, 3.4rem, 800);
  }

  &__nota {
    @include etiqueta-texto(0.68rem);
    color: var(--texto-suave);
  }

  &__mosaico {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: clamp(11rem, 23vw, 19rem);
    gap: 0.9rem;

    @include hasta($movil) {
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 14rem;
      gap: 0.6rem;
    }
  }

  &__celda {
    min-height: 0;

    &--1 { grid-area: 1 / 1 / 3 / 3; }
    &--2 { grid-area: 1 / 3 / 2 / 4; }
    &--3 { grid-area: 1 / 4 / 3 / 5; }
    &--4 { grid-area: 2 / 3 / 3 / 4; }
    &--5 { grid-area: 3 / 1 / 4 / 2; }
    &--6 { grid-area: 3 / 2 / 4 / 3; }
    &--7 { grid-area: 3 / 3 / 4 / 5; }

    @include hasta($movil) {
      &--1,
      &--2,
      &--3,
      &--4,
      &--5,
      &--6,
      &--7 {
        grid-area: auto;
      }

      &--1 { grid-column: span 2; grid-row: span 2; }
      &--6,
      &--7 { grid-column: span 2; }
    }
  }
}

.foto {
  position: relative;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: var(--superficie-2);
  border: $borde solid var(--linea);
  border-radius: $radio;

  &__imagen {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  &__pie {
    @include etiqueta-texto(0.66rem);
    position: absolute;
    left: 0.6rem;
    bottom: 0.6rem;
    padding: 0.25rem 0.55rem;
    background: var(--acento);
    color: var(--sobre-acento);
    border-radius: $radio;
    transform: translateY(0.4rem);
    opacity: 0;
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;

    @media (hover: none) {
      opacity: 1;
      transform: none;
    }
  }

  &:hover &__imagen {
    transform: scale(1.06);
  }

  &:hover &__pie {
    opacity: 1;
    transform: none;
  }
}
</style>
