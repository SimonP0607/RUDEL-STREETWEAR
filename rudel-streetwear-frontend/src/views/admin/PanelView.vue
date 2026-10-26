<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useSesion } from '@/composables/useSesion'

const sesion = useSesion()
const router = useRouter()

async function salir() {
  await sesion.cerrarSesion()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="panel">
    <header class="panel__barra">
      <div class="contenedor panel__fila">
        <div class="panel__marca">
          <span class="panel__logo">RUDEL</span>
          <span class="panel__zona">Trastienda</span>
        </div>

        <nav class="panel__nav" aria-label="Secciones del panel">
          <RouterLink :to="{ name: 'admin-productos' }" class="panel__enlace">Productos</RouterLink>
          <RouterLink :to="{ name: 'admin-categorias' }" class="panel__enlace">Categorías</RouterLink>
        </nav>

        <div class="panel__sesion">
          <span class="panel__usuario">{{ sesion.administrador.value?.nombre ?? 'Administrador' }}</span>
          <RouterLink to="/" class="boton boton--fantasma boton--pequeno">Ver tienda</RouterLink>
          <button type="button" class="boton boton--pequeno" @click="salir">Cerrar sesión</button>
        </div>
      </div>
    </header>

    <main class="contenedor panel__contenido">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.panel {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;

  &__barra {
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--fondo);
    border-bottom: $borde solid var(--linea);
  }

  &__fila {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem 2rem;
    min-height: 4.2rem;
    padding-block: 0.6rem;
  }

  &__marca {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }

  &__logo {
    font-family: $fuente-display;
    font-size: 2.1rem;
    font-weight: 900;
    line-height: 1;
  }

  &__zona {
    @include etiqueta-texto(0.66rem);
    padding: 0.15rem 0.45rem;
    background: var(--acento);
    color: var(--sobre-acento);
    border-radius: $radio;
  }

  &__nav {
    display: flex;
    gap: 1.2rem;
  }

  &__enlace {
    @include etiqueta-texto(0.74rem);
    padding-bottom: 0.2rem;
    border-bottom: 1.5px solid transparent;

    &:hover,
    &.router-link-active {
      border-color: var(--acento);
    }
  }

  &__sesion {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-left: auto;
  }

  &__usuario {
    @include etiqueta-texto(0.64rem);
    color: var(--texto-suave);

    @include hasta($movil) {
      display: none;
    }
  }

  &__contenido {
    flex: 1;
    padding-block: 2rem 3rem;
  }
}
</style>
