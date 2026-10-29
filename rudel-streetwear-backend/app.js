const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/entorno');
const swaggerSpec = require('./docs/swagger');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const { forzarHttps, cabecerasSeguridad, verificarOrigen, sanitizarEntrada } = require('./middlewares/seguridad');
const { limiteGeneral } = require('./middlewares/limitador');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/manejadorErrores');

const app = express();

app.set('trust proxy', config.proxiesConfiables);

app.use(forzarHttps);
app.use(cabecerasSeguridad);
app.use(
  cors({
    origin: config.origenesPermitidos,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(verificarOrigen);
app.use(sanitizarEntrada);

app.get('/api/salud', (req, res) => res.json({ estado: 'ok' }));
app.get('/api', (req, res) => {
  res.json({ mensaje: 'API REST de RUDEL Streetwear', documentacion: '/api-docs' });
});

app.use('/api', limiteGeneral);
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);

app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'API RUDEL Streetwear',
    swaggerOptions: { withCredentials: true, persistAuthorization: true },
  })
);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
