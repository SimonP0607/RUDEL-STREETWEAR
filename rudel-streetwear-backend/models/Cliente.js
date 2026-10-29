const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Producto = require('./Producto');

const itemCarritoSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    talla: { type: String, required: true, enum: Producto.TALLAS_VALIDAS },
    cantidad: {
      type: Number,
      required: true,
      min: [1, 'La cantidad mínima es 1'],
      validate: { validator: Number.isInteger, message: 'La cantidad debe ser un número entero' },
    },
  },
  { _id: false }
);

const clienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [60, 'El nombre no puede superar 60 caracteres'],
    },
    correo: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [120, 'El correo no puede superar 120 caracteres'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El correo no tiene un formato válido'],
    },
    contrasena: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      maxlength: [72, 'La contraseña no puede superar 72 caracteres'],
      select: false,
    },
    favoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Producto' }],
    carrito: [itemCarritoSchema],
  },
  { timestamps: true, versionKey: false }
);

clienteSchema.pre('save', async function () {
  if (!this.isModified('contrasena')) return;
  this.contrasena = await bcrypt.hash(this.contrasena, 10);
});

clienteSchema.methods.compararContrasena = function (texto) {
  return bcrypt.compare(texto, this.contrasena);
};

module.exports = mongoose.model('Cliente', clienteSchema, 'clientes');
