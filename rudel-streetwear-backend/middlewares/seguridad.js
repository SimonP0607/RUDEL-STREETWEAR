const helmet = require('helmet');
const { FilterXSS } = require('xss');
const config = require('../config/entorno');

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CAMPOS_SIN_SANITIZAR = new Set(['contrasena']);

const filtroXss = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
});

function forzarHttps(req, res, next) {
  if (!config.produccion || req.secure || req.path === '/api/salud') return next();
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(308, `https://${req.get('host')}${req.originalUrl}`);
  }
  res.status(403).json({ error: 'Las peticiones que modifican datos solo se aceptan por HTTPS' });
}

const cabecerasSeguridad = helmet({
  hsts: config.produccion ? { maxAge: 31536000, includeSubDomains: true } : false,
  crossOriginResourcePolicy: { policy: 'same-site' },
});

function verificarOrigen(req, res, next) {
  if (METODOS_SEGUROS.has(req.method)) return next();
  const origen = req.get('origin');
  if (!origen || config.origenesPermitidos.includes(origen)) return next();
  res.status(403).json({ error: 'Origen no permitido' });
}

function limpiar(valor, clave) {
  if (typeof valor === 'string') {
    return CAMPOS_SIN_SANITIZAR.has(clave) ? valor : filtroXss.process(valor).trim();
  }
  if (Array.isArray(valor)) return valor.map((elemento) => limpiar(elemento));
  if (valor && typeof valor === 'object') {
    const limpio = {};
    for (const [k, v] of Object.entries(valor)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      limpio[k] = limpiar(v, k);
    }
    return limpio;
  }
  return valor;
}

function sanitizarEntrada(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = limpiar(req.body);
  next();
}

module.exports = { forzarHttps, cabecerasSeguridad, verificarOrigen, sanitizarEntrada, limpiar };
