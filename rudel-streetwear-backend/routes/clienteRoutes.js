const { Router } = require('express');
const ctrl = require('../controllers/clienteController');
const validarId = require('../middlewares/validarId');
const { protegerCliente, requiereCliente } = require('../middlewares/autenticacion');
const { limiteLoginCliente, limiteRegistro } = require('../middlewares/limitador');

const router = Router();

/**
 * @openapi
 * /api/clientes/registro:
 *   post:
 *     tags: [Clientes]
 *     summary: Crea la cuenta de un cliente e inicia su sesión
 *     description: |
 *       Guarda la contraseña como hash bcrypt y entrega la cookie httpOnly `rudel_cliente`
 *       más el `csrfToken` de esa sesión. El correo debe ser único.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegistroCliente' }
 *     responses:
 *       201:
 *         description: Cuenta creada y sesión iniciada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SesionCliente' }
 *       400: { $ref: '#/components/responses/DatosNoValidos' }
 *       409:
 *         description: Ya existe una cuenta con ese correo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: 'Ya existe un registro con ese correo' }
 */
router.post('/registro', limiteRegistro, ctrl.registrar);

/**
 * @openapi
 * /api/clientes/login:
 *   post:
 *     tags: [Clientes]
 *     summary: Inicia la sesión de un cliente
 *     description: Se permiten 10 intentos fallidos cada 15 minutos.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CredencialesCliente' }
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SesionCliente' }
 *       400:
 *         description: Faltan el correo o la contraseña
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Correo o contraseña incorrectos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: 'Correo o contraseña incorrectos' }
 *       429:
 *         description: Demasiados intentos fallidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', limiteLoginCliente, ctrl.iniciarSesion);

/**
 * @openapi
 * /api/clientes/logout:
 *   post:
 *     tags: [Clientes]
 *     summary: Cierra la sesión del cliente
 *     security: []
 *     responses:
 *       204: { description: Sesión cerrada y cookie eliminada }
 */
router.post('/logout', ctrl.cerrar);

/**
 * @openapi
 * /api/clientes/sesion:
 *   get:
 *     tags: [Clientes]
 *     summary: Devuelve la sesión activa del cliente y su token CSRF
 *     security:
 *       - cookieCliente: []
 *     responses:
 *       200:
 *         description: Sesión activa
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SesionCliente' }
 *       401:
 *         description: No hay una sesión activa
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/sesion', ctrl.sesion);

/**
 * @openapi
 * /api/clientes/favoritos:
 *   get:
 *     tags: [Clientes]
 *     summary: Lista los productos favoritos del cliente
 *     description: Solo devuelve productos activos. Cada cliente solo ve sus propios favoritos.
 *     security:
 *       - cookieCliente: []
 *     responses:
 *       200:
 *         description: Productos favoritos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Producto' }
 *       401:
 *         description: Falta iniciar sesión como cliente
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/favoritos', requiereCliente, ctrl.listarFavoritos);

/**
 * @openapi
 * /api/clientes/favoritos/{id}:
 *   post:
 *     tags: [Clientes]
 *     summary: Agrega un producto a los favoritos
 *     description: Si el producto ya estaba en favoritos no se duplica.
 *     security:
 *       - cookieCliente: []
 *         tokenCsrf: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       204: { description: Producto agregado a favoritos }
 *       400: { $ref: '#/components/responses/IdNoValido' }
 *       401:
 *         description: Falta iniciar sesión como cliente
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   delete:
 *     tags: [Clientes]
 *     summary: Quita un producto de los favoritos
 *     security:
 *       - cookieCliente: []
 *         tokenCsrf: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       204: { description: Producto quitado de favoritos }
 *       400: { $ref: '#/components/responses/IdNoValido' }
 *       401:
 *         description: Falta iniciar sesión como cliente
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 */
router.post('/favoritos/:id', validarId, protegerCliente, ctrl.agregarFavorito);
router.delete('/favoritos/:id', validarId, protegerCliente, ctrl.quitarFavorito);

/**
 * @openapi
 * /api/clientes/carrito:
 *   get:
 *     tags: [Clientes]
 *     summary: Devuelve el carrito guardado del cliente
 *     description: Precios y existencias se leen del catálogo actual; los productos agotados o inactivos se omiten.
 *     security:
 *       - cookieCliente: []
 *     responses:
 *       200:
 *         description: Elementos del carrito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ItemCarrito' }
 *       401:
 *         description: Falta iniciar sesión como cliente
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   put:
 *     tags: [Clientes]
 *     summary: Guarda el carrito completo del cliente
 *     description: |
 *       Reemplaza el carrito. El servidor suma duplicados, descarta productos agotados o inactivos
 *       y limita cada cantidad a las existencias de la talla. Devuelve el carrito ya normalizado.
 *     security:
 *       - cookieCliente: []
 *         tokenCsrf: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EntradaCarrito' }
 *     responses:
 *       200:
 *         description: Carrito guardado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ItemCarrito' }
 *       400:
 *         description: El carrito no tiene el formato esperado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Falta iniciar sesión como cliente
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403: { $ref: '#/components/responses/CsrfNoValido' }
 */
router.get('/carrito', requiereCliente, ctrl.obtenerCarrito);
router.put('/carrito', protegerCliente, ctrl.guardarCarrito);

module.exports = router;
