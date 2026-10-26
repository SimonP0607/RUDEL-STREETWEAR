const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const { HttpError } = require('../middlewares/manejadorErrores');

function tomarCampos(body = {}) {
  const datos = {};
  if (body.nombre !== undefined) datos.nombre = body.nombre;
  if (body.descripcion !== undefined) datos.descripcion = body.descripcion;
  return datos;
}

async function listar(req, res) {
  const categorias = await Categoria.find()
    .collation({ locale: 'es', strength: 2 })
    .sort({ nombre: 1 })
    .lean();

  const conteos = await Producto.aggregate([
    { $group: { _id: '$categoria', total: { $sum: 1 }, activos: { $sum: { $cond: ['$activo', 1, 0] } } } },
  ]);
  const mapa = new Map(conteos.map((c) => [String(c._id), c]));

  res.json(
    categorias.map((c) => ({
      ...c,
      totalProductos: mapa.get(String(c._id))?.total || 0,
      productosActivos: mapa.get(String(c._id))?.activos || 0,
    }))
  );
}

async function obtener(req, res) {
  const categoria = await Categoria.findById(req.params.id).lean();
  if (!categoria) throw new HttpError(404, 'Categoría no encontrada');
  res.json(categoria);
}

async function crear(req, res) {
  const categoria = await Categoria.create(tomarCampos(req.body));
  res.status(201).json(categoria);
}

async function actualizar(req, res) {
  const categoria = await Categoria.findById(req.params.id);
  if (!categoria) throw new HttpError(404, 'Categoría no encontrada');
  categoria.set(tomarCampos(req.body));
  await categoria.save();
  res.json(categoria);
}

async function eliminar(req, res) {
  const categoria = await Categoria.findById(req.params.id);
  if (!categoria) throw new HttpError(404, 'Categoría no encontrada');

  const asociados = await Producto.countDocuments({ categoria: categoria._id });
  if (asociados > 0) {
    throw new HttpError(
      409,
      `No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${asociados} producto(s) asociado(s)`
    );
  }

  await categoria.deleteOne();
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
