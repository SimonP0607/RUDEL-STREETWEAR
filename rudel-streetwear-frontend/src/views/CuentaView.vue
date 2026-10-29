<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCliente } from '@/composables/useCliente'

const ruta = useRoute()
const router = useRouter()
const cliente = useCliente()

const modo = ref<'ingresar' | 'registro'>(ruta.query.modo === 'registro' ? 'registro' : 'ingresar')
const nombre = ref('')
const correo = ref('')
const contrasena = ref('')
const error = ref('')
const enviando = ref(false)

const motivo = computed(() => {
  if (ruta.query.motivo === 'carrito') return 'Inicia sesión para guardar tu carrito y armar tu compra.'
  if (ruta.query.motivo === 'favoritos') return 'Inicia sesión para guardar tus favoritos.'
  if (ruta.query.expirada === '1') return 'Tu sesión terminó. Ingresa de nuevo.'
  return ''
})

watch(modo, () => {
  error.value = ''
})

function destino() {
  const volver = ruta.query.volver
  return typeof volver === 'string' && volver.startsWith('/') && !volver.startsWith('//') && !volver.startsWith('/admin')
    ? volver
    : '/'
}

async function enviar() {
  error.value = ''
  if (!correo.value.trim() || !contrasena.value || (modo.value === 'registro' && !nombre.value.trim())) {
    error.value = modo.value === 'registro' ? 'Completa tu nombre, correo y contraseña.' : 'Escribe tu correo y tu contraseña.'
    return
  }
  if (modo.value === 'registro' && contrasena.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }
  enviando.value = true
  try {
    if (modo.value === 'registro') await cliente.registrar(nombre.value, correo.value, contrasena.value)
    else await cliente.iniciarSesion(correo.value, contrasena.value)
    router.replace(destino())
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo continuar'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="contenedor cuenta">
    <div class="cuenta__marco">
      <p class="cuenta__marca">RUDEL Streetwear</p>
      <h1 class="cuenta__titulo">{{ modo === 'registro' ? 'Crea tu cuenta' : 'Tu cuenta' }}</h1>

      <div class="cuenta__pestanas" role="tablist" aria-label="Acceso a la cuenta">
        <button
          type="button"
          role="tab"
          class="cuenta__pestana"
          :class="{ 'cuenta__pestana--activa': modo === 'ingresar' }"
          :aria-selected="modo === 'ingresar'"
          @click="modo = 'ingresar'"
        >
          Ingresar
        </button>
        <button
          type="button"
          role="tab"
          class="cuenta__pestana"
          :class="{ 'cuenta__pestana--activa': modo === 'registro' }"
          :aria-selected="modo === 'registro'"
          @click="modo = 'registro'"
        >
          Crear cuenta
        </button>
      </div>

      <p v-if="motivo" class="mensaje" role="status">{{ motivo }}</p>

      <form class="cuenta__formulario" novalidate @submit.prevent="enviar">
        <div v-if="modo === 'registro'" class="campo">
          <label for="cuenta-nombre" class="campo__etiqueta">Nombre</label>
          <input id="cuenta-nombre" v-model="nombre" type="text" class="campo__control" autocomplete="name" maxlength="60" />
        </div>
        <div class="campo">
          <label for="cuenta-correo" class="campo__etiqueta">Correo</label>
          <input id="cuenta-correo" v-model="correo" type="email" class="campo__control" autocomplete="email" maxlength="120" />
        </div>
        <div class="campo">
          <label for="cuenta-contrasena" class="campo__etiqueta">Contraseña</label>
          <input
            id="cuenta-contrasena"
            v-model="contrasena"
            type="password"
            class="campo__control"
            :autocomplete="modo === 'registro' ? 'new-password' : 'current-password'"
            maxlength="72"
          />
          <p v-if="modo === 'registro'" class="cuenta__ayuda">Mínimo 8 caracteres.</p>
        </div>
        <p v-if="error" class="mensaje mensaje--error" role="alert">{{ error }}</p>
        <button type="submit" class="boton boton--acento boton--bloque" :disabled="enviando">
          {{ enviando ? 'Un momento…' : modo === 'registro' ? 'Crear cuenta' : 'Ingresar' }}
        </button>
      </form>

      <p class="cuenta__nota">Con tu cuenta guardas tu carrito y tus favoritos.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cuenta {
  display: grid;
  place-items: center;
  padding-block: 3.4rem 2rem;

  &__marco {
    @include borde;
    width: min(100%, 27rem);
    padding: 2.2rem 2rem 1.8rem;
    background: var(--superficie);
    border-radius: $radio;
    box-shadow: 8px 10px 0 color-mix(in srgb, var(--acento) 70%, transparent);
  }

  &__marca {
    @include etiqueta-texto(0.68rem);
    color: var(--texto-suave);
  }

  &__titulo {
    @include display(2.8rem, 8vw, 3.8rem, 900);
    margin-top: 0.4rem;
  }

  &__pestanas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block: 1.4rem 1rem;
    border: $borde solid var(--linea);
    border-radius: $radio;
    overflow: hidden;
  }

  &__pestana {
    @include etiqueta-texto(0.74rem);
    padding: 0.7rem 0.5rem;
    background: var(--superficie);
    transition:
      background $transicion,
      color $transicion;
    @include foco;

    &--activa {
      background: var(--texto);
      color: var(--fondo);
    }
  }

  &__formulario {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  &__ayuda {
    font-size: 0.82rem;
    color: var(--texto-suave);
  }

  &__nota {
    @include etiqueta-texto(0.64rem);
    margin-top: 1.4rem;
    color: var(--texto-suave);
  }
}
</style>
