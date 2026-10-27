const { Router } = require('express');
const ctrl = require('../controllers/authController');
const { limiteLogin } = require('../middlewares/limitador');

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Inicia la sesión del administrador
 *     description: |
 *       Si las credenciales son correctas, el servidor envía la cookie httpOnly `rudel_sesion`
 *       y devuelve en el cuerpo el `csrfToken`. Ese token se debe enviar en la cabecera
 *       `X-CSRF-Token` en toda petición POST, PUT, PATCH o DELETE.
 *       Se permiten 10 intentos fallidos cada 15 minutos.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Credenciales' }
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         headers:
 *           Set-Cookie:
 *             schema: { type: string, example: 'rudel_sesion=eyJhbGci...; Path=/api; HttpOnly; SameSite=Strict' }
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Sesion' }
 *       400:
 *         description: Faltan el usuario o la contraseña
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: 'Usuario y contraseña son obligatorios' }
 *       401:
 *         description: Usuario o contraseña incorrectos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: 'Usuario o contraseña incorrectos' }
 *       429:
 *         description: Demasiados intentos fallidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: 'Demasiados intentos de inicio de sesión, espera 15 minutos' }
 */
router.post('/login', limiteLogin, ctrl.iniciarSesion);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cierra la sesión del administrador
 *     security: []
 *     responses:
 *       204: { description: Sesión cerrada y cookie eliminada }
 */
router.post('/logout', ctrl.cerrar);

/**
 * @openapi
 * /api/auth/sesion:
 *   get:
 *     tags: [Autenticación]
 *     summary: Devuelve la sesión activa y su token CSRF
 *     security:
 *       - cookieSesion: []
 *     responses:
 *       200:
 *         description: Sesión activa
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Sesion' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.get('/sesion', ctrl.sesion);

module.exports = router;
