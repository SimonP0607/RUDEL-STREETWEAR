<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Producto } from '@/types'
import { clientesApi } from '@/services/clientes'
import { nombreCategoria } from '@/utils/categoria'
import { useCliente } from '@/composables/useCliente'
import TarjetaProducto from '@/components/TarjetaProducto.vue'

const cliente = useCliente()
const productos = ref<Producto[]>([])
const cargando = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    productos.value = await clientesApi.favoritos()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar tus favoritos'
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <div class="contenedor favoritos">
    <header class="favoritos__cabecera">
      <h1 class="favoritos__titulo">Mis favoritos</h1>
      <p class="favoritos__nota">{{ cliente.cliente.value?.nombre }}</p>
    </header>

    <p v-if="cargando" class="estado" role="status">Cargando tus favoritos…</p>
    <p v-else-if="error" class="mensaje mensaje--error">{{ error }}</p>
    <div v-else-if="productos.length === 0" class="estado">
      <p class="estado__titulo">Aún no tienes favoritos</p>
      <p>Toca el corazón de una prenda para guardarla aquí.</p>
      <RouterLink to="/" class="boton boton--acento favoritos__ir">Ir al catálogo</RouterLink>
    </div>
    <div v-else class="favoritos__rejilla">
      <TarjetaProducto
        v-for="(producto, i) in productos"
        :key="producto._id"
        :producto="producto"
        :categoria-nombre="nombreCategoria(producto)"
        :indice="i"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.favoritos {
  padding-block: 2.6rem 2rem;

  &__cabecera {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }

  &__titulo {
    @include display(2.4rem, 6vw, 4rem, 900);
  }

  &__nota {
    @include etiqueta-texto(0.68rem);
    color: var(--texto-suave);
  }

  &__ir {
    margin-top: 1.2rem;
  }

  &__rejilla {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr));
    gap: 1.8rem 1.4rem;
    padding-bottom: 2rem;

    @include hasta($movil) {
      grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
      gap: 1.4rem 0.9rem;
    }
  }
}
</style>
