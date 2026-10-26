const { Router } = require('express');
const ctrl = require('../controllers/productoController');
const validarId = require('../middlewares/validarId');
const { requiereAdmin, protegerEscritura } = require('../middlewares/autenticacion');

const router = Router();


/**
 * @openapi
 * /api/productos:
 *   get:
 *     tags: [Productos - catálogo público]
 *     summary: Lista los productos activos del catálogo
 *     description: Solo devuelve productos activos. Permite filtrar por categoría y por destacados; el filtro se resuelve en la consulta a MongoDB.
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *         description: Id de la categoría para filtrar
 *       - in: query
 *         name: destacado
 *         schema: { type: string, enum: ['true'] }
 *         description: Si es "true", devuelve solo los productos destacados
 *     responses:
 *       200:
 *         description: Lista de productos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Producto' }
 *       400:
 *         description: Parámetro categoria mal formado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   post:
 *     security:
 *       - cookieSesion: []
 *         tokenCsrf: []
 *     tags: [Productos - administración]
 *     summary: Crea un producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductoEntrada' }
 *     responses:
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Producto' }
 *       400: { $ref: '#/components/responses/DatosNoValidos' }
 */
router.get('/', ctrl.listarCatalogo);
router.post('/', protegerEscritura, ctrl.crear);

/**
 * @openapi
 * /api/productos/admin:
 *   get:
 *     tags: [Productos - administración]
 *     summary: Lista todos los productos (activos e inactivos)
 *     security:
 *       - cookieSesion: []
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *         description: Id de la categoría para filtrar
 *     responses:
 *       200:
 *         description: Lista completa de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Producto' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.get('/admin', requiereAdmin, ctrl.listarTodos);

/**
 * @openapi
 * /api/productos/admin/{id}:
 *   get:
 *     tags: [Productos - administración]
 *     summary: Consulta un producto por id, aunque esté inactivo
 *     security:
 *       - cookieSesion: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Producto' }
 *       400: { $ref: '#/components/responses/IdNoValido' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 */
router.get('/admin/:id', requiereAdmin, validarId, ctrl.obtenerAdmin);

/**
 * @openapi
 * /api/productos/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/Id'
 *   get:
 *     tags: [Productos - catálogo público]
 *     summary: Detalle de un producto activo
 *     responses:
 *       200:
 *         description: Producto con sus tallas y existencias
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Producto' }
 *       400: { $ref: '#/components/responses/IdNoValido' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   put:
 *     security:
 *       - cookieSesion: []
 *         tokenCsrf: []
 *     tags: [Productos - administración]
 *     summary: Edita un producto (precio, existencias por talla, etc.)
 *     description: Solo se modifican los campos enviados. Si se envía "tallas", reemplaza la lista completa.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductoEntrada' }
 *     responses:
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Producto' }
 *       400: { $ref: '#/components/responses/DatosNoValidos' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   delete:
 *     security:
 *       - cookieSesion: []
 *         tokenCsrf: []
 *     tags: [Productos - administración]
 *     summary: Elimina un producto
 *     responses:
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       204: { description: Producto eliminado }
 *       400: { $ref: '#/components/responses/IdNoValido' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 */
router.get('/:id', validarId, ctrl.obtenerPublico);
router.put('/:id', protegerEscritura, validarId, ctrl.actualizar);
router.delete('/:id', protegerEscritura, validarId, ctrl.eliminar);

/**
 * @openapi
 * /api/productos/{id}/activo:
 *   patch:
 *     security:
 *       - cookieSesion: []
 *         tokenCsrf: []
 *     tags: [Productos - administración]
 *     summary: Activa o desactiva un producto (lo muestra u oculta del catálogo)
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activo]
 *             properties:
 *               activo: { type: boolean, example: false }
 *     responses:
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Producto' }
 *       400: { $ref: '#/components/responses/DatosNoValidos' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 */
router.patch('/:id/activo', protegerEscritura, validarId, ctrl.cambiarActivo);

/**
 * @openapi
 * /api/productos/{id}/destacado:
 *   patch:
 *     security:
 *       - cookieSesion: []
 *         tokenCsrf: []
 *     tags: [Productos - administración]
 *     summary: Marca o desmarca un producto como destacado
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destacado]
 *             properties:
 *               destacado: { type: boolean, example: true }
 *     responses:
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Producto' }
 *       400: { $ref: '#/components/responses/DatosNoValidos' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 */
router.patch('/:id/destacado', protegerEscritura, validarId, ctrl.cambiarDestacado);

module.exports = router;
