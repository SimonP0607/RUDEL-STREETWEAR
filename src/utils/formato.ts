const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatoPrecio(valor: number): string {
  return formatoCOP.format(valor)
}

const COLORES: Record<string, string> = {
  negro: '#1a1a1a',
  blanco: '#f6f4ee',
  crema: '#e9dfc7',
  crudo: '#e9dfc7',
  beige: '#d9c7a3',
  gris: '#9a9a96',
  'gris jaspeado': '#b3b3ae',
  carbón: '#3a3a3a',
  carbon: '#3a3a3a',
  'verde oliva': '#6b6a3f',
  oliva: '#6b6a3f',
  'verde ácido': '#d7ff3d',
  'verde acido': '#d7ff3d',
  azul: '#2c4a86',
  'azul marino': '#1f2a44',
  índigo: '#2b2f6b',
  indigo: '#2b2f6b',
  rojo: '#c0392b',
  vinotinto: '#6a1b2b',
  naranja: '#e8712a',
  café: '#5b3a24',
  cafe: '#5b3a24',
  camel: '#b98b4f',
  lila: '#b7a0d6',
  rosado: '#e6a5b8',
  amarillo: '#f0d23c',
}

export function colorACss(nombre: string): string {
  const clave = nombre.trim().toLowerCase()
  return COLORES[clave] ?? '#c9c6bd'
}
