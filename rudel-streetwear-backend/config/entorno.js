const fs = require('fs');
const path = require('path');

const produccion = process.env.NODE_ENV === 'production';
const puerto = Number(process.env.PORT) || 3000;
const puertoHttps = Number(process.env.PUERTO_HTTPS) || 3443;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Falta JWT_SECRET en el archivo .env (mínimo 32 caracteres). Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
}

const carpetaCertificados = path.resolve(__dirname, '..', '..', 'certs');
const archivoClave = process.env.SSL_KEY_FILE || path.join(carpetaCertificados, 'key.pem');
const archivoCertificado = process.env.SSL_CERT_FILE || path.join(carpetaCertificados, 'cert.pem');
const httpsLocal = !produccion && process.env.NODE_ENV !== 'test' && fs.existsSync(archivoClave) && fs.existsSync(archivoCertificado);

const apiUrl = (process.env.API_URL || (httpsLocal ? `https://localhost:${puertoHttps}` : `http://localhost:${puerto}`)).replace(/\/$/, '');

const origenesFrontend = (process.env.FRONTEND_URL || (httpsLocal ? 'https://localhost:5173' : 'http://localhost:5173'))
  .split(',')
  .map((origen) => origen.trim().replace(/\/$/, ''))
  .filter(Boolean);

module.exports = {
  produccion,
  puerto,
  puertoHttps,
  httpsLocal,
  archivoClave,
  archivoCertificado,
  apiUrl,
  mongoUri: process.env.MONGODB_URI,
  jwtSecreto: process.env.JWT_SECRET,
  adminUsuario: process.env.ADMIN_USUARIO || 'admin',
  adminContrasena: process.env.ADMIN_CONTRASENA,
  minutosSesion: Number(process.env.MINUTOS_SESION) || 15,
  rondasBcrypt: 12,
  largoMinimoContrasena: 10,
  intentosLogin: 5,
  hstsSegundos: produccion ? 31536000 : httpsLocal ? 300 : 0,
  cookieSegura: produccion || httpsLocal,
  proxiesConfiables: Number(process.env.PROXIES_CONFIABLES ?? 1),
  origenesPermitidos: [...new Set([...origenesFrontend, new URL(apiUrl).origin])],
};
