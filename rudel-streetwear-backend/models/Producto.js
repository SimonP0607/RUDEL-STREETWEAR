const mongoose = require('mongoose');

const TALLAS_VALIDAS = ['XS', 'S', 'M', 'L', 'XL', 'Única'];
const RUTA_IMAGEN = /^(https?:\/\/\S+|\/(?!\/)[\w\-./]+)$/i;

const campoImagen = {
  type: String,
  trim: true,
  default: '',
  validate: {
    validator: (v) => v === '' || RUTA_IMAGEN.test(v),
    message: 'La imagen debe ser una URL http(s) o una ruta del sitio que empiece por /',
  },
};

const tallaSchema = new mongoose.Schema(
  {
    talla: {
      type: String,
      required: [true, 'Cada talla debe tener un nombre'],
      enum: { values: TALLAS_VALIDAS, message: 'Talla no válida: {VALUE}' },
    },
    existencias: {
      type: Number,
      required: [true, 'Cada talla debe indicar sus existencias'],
      min: [0, 'Las existencias no pueden ser negativas'],
      validate: {
        validator: Number.isInteger,
        message: 'Las existencias deben ser un número entero',
      },
    },
  },
  { _id: false }
);

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede superar 100 caracteres'],
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'La descripción no puede superar 1000 caracteres'],
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    color: { type: String, trim: true, default: '' },
    imagenUrl: campoImagen,
    imagenAlternaUrl: campoImagen,
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'El producto debe tener una categoría'],
    },
    tallas: {
      type: [tallaSchema],
      validate: [
        {
          validator: (arr) => Array.isArray(arr) && arr.length > 0,
          message: 'El producto debe tener al menos una talla',
        },
        {
          validator: (arr) => new Set(arr.map((t) => t.talla)).size === arr.length,
          message: 'No se puede repetir una talla en el mismo producto',
        },
      ],
    },
    activo: { type: Boolean, default: true },
    destacado: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

productoSchema.index({ activo: 1, categoria: 1 });
productoSchema.index({ activo: 1, destacado: 1 });

const Producto = mongoose.model('Producto', productoSchema, 'productos');
Producto.TALLAS_VALIDAS = TALLAS_VALIDAS;

module.exports = Producto;
