const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/entorno');
const Administrador = require('../models/Administrador');
const { HttpError } = require('./manejadorErrores');
const { registrarEvento } = require('./registro');

const NOMBRE_COOKIE = 'rudel_sesion';
const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
const SEGUNDOS_SESION = config.minutosSesion * 60;

const opcionesCookie = () => ({
  httpOnly: true,
  secure: config.cookieSegura,
  sameSite: 'strict',
  path: '/api',
});

function emitirToken(res, datos) {
  const token = jwt.sign(datos, config.jwtSecreto, { expiresIn: SEGUNDOS_SESION });
  res.cookie(NOMBRE_COOKIE, token, { ...opcionesCookie(), maxAge: SEGUNDOS_SESION * 1000 });
}

function crearSesion(res, administrador) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  emitirToken(res, {
    sub: String(administrador._id),
    usuario: administrador.usuario,
    nombre: administrador.nombre,
    rol: administrador.rol,
    csrf: csrfToken,
  });
  return csrfToken;
}

function renovarSiCorresponde(res, sesion) {
  const restante = sesion.exp - Math.floor(Date.now() / 1000);
  if (restante > SEGUNDOS_SESION / 2) return;
  const { sub, usuario, nombre, rol, csrf } = sesion;
  emitirToken(res, { sub, usuario, nombre, rol, csrf });
}

function cerrarSesion(res) {
  res.clearCookie(NOMBRE_COOKIE, opcionesCookie());
}

function leerSesion(req) {
  const token = req.cookies?.[NOMBRE_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecreto, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

async function requiereAdmin(req, res, next) {
  const sesion = leerSesion(req);
  if (!sesion) throw new HttpError(401, 'Debes iniciar sesión como administrador');
  const existe = await Administrador.exists({ _id: sesion.sub });
  if (!existe) {
    cerrarSesion(res);
    throw new HttpError(401, 'La sesión ya no es válida');
  }
  req.sesion = sesion;
  renovarSiCorresponde(res, sesion);
  next();
}

const requiereRol =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.sesion?.rol)) {
      registrarEvento('permiso_denegado', { ip: req.ip, usuario: req.sesion?.usuario, rol: req.sesion?.rol, ruta: req.originalUrl });
      throw new HttpError(403, 'Sin permiso');
    }
    next();
  };

function tokensIguales(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

function verificarCsrf(req, res, next) {
  if (METODOS_SEGUROS.has(req.method)) return next();
  const recibido = req.get('x-csrf-token');
  if (!recibido || !req.sesion?.csrf || !tokensIguales(recibido, req.sesion.csrf)) {
    registrarEvento('csrf_rechazado', { ip: req.ip, usuario: req.sesion?.usuario, metodo: req.method, ruta: req.originalUrl });
    throw new HttpError(403, 'Token CSRF ausente o no válido');
  }
  next();
}

const soloAdmin = requiereRol('admin');
const protegerEscritura = [requiereAdmin, soloAdmin, verificarCsrf];
const protegerLectura = [requiereAdmin, soloAdmin];

module.exports = {
  NOMBRE_COOKIE,
  crearSesion,
  cerrarSesion,
  leerSesion,
  requiereAdmin,
  requiereRol,
  verificarCsrf,
  protegerEscritura,
  protegerLectura,
};
