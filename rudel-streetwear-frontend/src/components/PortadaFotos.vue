<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const fotos = [
  { src: '/productos/portada-rudel.webp', alt: 'Modelos con las camisetas Acid Wash de RUDEL', pie: 'Drop Acid Wash' },
  { src: '/productos/hope-frente.webp', alt: 'Modelo con la camiseta Hope', pie: 'Hope' },
  { src: '/productos/god-made-frente.webp', alt: 'Modelo con la camiseta God Made', pie: 'God Made' },
  { src: '/productos/paradise-frente.webp', alt: 'Modelo con la camiseta Paradise', pie: 'Paradise' },
  { src: '/productos/croptop-rosado-frente.webp', alt: 'Modelo con el croptop oversize', pie: 'Croptop' },
]

const activa = ref(0)
const previa = ref(-1)
const pausada = ref(false)
let temporizador: number | undefined

const pie = computed(() => fotos[activa.value]?.pie ?? '')

function ir(indice: number) {
  if (indice === activa.value) return
  previa.value = activa.value
  activa.value = indice
}

function iniciar() {
  detener()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  temporizador = window.setInterval(() => {
    if (!pausada.value) ir((activa.value + 1) % fotos.length)
  }, 4200)
}

function detener() {
  if (temporizador !== undefined) window.clearInterval(temporizador)
}

onMounted(iniciar)
onBeforeUnmount(detener)
</script>

<template>
  <figure
    class="fotos"
    @pointerenter="pausada = true"
    @pointerleave="pausada = false"
    @focusin="pausada = true"
    @focusout="pausada = false"
  >
    <div class="fotos__marco">
      <img
        v-for="(foto, i) in fotos"
        :key="foto.src"
        class="fotos__imagen"
        :class="{ 'fotos__imagen--activa': i === activa, 'fotos__imagen--previa': i === previa }"
        :src="foto.src"
        :alt="foto.alt"
        width="800"
        height="1000"
        :fetchpriority="i === 0 ? 'high' : 'auto'"
        :loading="i === 0 ? 'eager' : 'lazy'"
        decoding="async"
      />
    </div>

    <figcaption class="fotos__pie">{{ pie }}</figcaption>

    <div class="fotos__puntos" role="group" aria-label="Elegir foto">
      <button
        v-for="(foto, i) in fotos"
        :key="foto.src"
        type="button"
        class="fotos__punto"
        :class="{ 'fotos__punto--activo': i === activa }"
        :aria-label="`Ver foto: ${foto.pie}`"
        :aria-current="i === activa"
        @click="ir(i)"
      />
    </div>

    <svg class="fotos__sello" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id="circulo-sello" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <circle cx="60" cy="60" r="58" class="fotos__sello-fondo" />
      <text class="fotos__sello-texto">
        <textPath href="#circulo-sello">RUDEL · STREETWEAR · RUDEL · STREETWEAR ·</textPath>
      </text>
      <path class="fotos__sello-flecha" d="M44 60h32M64 48l12 12-12 12" />
    </svg>
  </figure>
</template>

<style lang="scss" scoped>
.fotos {
  position: relative;
  margin: 0;

  &__marco {
    @include borde;
    position: relative;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: $radio;
    background: var(--superficie-2);
    box-shadow: $sombra-tag;
  }

  &__imagen {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    clip-path: inset(100% 0 0 0);
    z-index: 0;
    transition: clip-path 0.9s cubic-bezier(0.7, 0, 0.2, 1);

    &--previa {
      clip-path: inset(0);
      z-index: 1;
    }

    &--activa {
      clip-path: inset(0);
      z-index: 2;
    }
  }

  &__pie {
    @include etiqueta-texto(0.66rem);
    position: absolute;
    left: -0.6rem;
    bottom: 1.1rem;
    z-index: 3;
    padding: 0.4rem 0.75rem;
    background: var(--acento);
    border: 1px solid var(--linea);
    border-radius: $radio;
    color: var(--sobre-acento);
    transform: rotate(-2deg);
  }

  &__puntos {
    position: absolute;
    right: 0.9rem;
    bottom: 1rem;
    z-index: 3;
    display: flex;
    gap: 0.35rem;
  }

  &__punto {
    width: 0.7rem;
    height: 0.7rem;
    padding: 0;
    background: var(--superficie);
    border: 1px solid var(--linea);
    border-radius: 50%;
    cursor: pointer;
    transition:
      transform $transicion,
      background $transicion;

    @include foco;

    &:hover {
      transform: scale(1.25);
    }

    &--activo {
      background: var(--acento);
      transform: scale(1.35);
    }
  }

  &__sello {
    position: absolute;
    top: -2.2rem;
    left: -2.4rem;
    z-index: 4;
    width: 6.4rem;
    height: 6.4rem;
    animation: girar 16s linear infinite;

    @include hasta($tableta) {
      top: -1.6rem;
      left: auto;
      right: -0.4rem;
      width: 5rem;
      height: 5rem;
    }
  }

  &__sello-fondo {
    fill: var(--acento);
    stroke: var(--linea);
    stroke-width: 1.5;
  }

  &__sello-texto {
    font-family: $fuente-mono;
    font-size: 10.4px;
    font-weight: 700;
    letter-spacing: 0.1em;
    fill: var(--sobre-acento);
  }

  &__sello-flecha {
    fill: none;
    stroke: var(--sobre-acento);
    stroke-width: 4;
    stroke-linecap: square;
    transform-origin: 60px 60px;
    animation: girar 16s linear infinite reverse;
  }
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
