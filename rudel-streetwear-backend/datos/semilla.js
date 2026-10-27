const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const Administrador = require('../models/Administrador');

const foto = (nombre) => `/productos/${nombre}.webp`;

const categorias = [
  { nombre: 'Oversize', descripcion: 'Camisetas de corte amplio con estampados propios.' },
  { nombre: 'Acid Wash', descripcion: 'Camisetas oversize con lavado ácido: cada pieza queda única.' },
  { nombre: 'Croptops', descripcion: 'Camisetas cortas de corte oversize.' },
  { nombre: 'Esqueletos', descripcion: 'Camisetas sin mangas.' },
];

function productos(c) {
  return [
    {
      nombre: 'Camiseta Hope', categoria: c.Oversize, precio: 89900, color: 'Negro', destacado: true,
      descripcion: 'Camiseta oversize con el estampado Hope: mano pequeña al frente y gráfico grande en la espalda.',
      imagenUrl: foto('hope-frente'), imagenAlternaUrl: foto('hope-espalda'),
      tallas: [{ talla: 'S', existencias: 3 }, { talla: 'M', existencias: 6 }, { talla: 'L', existencias: 4 }, { talla: 'XL', existencias: 2 }],
    },
    {
      nombre: 'Camiseta God Made', categoria: c.Oversize, precio: 89900, color: 'Negro', destacado: true,
      descripcion: 'Camiseta oversize con rosas y serpiente en la espalda. Life · Death · Reborn.',
      imagenUrl: foto('god-made-espalda'), imagenAlternaUrl: foto('god-made-frente'),
      tallas: [{ talla: 'S', existencias: 2 }, { talla: 'M', existencias: 5 }, { talla: 'L', existencias: 3 }],
    },
    {
      nombre: 'Camiseta You Can Do It', categoria: c.Oversize, precio: 84900, color: 'Negro',
      descripcion: 'Camiseta oversize con sol naranja y el mensaje You Can Do It en la espalda.',
      imagenUrl: foto('you-can-do-it-espalda'), imagenAlternaUrl: foto('you-can-do-it-frente'),
      tallas: [{ talla: 'S', existencias: 4 }, { talla: 'M', existencias: 4 }, { talla: 'L', existencias: 0 }],
    },
    {
      nombre: 'Camiseta Freedom', categoria: c.Oversize, precio: 79900, color: 'Blanco',
      descripcion: 'Camiseta oversize blanca con mariposa lila y el estampado Freedom al frente.',
      imagenUrl: foto('freedom-frente'), imagenAlternaUrl: foto('freedom-alterna'),
      tallas: [{ talla: 'S', existencias: 3 }, { talla: 'M', existencias: 3 }, { talla: 'L', existencias: 2 }],
    },
    {
      nombre: 'Camiseta Paradise', categoria: c.Oversize, precio: 79900, color: 'Beige', destacado: true,
      descripcion: 'Camiseta oversize beige con el estampado Welcome to Paradise al frente.',
      imagenUrl: foto('paradise-frente'), imagenAlternaUrl: foto('paradise-detalle'),
      tallas: [{ talla: 'S', existencias: 2 }, { talla: 'M', existencias: 4 }, { talla: 'L', existencias: 0 }],
    },
    {
      nombre: 'Camiseta Acid Wash Carbón', categoria: c['Acid Wash'], precio: 99900, color: 'Carbón', destacado: true,
      descripcion: 'Camiseta oversize con lavado ácido en tono carbón, logo al frente y gráfico grande en la espalda.',
      imagenUrl: foto('acid-wash-carbon-espalda'), imagenAlternaUrl: foto('acid-wash-carbon-frente'),
      tallas: [{ talla: 'M', existencias: 3 }, { talla: 'L', existencias: 4 }, { talla: 'XL', existencias: 2 }],
    },
    {
      nombre: 'Camiseta Acid Wash Gris', categoria: c['Acid Wash'], precio: 99900, color: 'Gris',
      descripcion: 'Camiseta oversize con lavado ácido gris y gráfico de cerezas en la espalda.',
      imagenUrl: foto('acid-wash-gris-espalda'), imagenAlternaUrl: foto('acid-wash-gris-frente'),
      tallas: [{ talla: 'S', existencias: 3 }, { talla: 'M', existencias: 2 }, { talla: 'L', existencias: 0 }],
    },
    {
      nombre: 'Croptop Oversize Basic', categoria: c.Croptops, precio: 59900, color: 'Rosado',
      descripcion: 'Croptop de corte oversize, cuello redondo y manga amplia.',
      imagenUrl: foto('croptop-rosado-frente'), imagenAlternaUrl: foto('croptop-rosado-espalda'),
      tallas: [{ talla: 'XS', existencias: 2 }, { talla: 'S', existencias: 5 }, { talla: 'M', existencias: 3 }],
    },
    {
      nombre: 'Esqueleto Basic', categoria: c.Esqueletos, precio: 49900, color: 'Negro',
      descripcion: 'Esqueleto de cuello redondo con logo pequeño en la espalda.',
      imagenUrl: foto('esqueleto-negro-frente'), imagenAlternaUrl: foto('esqueleto-negro-espalda'),
      tallas: [{ talla: 'S', existencias: 4 }, { talla: 'M', existencias: 4 }, { talla: 'L', existencias: 1 }],
    },
    {
      nombre: 'Esqueleto Basic Blanco', categoria: c.Esqueletos, precio: 49900, color: 'Blanco', activo: false,
      descripcion: 'Esqueleto de cuello redondo. Próximamente.',
      tallas: [{ talla: 'S', existencias: 0 }, { talla: 'M', existencias: 0 }],
    },
  ];
}

async function cargarCatalogo() {
  await Producto.deleteMany({});
  await Categoria.deleteMany({});
  await Categoria.syncIndexes();
  await Producto.syncIndexes();

  const creadas = await Categoria.insertMany(categorias);
  const ids = Object.fromEntries(creadas.map((c) => [c.nombre, c._id]));
  const creados = await Producto.insertMany(productos(ids));
  return { categorias: creadas.length, productos: creados.length };
}

async function guardarAdministrador(usuario, contrasena, nombre = 'Administrador RUDEL') {
  const clave = usuario.trim().toLowerCase();
  const administrador = (await Administrador.findOne({ usuario: clave })) ?? new Administrador({ usuario: clave, nombre });
  administrador.contrasena = contrasena;
  await administrador.save();
  return administrador;
}

async function asegurarAdministrador(usuario, contrasena) {
  const clave = usuario.trim().toLowerCase();
  const existente = await Administrador.findOne({ usuario: clave }).select('+contrasena');
  if (existente && (await existente.compararContrasena(contrasena))) return existente;
  return guardarAdministrador(clave, contrasena);
}

module.exports = { cargarCatalogo, guardarAdministrador, asegurarAdministrador };
