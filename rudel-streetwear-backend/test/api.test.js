const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'secreto-de-prueba-solo-para-las-pruebas-automaticas';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.API_URL = 'http://localhost:3000';

const app = require('../app');
const Producto = require('../models/Producto');
const { cargarCatalogo, guardarAdministrador } = require('../datos/semilla');

const ADMIN = { usuario: 'admin', contrasena: 'ClaveDePrueba123' };
const ORIGEN = 'http://localhost:5173';

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('rudel-test'));
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
  return { agente, csrf: respuesta.body.csrfToken };
}

describe('Catálogo público', () => {
  test('lista solo productos activos con su categoría', async () => {
    const respuesta = await request(app).get('/api/productos');
    assert.equal(respuesta.status, 200);
    assert.ok(respuesta.body.length > 0);
    assert.ok(respuesta.body.every((producto) => producto.activo));
    assert.ok(respuesta.body.every((producto) => typeof producto.categoria?.nombre === 'string'));
  });

  test('el filtro por categoría devuelve solo productos de esa categoría', async () => {
    const categorias = await request(app).get('/api/categorias');
    const acidWash = categorias.body.find((categoria) => categoria.nombre === 'Acid Wash');
    const respuesta = await request(app).get(`/api/productos?categoria=${acidWash._id}`);
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.length, 2);
    assert.equal(respuesta.body.length, acidWash.productosActivos);
    assert.ok(respuesta.body.every((producto) => producto.categoria._id === acidWash._id));
  });

  test('rechaza un id de categoría mal formado', async () => {
    const respuesta = await request(app).get('/api/productos?categoria=abc');
    assert.equal(respuesta.status, 400);
  });

  test('un producto inactivo no aparece en el detalle público', async () => {
    const inactivo = await Producto.findOne({ activo: false }).lean();
    const respuesta = await request(app).get(`/api/productos/${inactivo._id}`);
    assert.equal(respuesta.status, 404);
  });
});

describe('Autenticación', () => {
  test('rechaza credenciales incorrectas', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({ usuario: 'admin', contrasena: 'incorrecta' });
    assert.equal(respuesta.status, 401);
  });

  test('rechaza operadores de MongoDB en el login', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({ usuario: { $ne: null }, contrasena: { $ne: null } });
    assert.equal(respuesta.status, 400);
  });

  test('el login entrega una cookie httpOnly y el token CSRF', async () => {
    const respuesta = await request(app).post('/api/auth/login').send(ADMIN);
    assert.equal(respuesta.status, 200);
    const cookie = respuesta.headers['set-cookie'].join(';');
    assert.match(cookie, /rudel_sesion=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
    assert.equal(typeof respuesta.body.csrfToken, 'string');
    assert.equal(respuesta.body.administrador.usuario, 'admin');
  });

  test('la sesión se puede recuperar y cerrar', async () => {
    const { agente, csrf } = await iniciarSesion();
    const sesion = await agente.get('/api/auth/sesion');
    assert.equal(sesion.status, 200);
    assert.equal(sesion.body.csrfToken, csrf);
    const cierre = await agente.post('/api/auth/logout').set('Origin', ORIGEN);
    assert.equal(cierre.status, 204);
    const despues = await agente.get('/api/auth/sesion');
    assert.equal(despues.status, 401);
  });
});

describe('Protección de operaciones que modifican datos', () => {
  test('sin sesión responde 401', async () => {
    const respuesta = await request(app).post('/api/categorias').send({ nombre: 'Sin sesión' });
    assert.equal(respuesta.status, 401);
  });

  test('las rutas de administración también exigen sesión', async () => {
    const respuesta = await request(app).get('/api/productos/admin');
    assert.equal(respuesta.status, 401);
  });

  test('con sesión pero sin token CSRF responde 403', async () => {
    const { agente } = await iniciarSesion();
    const respuesta = await agente.post('/api/categorias').set('Origin', ORIGEN).send({ nombre: 'Sin token' });
    assert.equal(respuesta.status, 403);
  });

  test('con un token CSRF distinto responde 403', async () => {
    const { agente } = await iniciarSesion();
    const respuesta = await agente
      .post('/api/categorias')
      .set('Origin', ORIGEN)
      .set('X-CSRF-Token', 'f'.repeat(64))
      .send({ nombre: 'Token falso' });
    assert.equal(respuesta.status, 403);
  });

  test('desde un origen no permitido responde 403', async () => {
    const { agente, csrf } = await iniciarSesion();
    const respuesta = await agente
      .post('/api/categorias')
      .set('Origin', 'https://sitio-malicioso.example')
      .set('X-CSRF-Token', csrf)
      .send({ nombre: 'Ataque' });
    assert.equal(respuesta.status, 403);
  });
});

describe('Mitigación de XSS', () => {
  test('elimina etiquetas HTML y scripts del texto recibido', async () => {
    const { agente, csrf } = await iniciarSesion();
    const respuesta = await agente
      .post('/api/categorias')
      .set('Origin', ORIGEN)
      .set('X-CSRF-Token', csrf)
      .send({ nombre: '<img src=x onerror=alert(1)>Chaquetas', descripcion: '<script>alert("xss")</script>Abrigos' });
    assert.equal(respuesta.status, 201);
    assert.equal(respuesta.body.nombre, 'Chaquetas');
    assert.equal(respuesta.body.descripcion, 'Abrigos');
  });

  test('rechaza URLs de imagen con javascript:', async () => {
    const { agente, csrf } = await iniciarSesion();
    const categorias = await request(app).get('/api/categorias');
    const respuesta = await agente
      .post('/api/productos')
      .set('Origin', ORIGEN)
      .set('X-CSRF-Token', csrf)
      .send({
        nombre: 'Producto malicioso',
        precio: 1000,
        categoria: categorias.body[0]._id,
        imagenUrl: 'javascript:alert(1)',
        tallas: [{ talla: 'M', existencias: 1 }],
      });
    assert.equal(respuesta.status, 400);
  });

  test('acepta rutas de imagen del propio sitio y rechaza rutas de otro dominio', async () => {
    const { agente, csrf } = await iniciarSesion();
    const categorias = await request(app).get('/api/categorias');
    const base = { precio: 1000, categoria: categorias.body[0]._id, tallas: [{ talla: 'M', existencias: 1 }] };
    const enviar = (cuerpo) => agente.post('/api/productos').set('Origin', ORIGEN).set('X-CSRF-Token', csrf).send({ ...base, ...cuerpo });

    const local = await enviar({ nombre: 'Foto local', imagenUrl: '/productos/hope-frente.webp', imagenAlternaUrl: '/productos/hope-espalda.webp' });
    assert.equal(local.status, 201);
    assert.equal(local.body.imagenAlternaUrl, '/productos/hope-espalda.webp');

    const otroDominio = await enviar({ nombre: 'Foto externa', imagenUrl: '//sitio-malicioso.example/x.png' });
    assert.equal(otroDominio.status, 400);

    await agente.delete(`/api/productos/${local.body._id}`).set('Origin', ORIGEN).set('X-CSRF-Token', csrf);
  });

  test('envía cabeceras de seguridad', async () => {
    const respuesta = await request(app).get('/api/salud');
    assert.ok(respuesta.headers['content-security-policy']);
    assert.equal(respuesta.headers['x-content-type-options'], 'nosniff');
    assert.ok(respuesta.headers['x-frame-options']);
  });
});

describe('CRUD de categorías y productos', () => {
  test('ciclo completo de una categoría', async () => {
    const { agente, csrf } = await iniciarSesion();
    const enviar = (metodo, ruta) => agente[metodo](ruta).set('Origin', ORIGEN).set('X-CSRF-Token', csrf);

    const creada = await enviar('post', '/api/categorias').send({ nombre: 'Chaquetas Test', descripcion: 'Prueba' });
    assert.equal(creada.status, 201);

    const repetida = await enviar('post', '/api/categorias').send({ nombre: 'chaquetas test' });
    assert.equal(repetida.status, 409);

    const editada = await enviar('put', `/api/categorias/${creada.body._id}`).send({ nombre: 'Chaquetas Editadas' });
    assert.equal(editada.status, 200);
    assert.equal(editada.body.nombre, 'Chaquetas Editadas');

    const eliminada = await enviar('delete', `/api/categorias/${creada.body._id}`);
    assert.equal(eliminada.status, 204);

    const consulta = await request(app).get(`/api/categorias/${creada.body._id}`);
    assert.equal(consulta.status, 404);
  });

  test('no permite eliminar una categoría con productos', async () => {
    const { agente, csrf } = await iniciarSesion();
    const categorias = await request(app).get('/api/categorias');
    const conProductos = categorias.body.find((categoria) => categoria.totalProductos > 0);
    const respuesta = await agente
      .delete(`/api/categorias/${conProductos._id}`)
      .set('Origin', ORIGEN)
      .set('X-CSRF-Token', csrf);
    assert.equal(respuesta.status, 409);
  });

  test('ciclo completo de un producto', async () => {
    const { agente, csrf } = await iniciarSesion();
    const enviar = (metodo, ruta) => agente[metodo](ruta).set('Origin', ORIGEN).set('X-CSRF-Token', csrf);
    const categorias = await request(app).get('/api/categorias');
    const categoria = categorias.body[0];

    const creado = await enviar('post', '/api/productos').send({
      nombre: 'Camiseta de prueba',
      precio: 50000,
      categoria: categoria._id,
      tallas: [{ talla: 'M', existencias: 3 }],
    });
    assert.equal(creado.status, 201);
    assert.equal(creado.body.categoria.nombre, categoria.nombre);

    const invalido = await enviar('put', `/api/productos/${creado.body._id}`).send({ precio: -5 });
    assert.equal(invalido.status, 400);
    assert.ok(Array.isArray(invalido.body.detalles));

    const editado = await enviar('put', `/api/productos/${creado.body._id}`).send({ precio: 45000 });
    assert.equal(editado.body.precio, 45000);

    const oculto = await enviar('patch', `/api/productos/${creado.body._id}/activo`).send({ activo: false });
    assert.equal(oculto.body.activo, false);
    const publico = await request(app).get(`/api/productos/${creado.body._id}`);
    assert.equal(publico.status, 404);

    const todos = await agente.get('/api/productos/admin');
    assert.ok(todos.body.some((producto) => producto._id === creado.body._id));

    const eliminado = await enviar('delete', `/api/productos/${creado.body._id}`);
    assert.equal(eliminado.status, 204);
  });
});

describe('Documentación', () => {
  test('expone la especificación OpenAPI con los esquemas de seguridad', async () => {
    const respuesta = await request(app).get('/api-docs.json');
    assert.equal(respuesta.status, 200);
    assert.ok(respuesta.body.paths['/api/auth/login']);
    assert.ok(respuesta.body.components.securitySchemes.tokenCsrf);
  });

  test('sirve la interfaz de Swagger UI', async () => {
    const respuesta = await request(app).get('/api-docs/');
    assert.equal(respuesta.status, 200);
    assert.match(respuesta.text, /swagger-ui/);
  });
});

describe('Cuenta del administrador', () => {
  test('al cambiar la contraseña en las variables de entorno se actualiza la cuenta', async () => {
    const { asegurarAdministrador } = require('../datos/semilla');
    await asegurarAdministrador('admin', 'NuevaClave2026');
    const anterior = await request(app).post('/api/auth/login').send(ADMIN);
    assert.equal(anterior.status, 401);
    const nueva = await request(app).post('/api/auth/login').send({ usuario: 'admin', contrasena: 'NuevaClave2026' });
    assert.equal(nueva.status, 200);
    await asegurarAdministrador('admin', ADMIN.contrasena);
  });
});
