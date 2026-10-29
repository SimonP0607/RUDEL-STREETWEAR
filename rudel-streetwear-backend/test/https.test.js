const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'secreto-de-prueba-para-produccion-con-largo-suficiente';
process.env.API_URL = 'https://api.rudel.test';
process.env.PROXIES_CONFIABLES = '1';

const app = require('../app');

test('redirige a HTTPS las consultas que llegan por HTTP', async () => {
  const respuesta = await request(app).get('/api/productos').set('Host', 'api.rudel.test');
  assert.equal(respuesta.status, 308);
  assert.equal(respuesta.headers.location, 'https://api.rudel.test/api/productos');
});

test('rechaza por HTTP las operaciones que modifican datos', async () => {
  const respuesta = await request(app).post('/api/auth/login').send({ usuario: 'admin', contrasena: 'x' });
  assert.equal(respuesta.status, 403);
});

test('acepta las peticiones que el proxy marca como HTTPS e incluye HSTS', async () => {
  const respuesta = await request(app).get('/api/salud').set('X-Forwarded-Proto', 'https');
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers['strict-transport-security'], /max-age=31536000/);
});
