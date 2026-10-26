const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      trim: true,
      maxlength: [50, 'El nombre no puede superar 50 caracteres'],
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'La descripción no puede superar 300 caracteres'],
    },
  },
  { timestamps: true, versionKey: false }
);

categoriaSchema.index(
  { nombre: 1 },
  { unique: true, collation: { locale: 'es', strength: 2 } }
);

module.exports = mongoose.model('Categoria', categoriaSchema, 'categorias');
