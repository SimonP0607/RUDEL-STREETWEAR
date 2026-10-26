<script setup lang="ts">
import { computed } from 'vue'
import { colorACss } from '@/utils/formato'

const props = defineProps<{
  categoriaNombre: string
  color: string
  nombre: string
}>()

type Tipo = 'camiseta' | 'hoodie' | 'pantalon' | 'gorra' | 'accesorio'

const tipo = computed<Tipo>(() => {
  const n = props.categoriaNombre.toLowerCase()
  if (/hood|buzo|sudadera|saco/.test(n)) return 'hoodie'
  if (/pantal|jean|cargo|jogger|short/.test(n)) return 'pantalon'
  if (/gorr|cap|bucket|sombrero/.test(n)) return 'gorra'
  if (/camis|tee|polo|playera/.test(n)) return 'camiseta'
  return 'accesorio'
})

const relleno = computed(() => colorACss(props.color))
</script>

<template>
  <svg
    class="arte"
    viewBox="0 0 200 220"
    role="img"
    :aria-label="`Dibujo técnico de ${nombre}`"
    :style="{ '--relleno': relleno }"
  >
    <g v-if="tipo === 'camiseta'">
      <path class="arte__pieza" d="M52 46 L84 30 C90 44 110 44 116 30 L148 46 L166 84 L138 96 L134 80 L134 190 L66 190 L66 80 L62 96 L34 84 Z" />
      <path class="arte__costura" d="M70 182 H130" />
      <path class="arte__costura" d="M62 96 L66 84 M138 96 L134 84" />
      <rect class="arte__etiqueta" x="94" y="44" width="12" height="7" />
    </g>

    <g v-else-if="tipo === 'hoodie'">
      <path class="arte__pieza" d="M74 44 C80 14 120 14 126 44 L152 58 L174 150 L148 158 L138 122 L138 196 L62 196 L62 122 L52 158 L26 150 L48 58 Z" />
      <path class="arte__pieza" d="M84 48 C88 30 112 30 116 48 C110 58 90 58 84 48 Z" />
      <path class="arte__pieza" d="M72 140 H128 V178 H72 Z" />
      <path class="arte__costura" d="M93 54 L90 92 M107 54 L110 92" />
      <path class="arte__costura" d="M138 122 L150 150 M62 122 L50 150 M66 188 H134" />
    </g>

    <g v-else-if="tipo === 'pantalon'">
      <path class="arte__pieza" d="M62 24 H138 V40 H62 Z" />
      <path class="arte__pieza" d="M62 40 L56 202 H92 L100 104 L108 202 H144 L138 40 Z" />
      <path class="arte__pieza" d="M64 112 H88 V140 H64 Z" />
      <path class="arte__pieza" d="M112 112 H136 V140 H112 Z" />
      <path class="arte__costura" d="M100 40 V72 M64 120 H88 M112 120 H136" />
      <path class="arte__costura" d="M72 24 V40 M100 24 V40 M128 24 V40" />
    </g>

    <g v-else-if="tipo === 'gorra'">
      <path class="arte__pieza" d="M40 128 C36 72 104 44 142 86 C152 98 152 114 150 128 Z" />
      <path class="arte__pieza" d="M40 128 H150 C174 128 192 134 194 142 C186 150 162 152 142 146 C110 138 74 136 40 136 Z" />
      <path class="arte__costura" d="M96 60 L92 128 M128 70 L130 128 M48 120 H146" />
      <circle class="arte__pieza" cx="100" cy="52" r="4" />
    </g>

    <g v-else>
      <path class="arte__asa" d="M76 78 C76 30 124 30 124 78" />
      <path class="arte__asa" d="M86 78 C86 42 114 42 114 78" />
      <path class="arte__pieza" d="M50 78 H150 V194 H50 Z" />
      <path class="arte__costura" d="M58 86 H142 V186 H58 Z" />
      <circle class="arte__costura" cx="100" cy="136" r="14" />
    </g>
  </svg>
</template>

<style lang="scss" scoped>
.arte {
  width: 100%;
  height: auto;
  color: $tinta;

  &__pieza {
    fill: var(--relleno);
    stroke: currentColor;
    stroke-width: 3;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  &__costura {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-dasharray: 3 4;
    stroke-linecap: round;
    opacity: 0.75;
  }

  &__asa {
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
  }

  &__etiqueta {
    fill: $papel-claro;
    stroke: currentColor;
    stroke-width: 1.4;
  }
}
</style>
