const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const { HttpError } = require('../middlewares/manejadorErrores');

const CAMPOS_EDITABLES = [
  'nombre', 'descripcion', 'precio', 'color', 'imagenUrl', 'imagenAlternaUrl',
  'categoria', 'tallas', 'activo', 'destacado',
];

function tomarCampos(body = {}) {
  const datos = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  }
  if (Array.isArray(datos.tallas)) {
    datos.tallas = datos.tallas.map((t) => ({ talla: t?.talla, existencias: t?.existencias }));
  }
  return datos;
}

async function verificarCategoria(id) {
  if (id === undefined) return;
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'La categoría no tiene un formato válido');
  const existe = await Categoria.exists({ _id: id });
  if (!existe) throw new HttpError(400, 'La categoría indicada no existe');
}

function aBooleano(valor, campo) {
  if (typeof valor === 'boolean') return valor;
  throw new HttpError(400, `El campo "${campo}" debe ser true o false`);
}

const POBLAR = { path: 'categoria', select: 'nombre' };

async function listarCatalogo(req, res) {
  const filtro = { activo: true };

  if (req.query.categoria) {
    if (!mongoose.isValidObjectId(req.query.categoria)) {
      throw new HttpError(400, 'El parámetro categoria no tiene un formato válido');
    }
    filtro.categoria = req.query.categoria;
  }
  if (req.query.destacado === 'true') filtro.destacado = true;

  const productos = await Producto.find(filtro).populate(POBLAR).sort({ createdAt: -1 }).lean();
  res.json(productos);
}

async function obtenerPublico(req, res) {
  const producto = await Producto.findOne({ _id: req.params.id, activo: true }).populate(POBLAR).lean();
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  res.json(producto);
}

async function listarTodos(req, res) {
  const filtro = {};
  if (req.query.categoria) {
    if (!mongoose.isValidObjectId(req.query.categoria)) {
      throw new HttpError(400, 'El parámetro categoria no tiene un formato válido');
    }
    filtro.categoria = req.query.categoria;
  }
  const productos = await Producto.find(filtro).populate(POBLAR).sort({ createdAt: -1 }).lean();
  res.json(productos);
}

async function obtenerAdmin(req, res) {
  const producto = await Producto.findById(req.params.id).populate(POBLAR).lean();
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  res.json(producto);
}

async function crear(req, res) {
  const datos = tomarCampos(req.body);
  await verificarCategoria(datos.categoria);
  const producto = await Producto.create(datos);
  await producto.populate(POBLAR);
  res.status(201).json(producto);
}

async function actualizar(req, res) {
  const producto = await Producto.findById(req.params.id);
  if (!producto) throw new HttpError(404, 'Producto no encontrado');

  const datos = tomarCampos(req.body);
  await verificarCategoria(datos.categoria);
  producto.set(datos);
  await producto.save();
  await producto.populate(POBLAR);
  res.json(producto);
}

async function cambiarActivo(req, res) {
  const activo = aBooleano(req.body?.activo, 'activo');
  const producto = await Producto.findByIdAndUpdate(
    req.params.id, { activo }, { new: true }
  ).populate(POBLAR);
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  res.json(producto);
}

async function cambiarDestacado(req, res) {
  const destacado = aBooleano(req.body?.destacado, 'destacado');
  const producto = await Producto.findByIdAndUpdate(
    req.params.id, { destacado }, { new: true }
  ).populate(POBLAR);
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  res.json(producto);
}

async function eliminar(req, res) {
  const producto = await Producto.findByIdAndDelete(req.params.id);
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  res.status(204).end();
}

module.exports = {
  listarCatalogo, obtenerPublico, listarTodos, obtenerAdmin,
  crear, actualizar, cambiarActivo, cambiarDestacado, eliminar,
};
