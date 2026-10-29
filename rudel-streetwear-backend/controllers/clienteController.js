const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const { HttpError } = require('../middlewares/manejadorErrores');
const { crearSesionCliente, cerrarSesionCliente, leerSesionCliente } = require('../middlewares/autenticacion');

const HASH_FICTICIO = bcrypt.hashSync('rudel-hash-ficticio', 10);
const MAXIMO_ITEMS = 50;

const datosPublicos = (cliente) => ({ _id: cliente._id, nombre: cliente.nombre, correo: cliente.correo });

const esTexto = (valor) => typeof valor === 'string';

async function registrar(req, res) {
  const { nombre, correo, contrasena } = req.body ?? {};
  if (![nombre, correo, contrasena].every(esTexto) || !nombre.trim() || !correo.trim() || !contrasena) {
    throw new HttpError(400, 'Nombre, correo y contraseña son obligatorios');
  }

  const cliente = await Cliente.create({ nombre, correo, contrasena });
  const csrfToken = crearSesionCliente(res, cliente);
  res.status(201).json({ cliente: datosPublicos(cliente), csrfToken });
}

async function iniciarSesion(req, res) {
  const { correo, contrasena } = req.body ?? {};
  if (!esTexto(correo) || !esTexto(contrasena) || !correo.trim() || !contrasena) {
    throw new HttpError(400, 'Correo y contraseña son obligatorios');
  }

  const cliente = await Cliente.findOne({ correo: correo.trim().toLowerCase() }).select('+contrasena');
  const valida = cliente ? await cliente.compararContrasena(contrasena) : await bcrypt.compare(contrasena, HASH_FICTICIO);

  if (!cliente || !valida) throw new HttpError(401, 'Correo o contraseña incorrectos');

  const csrfToken = crearSesionCliente(res, cliente);
  res.json({ cliente: datosPublicos(cliente), csrfToken });
}

function cerrar(req, res) {
  cerrarSesionCliente(res);
  res.status(204).end();
}

async function sesion(req, res) {
  const datos = leerSesionCliente(req);
  const cliente = datos && (await Cliente.findById(datos.sub).lean());
  if (!cliente) {
    if (datos) cerrarSesionCliente(res);
    throw new HttpError(401, 'No hay una sesión activa');
  }
  res.json({ cliente: datosPublicos(cliente), csrfToken: datos.csrf });
}

async function listarFavoritos(req, res) {
  const cliente = await Cliente.findById(req.sesion.sub)
    .populate({
      path: 'favoritos',
      match: { activo: true },
      populate: { path: 'categoria', select: 'nombre' },
    })
    .lean();
  res.json((cliente?.favoritos ?? []).filter(Boolean));
}

async function agregarFavorito(req, res) {
  const existe = await Producto.exists({ _id: req.params.id, activo: true });
  if (!existe) throw new HttpError(404, 'Producto no encontrado');
  await Cliente.updateOne({ _id: req.sesion.sub }, { $addToSet: { favoritos: req.params.id } });
  res.status(204).end();
}

async function quitarFavorito(req, res) {
  await Cliente.updateOne({ _id: req.sesion.sub }, { $pull: { favoritos: req.params.id } });
  res.status(204).end();
}

async function armarCarrito(items) {
  const productos = await Producto.find({ _id: { $in: items.map((i) => i.producto) }, activo: true }).lean();
  const porId = new Map(productos.map((p) => [String(p._id), p]));
  const resultado = [];

  for (const item of items) {
    const producto = porId.get(String(item.producto));
    const existencias = producto?.tallas.find((t) => t.talla === item.talla)?.existencias ?? 0;
    if (!producto || existencias <= 0) continue;
    resultado.push({
      productoId: String(producto._id),
      nombre: producto.nombre,
      talla: item.talla,
      precioUnitario: producto.precio,
      cantidad: Math.min(item.cantidad, existencias),
      existenciasDisponibles: existencias,
    });
  }
  return resultado;
}

async function obtenerCarrito(req, res) {
  const cliente = await Cliente.findById(req.sesion.sub).select('carrito').lean();
  res.json(await armarCarrito(cliente?.carrito ?? []));
}

function leerItems(body) {
  const items = body?.items;
  if (!Array.isArray(items) || items.length > MAXIMO_ITEMS) {
    throw new HttpError(400, `El carrito debe ser una lista de hasta ${MAXIMO_ITEMS} elementos`);
  }

  const acumulado = new Map();
  for (const item of items) {
    const { productoId, talla, cantidad } = item ?? {};
    if (!esTexto(productoId) || !mongoose.isValidObjectId(productoId) || !esTexto(talla) || !Number.isInteger(cantidad) || cantidad < 1) {
      throw new HttpError(400, 'Cada elemento del carrito necesita productoId, talla y una cantidad entera mayor que 0');
    }
    const clave = `${productoId}|${talla}`;
    const previo = acumulado.get(clave);
    acumulado.set(clave, { producto: productoId, talla, cantidad: (previo?.cantidad ?? 0) + cantidad });
  }
  return [...acumulado.values()];
}

async function guardarCarrito(req, res) {
  const normalizado = await armarCarrito(leerItems(req.body));
  const carrito = normalizado.map((i) => ({ producto: i.productoId, talla: i.talla, cantidad: i.cantidad }));
  await Cliente.updateOne({ _id: req.sesion.sub }, { $set: { carrito } });
  res.json(normalizado);
}

module.exports = {
  registrar,
  iniciarSesion,
  cerrar,
  sesion,
  listarFavoritos,
  agregarFavorito,
  quitarFavorito,
  obtenerCarrito,
  guardarCarrito,
};
