function registrarEvento(evento, datos = {}) {
  console.warn(JSON.stringify({ fecha: new Date().toISOString(), evento, ...datos }));
}

module.exports = { registrarEvento };
