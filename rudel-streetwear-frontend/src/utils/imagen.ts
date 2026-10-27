const RUTA_IMAGEN = /^(https?:\/\/\S+|\/(?!\/)[\w\-./]+)$/i

export const imagenValida = (valor: string) => valor === '' || RUTA_IMAGEN.test(valor)

export const imagenesDe = (producto: { imagenUrl: string; imagenAlternaUrl?: string }) =>
  [producto.imagenUrl, producto.imagenAlternaUrl ?? ''].filter((url) => url !== '')
