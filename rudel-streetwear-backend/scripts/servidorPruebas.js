const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const PUERTO = Number(process.env.PORT) || 3100;
const ADMIN = { usuario: 'admin', contrasena: 'RudelPruebas2026' };

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'secreto-de-pruebas-e2e-con-largo-suficiente-123456';
process.env.FRONTEND_URL ??= 'http://localhost:4173';
process.env.API_URL ??= `http://localhost:${PUERTO}`;

const app = require('../app');
const { cargarCatalogo, guardarAdministrador } = require('../datos/semilla');

async function iniciar() {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('rudel'));
  await cargarCatalogo();
  await guardarAdministrador(ADMIN.usuario, ADMIN.contrasena);

  const servidor = app.listen(PUERTO, () => console.log(`Servidor de pruebas en http://localhost:${PUERTO}`));

  const detener = async () => {
    servidor.close();
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', detener);
  process.on('SIGTERM', detener);
}

iniciar().catch((error) => {
  console.error(error);
  process.exit(1);
});
