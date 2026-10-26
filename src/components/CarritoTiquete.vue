<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useCarrito } from '@/composables/useCarrito'
import { formatoPrecio } from '@/utils/formato'

const carrito = useCarrito()
const panel = ref<HTMLElement | null>(null)

function cerrarConEscape(evento: KeyboardEvent) {
  if (evento.key === 'Escape') carrito.cerrar()
}

onMounted(() => window.addEventListener('keydown', cerrarConEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', cerrarConEscape))

watch(carrito.abierto, (abierto) => {
  document.body.style.overflow = abierto ? 'hidden' : ''
  if (abierto) requestAnimationFrame(() => panel.value?.focus())
})
</script>

<template>
  <Teleport to="body">
    <Transition name="tiquete">
      <div v-if="carrito.abierto.value" class="tiquete">
        <div class="tiquete__fondo" @click="carrito.cerrar()" />

        <section
          ref="panel"
          class="tiquete__papel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tiquete-titulo"
          tabindex="-1"
        >
          <header class="tiquete__cabecera">
            <p class="tiquete__marca">RUDEL Streetwear</p>
            <h2 id="tiquete-titulo" class="tiquete__titulo">Tiquete de compra</h2>
            <p class="tiquete__linea">{{ carrito.cantidadTotal.value }} prenda(s) · sin pago en línea</p>
            <button type="button" class="tiquete__cerrar" aria-label="Cerrar el carrito" @click="carrito.cerrar()">
              ✕
            </button>
          </header>

          <div v-if="carrito.items.value.length === 0" class="tiquete__vacio">
            <p class="tiquete__vacio-titulo">Tu tiquete está en blanco</p>
            <p>Agrega prendas desde el catálogo para armar tu compra.</p>
            <RouterLink to="/" class="boton boton--acento" @click="carrito.cerrar()">Ir al catálogo</RouterLink>
          </div>

          <ul v-else class="tiquete__items">
            <li v-for="item in carrito.items.value" :key="`${item.productoId}-${item.talla}`" class="item">
              <div class="item__fila">
                <p class="item__nombre">{{ item.nombre }}</p>
                <p class="item__subtotal">{{ formatoPrecio(carrito.subtotal(item)) }}</p>
              </div>
              <div class="item__fila item__fila--detalle">
                <p class="item__detalle">Talla {{ item.talla }} · {{ formatoPrecio(item.precioUnitario) }} c/u</p>
              </div>
              <div class="item__fila item__fila--controles">
                <div class="cantidad" role="group" :aria-label="`Cantidad de ${item.nombre} talla ${item.talla}`">
                  <button
                    type="button"
                    class="cantidad__boton"
                    :disabled="item.cantidad <= 1"
                    aria-label="Disminuir cantidad"
                    @click="carrito.cambiarCantidad(item.productoId, item.talla, item.cantidad - 1)"
                  >
                    −
                  </button>
                  <span class="cantidad__valor" aria-live="polite">{{ item.cantidad }}</span>
                  <button
                    type="button"
                    class="cantidad__boton"
                    :disabled="item.cantidad >= item.existenciasDisponibles"
                    aria-label="Aumentar cantidad"
                    @click="carrito.cambiarCantidad(item.productoId, item.talla, item.cantidad + 1)"
                  >
                    +
                  </button>
                  <span v-if="item.cantidad >= item.existenciasDisponibles" class="cantidad__limite">máx.</span>
                </div>
                <button type="button" class="item__quitar" @click="carrito.quitar(item.productoId, item.talla)">
                  Quitar
                </button>
              </div>
            </li>
          </ul>

          <footer v-if="carrito.items.value.length > 0" class="tiquete__pie">
            <div class="tiquete__total">
              <span>Total</span>
              <span>{{ formatoPrecio(carrito.total.value) }}</span>
            </div>
            <p class="tiquete__nota">El total se recalcula con cada cambio. El pago y la entrega no hacen parte de esta versión.</p>
            <div class="tiquete__barras" aria-hidden="true" />
            <p class="tiquete__gracias">*** Gracias por pasar por RUDEL ***</p>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.tiquete {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;

  &__fondo {
    position: absolute;
    inset: 0;
    background: rgba(18, 18, 18, 0.45);
  }

  &__papel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(100%, 25rem);
    height: calc(100% - 2rem);
    margin: 1rem 1rem 1rem 0;
    padding: 2.2rem 1.5rem 2.6rem;
    overflow-y: auto;
    background: var(--superficie);
    color: var(--texto);
    font-family: $fuente-mono;
    font-size: 0.82rem;
    box-shadow: -14px 0 40px rgba(0, 0, 0, 0.25);
    clip-path: polygon(
      0 0.6rem, 4% 0, 8% 0.6rem, 12% 0, 16% 0.6rem, 20% 0, 24% 0.6rem, 28% 0, 32% 0.6rem, 36% 0, 40% 0.6rem, 44% 0,
      48% 0.6rem, 52% 0, 56% 0.6rem, 60% 0, 64% 0.6rem, 68% 0, 72% 0.6rem, 76% 0, 80% 0.6rem, 84% 0, 88% 0.6rem,
      92% 0, 96% 0.6rem, 100% 0, 100% 100%, 96% calc(100% - 0.6rem), 92% 100%, 88% calc(100% - 0.6rem), 84% 100%,
      80% calc(100% - 0.6rem), 76% 100%, 72% calc(100% - 0.6rem), 68% 100%, 64% calc(100% - 0.6rem), 60% 100%,
      56% calc(100% - 0.6rem), 52% 100%, 48% calc(100% - 0.6rem), 44% 100%, 40% calc(100% - 0.6rem), 36% 100%,
      32% calc(100% - 0.6rem), 28% 100%, 24% calc(100% - 0.6rem), 20% 100%, 16% calc(100% - 0.6rem), 12% 100%,
      8% calc(100% - 0.6rem), 4% 100%, 0 calc(100% - 0.6rem)
    );

    @include hasta($movil) {
      margin: 0;
      height: 100%;
      width: 100%;
    }
  }

  &__cabecera {
    position: relative;
    padding: 0 2.4rem 1rem;
    margin-bottom: 1rem;
    border-bottom: 1.5px dashed var(--linea);
    text-align: center;
  }

  &__marca {
    @include etiqueta-texto(0.7rem);
  }

  &__titulo {
    font-family: $fuente-display;
    font-size: clamp(1.8rem, 9vw, 2.4rem);
    font-weight: 900;
    margin-top: 0.2rem;
  }

  &__linea {
    @include etiqueta-texto(0.62rem);
    color: var(--texto-suave);
    margin-top: 0.3rem;
  }

  &__cerrar {
    position: absolute;
    top: -0.4rem;
    right: 0;
    width: 2.2rem;
    height: 2.2rem;
    border: $borde solid var(--linea);
    border-radius: 50%;
    font-size: 0.9rem;
    transition:
      background $transicion,
      color $transicion;

    &:hover {
      background: var(--texto);
      color: var(--fondo);
    }
  }

  &__vacio {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 2.5rem 0.5rem;
    text-align: center;
    color: var(--texto-suave);
  }

  &__vacio-titulo {
    font-family: $fuente-display;
    font-size: 2rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--texto);
  }

  &__items {
    display: flex;
    flex-direction: column;
  }

  &__pie {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1.5px dashed var(--linea);
  }

  &__total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: $fuente-display;
    font-size: 2rem;
    font-weight: 900;
    text-transform: uppercase;
    padding-block: 0.4rem;
    border-bottom: 3px double var(--linea);
  }

  &__nota {
    margin-top: 0.7rem;
    font-size: 0.7rem;
    color: var(--texto-suave);
  }

  &__barras {
    height: 2.6rem;
    margin-top: 1.1rem;
    background: repeating-linear-gradient(
      90deg,
      var(--linea) 0 2px,
      transparent 2px 5px,
      var(--linea) 5px 6px,
      transparent 6px 10px,
      var(--linea) 10px 13px,
      transparent 13px 15px
    );
  }

  &__gracias {
    @include etiqueta-texto(0.62rem);
    margin-top: 0.6rem;
    text-align: center;
  }

}

.item {
  padding: 0.8rem 0;
  border-bottom: 1px dotted var(--linea-suave);

  &__fila {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.8rem;

    &--detalle {
      margin-top: 0.15rem;
    }

    &--controles {
      align-items: center;
      margin-top: 0.6rem;
    }
  }

  &__nombre {
    font-weight: 700;
    text-transform: uppercase;
  }

  &__subtotal {
    font-weight: 700;
    white-space: nowrap;
  }

  &__detalle {
    color: var(--texto-suave);
    font-size: 0.72rem;
  }

  &__quitar {
    @include etiqueta-texto(0.62rem);
    border-bottom: 1px solid currentColor;
    color: var(--texto-suave);

    &:hover {
      color: var(--alerta);
    }
  }
}

.cantidad {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;

  &__boton {
    @include borde;
    width: 1.9rem;
    height: 1.9rem;
    display: grid;
    place-items: center;
    background: var(--superficie);
    border-radius: $radio;
    font-size: 1rem;
    line-height: 1;
    transition:
      background $transicion,
      color $transicion;

    &:hover:not(:disabled) {
      background: var(--texto);
      color: var(--fondo);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__valor {
    min-width: 2rem;
    text-align: center;
    font-weight: 700;
  }

  &__limite {
    @include etiqueta-texto(0.56rem);
    margin-left: 0.3rem;
    color: var(--texto-gris);
  }
}

.tiquete-enter-active,
.tiquete-leave-active {
  transition: opacity 0.25s ease;

  .tiquete__papel {
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
}

.tiquete-enter-from,
.tiquete-leave-to {
  opacity: 0;

  .tiquete__papel {
    transform: translateX(105%);
  }
}
</style>
