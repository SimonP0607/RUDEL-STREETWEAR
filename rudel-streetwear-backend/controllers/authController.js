const bcrypt = require('bcryptjs');
const Administrador = require('../models/Administrador');
const { HttpError } = require('../middlewares/manejadorErrores');
const { crearSesion, cerrarSesion, leerSesion } = require('../middlewares/autenticacion');

const HASH_FICTICIO = bcrypt.hashSync('rudel-hash-ficticio', 10);

const datosPublicos = (administrador) => ({
  _id: administrador._id,
  usuario: administrador.usuario,
  nombre: administrador.nombre,
});

async function iniciarSesion(req, res) {
  const { usuario, contrasena } = req.body ?? {};
  if (typeof usuario !== 'string' || typeof contrasena !== 'string' || !usuario.trim() || !contrasena) {
    throw new HttpError(400, 'Usuario y contraseña son obligatorios');
  }

  const administrador = await Administrador.findOne({ usuario: usuario.trim().toLowerCase() }).select('+contrasena');
  const valida = administrador
    ? await administrador.compararContrasena(contrasena)
    : await bcrypt.compare(contrasena, HASH_FICTICIO);

  if (!administrador || !valida) throw new HttpError(401, 'Usuario o contraseña incorrectos');

  const csrfToken = crearSesion(res, administrador);
  res.json({ administrador: datosPublicos(administrador), csrfToken });
}

function cerrar(req, res) {
  cerrarSesion(res);
  res.status(204).end();
}

async function sesion(req, res) {
  const datos = leerSesion(req);
  const administrador = datos && (await Administrador.findById(datos.sub).lean());
  if (!administrador) {
    if (datos) cerrarSesion(res);
    throw new HttpError(401, 'No hay una sesión activa');
  }
  res.json({ administrador: datosPublicos(administrador), csrfToken: datos.csrf });
}

module.exports = { iniciarSesion, cerrar, sesion };
