const { rateLimit } = require('express-rate-limit');
const config = require('../config/entorno');
const { registrarEvento } = require('./registro');

const respuesta = (mensaje) => ({ error: mensaje });

const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: respuesta('Demasiadas peticiones, intenta de nuevo en unos minutos'),
});

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.intentosLogin,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: respuesta('Demasiados intentos de inicio de sesión, espera 15 minutos'),
  handler: (req, res, next, opciones) => {
    registrarEvento('login_bloqueado', { ip: req.ip });
    res.status(opciones.statusCode).json(opciones.message);
  },
});

module.exports = { limiteGeneral, limiteLogin };
