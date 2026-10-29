const fs = require('fs');
const http = require('http');
const https = require('https');
const config = require('./config/entorno');

function redireccionHttp(puertoHttps) {
  return (req, res) => {
    const servidor = (req.headers.host || 'localhost').replace(/:\d+$/, '');
    res.writeHead(301, { Location: `https://${servidor}:${puertoHttps}${req.url}` });
    res.end();
  };
}

function iniciarServidores(app) {
  if (!config.httpsLocal) {
    return [
      http.createServer(app).listen(config.puerto, () => {
        console.log(`Servidor en http://localhost:${config.puerto}`);
        console.log(`Documentación en ${config.apiUrl}/api-docs`);
      }),
    ];
  }

  const opciones = { key: fs.readFileSync(config.archivoClave), cert: fs.readFileSync(config.archivoCertificado) };
  return [
    https.createServer(opciones, app).listen(config.puertoHttps, () => {
      console.log(`Servidor seguro en https://localhost:${config.puertoHttps}`);
      console.log(`Documentación en ${config.apiUrl}/api-docs`);
    }),
    http.createServer(redireccionHttp(config.puertoHttps)).listen(config.puerto, () => {
      console.log(`http://localhost:${config.puerto} redirige a https://localhost:${config.puertoHttps}`);
    }),
  ];
}

module.exports = { iniciarServidores, redireccionHttp };
