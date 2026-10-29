const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.API_URL = 'http://localhost:3000';

const app = require('../app');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const { cargarCatalogo, guardarAdministrador } = require('../datos/semilla');

const ORIGEN = 'http://localhost:5173';
const CLAVE = 'ClaveCliente2026';

let mongo;
let contador = 0;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('rudel-clientes'));
  await cargarCatalogo();
  await guardarAdministrador('admin', 'ClaveDePrueba123');
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function nuevoCliente(nombre = 'Laura Gómez') {
  contador += 1;
  const correo = `cliente${contador}@correo.com`;
  const agente = request.agent(app);
  const respuesta = await agente.post('/api/clientes/registro').set('Origin', ORIGEN).send({ nombre, correo, contrasena: CLAVE });
  assert.equal(respuesta.status, 201);
  const galleta = respuesta.headers['set-cookie'].find((c) => c.startsWith('rudel_cliente='));
  return { agente, correo, csrf: respuesta.body.csrfToken, id: respuesta.body.cliente._id, token: galleta.split(';')[0].split('=')[1] };
}

const conCsrf = (peticion, csrf) => peticion.set('Origin', ORIGEN).set('X-CSRF-Token', csrf);

async function productoConStock(nombre) {
  return Producto.findOne({ nombre, activo: true }).lean();
}

describe('Registro e inicio de sesión del cliente', () => {
  test('crea la cuenta, guarda un hash bcrypt y entrega la cookie httpOnly', async () => {
    const respuesta = await request(app)
      .post('/api/clientes/registro')
      .set('Origin', ORIGEN)
      .send({ nombre: 'Ana Torres', correo: 'Ana@Correo.com', contrasena: CLAVE });
    assert.equal(respuesta.status, 201);
    assert.equal(respuesta.body.cliente.correo, 'ana@correo.com');
    assert.equal(respuesta.body.cliente.contrasena, undefined);
    assert.match(respuesta.body.csrfToken, /^[0-9a-f]{64}$/);
    const cookie = respuesta.headers['set-cookie'].find((c) => c.startsWith('rudel_cliente='));
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);

    const guardado = await Cliente.findOne({ correo: 'ana@correo.com' }).select('+contrasena').lean();
    assert.match(guardado.contrasena, /^\$2[aby]\$/);
    assert.notEqual(guardado.contrasena, CLAVE);
  });

  test('valida nombre, correo y contraseña', async () => {
    const enviar = (datos) => request(app).post('/api/clientes/registro').set('Origin', ORIGEN).send(datos);
    assert.equal((await enviar({ nombre: 'Ana', correo: 'correo-sin-arroba', contrasena: CLAVE })).status, 400);
    assert.equal((await enviar({ nombre: 'Ana', correo: 'ana2@correo.com', contrasena: 'corta' })).status, 400);
    assert.equal((await enviar({ nombre: '', correo: 'ana3@correo.com', contrasena: CLAVE })).status, 400);
    assert.equal((await enviar({ nombre: { $gt: '' }, correo: 'ana4@correo.com', contrasena: CLAVE })).status, 400);
  });

  test('no permite dos cuentas con el mismo correo', async () => {
    const cliente = await nuevoCliente();
    const repetido = await request(app)
      .post('/api/clientes/registro')
      .set('Origin', ORIGEN)
      .send({ nombre: 'Otra Persona', correo: cliente.correo, contrasena: CLAVE });
    assert.equal(repetido.status, 409);
  });

  test('limpia el HTML del nombre', async () => {
    contador += 1;
    const respuesta = await request(app)
      .post('/api/clientes/registro')
      .set('Origin', ORIGEN)
      .send({ nombre: '<script>alert(1)</script>Marta', correo: `xss${contador}@correo.com`, contrasena: CLAVE });
    assert.equal(respuesta.status, 201);
    assert.ok(!respuesta.body.cliente.nombre.includes('<'));
    assert.ok(respuesta.body.cliente.nombre.includes('Marta'));
  });

  test('el login rechaza credenciales incorrectas y operadores de MongoDB', async () => {
    const cliente = await nuevoCliente();
    const login = (datos) => request(app).post('/api/clientes/login').set('Origin', ORIGEN).send(datos);
    assert.equal((await login({ correo: cliente.correo, contrasena: 'OtraClave2026' })).status, 401);
    assert.equal((await login({ correo: 'noexiste@correo.com', contrasena: CLAVE })).status, 401);
    assert.equal((await login({ correo: { $ne: '' }, contrasena: { $ne: '' } })).status, 400);
    const correcto = await login({ correo: cliente.correo.toUpperCase(), contrasena: CLAVE });
    assert.equal(correcto.status, 200);
  });

  test('la sesión se recupera y se cierra', async () => {
    const { agente, correo } = await nuevoCliente();
    const sesion = await agente.get('/api/clientes/sesion');
    assert.equal(sesion.status, 200);
    assert.equal(sesion.body.cliente.correo, correo);
    assert.equal((await agente.post('/api/clientes/logout').set('Origin', ORIGEN)).status, 204);
    assert.equal((await agente.get('/api/clientes/sesion')).status, 401);
  });
});

describe('Favoritos', () => {
  test('exigen sesión de cliente y token CSRF', async () => {
    const hope = await productoConStock('Camiseta Hope');
    assert.equal((await request(app).get('/api/clientes/favoritos')).status, 401);
    assert.equal((await request(app).post(`/api/clientes/favoritos/${hope._id}`).set('Origin', ORIGEN)).status, 401);

    const { agente } = await nuevoCliente();
    const sinToken = await agente.post(`/api/clientes/favoritos/${hope._id}`).set('Origin', ORIGEN);
    assert.equal(sinToken.status, 403);
  });

  test('agregar, no duplicar, listar y quitar', async () => {
    const hope = await productoConStock('Camiseta Hope');
    const paradise = await productoConStock('Camiseta Paradise');
    const { agente, csrf } = await nuevoCliente();

    assert.equal((await conCsrf(agente.post(`/api/clientes/favoritos/${hope._id}`), csrf)).status, 204);
    assert.equal((await conCsrf(agente.post(`/api/clientes/favoritos/${hope._id}`), csrf)).status, 204);
    assert.equal((await conCsrf(agente.post(`/api/clientes/favoritos/${paradise._id}`), csrf)).status, 204);

    const lista = await agente.get('/api/clientes/favoritos');
    assert.equal(lista.status, 200);
    assert.deepEqual(lista.body.map((p) => p.nombre), ['Camiseta Hope', 'Camiseta Paradise']);
    assert.equal(lista.body[0].categoria.nombre, 'Oversize');

    assert.equal((await conCsrf(agente.delete(`/api/clientes/favoritos/${hope._id}`), csrf)).status, 204);
    const despues = await agente.get('/api/clientes/favoritos');
    assert.deepEqual(despues.body.map((p) => p.nombre), ['Camiseta Paradise']);
  });

  test('rechaza ids mal formados y productos que no existen', async () => {
    const { agente, csrf } = await nuevoCliente();
    assert.equal((await conCsrf(agente.post('/api/clientes/favoritos/abc'), csrf)).status, 400);
    const inexistente = new mongoose.Types.ObjectId();
    assert.equal((await conCsrf(agente.post(`/api/clientes/favoritos/${inexistente}`), csrf)).status, 404);
  });

  test('cada cliente solo ve sus propios favoritos', async () => {
    const hope = await productoConStock('Camiseta Hope');
    const uno = await nuevoCliente();
    const dos = await nuevoCliente();
    await conCsrf(uno.agente.post(`/api/clientes/favoritos/${hope._id}`), uno.csrf);
    assert.equal((await uno.agente.get('/api/clientes/favoritos')).body.length, 1);
    assert.equal((await dos.agente.get('/api/clientes/favoritos')).body.length, 0);
  });
});

describe('Carrito guardado', () => {
  test('exige sesión de cliente y token CSRF', async () => {
    assert.equal((await request(app).get('/api/clientes/carrito')).status, 401);
    const { agente } = await nuevoCliente();
    const sinToken = await agente.put('/api/clientes/carrito').set('Origin', ORIGEN).send({ items: [] });
    assert.equal(sinToken.status, 403);
  });

  test('guarda el carrito, suma duplicados y limita a las existencias', async () => {
    const hope = await productoConStock('Camiseta Hope');
    const existenciasM = hope.tallas.find((t) => t.talla === 'M').existencias;
    const { agente, csrf } = await nuevoCliente();

    const respuesta = await conCsrf(agente.put('/api/clientes/carrito'), csrf).send({
      items: [
        { productoId: String(hope._id), talla: 'M', cantidad: 2 },
        { productoId: String(hope._id), talla: 'M', cantidad: 500 },
        { productoId: String(hope._id), talla: 'S', cantidad: 1 },
      ],
    });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.length, 2);
    const itemM = respuesta.body.find((i) => i.talla === 'M');
    assert.equal(itemM.cantidad, existenciasM);
    assert.equal(itemM.precioUnitario, hope.precio);
    assert.equal(itemM.existenciasDisponibles, existenciasM);

    const guardado = await agente.get('/api/clientes/carrito');
    assert.deepEqual(guardado.body, respuesta.body);
  });

  test('descarta tallas agotadas, tallas inexistentes y productos que no existen', async () => {
    const youCanDoIt = await productoConStock('Camiseta You Can Do It');
    const { agente, csrf } = await nuevoCliente();
    const respuesta = await conCsrf(agente.put('/api/clientes/carrito'), csrf).send({
      items: [
        { productoId: String(youCanDoIt._id), talla: 'L', cantidad: 1 },
        { productoId: String(youCanDoIt._id), talla: 'XS', cantidad: 1 },
        { productoId: String(new mongoose.Types.ObjectId()), talla: 'M', cantidad: 1 },
        { productoId: String(youCanDoIt._id), talla: 'M', cantidad: 1 },
      ],
    });
    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body.map((i) => i.talla), ['M']);
  });

  test('rechaza un carrito mal formado', async () => {
    const hope = await productoConStock('Camiseta Hope');
    const { agente, csrf } = await nuevoCliente();
    const enviar = (cuerpo) => conCsrf(agente.put('/api/clientes/carrito'), csrf).send(cuerpo);
    assert.equal((await enviar({ items: 'hola' })).status, 400);
    assert.equal((await enviar({ items: [{ productoId: 'abc', talla: 'M', cantidad: 1 }] })).status, 400);
    assert.equal((await enviar({ items: [{ productoId: String(hope._id), talla: 'M', cantidad: -2 }] })).status, 400);
    assert.equal((await enviar({ items: [{ productoId: String(hope._id), talla: 'M', cantidad: 1.5 }] })).status, 400);
    assert.equal((await enviar({ items: [{ productoId: { $ne: null }, talla: 'M', cantidad: 1 }] })).status, 400);
  });

  test('cada cliente solo ve su propio carrito', async () => {
    const hope = await productoConStock('Camiseta Hope');
    const uno = await nuevoCliente();
    const dos = await nuevoCliente();
    await conCsrf(uno.agente.put('/api/clientes/carrito'), uno.csrf).send({ items: [{ productoId: String(hope._id), talla: 'M', cantidad: 1 }] });
    assert.equal((await uno.agente.get('/api/clientes/carrito')).body.length, 1);
    assert.deepEqual((await dos.agente.get('/api/clientes/carrito')).body, []);
  });
});

describe('Separación entre cliente y administrador', () => {
  test('la sesión de un cliente no sirve para administrar el catálogo', async () => {
    const { agente, csrf } = await nuevoCliente();
    const crear = await conCsrf(agente.post('/api/categorias'), csrf).send({ nombre: 'Intento' });
    assert.equal(crear.status, 401);
    assert.equal((await agente.get('/api/productos/admin')).status, 401);
  });

  test('la sesión del administrador no sirve para las rutas del cliente', async () => {
    const agente = request.agent(app);
    const login = await agente.post('/api/auth/login').set('Origin', ORIGEN).send({ usuario: 'admin', contrasena: 'ClaveDePrueba123' });
    assert.equal(login.status, 200);
    assert.equal((await agente.get('/api/clientes/carrito')).status, 401);
    assert.equal((await agente.get('/api/clientes/sesion')).status, 401);
  });

  test('un token de cliente copiado en la cookie del administrador es rechazado', async () => {
    const { token } = await nuevoCliente();
    const respuesta = await request(app).get('/api/productos/admin').set('Cookie', `rudel_sesion=${token}`);
    assert.equal(respuesta.status, 401);
  });
});
