const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/entorno');
const Administrador = require('../models/Administrador');
const { HttpError } = require('./manejadorErrores');

const NOMBRE_COOKIE = 'rudel_sesion';
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
    { sub: String(administrador._id), usuario: administrador.usuario, nombre: administrador.nombre, csrf: csrfToken },
    config.jwtSecreto,
    { expiresIn: `${config.horasSesion}h` }
  );
  res.cookie(NOMBRE_COOKIE, token, { ...opcionesCookie(), maxAge: config.horasSesion * 60 * 60 * 1000 });
  return csrfToken;
}

function cerrarSesion(res) {
  res.clearCookie(NOMBRE_COOKIE, opcionesCookie());
}

function leerSesion(req) {
  const token = req.cookies?.[NOMBRE_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecreto);
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

module.exports = { NOMBRE_COOKIE, crearSesion, cerrarSesion, leerSesion, requiereAdmin, verificarCsrf, protegerEscritura };
