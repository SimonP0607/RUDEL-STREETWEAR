const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const Administrador = require('../models/Administrador');

const img = (id) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

const categorias = [
  { nombre: 'Camisetas', descripcion: 'Camisetas oversize y boxy fit con estampados propios.' },
  { nombre: 'Hoodies', descripcion: 'Buzos con capucha en algodón perchado.' },
  { nombre: 'Pantalones', descripcion: 'Cargos, joggers y jeans de corte amplio.' },
  { nombre: 'Gorras', descripcion: 'Gorras snapback, dad hats y beanies.' },
  { nombre: 'Accesorios', descripcion: 'Bolsos, medias y complementos.' },
];

function productos(c) {
  return [
    {
      nombre: 'Camiseta Rudel Logo', categoria: c.Camisetas, precio: 69900, color: 'Negro', destacado: true,
      descripcion: 'Camiseta oversize en algodón 100% de 220 g con el logo RUDEL estampado en pecho y espalda.',
      imagenUrl: img('photo-1521572163474-6864f9cf17ab'),
      tallas: [{ talla: 'S', existencias: 5 }, { talla: 'M', existencias: 8 }, { talla: 'L', existencias: 0 }, { talla: 'XL', existencias: 3 }],
    },
    {
      nombre: 'Camiseta Boxy Concrete', categoria: c.Camisetas, precio: 74900, color: 'Blanco hueso',
      descripcion: 'Corte boxy de hombro caído, cuello acanalado grueso y estampado en serigrafía.',
      imagenUrl: img('photo-1583743814966-8936f5b7be1a'),
      tallas: [{ talla: 'M', existencias: 4 }, { talla: 'L', existencias: 2 }, { talla: 'XL', existencias: 0 }],
    },
    {
      nombre: 'Camiseta Graffiti Wash', categoria: c.Camisetas, precio: 79900, color: 'Gris lavado',
      descripcion: 'Tela con lavado ácido para un acabado desgastado. Cada pieza queda única.',
      imagenUrl: img('photo-1576566588028-4147f3842f27'),
      tallas: [{ talla: 'S', existencias: 0 }, { talla: 'M', existencias: 0 }, { talla: 'L', existencias: 6 }],
    },
    {
      nombre: 'Hoodie Rudel Classic', categoria: c.Hoodies, precio: 159900, color: 'Negro', destacado: true,
      descripcion: 'Hoodie oversize en algodón perchado de 380 g, capucha doble y bolsillo canguro.',
      imagenUrl: img('photo-1556821840-3a63f95609a7'),
      tallas: [{ talla: 'S', existencias: 2 }, { talla: 'M', existencias: 6 }, { talla: 'L', existencias: 0 }, { talla: 'XL', existencias: 1 }],
    },
    {
      nombre: 'Hoodie Night Shift', categoria: c.Hoodies, precio: 169900, color: 'Gris jaspe', destacado: true,
      descripcion: 'Bordado frontal en hilo reflectivo y puños con elástico reforzado.',
      imagenUrl: img('photo-1620799140408-edc6dcb6d633'),
      tallas: [{ talla: 'M', existencias: 3 }, { talla: 'L', existencias: 3 }],
    },
    {
      nombre: 'Hoodie Zip Bloque', categoria: c.Hoodies, precio: 179900, color: 'Verde oliva',
      descripcion: 'Hoodie con cremallera completa y paneles de color en las mangas.',
      imagenUrl: img('photo-1578768079052-aa76e52ff62e'),
      tallas: [{ talla: 'S', existencias: 1 }, { talla: 'M', existencias: 0 }, { talla: 'L', existencias: 4 }],
    },
    {
      nombre: 'Cargo Utility', categoria: c.Pantalones, precio: 189900, color: 'Beige', destacado: true,
      descripcion: 'Pantalón cargo de corte amplio con seis bolsillos y bota ajustable con cordón.',
      imagenUrl: img('photo-1624378439575-d8705ad7ae80'),
      tallas: [{ talla: 'S', existencias: 3 }, { talla: 'M', existencias: 5 }, { talla: 'L', existencias: 2 }],
    },
    {
      nombre: 'Jogger Track', categoria: c.Pantalones, precio: 139900, color: 'Negro',
      descripcion: 'Jogger en french terry con franjas laterales y bota con resorte.',
      imagenUrl: img('photo-1552902865-b72c031ac5ea'),
      tallas: [{ talla: 'M', existencias: 0 }, { talla: 'L', existencias: 0 }, { talla: 'XL', existencias: 2 }],
    },
    {
      nombre: 'Snapback Rudel', categoria: c.Gorras, precio: 89900, color: 'Negro',
      descripcion: 'Gorra de visera plana con logo bordado en 3D y cierre snapback.',
      imagenUrl: img('photo-1588850561407-ed78c282e89b'),
      tallas: [{ talla: 'Única', existencias: 10 }],
    },
    {
      nombre: 'Beanie Ribbed', categoria: c.Gorras, precio: 59900, color: 'Naranja',
      descripcion: 'Gorro tejido en punto acanalado con parche RUDEL.',
      imagenUrl: img('photo-1576871337622-98d48d1cf531'),
      tallas: [{ talla: 'Única', existencias: 0 }],
    },
    {
      nombre: 'Bolso Crossbody', categoria: c.Accesorios, precio: 99900, color: 'Negro',
      descripcion: 'Bolso cruzado en lona resistente al agua con correa ajustable.',
      imagenUrl: img('photo-1553062407-98eeb64c6a62'),
      tallas: [{ talla: 'Única', existencias: 7 }],
    },
    {
      nombre: 'Medias Rudel x3', categoria: c.Accesorios, precio: 39900, color: 'Blanco', activo: false,
      descripcion: 'Paquete de tres pares de medias deportivas.',
      imagenUrl: img('photo-1586350977771-b3b0abd50c82'),
      tallas: [{ talla: 'Única', existencias: 12 }],
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
