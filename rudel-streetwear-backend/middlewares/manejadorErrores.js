const mongoose = require('mongoose');

class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

function manejadorErrores(err, req, res, next) {
  if (err instanceof HttpError) {
    const cuerpo = { error: err.message };
    if (err.detalles) cuerpo.detalles = err.detalles;
    return res.status(err.status).json(cuerpo);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const detalles = Object.values(err.errors).map((e) =>
      e instanceof mongoose.Error.CastError ? `El campo "${e.path}" no tiene un formato válido` : e.message
    );
    return res.status(400).json({ error: 'Datos no válidos', detalles });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Valor no válido para el campo "${err.path}"` });
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(409).json({ error: `Ya existe un registro con ese ${campo}` });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la petición es demasiado grande' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }

  console.error(new Date().toISOString(), req.method, req.originalUrl, err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { HttpError, rutaNoEncontrada, manejadorErrores };
