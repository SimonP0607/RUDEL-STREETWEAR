const { Router } = require('express');
const ctrl = require('../controllers/categoriaController');
const validarId = require('../middlewares/validarId');
const { protegerEscritura } = require('../middlewares/autenticacion');

const router = Router();

/**
 * @openapi
 * /api/categorias:
 *   get:
 *     tags: [Categorías]
 *     summary: Lista todas las categorías
 *     description: Devuelve las categorías ordenadas por nombre, con el número de productos totales y activos de cada una.
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/CategoriaConConteo' }
 *   post:
 *     security:
 *       - cookieSesion: []
 *         tokenCsrf: []
 *     tags: [Categorías]
 *     summary: Crea una categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoriaEntrada' }
 *     responses:
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Categoria' }
 *       400: { $ref: '#/components/responses/DatosNoValidos' }
 *       409:
 *         description: Ya existe una categoría con ese nombre
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: 'Ya existe un registro con ese nombre' }
 */
router.get('/', ctrl.listar);
router.post('/', protegerEscritura, ctrl.crear);

/**
 * @openapi
 * /api/categorias/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/Id'
 *   get:
 *     tags: [Categorías]
 *     summary: Consulta una categoría por id
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Categoria' }
 *       400: { $ref: '#/components/responses/IdNoValido' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   put:
 *     security:
 *       - cookieSesion: []
 *         tokenCsrf: []
 *     tags: [Categorías]
 *     summary: Edita el nombre y/o la descripción de una categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoriaEntrada' }
 *     responses:
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       200:
 *         description: Categoría actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Categoria' }
 *       400: { $ref: '#/components/responses/DatosNoValidos' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       409:
 *         description: Ya existe otra categoría con ese nombre
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: 'Ya existe un registro con ese nombre' }
 *   delete:
 *     security:
 *       - cookieSesion: []
 *         tokenCsrf: []
 *     tags: [Categorías]
 *     summary: Elimina una categoría sin productos asociados
 *     responses:
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       204: { description: Categoría eliminada }
 *       400: { $ref: '#/components/responses/IdNoValido' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       409:
 *         description: La categoría tiene productos asociados y no se puede eliminar
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: 'No se puede eliminar la categoría "Oversize" porque tiene 5 producto(s) asociado(s)' }
 */
router.get('/:id', validarId, ctrl.obtener);
router.put('/:id', protegerEscritura, validarId, ctrl.actualizar);
router.delete('/:id', protegerEscritura, validarId, ctrl.eliminar);

module.exports = router;
