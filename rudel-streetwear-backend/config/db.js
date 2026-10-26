const mongoose = require('mongoose');

async function conectarDB(uri) {
  if (!uri) {
    throw new Error('Falta la variable MONGODB_URI en el archivo .env');
  }
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = conectarDB;
