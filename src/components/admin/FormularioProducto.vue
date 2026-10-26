<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Categoria, Producto, ProductoEntrada } from '@/types'
import { TALLAS_VALIDAS } from '@/types'
import { productosApi } from '@/services/productos'
import { colorACss } from '@/utils/formato'

const props = defineProps<{ producto: Producto | null; categorias: Categoria[] }>()
const emit = defineEmits<{ guardado: [producto: Producto]; cancelar: [] }>()

interface FilaTalla {
  talla: string
  existencias: number
}

const datos = reactive({
  nombre: '',
  descripcion: '',
  precio: 0,
  color: '',
  imagenUrl: '',
  categoria: '',
  activo: true,
  destacado: false,
})
const tallas = ref<FilaTalla[]>([])
const errores = reactive<Record<string, string | undefined>>({})
const errorGeneral = ref('')
const enviando = ref(false)

const tallasDisponibles = computed(() => TALLAS_VALIDAS.filter((t) => !tallas.value.some((f) => f.talla === t)))

watch(
  () => props.producto,
  (producto) => {
    datos.nombre = producto?.nombre ?? ''
    datos.descripcion = producto?.descripcion ?? ''
    datos.precio = producto?.precio ?? 0
    datos.color = producto?.color ?? ''
    datos.imagenUrl = producto?.imagenUrl ?? ''
    datos.categoria = producto?.categoria?._id ?? props.categorias[0]?._id ?? ''
    datos.activo = producto?.activo ?? true
    datos.destacado = producto?.destacado ?? false
    tallas.value = producto ? producto.tallas.map((t) => ({ ...t })) : [{ talla: 'M', existencias: 0 }]
    for (const clave of Object.keys(errores)) errores[clave] = undefined
    errorGeneral.value = ''
  },
  { immediate: true },
)

function agregarTalla() {
  const siguiente = tallasDisponibles.value[0]
  if (siguiente) tallas.value.push({ talla: siguiente, existencias: 0 })
}

function quitarTalla(indice: number) {
  tallas.value.splice(indice, 1)
}

function validar(): boolean {
  errores.nombre = datos.nombre.trim() ? undefined : 'El nombre es obligatorio.'
  errores.precio =
    Number.isFinite(datos.precio) && datos.precio >= 0 ? undefined : 'El precio debe ser un número mayor o igual a cero.'
  errores.categoria = datos.categoria ? undefined : 'Elige una categoría.'
  errores.color = datos.color.trim() ? undefined : 'Indica el color de la prenda.'
  errores.imagenUrl =
    !datos.imagenUrl.trim() || /^https?:\/\/\S+$/i.test(datos.imagenUrl.trim())
      ? undefined
      : 'La URL debe empezar por http:// o https://'

  if (tallas.value.length === 0) {
    errores.tallas = 'Agrega al menos una talla.'
  } else if (tallas.value.some((t) => !Number.isInteger(t.existencias) || t.existencias < 0)) {
    errores.tallas = 'Las existencias deben ser números enteros mayores o iguales a cero.'
  } else if (new Set(tallas.value.map((t) => t.talla)).size !== tallas.value.length) {
    errores.tallas = 'Hay tallas repetidas.'
  } else {
    errores.tallas = undefined
  }

  return !Object.values(errores).some(Boolean)
}

async function guardar() {
  if (!validar()) return
  enviando.value = true
  errorGeneral.value = ''
  const entrada: ProductoEntrada = {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    precio: Number(datos.precio),
    color: datos.color.trim(),
    imagenUrl: datos.imagenUrl.trim(),
    categoria: datos.categoria,
    tallas: tallas.value.map((t) => ({ talla: t.talla, existencias: Number(t.existencias) })),
    activo: datos.activo,
    destacado: datos.destacado,
  }
  try {
    const guardado = props.producto
      ? await productosApi.actualizar(props.producto._id, entrada)
      : await productosApi.crear(entrada)
    emit('guardado', guardado)
  } catch (e) {
    errorGeneral.value = e instanceof Error ? e.message : 'No se pudo guardar el producto'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <form class="formulario" novalidate @submit.prevent="guardar">
    <div class="campo">
      <label for="prod-nombre" class="campo__etiqueta">Nombre *</label>
      <input id="prod-nombre" v-model="datos.nombre" type="text" class="campo__control" maxlength="100" required />
      <p v-if="errores.nombre" class="formulario__error">{{ errores.nombre }}</p>
    </div>

    <div class="formulario__fila">
      <div class="campo">
        <label for="prod-categoria" class="campo__etiqueta">Categoría *</label>
        <select id="prod-categoria" v-model="datos.categoria" class="campo__control" required>
          <option value="" disabled>Elige una categoría</option>
          <option v-for="c in categorias" :key="c._id" :value="c._id">{{ c.nombre }}</option>
        </select>
        <p v-if="errores.categoria" class="formulario__error">{{ errores.categoria }}</p>
      </div>

      <div class="campo">
        <label for="prod-precio" class="campo__etiqueta">Precio (COP) *</label>
        <input id="prod-precio" v-model.number="datos.precio" type="number" min="0" step="100" class="campo__control" required />
        <p v-if="errores.precio" class="formulario__error">{{ errores.precio }}</p>
      </div>
    </div>

    <div class="formulario__fila">
      <div class="campo">
        <label for="prod-color" class="campo__etiqueta">Color *</label>
        <div class="formulario__color">
          <span class="formulario__muestra" :style="{ background: colorACss(datos.color) }" aria-hidden="true" />
          <input id="prod-color" v-model="datos.color" type="text" class="campo__control" placeholder="Negro, Crema, Verde oliva…" />
        </div>
        <p v-if="errores.color" class="formulario__error">{{ errores.color }}</p>
      </div>

      <div class="campo">
        <label for="prod-imagen" class="campo__etiqueta">URL de la imagen</label>
        <input id="prod-imagen" v-model="datos.imagenUrl" type="url" class="campo__control" placeholder="https://…" />
        <p v-if="errores.imagenUrl" class="formulario__error">{{ errores.imagenUrl }}</p>
        <p v-else class="campo__ayuda">Si se deja vacía, el catálogo muestra el dibujo técnico de la prenda.</p>
      </div>
    </div>

    <div class="campo">
      <label for="prod-descripcion" class="campo__etiqueta">Descripción</label>
      <textarea id="prod-descripcion" v-model="datos.descripcion" class="campo__control" maxlength="1000" />
    </div>

    <fieldset class="tallas">
      <legend class="campo__etiqueta">Tallas y existencias *</legend>
      <div v-for="(fila, i) in tallas" :key="i" class="tallas__fila">
        <select v-model="fila.talla" class="campo__control" :aria-label="`Talla ${i + 1}`">
          <option v-for="t in TALLAS_VALIDAS" :key="t" :value="t">{{ t }}</option>
        </select>
        <input
          v-model.number="fila.existencias"
          type="number"
          min="0"
          step="1"
          class="campo__control"
          :aria-label="`Existencias de la talla ${fila.talla}`"
        />
        <button type="button" class="boton boton--pequeno boton--fantasma" :aria-label="`Quitar la talla ${fila.talla}`" @click="quitarTalla(i)">
          Quitar
        </button>
      </div>
      <button type="button" class="boton boton--pequeno" :disabled="tallasDisponibles.length === 0" @click="agregarTalla">
        + Agregar talla
      </button>
      <p v-if="errores.tallas" class="formulario__error">{{ errores.tallas }}</p>
    </fieldset>

    <div class="formulario__fila">
      <label class="campo campo--casilla">
        <input v-model="datos.activo" type="checkbox" />
        <span>Activo (visible en el catálogo)</span>
      </label>
      <label class="campo campo--casilla">
        <input v-model="datos.destacado" type="checkbox" />
        <span>Destacado en la página de inicio</span>
      </label>
    </div>

    <p v-if="errorGeneral" class="mensaje mensaje--error" role="alert">{{ errorGeneral }}</p>

    <div class="formulario__acciones">
      <button type="button" class="boton boton--fantasma" @click="emit('cancelar')">Cancelar</button>
      <button type="submit" class="boton boton--acento" :disabled="enviando">
        {{ enviando ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto' }}
      </button>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  &__fila {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @include hasta($movil) {
      grid-template-columns: 1fr;
    }
  }

  &__color {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__muestra {
    flex-shrink: 0;
    width: 1.4rem;
    height: 1.4rem;
    border: 1px solid var(--linea);
    border-radius: 50%;
  }

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

.tallas {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  margin: 0;
  padding: 1rem;
  border: 1px dashed var(--linea-suave);
  border-radius: $radio;

  legend {
    padding-inline: 0.3rem;
  }

  &__fila {
    display: grid;
    grid-template-columns: 7rem 1fr auto;
    gap: 0.5rem;
    width: 100%;
    align-items: center;
  }
}
</style>
