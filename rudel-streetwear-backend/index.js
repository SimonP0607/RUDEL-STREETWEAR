require('dotenv').config();

const config = require('./config/entorno');
const conectarDB = require('./config/db');
const { asegurarAdministrador } = require('./datos/semilla');
const app = require('./app');
const { iniciarServidores } = require('./servidor');

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

  iniciarServidores(app);
}

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
