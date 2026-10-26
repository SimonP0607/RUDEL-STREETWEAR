require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config/entorno');
const conectarDB = require('./config/db');
const { cargarCatalogo, guardarAdministrador } = require('./datos/semilla');

async function main() {
  await conectarDB(config.mongoUri);

  const resumen = await cargarCatalogo();
  console.log(`${resumen.categorias} categorías y ${resumen.productos} productos creados`);

  const usuario = process.env.ADMIN_USUARIO || 'admin';
  const contrasena = process.env.ADMIN_CONTRASENA;
  if (contrasena) {
    await guardarAdministrador(usuario, contrasena);
    console.log(`Administrador "${usuario.toLowerCase()}" listo`);
  } else {
    console.log('ADMIN_CONTRASENA no está definida: no se creó el administrador');
  }
}

main()
  .catch((error) => {
    console.error('Error al cargar los datos:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
