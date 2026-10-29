<script setup lang="ts">
import { vRevelar } from '@/directives/revelar'

defineProps<{ totalPrendas: number; totalCategorias: number }>()

const mensajes = ['Hope', 'God Made', 'You Can Do It', 'Freedom', 'Paradise']
</script>

<template>
  <section class="manifiesto tema-oscuro" aria-labelledby="manifiesto-titulo">
    <div class="contenedor manifiesto__fila">
      <div class="manifiesto__texto">
        <p class="manifiesto__etiqueta">Sobre RUDEL</p>
        <h2 id="manifiesto-titulo" class="manifiesto__titulo">
          Streetwear <span class="manifiesto__acento">con mensaje</span>
        </h2>
        <p class="manifiesto__parrafo">
          RUDEL es ropa urbana pensada para llevar una idea puesta: oversize, acid wash, croptops y esqueletos que
          se eligen por talla, de XS a XL, y se arman en un carrito sin crear cuenta.
        </p>

        <ul class="manifiesto__mensajes" aria-label="Estampados con mensaje">
          <li v-for="m in mensajes" :key="m" class="manifiesto__mensaje">{{ m }}</li>
        </ul>

        <dl class="manifiesto__datos">
          <div v-revelar="0">
            <dt>Prendas en catálogo</dt>
            <dd>{{ totalPrendas }}</dd>
          </div>
          <div v-revelar="100">
            <dt>Categorías</dt>
            <dd>{{ totalCategorias }}</dd>
          </div>
          <div v-revelar="200">
            <dt>Tallas</dt>
            <dd>XS–XL</dd>
          </div>
        </dl>
      </div>

      <figure class="manifiesto__foto" v-revelar="120">
        <img
          src="/productos/portada-rudel.webp"
          alt="Modelos con las camisetas Acid Wash de RUDEL"
          width="800"
          height="1000"
          loading="lazy"
          decoding="async"
        />
        <figcaption>Drop Acid Wash</figcaption>
      </figure>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.manifiesto {
  margin-top: 3rem;
  padding-block: 4.4rem;
  border-block: $borde solid var(--linea);
  overflow: hidden;

  &__fila {
    display: grid;
    grid-template-columns: 1.3fr minmax(15rem, 0.7fr);
    align-items: center;
    gap: 2.6rem 3.4rem;

    @include hasta($tableta) {
      grid-template-columns: 1fr;
    }
  }

  &__texto {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
  }

  &__etiqueta {
    @include etiqueta-texto(0.72rem);
    width: fit-content;
    padding: 0.25rem 0.6rem;
    background: var(--acento);
    color: var(--sobre-acento);
    border-radius: $radio;
  }

  &__titulo {
    @include display(3rem, 8vw, 6.4rem, 900);
  }

  &__acento {
    color: var(--acento);
  }

  &__parrafo {
    max-width: 38rem;
    font-size: 1.1rem;
    line-height: 1.6;
    color: var(--texto-suave);
  }

  &__mensajes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__mensaje {
    @include etiqueta-texto(0.72rem);
    padding: 0.35rem 0.8rem;
    border: $borde solid var(--linea-suave);
    border-radius: 999px;
  }

  &__datos {
    display: grid;
    grid-template-columns: repeat(3, auto);
    justify-content: start;
    gap: 1.2rem 2.6rem;
    margin: 0.6rem 0 0;
    padding-top: 1.4rem;
    border-top: 1px dashed var(--linea-suave);

    dt {
      @include etiqueta-texto(0.64rem);
      color: var(--texto-suave);
    }

    dd {
      margin: 0.25rem 0 0;
      font-family: $fuente-display;
      font-size: clamp(2rem, 5vw, 3.2rem);
      font-weight: 900;
      line-height: 1;
      color: var(--acento);
    }

    @include hasta($movil) {
      grid-template-columns: repeat(2, auto);
    }
  }

  &__foto {
    margin: 0;
    padding: 0.7rem 0.7rem 0.4rem;
    background: var(--niebla, #e8e6df);
    border-radius: $radio;
    transform: rotate(2deg);
    box-shadow: 10px 12px 0 rgba(215, 255, 61, 0.22);

    @include hasta($tableta) {
      max-width: 22rem;
      transform: rotate(1deg);
    }

    img {
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 5;
      object-fit: cover;
    }

    figcaption {
      @include etiqueta-texto(0.66rem);
      padding: 0.6rem 0.1rem 0.2rem;
      color: #121212;
    }
  }
}
</style>
