const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('../config/entorno');

const opciones = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API REST de RUDEL Streetwear',
      version: '2.0.0',
      description: [
        'API de la tienda en línea RUDEL Streetwear: categorías, productos con tallas y existencias, y sesiones de administrador y de cliente (cuenta, favoritos y carrito).',
        '',
        '**Consultas públicas:** el catálogo (`GET /api/productos`, `GET /api/productos/{id}`) y las categorías (`GET /api/categorias`) no requieren sesión. El catálogo solo devuelve productos activos.',
        '',
        '**Cómo probar las operaciones de administración desde esta página:**',
        '1. Ejecuta `POST /api/auth/login` con el usuario y la contraseña del administrador. El navegador guarda la cookie `rudel_sesion` automáticamente.',
        '2. Copia el valor `csrfToken` de la respuesta.',
        '3. Pulsa **Authorize**, pega el token en `tokenCsrf` y confirma.',
        '4. Desde ese momento puedes crear, editar y eliminar categorías y productos.',
        '',
        '**Cuenta de cliente:** `POST /api/clientes/registro` crea la cuenta y deja la sesión iniciada (cookie `rudel_cliente`); `POST /api/clientes/login` inicia sesión. Con esa sesión se usan `/api/clientes/favoritos` y `/api/clientes/carrito`, y cada cliente solo puede ver y modificar lo suyo.',
        '',
        '**Seguridad:** toda operación que modifica datos exige la cookie de sesión (401 si falta) y la cabecera `X-CSRF-Token` con el token de esa sesión (403 si falta o no coincide). En producción la API solo atiende por HTTPS y el texto recibido se limpia de etiquetas HTML para evitar XSS.',
      ].join('\n'),
    },
    servers: [{ url: config.apiUrl }],
    tags: [
      { name: 'Autenticación', description: 'Sesión del administrador y token CSRF' },
      { name: 'Clientes', description: 'Cuenta del cliente, favoritos y carrito guardado' },
      { name: 'Categorías', description: 'CRUD de categorías' },
      { name: 'Productos - catálogo público', description: 'Consultas que usa el catálogo de la tienda' },
      { name: 'Productos - administración', description: 'CRUD de productos que usa el panel del administrador' },
    ],
    components: {
      securitySchemes: {
        cookieSesion: {
          type: 'apiKey',
          in: 'cookie',
          name: 'rudel_sesion',
          description: 'Cookie httpOnly que envía el servidor al iniciar sesión. El navegador la adjunta sola.',
        },
        cookieCliente: {
          type: 'apiKey',
          in: 'cookie',
          name: 'rudel_cliente',
          description: 'Cookie httpOnly que envía el servidor al iniciar sesión como cliente. El navegador la adjunta sola.',
        },
        tokenCsrf: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'Valor csrfToken devuelto por el login o por la consulta de sesión (administrador o cliente).',
        },
      },
      parameters: {
        Id: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', example: '66f1c2a4b5e6d7f8a9b0c1d2' },
          description: 'ObjectId del documento',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Datos no válidos' },
            detalles: { type: 'array', items: { type: 'string' }, example: ['El precio no puede ser negativo'] },
          },
        },
        Credenciales: {
          type: 'object',
          required: ['usuario', 'contrasena'],
          properties: {
            usuario: { type: 'string', example: 'admin' },
            contrasena: { type: 'string', format: 'password', example: 'RudelAdmin2026' },
          },
        },
        Sesion: {
          type: 'object',
          properties: {
            administrador: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '66f1c2a4b5e6d7f8a9b0c1aa' },
                usuario: { type: 'string', example: 'admin' },
                nombre: { type: 'string', example: 'Administrador RUDEL' },
              },
            },
            csrfToken: { type: 'string', example: '9f2c4e6a8b0d1f3e5a7c9b1d3f5e7a9c0b2d4f6e8a1c3e5b7d9f0a2c4e6b8d0f' },
          },
        },
        RegistroCliente: {
          type: 'object',
          required: ['nombre', 'correo', 'contrasena'],
          properties: {
            nombre: { type: 'string', minLength: 2, maxLength: 60, example: 'Laura Gómez' },
            correo: { type: 'string', format: 'email', example: 'laura@correo.com' },
            contrasena: { type: 'string', format: 'password', minLength: 8, maxLength: 72, example: 'ClaveSegura2026' },
          },
        },
        CredencialesCliente: {
          type: 'object',
          required: ['correo', 'contrasena'],
          properties: {
            correo: { type: 'string', format: 'email', example: 'laura@correo.com' },
            contrasena: { type: 'string', format: 'password', example: 'ClaveSegura2026' },
          },
        },
        SesionCliente: {
          type: 'object',
          properties: {
            cliente: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '66f1c2a4b5e6d7f8a9b0c1bb' },
                nombre: { type: 'string', example: 'Laura Gómez' },
                correo: { type: 'string', example: 'laura@correo.com' },
              },
            },
            csrfToken: { type: 'string', example: '9f2c4e6a8b0d1f3e5a7c9b1d3f5e7a9c0b2d4f6e8a1c3e5b7d9f0a2c4e6b8d0f' },
          },
        },
        EntradaCarrito: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              maxItems: 50,
              items: {
                type: 'object',
                required: ['productoId', 'talla', 'cantidad'],
                properties: {
                  productoId: { type: 'string', example: '66f1c3b7c8d9e0f1a2b3c4d5' },
                  talla: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL', 'Única'], example: 'M' },
                  cantidad: { type: 'integer', minimum: 1, example: 2 },
                },
              },
            },
          },
        },
        ItemCarrito: {
          type: 'object',
          properties: {
            productoId: { type: 'string', example: '66f1c3b7c8d9e0f1a2b3c4d5' },
            nombre: { type: 'string', example: 'Camiseta Hope' },
            talla: { type: 'string', example: 'M' },
            precioUnitario: { type: 'number', example: 89900 },
            cantidad: { type: 'integer', example: 2 },
            existenciasDisponibles: { type: 'integer', example: 6 },
          },
        },
        CategoriaEntrada: {
          type: 'object',
          required: ['nombre'],
          properties: {
            nombre: { type: 'string', example: 'Oversize' },
            descripcion: { type: 'string', example: 'Camisetas de corte amplio con estampado propio' },
          },
        },
        Categoria: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66f1c2a4b5e6d7f8a9b0c1d2' },
            nombre: { type: 'string', example: 'Oversize' },
            descripcion: { type: 'string', example: 'Camisetas de corte amplio con estampado propio' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CategoriaConConteo: {
          allOf: [
            { $ref: '#/components/schemas/Categoria' },
            {
              type: 'object',
              properties: {
                totalProductos: { type: 'integer', example: 6 },
                productosActivos: { type: 'integer', example: 5 },
              },
            },
          ],
        },
        Talla: {
          type: 'object',
          required: ['talla', 'existencias'],
          properties: {
            talla: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL', 'Única'], example: 'M' },
            existencias: { type: 'integer', minimum: 0, example: 4 },
          },
        },
        ProductoEntrada: {
          type: 'object',
          required: ['nombre', 'precio', 'categoria', 'tallas'],
          properties: {
            nombre: { type: 'string', example: 'Camiseta Hope' },
            descripcion: { type: 'string', example: 'Camiseta oversize negra con estampado Hope en la espalda' },
            precio: { type: 'number', minimum: 0, example: 89900 },
            color: { type: 'string', example: 'Negro' },
            imagenUrl: { type: 'string', description: 'URL http(s) o ruta del sitio que empieza por /', example: '/productos/hope-frente.webp' },
            imagenAlternaUrl: { type: 'string', description: 'Segunda foto (espalda o detalle), opcional', example: '/productos/hope-espalda.webp' },
            categoria: { type: 'string', description: 'Id de la categoría', example: '66f1c2a4b5e6d7f8a9b0c1d2' },
            tallas: {
              type: 'array',
              items: { $ref: '#/components/schemas/Talla' },
              example: [{ talla: 'M', existencias: 4 }, { talla: 'L', existencias: 0 }],
            },
            activo: { type: 'boolean', example: true },
            destacado: { type: 'boolean', example: false },
          },
        },
        Producto: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66f1c3b7c8d9e0f1a2b3c4d5' },
            nombre: { type: 'string', example: 'Camiseta Hope' },
            descripcion: { type: 'string' },
            precio: { type: 'number', example: 89900 },
            color: { type: 'string', example: 'Negro' },
            imagenUrl: { type: 'string', example: '/productos/hope-frente.webp' },
            imagenAlternaUrl: { type: 'string', example: '/productos/hope-espalda.webp' },
            categoria: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                nombre: { type: 'string', example: 'Oversize' },
              },
            },
            tallas: { type: 'array', items: { $ref: '#/components/schemas/Talla' } },
            activo: { type: 'boolean' },
            destacado: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        DatosNoValidos: {
          description: 'Datos no válidos (campos obligatorios, valores negativos, categoría inexistente, etc.)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Datos no válidos', detalles: ['El precio no puede ser negativo'] } } },
        },
        IdNoValido: {
          description: 'El id no tiene un formato válido',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'El id no tiene un formato válido' } } },
        },
        NoAutenticado: {
          description: 'No hay una sesión de administrador activa',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Debes iniciar sesión como administrador' } } },
        },
        CsrfNoValido: {
          description: 'Token CSRF ausente o no válido, u origen de la petición no permitido',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Token CSRF ausente o no válido' } } },
        },
        NoEncontrado: {
          description: 'No existe un documento con ese id',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Producto no encontrado' } } },
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.js')],
};

module.exports = swaggerJsdoc(opciones);
