<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Categoria } from '@/types'
import { categoriasApi } from '@/services/categorias'

const props = defineProps<{ categoria: Categoria | null }>()
const emit = defineEmits<{ guardado: [categoria: Categoria]; cancelar: [] }>()

const datos = reactive({ nombre: '', descripcion: '' })
const errores = reactive<{ nombre?: string }>({})
const errorGeneral = ref('')
const enviando = ref(false)

watch(
  () => props.categoria,
  (categoria) => {
    datos.nombre = categoria?.nombre ?? ''
    datos.descripcion = categoria?.descripcion ?? ''
    errores.nombre = undefined
    errorGeneral.value = ''
  },
  { immediate: true },
)

function validar(): boolean {
  errores.nombre = datos.nombre.trim() ? undefined : 'El nombre es obligatorio.'
  return !errores.nombre
}

async function guardar() {
  if (!validar()) return
  enviando.value = true
  errorGeneral.value = ''
  try {
    const entrada = { nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim() }
    const guardada = props.categoria
      ? await categoriasApi.actualizar(props.categoria._id, entrada)
      : await categoriasApi.crear(entrada)
    emit('guardado', guardada)
  } catch (e) {
    errorGeneral.value = e instanceof Error ? e.message : 'No se pudo guardar la categoría'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <form class="formulario" novalidate @submit.prevent="guardar">
    <div class="campo">
      <label for="cat-nombre" class="campo__etiqueta">Nombre *</label>
      <input id="cat-nombre" v-model="datos.nombre" type="text" class="campo__control" maxlength="50" required />
      <p v-if="errores.nombre" class="formulario__error">{{ errores.nombre }}</p>
    </div>

    <div class="campo">
      <label for="cat-descripcion" class="campo__etiqueta">Descripción</label>
      <textarea id="cat-descripcion" v-model="datos.descripcion" class="campo__control" maxlength="300" />
      <p class="campo__ayuda">Se muestra en el catálogo como apoyo para el cliente.</p>
    </div>

    <p v-if="errorGeneral" class="mensaje mensaje--error" role="alert">{{ errorGeneral }}</p>

    <div class="formulario__acciones">
      <button type="button" class="boton boton--fantasma" @click="emit('cancelar')">Cancelar</button>
      <button type="submit" class="boton boton--acento" :disabled="enviando">
        {{ enviando ? 'Guardando…' : categoria ? 'Guardar cambios' : 'Crear categoría' }}
      </button>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  &__error {
    font-size: 0.8rem;
    color: var(--alerta);
  }

  &__acciones {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--linea-suave);
  }
}
</style>
