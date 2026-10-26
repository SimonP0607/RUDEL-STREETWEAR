<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSesion } from '@/composables/useSesion'

const ruta = useRoute()
const router = useRouter()
const sesion = useSesion()

const usuario = ref('')
const contrasena = ref('')
const error = ref('')
const enviando = ref(false)
const sesionExpirada = computed(() => ruta.query.expirada === '1')

async function ingresar() {
  error.value = ''
  if (!usuario.value.trim() || !contrasena.value) {
    error.value = 'Escribe el usuario y la contraseña.'
    return
  }
  enviando.value = true
  try {
    await sesion.iniciarSesion(usuario.value, contrasena.value)
    const destino = typeof ruta.query.volver === 'string' ? ruta.query.volver : ''
    const volver = destino.startsWith('/admin') ? destino : '/admin'
    router.replace(volver)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo iniciar sesión'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="acceso">
    <div class="acceso__marco">
      <p class="acceso__marca">RUDEL Streetwear</p>
      <h1 class="acceso__titulo">Trastienda</h1>
      <p class="acceso__sub">Acceso del administrador</p>

      <form class="acceso__formulario" novalidate @submit.prevent="ingresar">
        <div class="campo">
          <label for="usuario" class="campo__etiqueta">Usuario</label>
          <input id="usuario" v-model="usuario" type="text" class="campo__control" autocomplete="username" required />
        </div>
        <div class="campo">
          <label for="contrasena" class="campo__etiqueta">Contraseña</label>
          <input
            id="contrasena"
            v-model="contrasena"
            type="password"
            class="campo__control"
            autocomplete="current-password"
            required
          />
        </div>
        <p v-if="sesionExpirada && !error" class="mensaje" role="status">Tu sesión terminó. Ingresa de nuevo.</p>
        <p v-if="error" class="mensaje mensaje--error" role="alert">{{ error }}</p>
        <button type="submit" class="boton boton--acento boton--bloque" :disabled="enviando">
          {{ enviando ? 'Verificando…' : 'Ingresar' }}
        </button>
      </form>

      <RouterLink to="/" class="enlace-texto acceso__volver">← Volver a la tienda</RouterLink>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.acceso {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background:
    radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--acento) 14%, transparent), transparent 40%),
    var(--fondo);

  &__marco {
    @include borde;
    width: min(100%, 26rem);
    padding: 2.2rem 2rem 1.8rem;
    background: var(--superficie);
    border-radius: $radio;
    box-shadow: 8px 10px 0 color-mix(in srgb, var(--acento) 55%, transparent);
  }

  &__marca {
    @include etiqueta-texto(0.68rem);
    color: var(--texto-suave);
  }

  &__titulo {
    @include display(3.2rem, 8vw, 4.4rem, 900);
    margin-top: 0.4rem;
    color: var(--acento);
  }

  &__sub {
    @include etiqueta-texto(0.68rem);
    margin-top: 0.4rem;
    color: var(--texto-suave);
  }

  &__formulario {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.8rem;
  }

  &__volver {
    display: inline-block;
    margin-top: 1.4rem;
  }
}
</style>
