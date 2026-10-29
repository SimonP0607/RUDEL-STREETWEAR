<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useCarrito } from '@/composables/useCarrito'
import { useCliente } from '@/composables/useCliente'

const carrito = useCarrito()
const cliente = useCliente()
const router = useRouter()
const ruta = useRoute()

async function abrirCarrito() {
  if (await cliente.verificar()) carrito.abrir()
  else router.push({ name: 'cuenta', query: { volver: ruta.fullPath, motivo: 'carrito' } })
}

async function salir() {
  await cliente.cerrarSesion()
  if (ruta.meta.requiereCliente) router.replace('/')
}
</script>

<template>
  <header class="cabecera">
    <div class="contenedor cabecera__fila">
      <RouterLink to="/" class="cabecera__marca" aria-label="RUDEL Streetwear, ir al catálogo">
        <span class="cabecera__logo">RUDEL</span>
        <span class="cabecera__sub">Streetwear</span>
      </RouterLink>

      <nav class="cabecera__nav" aria-label="Navegación principal">
        <RouterLink to="/" class="cabecera__enlace">Catálogo</RouterLink>
        <template v-if="cliente.haySesion.value">
          <RouterLink to="/favoritos" class="cabecera__enlace">
            Favoritos<span class="cabecera__cuenta-num">{{ cliente.totalFavoritos.value }}</span>
          </RouterLink>
          <span class="cabecera__usuario" :title="cliente.cliente.value?.correo">{{ cliente.cliente.value?.nombre.split(' ')[0] }}</span>
          <button type="button" class="cabecera__enlace cabecera__salir" @click="salir">Salir</button>
        </template>
        <RouterLink v-else to="/cuenta" class="cabecera__enlace">Ingresar</RouterLink>
        <button
          type="button"
          class="cabecera__carrito"
          :class="{ 'cabecera__carrito--lleno': carrito.cantidadTotal.value > 0 }"
          aria-haspopup="dialog"
          :aria-expanded="carrito.abierto.value"
          @click="abrirCarrito"
        >
          <span>Carrito</span>
          <span class="cabecera__contador" aria-live="polite">{{ carrito.cantidadTotal.value }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.cabecera {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--fondo);
  border-bottom: $borde solid var(--linea);

  &__fila {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 4.2rem;
  }

  &__marca {
    display: flex;
    align-items: baseline;
    gap: 0.55rem;
    line-height: 1;
  }

  &__logo {
    font-family: $fuente-display;
    font-size: 2.35rem;
    font-weight: 900;
    letter-spacing: 0.02em;
    transition: font-variation-settings 0.5s ease;
    font-variation-settings: 'wght' 900;

    .cabecera__marca:hover & {
      font-variation-settings: 'wght' 300;
    }
  }

  &__sub {
    @include etiqueta-texto(0.66rem);
    color: var(--texto-suave);

    @include hasta($movil) {
      display: none;
    }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 1.25rem;

    @include hasta($movil) {
      gap: 0.8rem;
    }
  }

  &__enlace {
    @include etiqueta-texto(0.74rem);
    padding-bottom: 0.15rem;
    border-bottom: 1.5px solid transparent;

    &:hover,
    &.router-link-exact-active {
      border-color: var(--texto);
    }
  }

  &__cuenta-num {
    margin-left: 0.4rem;
    font-family: $fuente-mono;
    font-size: 0.7rem;
    opacity: 0.7;
  }

  &__usuario {
    @include etiqueta-texto(0.72rem);
    max-width: 8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--texto-suave);

    @include hasta($movil) {
      display: none;
    }
  }

  &__salir {
    background: none;
    border-top: 0;
    border-inline: 0;
    color: inherit;
  }

  &__carrito {
    @include etiqueta-texto(0.74rem);
    @include borde;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.9rem;
    background: var(--superficie);
    border-radius: $radio;
    transition:
      background $transicion,
      color $transicion;

    &:hover {
      background: var(--texto);
      color: var(--fondo);
    }

    &--lleno {
      background: var(--acento);
    }
  }

  &__contador {
    display: inline-grid;
    place-items: center;
    min-width: 1.4rem;
    height: 1.4rem;
    padding-inline: 0.3rem;
    border-radius: 999px;
    background: var(--texto);
    color: var(--fondo);
    font-family: $fuente-mono;
    font-size: 0.7rem;
    letter-spacing: 0;

    .cabecera__carrito:hover & {
      background: var(--acento);
      color: var(--sobre-acento);
    }
  }
}
</style>
