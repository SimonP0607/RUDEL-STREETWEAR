const produccion = process.env.NODE_ENV === 'production';
const puerto = Number(process.env.PORT) || 3000;
const apiUrl = (process.env.API_URL || `http://localhost:${puerto}`).replace(/\/$/, '');

if (produccion && !process.env.JWT_SECRET) {
  throw new Error('La variable JWT_SECRET es obligatoria en producción');
}

const origenesFrontend = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origen) => origen.trim().replace(/\/$/, ''))
  .filter(Boolean);

module.exports = {
  produccion,
  puerto,
  apiUrl,
  mongoUri: process.env.MONGODB_URI,
  jwtSecreto: process.env.JWT_SECRET || 'rudel-secreto-solo-para-desarrollo',
  horasSesion: Number(process.env.HORAS_SESION) || 8,
  proxiesConfiables: Number(process.env.PROXIES_CONFIABLES ?? 1),
  origenesPermitidos: [...new Set([...origenesFrontend, new URL(apiUrl).origin])],
};
