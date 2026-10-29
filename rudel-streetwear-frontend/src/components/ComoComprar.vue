<script setup lang="ts">
import { vRevelar } from '@/directives/revelar'

const pasos = [
  { n: '01', titulo: 'Elige tu prenda', texto: 'Filtra por categoría y abre la que te guste para ver sus fotos y su precio.' },
  { n: '02', titulo: 'Escoge tu talla', texto: 'Cada talla muestra cuántas quedan. Si una está agotada, elige otra.' },
  { n: '03', titulo: 'Arma tu carrito', texto: 'Cambia cantidades o quita prendas y mira el total al instante en tu tiquete.' },
]

const tallas = ['XS', 'S', 'M', 'L', 'XL', 'Única']
</script>

<template>
  <section class="compra" aria-labelledby="compra-titulo">
    <div class="contenedor">
      <header class="compra__cabecera">
        <h2 id="compra-titulo" class="compra__titulo">Cómo comprar</h2>
        <p class="compra__nota">Sin registro, desde cualquier dispositivo</p>
      </header>

      <ol class="compra__pasos">
        <li v-for="(p, i) in pasos" :key="p.n" class="paso" v-revelar="i * 110">
          <span class="paso__numero" aria-hidden="true">{{ p.n }}</span>
          <h3 class="paso__titulo">{{ p.titulo }}</h3>
          <p class="paso__texto">{{ p.texto }}</p>
        </li>
      </ol>

      <div class="tallas-guia" v-revelar="0">
        <p class="tallas-guia__titulo">Tallas disponibles</p>
        <ul class="tallas-guia__lista">
          <li v-for="t in tallas" :key="t" class="tallas-guia__talla">{{ t }}</li>
        </ul>
        <p class="tallas-guia__nota">La talla se elige en cada prenda, junto a las existencias que quedan.</p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.compra {
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

    @include hasta($movil) {
      display: none;
    }
  }

  &__pasos {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.2rem;

    @include hasta($tableta) {
      grid-template-columns: 1fr;
    }
  }
}

.paso {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.4rem 1.4rem 1.6rem;
  background: var(--superficie);
  border: $borde solid var(--linea);
  border-radius: $radio;
  box-shadow: $sombra-tag;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -0.8rem;
    width: 1.4rem;
    height: 1.4rem;
    margin-top: -0.7rem;
    background: var(--fondo);
    border: $borde solid var(--linea);
    border-radius: 50%;

    @include hasta($tableta) {
      display: none;
    }
  }

  &:last-child::after {
    display: none;
  }

  &__numero {
    @include display(3.4rem, 6vw, 4.6rem, 900);
    width: fit-content;
    padding-inline: 0.12em;
    background: var(--acento);
    color: var(--sobre-acento);
  }

  &__titulo {
    @include display(1.5rem, 3vw, 2rem, 800);
  }

  &__texto {
    color: var(--texto-suave);
    line-height: 1.55;
  }
}

.tallas-guia {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem 1.6rem;
  margin-top: 1.6rem;
  padding: 1.1rem 1.4rem;
  border: $borde dashed var(--linea);
  border-radius: $radio;

  &__titulo {
    @include etiqueta-texto(0.72rem);
  }

  &__lista {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  &__talla {
    @include borde;
    min-width: 2.8rem;
    padding: 0.35rem 0.7rem;
    text-align: center;
    font-family: $fuente-display;
    font-size: 1.25rem;
    font-weight: 800;
    border-radius: $radio;
  }

  &__nota {
    flex: 1 1 18rem;
    font-size: 0.92rem;
    color: var(--texto-suave);
  }
}
</style>
