require('dotenv').config();

const config = require('./config/entorno');
const conectarDB = require('./config/db');
const app = require('./app');

async function iniciar() {
  const conexion = await conectarDB(config.mongoUri);
  console.log(`Conectado a MongoDB Atlas (base de datos: ${conexion.name})`);

  app.listen(config.puerto, () => {
    console.log(`Servidor en http://localhost:${config.puerto}`);
    console.log(`Documentación en ${config.apiUrl}/api-docs`);
  });
}

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
