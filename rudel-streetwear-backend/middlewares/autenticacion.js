const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/entorno');
const Administrador = require('../models/Administrador');
const Cliente = require('../models/Cliente');
const { HttpError } = require('./manejadorErrores');

const NOMBRE_COOKIE = 'rudel_sesion';
const NOMBRE_COOKIE_CLIENTE = 'rudel_cliente';
const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

const opcionesCookie = () => ({
  httpOnly: true,
  secure: config.produccion,
  sameSite: 'strict',
  path: '/api',
});

function crearSesion(res, administrador) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign(
    { sub: String(administrador._id), rol: 'admin', usuario: administrador.usuario, nombre: administrador.nombre, csrf: csrfToken },
    config.jwtSecreto,
    { expiresIn: `${config.horasSesion}h` }
  );
  res.cookie(NOMBRE_COOKIE, token, { ...opcionesCookie(), maxAge: config.horasSesion * 60 * 60 * 1000 });
  return csrfToken;
}

function cerrarSesion(res) {
  res.clearCookie(NOMBRE_COOKIE, opcionesCookie());
}

function verificarToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecreto);
  } catch {
    return null;
  }
}

function leerSesion(req) {
  return verificarToken(req.cookies?.[NOMBRE_COOKIE]);
}

function crearSesionCliente(res, cliente) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign(
    { sub: String(cliente._id), rol: 'cliente', nombre: cliente.nombre, csrf: csrfToken },
    config.jwtSecreto,
    { expiresIn: `${config.horasSesion}h` }
  );
  res.cookie(NOMBRE_COOKIE_CLIENTE, token, { ...opcionesCookie(), maxAge: config.horasSesion * 60 * 60 * 1000 });
  return csrfToken;
}

function cerrarSesionCliente(res) {
  res.clearCookie(NOMBRE_COOKIE_CLIENTE, opcionesCookie());
}

function leerSesionCliente(req) {
  const sesion = verificarToken(req.cookies?.[NOMBRE_COOKIE_CLIENTE]);
  return sesion?.rol === 'cliente' ? sesion : null;
}

async function requiereAdmin(req, res, next) {
  const sesion = leerSesion(req);
  if (!sesion || (sesion.rol && sesion.rol !== 'admin')) {
    throw new HttpError(401, 'Debes iniciar sesión como administrador');
  }
  const existe = await Administrador.exists({ _id: sesion.sub });
  if (!existe) {
    cerrarSesion(res);
    throw new HttpError(401, 'La sesión ya no es válida');
  }
  req.sesion = sesion;
  next();
}

async function requiereCliente(req, res, next) {
  const sesion = leerSesionCliente(req);
  if (!sesion) throw new HttpError(401, 'Debes iniciar sesión para usar tu cuenta');
  const existe = await Cliente.exists({ _id: sesion.sub });
  if (!existe) {
    cerrarSesionCliente(res);
    throw new HttpError(401, 'La sesión ya no es válida');
  }
  req.sesion = sesion;
  next();
}

function tokensIguales(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

function verificarCsrf(req, res, next) {
  if (METODOS_SEGUROS.has(req.method)) return next();
  const recibido = req.get('x-csrf-token');
  if (!recibido || !req.sesion?.csrf || !tokensIguales(recibido, req.sesion.csrf)) {
    throw new HttpError(403, 'Token CSRF ausente o no válido');
  }
  next();
}

const protegerEscritura = [requiereAdmin, verificarCsrf];
const protegerCliente = [requiereCliente, verificarCsrf];

module.exports = {
  NOMBRE_COOKIE,
  NOMBRE_COOKIE_CLIENTE,
  crearSesion,
  cerrarSesion,
  leerSesion,
  crearSesionCliente,
  cerrarSesionCliente,
  leerSesionCliente,
  requiereAdmin,
  requiereCliente,
  verificarCsrf,
  protegerEscritura,
  protegerCliente,
};
