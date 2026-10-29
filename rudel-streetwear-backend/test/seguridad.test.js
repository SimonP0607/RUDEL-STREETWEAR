const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'secreto-de-prueba-solo-para-las-pruebas-automaticas';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.API_URL = 'http://localhost:3000';

const app = require('../app');
const Administrador = require('../models/Administrador');
const Producto = require('../models/Producto');
const { cargarCatalogo, guardarAdministrador } = require('../datos/semilla');

const ADMIN = { usuario: 'admin', contrasena: 'ClaveDePrueba123' };
const ORIGEN = 'http://localhost:5173';

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('rudel-seguridad'));
  await cargarCatalogo();
  await guardarAdministrador(ADMIN.usuario, ADMIN.contrasena);
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function iniciarSesion() {
  const agente = request.agent(app);
  const respuesta = await agente.post('/api/auth/login').set('Origin', ORIGEN).send(ADMIN);
  assert.equal(respuesta.status, 200);
  return { agente, csrf: respuesta.body.csrfToken, cookies: respuesta.headers['set-cookie'] };
}

describe('Contraseñas y sesión', () => {
  test('la contraseña se guarda con hash bcrypt y nunca en texto plano', async () => {
    const admin = await Administrador.findOne({ usuario: ADMIN.usuario }).select('+contrasena').lean();
    assert.notEqual(admin.contrasena, ADMIN.contrasena);
    assert.match(admin.contrasena, /^\$2[aby]\$12\$/);
  });

  test('la respuesta del login no expone el hash ni la contraseña', async () => {
    const { agente } = await iniciarSesion();
    const sesion = await agente.get('/api/auth/sesion');
    assert.doesNotMatch(JSON.stringify(sesion.body), /\$2[aby]\$|ClaveDePrueba/);
  });

  test('la cookie de sesión es httpOnly, SameSite=Strict y limitada a /api', async () => {
    const { cookies } = await iniciarSesion();
    const cookie = cookies.find((c) => c.startsWith('rudel_sesion='));
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
    assert.match(cookie, /Path=\/api/i);
    assert.match(cookie, /Max-Age=|Expires=/i);
  });

  test('el token incluye rol y expiración corta', async () => {
    const { cookies } = await iniciarSesion();
    const valor = decodeURIComponent(cookies.find((c) => c.startsWith('rudel_sesion=')).split(';')[0].split('=')[1]);
    const datos = jwt.decode(valor);
    assert.equal(datos.rol, 'admin');
    assert.ok(datos.exp - datos.iat <= 15 * 60);
  });

  test('un token firmado con otro secreto es rechazado', async () => {
    const falso = jwt.sign({ sub: 'x', rol: 'admin', csrf: 'x' }, 'otro-secreto-que-no-es-el-del-servidor-123456');
    const respuesta = await request(app).get('/api/productos/admin').set('Cookie', `rudel_sesion=${falso}`);
    assert.equal(respuesta.status, 401);
  });

  test('un token sin firma (alg none) es rechazado', async () => {
    const cabecera = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const cuerpo = Buffer.from(JSON.stringify({ sub: 'x', rol: 'admin' })).toString('base64url');
    const respuesta = await request(app).get('/api/productos/admin').set('Cookie', `rudel_sesion=${cabecera}.${cuerpo}.`);
    assert.equal(respuesta.status, 401);
  });

  test('un token expirado es rechazado', async () => {
    const vencido = jwt.sign({ sub: 'x', rol: 'admin', csrf: 'x' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const respuesta = await request(app).get('/api/productos/admin').set('Cookie', `rudel_sesion=${vencido}`);
    assert.equal(respuesta.status, 401);
  });

  test('el mensaje de error del login no revela si el usuario existe', async () => {
    const a = await request(app).post('/api/auth/login').set('Origin', ORIGEN).send({ usuario: 'noexiste', contrasena: 'x'.repeat(12) });
    const b = await request(app).post('/api/auth/login').set('Origin', ORIGEN).send({ usuario: ADMIN.usuario, contrasena: 'x'.repeat(12) });
    assert.equal(a.status, b.status);
    assert.deepEqual(a.body, b.body);
  });
});

describe('Control de acceso por rol', () => {
  test('un token válido con rol distinto de admin recibe 403', async () => {
    const admin = await Administrador.findOne({ usuario: ADMIN.usuario }).lean();
    const cliente = jwt.sign({ sub: String(admin._id), rol: 'cliente', csrf: 'x' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const respuesta = await request(app).get('/api/productos/admin').set('Cookie', `rudel_sesion=${cliente}`);
    assert.equal(respuesta.status, 403);
  });

  test('no existe un endpoint público de registro', async () => {
    const respuesta = await request(app).post('/api/auth/registro').set('Origin', ORIGEN).send({ usuario: 'nuevo', contrasena: 'ClaveDePrueba123', rol: 'admin' });
    assert.equal(respuesta.status, 404);
  });

  test('crear, editar y borrar sin sesión responde 401', async () => {
    const producto = await Producto.findOne().lean();
    for (const [metodo, ruta] of [
      ['post', '/api/productos'],
      ['put', `/api/productos/${producto._id}`],
      ['delete', `/api/productos/${producto._id}`],
      ['post', '/api/categorias'],
    ]) {
      const respuesta = await request(app)[metodo](ruta).set('Origin', ORIGEN).send({});
      assert.equal(respuesta.status, 401, `${metodo} ${ruta}`);
    }
  });
});

describe('Validación de entrada (A06)', () => {
  async function crear(cuerpo) {
    const { agente, csrf } = await iniciarSesion();
    const categoria = (await request(app).get('/api/categorias')).body[0];
    return agente
      .post('/api/productos')
      .set('Origin', ORIGEN)
      .set('X-CSRF-Token', csrf)
      .send({ nombre: 'Prueba', precio: 10000, categoria: categoria._id, tallas: [{ talla: 'M', existencias: 1 }], ...cuerpo });
  }

  test('rechaza existencias negativas', async () => {
    const respuesta = await crear({ tallas: [{ talla: 'M', existencias: -5 }] });
    assert.equal(respuesta.status, 400);
  });

  test('rechaza precio negativo o no numérico', async () => {
    assert.equal((await crear({ precio: -1 })).status, 400);
    const texto = await crear({ precio: 'gratis' });
    assert.equal(texto.status, 400);
    assert.doesNotMatch(JSON.stringify(texto.body), /Cast to|mongoose|type string/i);
  });

  test('ignora campos que el cliente no debería controlar', async () => {
    const respuesta = await crear({ rol: 'admin', _id: '000000000000000000000001', __v: 99 });
    assert.equal(respuesta.status, 201);
    assert.notEqual(respuesta.body._id, '000000000000000000000001');
    assert.equal(respuesta.body.rol, undefined);
  });

  test('rechaza un cuerpo JSON mayor al límite', async () => {
    const respuesta = await crear({ nombre: 'a'.repeat(200000) });
    assert.equal(respuesta.status, 413);
  });
});

describe('Errores y cabeceras', () => {
  test('un id inválido no filtra detalles internos', async () => {
    const respuesta = await request(app).get('/api/productos/no-es-un-id');
    assert.equal(respuesta.status, 400);
    assert.doesNotMatch(JSON.stringify(respuesta.body), /Cast|mongoose|stack|at /i);
  });

  test('una ruta inexistente responde 404 genérico', async () => {
    const respuesta = await request(app).get('/api/no-existe');
    assert.equal(respuesta.status, 404);
  });

  test('no se anuncia el framework y se envía CSP estricta', async () => {
    const respuesta = await request(app).get('/api/categorias');
    assert.equal(respuesta.headers['x-powered-by'], undefined);
    const csp = respuesta.headers['content-security-policy'];
    assert.match(csp, /default-src 'none'|default-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.equal(respuesta.headers['x-content-type-options'], 'nosniff');
  });

  test('CORS no responde a orígenes ajenos', async () => {
    const respuesta = await request(app).get('/api/categorias').set('Origin', 'https://sitio-malicioso.example');
    assert.notEqual(respuesta.headers['access-control-allow-origin'], 'https://sitio-malicioso.example');
    assert.notEqual(respuesta.headers['access-control-allow-origin'], '*');
  });
});

describe('Fuerza bruta', () => {
  test('bloquea con 429 tras 5 intentos fallidos', async () => {
    const estados = [];
    for (let i = 0; i < 8; i++) {
      const r = await request(app).post('/api/auth/login').set('Origin', ORIGEN).send({ usuario: ADMIN.usuario, contrasena: `incorrecta-${i}-xxxx` });
      estados.push(r.status);
    }
    assert.ok(estados.filter((estado) => estado === 401).length <= 5);
    assert.equal(estados.at(-1), 429);
    assert.equal(estados.at(-2), 429);
  });
});
