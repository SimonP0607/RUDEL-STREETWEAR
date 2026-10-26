import { expect, test, type Page } from '@playwright/test'

const ADMIN = { usuario: 'admin', contrasena: 'RudelPruebas2026' }

async function iniciarSesion(page: Page) {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login/)
  await page.getByLabel('Usuario').fill(ADMIN.usuario)
  await page.getByLabel('Contraseña').fill(ADMIN.contrasena)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: 'Productos', level: 1 })).toBeVisible()
}

async function marcarDocumento(page: Page) {
  await page.evaluate(() => Object.assign(window, { __sinRecarga: true }))
}

async function sigueSinRecargar(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __sinRecarga?: boolean }).__sinRecarga)).toBe(true)
}

test.describe('Catálogo público', () => {
  test('al elegir una categoría solo se muestran sus productos', async ({ page }) => {
    await page.goto('/')
    const filtro = page.getByRole('navigation', { name: 'Filtrar por categoría' })
    await filtro.getByRole('button', { name: /Gorras/ }).click()
    await expect(page).toHaveURL(/categoria=/)
    await expect(page.getByRole('heading', { name: /Gorras/, level: 2 })).toBeVisible()

    const tarjetas = page.locator('.rejilla .etiqueta')
    await expect(tarjetas).toHaveCount(2)
    for (const texto of await tarjetas.locator('.etiqueta__categoria').allInnerTexts()) {
      expect(texto).toMatch(/^Gorras/i)
    }

    await filtro.getByRole('button', { name: /Todo/ }).click()
    await expect(tarjetas).toHaveCount(11)
  })
})

test.describe('Carrito de compras', () => {
  test('agrega, modifica cantidades, quita y recalcula el total', async ({ page }) => {
    await page.goto('/')
    await page.locator('.rejilla').getByRole('link', { name: /Snapback Rudel/ }).click()
    await expect(page.getByRole('heading', { name: 'Snapback Rudel', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'Aumentar cantidad' }).click()
    await page.getByRole('button', { name: 'Agregar al carrito' }).click()

    const tiquete = page.getByRole('dialog', { name: 'Tiquete de compra' })
    const total = tiquete.locator('.tiquete__total')
    await expect(total).toContainText('179.800')

    await tiquete.getByRole('button', { name: 'Aumentar cantidad' }).click()
    await expect(total).toContainText('269.700')

    await tiquete.getByRole('button', { name: 'Disminuir cantidad' }).click()
    await expect(total).toContainText('179.800')

    await tiquete.getByRole('button', { name: 'Cerrar el carrito' }).click()
    await page.getByRole('link', { name: '← Catálogo' }).click()
    await page.locator('.rejilla').getByRole('link', { name: /Bolso Crossbody/ }).click()
    await page.getByRole('button', { name: 'Agregar al carrito' }).click()
    await expect(total).toContainText('279.700')
    await expect(page.locator('.cabecera__contador')).toHaveText('3')

    await tiquete.locator('.item').filter({ hasText: 'Snapback Rudel' }).getByRole('button', { name: 'Quitar' }).click()
    await expect(total).toContainText('99.900')

    await page.reload()
    await page.getByRole('button', { name: /Carrito/ }).click()
    await expect(page.getByRole('dialog', { name: 'Tiquete de compra' }).locator('.tiquete__total')).toContainText('99.900')
  })
})

test.describe('Panel de administración', () => {
  test('las rutas del panel exigen iniciar sesión', async ({ page }) => {
    await page.goto('/admin/categorias')
    await expect(page).toHaveURL(/\/admin\/login/)
    await page.getByLabel('Usuario').fill(ADMIN.usuario)
    await page.getByLabel('Contraseña').fill('incorrecta')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByRole('alert')).toContainText('Usuario o contraseña incorrectos')
  })

  test('crea una categoría y un producto desde la interfaz y aparecen en el catálogo', async ({ page }) => {
    const sufijo = Date.now().toString().slice(-6)
    const categoria = `Chaquetas ${sufijo}`
    const producto = `Chaqueta Coach ${sufijo}`

    await iniciarSesion(page)
    await marcarDocumento(page)

    await page.getByRole('link', { name: 'Categorías' }).click()
    await page.getByRole('button', { name: '+ Nueva categoría' }).click()
    const hojaCategoria = page.getByRole('dialog', { name: 'Nueva categoría' })
    await hojaCategoria.getByLabel('Nombre *').fill(categoria)
    await hojaCategoria.getByLabel('Descripción').fill('Chaquetas livianas')
    await hojaCategoria.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.getByRole('status')).toContainText(`Categoría "${categoria}" creada.`)
    await expect(page.getByRole('row', { name: new RegExp(categoria) })).toBeVisible()

    await page.getByRole('link', { name: 'Productos', exact: true }).click()
    await page.getByRole('button', { name: '+ Nuevo producto' }).click()
    const hojaProducto = page.getByRole('dialog', { name: 'Nuevo producto' })
    await hojaProducto.getByLabel('Nombre *').fill(producto)
    await hojaProducto.getByLabel('Categoría *').selectOption({ label: categoria })
    await hojaProducto.getByLabel('Precio (COP) *').fill('210000')
    await hojaProducto.getByLabel('Color *').fill('Negro')
    await hojaProducto.getByLabel('Existencias de la talla M').fill('4')
    await hojaProducto.getByRole('button', { name: 'Crear producto' }).click()
    await expect(page.getByRole('status')).toContainText(`Producto "${producto}" creado.`)

    const fila = page.getByRole('row', { name: new RegExp(producto) })
    await expect(fila).toContainText('210.000')

    await fila.getByRole('button', { name: 'Editar' }).click()
    const hojaEdicion = page.getByRole('dialog', { name: 'Editar producto' })
    await hojaEdicion.getByLabel('Precio (COP) *').fill('195000')
    await hojaEdicion.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(fila).toContainText('195.000')
    await sigueSinRecargar(page)

    await page.getByRole('link', { name: 'Ver tienda' }).click()
    await page.getByRole('navigation', { name: 'Filtrar por categoría' }).getByRole('button', { name: new RegExp(categoria) }).click()
    const tarjetas = page.locator('.rejilla .etiqueta')
    await expect(tarjetas).toHaveCount(1)
    await expect(tarjetas.first()).toContainText(producto)
    await expect(tarjetas.first()).toContainText('195.000')
  })

  test('elimina un producto y la categoría sin recargar la página', async ({ page }) => {
    const sufijo = Date.now().toString().slice(-6)
    const categoria = `Temporal ${sufijo}`
    const producto = `Prenda temporal ${sufijo}`

    await iniciarSesion(page)
    await marcarDocumento(page)

    await page.getByRole('link', { name: 'Categorías' }).click()
    await page.getByRole('button', { name: '+ Nueva categoría' }).click()
    await page.getByRole('dialog', { name: 'Nueva categoría' }).getByLabel('Nombre *').fill(categoria)
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.getByRole('row', { name: new RegExp(categoria) })).toBeVisible()

    await page.getByRole('link', { name: 'Productos', exact: true }).click()
    await page.getByRole('button', { name: '+ Nuevo producto' }).click()
    const hoja = page.getByRole('dialog', { name: 'Nuevo producto' })
    await hoja.getByLabel('Nombre *').fill(producto)
    await hoja.getByLabel('Categoría *').selectOption({ label: categoria })
    await hoja.getByLabel('Precio (COP) *').fill('1000')
    await hoja.getByLabel('Color *').fill('Gris')
    await hoja.getByRole('button', { name: 'Crear producto' }).click()

    const filaProducto = page.getByRole('row', { name: new RegExp(producto) })
    await filaProducto.getByRole('button', { name: 'Eliminar' }).click()
    await filaProducto.getByRole('button', { name: 'Sí, eliminar' }).click()
    await expect(filaProducto).toHaveCount(0)

    await page.getByRole('link', { name: 'Categorías' }).click()
    const filaCategoria = page.getByRole('row', { name: new RegExp(categoria) })
    await filaCategoria.getByRole('button', { name: 'Eliminar' }).click()
    await filaCategoria.getByRole('button', { name: 'Sí, eliminar' }).click()
    await expect(filaCategoria).toHaveCount(0)
    await sigueSinRecargar(page)
  })
})

test.describe('Seguridad', () => {
  test('el texto con HTML malicioso se guarda limpio y no se ejecuta', async ({ page }) => {
    let alertaEjecutada = false
    page.on('dialog', async (dialogo) => {
      alertaEjecutada = true
      await dialogo.dismiss()
    })
    const sufijo = Date.now().toString().slice(-6)

    await iniciarSesion(page)
    await page.getByRole('link', { name: 'Categorías' }).click()
    await page.getByRole('button', { name: '+ Nueva categoría' }).click()
    const hoja = page.getByRole('dialog', { name: 'Nueva categoría' })
    await hoja.getByLabel('Nombre *').fill(`<img src=x onerror=alert(1)>Sudaderas ${sufijo}`)
    await hoja.getByLabel('Descripción').fill('<script>alert("xss")</script>Abrigadas')
    await hoja.getByRole('button', { name: 'Crear categoría' }).click()

    const fila = page.getByRole('row', { name: new RegExp(`Sudaderas ${sufijo}`) })
    await expect(fila).toContainText(`Sudaderas ${sufijo}`)
    await expect(fila).toContainText('Abrigadas')
    await expect(fila).not.toContainText('<img')
    await expect(fila.locator('img')).toHaveCount(0)
    expect(alertaEjecutada).toBe(false)
  })

  test('una petición que modifica datos sin token CSRF es rechazada', async ({ page }) => {
    await iniciarSesion(page)
    const estado = await page.evaluate(async () => {
      const respuesta = await fetch('/api/categorias', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'Sin token CSRF' }),
      })
      return respuesta.status
    })
    expect(estado).toBe(403)
  })

  test('la página publica una política de seguridad de contenido', async ({ page }) => {
    await page.goto('/')
    const politica = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
    expect(politica).toContain("script-src 'self'")
  })
})
