require('dotenv').config();

const config = require('./config/entorno');
const conectarDB = require('./config/db');
const { asegurarAdministrador } = require('./datos/semilla');
const app = require('./app');

async function prepararAdministrador() {
  if (!config.adminContrasena) return;
  try {
    const administrador = await asegurarAdministrador(config.adminUsuario, config.adminContrasena);
    console.log(`Administrador "${administrador.usuario}" sincronizado con las variables de entorno`);
  } catch (error) {
    console.error('No se pudo preparar el administrador:', error.message);
  }
}

async function iniciar() {
  const conexion = await conectarDB(config.mongoUri);
  console.log(`Conectado a MongoDB Atlas (base de datos: ${conexion.name})`);
  await prepararAdministrador();

  app.listen(config.puerto, () => {
    console.log(`Servidor en http://localhost:${config.puerto}`);
    console.log(`Documentación en ${config.apiUrl}/api-docs`);
  });
}

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
