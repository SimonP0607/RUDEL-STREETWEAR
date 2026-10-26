const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const administradorSchema = new mongoose.Schema(
  {
    nombre: { type: String, trim: true, default: 'Administrador' },
    usuario: {
      type: String,
      required: [true, 'El usuario es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    contrasena: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false,
    },
  },
  { timestamps: true, versionKey: false }
);

administradorSchema.pre('save', async function () {
  if (!this.isModified('contrasena')) return;
  this.contrasena = await bcrypt.hash(this.contrasena, 10);
});

administradorSchema.methods.compararContrasena = function (texto) {
  return bcrypt.compare(texto, this.contrasena);
};

module.exports = mongoose.model('Administrador', administradorSchema, 'administradores');
