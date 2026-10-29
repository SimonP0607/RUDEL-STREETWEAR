const { rateLimit } = require('express-rate-limit');

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
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: respuesta('Demasiados intentos de inicio de sesión, espera 15 minutos'),
});

const limiteLoginCliente = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: respuesta('Demasiados intentos de inicio de sesión, espera 15 minutos'),
});

const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: respuesta('Demasiadas cuentas creadas desde esta conexión, intenta más tarde'),
});

module.exports = { limiteGeneral, limiteLogin, limiteLoginCliente, limiteRegistro };
