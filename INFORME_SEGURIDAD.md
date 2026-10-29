**Laboratorio de Seguridad — RUDEL Streetwear**

**Desarrollo de Aplicaciones Web · Universidad Pontificia Bolivariana**

**Integrantes:** Simón Pérez Gómez · Andrés Santiago Ayala Mantilla · José David Soria Rojas

# 1. Parte 0 — Preparación y diagnóstico inicial

| **Pregunta**                                                     | **Qué se buscó**                                          | **Sí / No** | **Resultado de la revisión**                                                                                                                                                                  |
|------------------------------------------------------------------|-----------------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ¿Hay contraseñas guardadas tal cual?                             | Campo de contraseña que se guarda sin hash                | No          | El modelo Administrador aplica bcrypt (10 rondas) antes de guardar.                                                                                                                           |
| ¿Hay credenciales en el código?                                  | mongodb+srv, password, secret, apikey                     | Sí          | config/entorno.js tenía un valor por defecto para JWT_SECRET escrito en el código, y el ejemplo de contraseña de la documentación Swagger coincidía con la contraseña real del administrador. |
| ¿Hay archivos de secretos en git?                                | git ls-files con .env o similares                         | No          | Solo se versionan los dos .env.example (sin valores reales).                                                                                                                                  |
| ¿Hay secretos en el historial de git?                            | git log --all -S"mongodb+srv" y búsqueda de la contraseña | Sí          | El commit d724fbf contiene la contraseña del administrador (ejemplo de Swagger). La cadena de Atlas del historial es solo el marcador USUARIO:CONTRASENA.                                     |
| ¿Se muestra texto de usuarios como HTML?                         | innerHTML, outerHTML, document.write, v-html              | No          | Sin resultados en todo el repositorio; las vistas Vue interpolan con {{ }}.                                                                                                                   |
| ¿Se puede ver un recurso de otro usuario cambiando el id?        | Rutas /:id sin comprobar propietario                      | No aplica   | No existen cuentas de clientes ni pedidos: no hay recursos «de alguien». El catálogo es público de lectura.                                                                                   |
| ¿Las rutas de administrador solo están «ocultas» en el frontend? | Botones escondidos pero endpoint sin verificar rol        | No          | Las rutas de escritura exigen sesión y token CSRF en el servidor. Pero la sesión no llevaba rol: bastaba con que el administrador existiera.                                                  |
| ¿CORS está abierto a cualquier origen?                           | cors() sin opciones o origin: "\*"                        | No          | Lista blanca de orígenes con credentials: true.                                                                                                                                               |
| ¿El proyecto usa HTTP simple?                                    | Se abre con http://                                       | Sí          | En producción Render y Vercel sirven HTTPS, pero en desarrollo el servidor escuchaba solo en http://localhost:3000.                                                                           |

La rama de trabajo se creó con git checkout -b seguridad antes de modificar nada, para poder volver atrás si algo se dañaba; la rama master conserva el proyecto tal como se entregó en el examen final.

```powershell
PS C:\Users\simon_zkmbj72\...\RUDEL STREETWEAR SIMON> git branch
  master
* seguridad
PS C:\Users\simon_zkmbj72\...\RUDEL STREETWEAR SIMON> git status -sb
## seguridad
 M .gitignore
 M rudel-streetwear-backend/config/entorno.js
 M rudel-streetwear-backend/controllers/authController.js
 M rudel-streetwear-backend/middlewares/autenticacion.js
 M rudel-streetwear-backend/middlewares/seguridad.js
?? rudel-streetwear-backend/servidor.js
?? INFORME_SEGURIDAD.md
...
```

*Figura 1. Rama seguridad activa (git branch) y archivos modificados respecto a master (git status).*

# 2. Parte 1 — HTTPS local

**Idea.** Con HTTPS el contenido viaja cifrado y el navegador comprueba el certificado. En desarrollo se usa un certificado emitido por mkcert, en el que el propio computador confía.

## 2.1 Certificado

Se generó con mkcert en la carpeta certs/ de la raíz del repositorio, y se agregó al .gitignore (certs/, \*.pem, \*.key) para que la clave privada nunca se suba.

> mkcert -install
>
> mkdir certs
>
> mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1

## 2.2 Activar HTTPS en Express

```js
// servidor.js
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
```

*Figura 2. servidor.js: servidor HTTPS en 3443 y redirección 301 desde HTTP en 3000.*

config/entorno.js detecta los certificados y, solo en ese caso, activa tres cosas coherentes entre sí: la cookie de sesión con la bandera Secure, la cabecera HSTS con vigencia de **300 segundos** (5 minutos, como pide el laboratorio para no «contaminar» otros proyectos en localhost) y las URL del frontend y la API en https://. En producción el HSTS es de un año (31536000 s) y la redirección a HTTPS la hace forzarHttps detrás del proxy de Render.

## 2.3 Comprobación

[Captura del navegador: https://localhost:3443 con candado y visor del certificado]

*Figura 3. https://localhost:3443 abierto con HTTPS y detalle del certificado*

Al abrir https://localhost:3443 el navegador muestra el candado y, en el detalle del certificado, el dominio (localhost), la organización «mkcert development certificate» y la vigencia (del 30 de abril de 2026 al 29 de abril de 2027). En este equipo el visor muestra como emisor la raíz del antivirus instalado, que inspecciona las conexiones HTTPS y vuelve a firmar el certificado; el certificado de la aplicación es el generado con mkcert.

Al escribir http://localhost:3000 el servidor responde 301 con Location: https://localhost:3443, de modo que el navegador termina en HTTPS, y las respuestas HTTPS llevan la cabecera Strict-Transport-Security: max-age=300.

```powershell
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sI http://localhost:3000/api/categorias
HTTP/1.1 301 Moved Permanently
Location: https://localhost:3443/api/categorias
Connection: keep-alive

PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -skI https://localhost:3443/api/categorias | Select-String "HTTP/1.1|Strict-Transport|X-Content-Type"
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=300
X-Content-Type-Options: nosniff
```

*Figura 4. Redirección 301 de HTTP (puerto 3000) a HTTPS (puerto 3443) y cabecera HSTS de 300 segundos.*

**Pregunta: ¿qué dos garantías da HTTPS que HTTP no da? ¿Garantiza que el sitio sea honesto?**

HTTPS da, primero, confidencialidad e integridad: el contenido viaja cifrado, de modo que alguien en la misma red (una wifi pública, por ejemplo) no puede leer la contraseña del administrador ni la cookie de sesión, y tampoco puede modificar la respuesta en el camino (British Airways, visto en clase, mostró lo que pasa cuando el JavaScript de una página se altera). Segundo, autenticidad del servidor: el certificado, firmado por una autoridad en la que el navegador confía, demuestra que se está hablando con el dominio que se escribió y no con un impostor que se interpone. HTTP no ofrece ninguna de las dos cosas.

No garantiza que el sitio sea honesto. El certificado prueba la identidad del dominio y la privacidad del canal, no las intenciones de quien lo opera: un sitio de phishing puede tener candado y certificado válido, y un sitio legítimo con HTTPS puede tener un XSS o una base de datos expuesta. HTTPS es necesario, pero no suficiente: por eso el resto del laboratorio.

# 3. Parte 2 — Contraseñas con hash, login, token y límite de intentos

**Idea.** Nunca se guarda la contraseña sino su hash lento con sal. Al iniciar sesión se compara y se entrega un token firmado con vencimiento, guardado en una cookie HttpOnly que JavaScript no puede leer: así un XSS no se la lleva.

## 3.1 Paquetes

El proyecto ya usaba jsonwebtoken, cookie-parser y express-rate-limit. En lugar de bcrypt se usa bcryptjs (misma familia de algoritmo, implementado en JavaScript puro, lo que evita compilar módulos nativos en Windows y en Render); produce hashes con el prefijo \$2a\$.

## 3.2 Contraseña con hash (adaptación del «registro»)

La tienda no tiene registro público: el alcance del proyecto es que **solo el administrador inicia sesión** y los clientes navegan y compran como visitantes. El único administrador se crea desde las variables de entorno ADMIN_USUARIO y ADMIN_CONTRASENA mediante el script de semilla. Las reglas del laboratorio se aplican en el servidor, en el modelo: el texto se valida (mínimo **10 caracteres**) y se guarda con bcrypt de **12 rondas** antes de persistir. El rol lo asigna el servidor (admin) y nunca viene del cuerpo de una petición.

```js
// models/Administrador.js
administradorSchema.pre('save', async function () {
  if (!this.isModified('contrasena')) return;
  this.contrasena = await bcrypt.hash(this.contrasena, config.rondasBcrypt);
});

administradorSchema.methods.compararContrasena = function (texto) {
  return bcrypt.compare(texto, this.contrasena);
};
```

*Figura 5. models/Administrador.js: el hook pre('save') genera el hash con config.rondasBcrypt (12) y compararContrasena usa bcrypt.compare.*

**Prueba:** se consultó la base de datos para ver cómo quedó guardada la contraseña. Es una cadena larga que empieza por \$2a\$12\$ (algoritmo bcrypt, 12 rondas, sal incluida) y nunca la clave original.

```powershell
# usuario de prueba; contraseña original: ClaveDePrueba123
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> mongosh "mongodb://localhost:27017/rudel" --quiet --eval "db.administradors.findOne({}, {_id:0, usuario:1, rol:1, contrasena:1})"
{
  usuario: 'admin',
  rol: 'admin',
  contrasena: '$2a$12$1orJZdfdfjG2.f5Fl.WioOidLQEE3kLfx5a7J2ZshCqIKKCpjXZOu'
}
```

*Figura 6. Documento del administrador en MongoDB: la contraseña es un hash bcrypt de 12 rondas.*

## 3.3 Login que entrega el token

El controlador valida que usuario y contraseña sean texto (esto detiene los intentos de inyección NoSQL como {"\$gt":""}), busca al administrador y compara. Si el usuario no existe compara contra un hash ficticio para que la respuesta tarde lo mismo y no se pueda enumerar usuarios por el tiempo de respuesta. El mensaje es genérico, «Usuario o contraseña incorrectos», sin decir cuál de los dos falló. Cada fallo queda en el registro del servidor.

```js
// controllers/authController.js
async function iniciarSesion(req, res) {
  const { usuario, contrasena } = req.body ?? {};
  if (typeof usuario !== 'string' || typeof contrasena !== 'string' || !usuario.trim() || !contrasena) {
    throw new HttpError(400, 'Usuario y contraseña son obligatorios');
  }

  const administrador = await Administrador.findOne({ usuario: usuario.trim().toLowerCase() }).select('+contrasena');
  const valida = administrador
    ? await administrador.compararContrasena(contrasena)
    : await bcrypt.compare(contrasena, HASH_FICTICIO);

  if (!administrador || !valida) {
    registrarEvento('login_fallido', { ip: req.ip, usuario: usuario.trim().toLowerCase().slice(0, 60) });
    throw new HttpError(401, 'Usuario o contraseña incorrectos');
  }

  const csrfToken = crearSesion(res, administrador);
  res.json({ administrador: datosPublicos(administrador), csrfToken });
}
```

*Figura 7. controllers/authController.js: validación de tipos, hash ficticio, mensaje genérico y registro del evento login_fallido.*

El token es un JWT firmado con JWT_SECRET que lleva el id, el usuario, el **rol** y el token CSRF, con vencimiento de **15 minutos** (el original duraba 8 horas). Se guarda en la cookie rudel_sesion con las tres banderas: HttpOnly (JavaScript no la lee), Secure (solo viaja por HTTPS) y SameSite=Strict (el navegador no la envía desde otros sitios), limitada a la ruta /api. Si a la sesión le queda menos de la mitad del tiempo, el servidor la renueva (sesión deslizante), de modo que un administrador activo no se desconecta pero una sesión abandonada vence.

```js
// middlewares/autenticacion.js

const opcionesCookie = () => ({
  httpOnly: true,
  secure: config.cookieSegura,
  sameSite: 'strict',
  path: '/api',
});

function emitirToken(res, datos) {
  const token = jwt.sign(datos, config.jwtSecreto, { expiresIn: SEGUNDOS_SESION });
  res.cookie(NOMBRE_COOKIE, token, { ...opcionesCookie(), maxAge: SEGUNDOS_SESION * 1000 });
}

function crearSesion(res, administrador) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  emitirToken(res, {
    sub: String(administrador._id),
    usuario: administrador.usuario,
    nombre: administrador.nombre,
    rol: administrador.rol,
    csrf: csrfToken,
  });
  return csrfToken;
}
```

*Figura 8. middlewares/autenticacion.js: opciones de la cookie, emisión del token con vencimiento y creación de la sesión con rol y token CSRF.*

```powershell
# 1) Contraseña incorrecta y usuario inexistente: mismo mensaje y mismo código
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/auth/login -H "Content-Type: application/json" -d '{\"usuario\":\"admin\",\"contrasena\":\"incorrecta-123456\"}'
{"error":"Usuario o contraseña incorrectos"}
HTTP 401
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/auth/login -H "Content-Type: application/json" -d '{\"usuario\":\"noexiste\",\"contrasena\":\"incorrecta-123456\"}'
{"error":"Usuario o contraseña incorrectos"}
HTTP 401
# 2) Credenciales correctas: 200 y cookie con las tres banderas
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -i -c jar.txt -X POST https://localhost:3443/api/auth/login -H "Content-Type: application/json" -d '{\"usuario\":\"admin\",\"contrasena\":\"ClaveDePrueba123\"}' | Select-String "HTTP/1.1|Set-Cookie"
HTTP/1.1 200 OK
Set-Cookie: rudel_sesion=eyJhbGciOiJIUzI1…; Max-Age=900; Path=/api; Expires=Thu, 29 Oct 2026 03:27:57 GMT; HttpOnly; Secure; SameSite=Strict
# 3) Ruta privada sin sesión y con sesión
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" https://localhost:3443/api/productos/admin
{"error":"Debes iniciar sesión como administrador"}
HTTP 401
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -o NUL -w "HTTP %{http_code}\n" https://localhost:3443/api/productos/admin
HTTP 200
```

*Figura 9. Login: dos fallos con el mismo mensaje y el mismo código 401; login correcto con cookie HttpOnly; Secure; SameSite=Strict; ruta privada 401 sin sesión y 200 con sesión.*

[Captura F12 → Application → Cookies: rudel_sesion con HttpOnly ✓, Secure ✓, SameSite Strict, Path /api]

*Figura 10. F12 → Application → Cookies: la cookie rudel_sesion con HttpOnly y Secure marcadas, SameSite Strict y Path /api.*

**Prueba de que HttpOnly funciona.** Con el navegador real (Chromium controlado con Playwright) se inició sesión desde el frontend y se leyó document.cookie: la cookie rudel_sesion **no aparece**, aunque el navegador sí la tiene guardada con httpOnly: true, secure: true y sameSite: Strict.

```powershell
> document.cookie
< ''
> document.cookie.includes('rudel_sesion')
< false
```

*Figura 11. document.cookie devuelve una cadena vacía: la cookie de sesión no es accesible desde JavaScript.*

## 3.4 Proteger rutas con el token

requiereAdmin lee la cookie, verifica la firma **fijando el algoritmo HS256** (así un token con alg: none se rechaza) y comprueba que el administrador del token todavía exista en la base de datos. Las rutas que modifican datos o son privadas (crear, editar, borrar, listar /admin) lo usan; el catálogo y las categorías siguen siendo públicos. Las pruebas automáticas confirman que un token firmado con otro secreto, un token sin firma y un token vencido reciben 401 (véase el anexo).

## 3.5 Limitar intentos de login

El limitador permite **5 intentos fallidos por IP cada 15 minutos**; los inicios correctos no cuentan. El sexto responde 429 y se registra login_bloqueado.

```js
// middlewares/limitador.js
});

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.intentosLogin,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: respuesta('Demasiados intentos de inicio de sesión, espera 15 minutos'),
  handler: (req, res, next, opciones) => {
    registrarEvento('login_bloqueado', { ip: req.ip });
    res.status(opciones.statusCode).json(opciones.message);
  },
});
```

*Figura 12. middlewares/limitador.js: límite de 5 intentos, ventana de 15 minutos y registro del bloqueo.*

```powershell
# Seis intentos seguidos con una clave incorrecta
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> 1..6 | ForEach-Object { "intento $_ -> " + (curl.exe -sk -w " HTTP %{http_code}" -X POST https://localhost:3443/api/auth/login -H "Content-Type: application/json" -d '{\"usuario\":\"admin\",\"contrasena\":\"incorrecta-123456\"}') }
intento 1 -> {"error":"Usuario o contraseña incorrectos"} HTTP 401
intento 2 -> {"error":"Usuario o contraseña incorrectos"} HTTP 401
intento 3 -> {"error":"Usuario o contraseña incorrectos"} HTTP 401
intento 4 -> {"error":"Usuario o contraseña incorrectos"} HTTP 401
intento 5 -> {"error":"Usuario o contraseña incorrectos"} HTTP 401
intento 6 -> {"error":"Demasiados intentos de inicio de sesión, espera 15 minutos"} HTTP 429
```

*Figura 13. Los cinco primeros intentos fallidos responden 401; el sexto responde 429.*

```powershell
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> npm start
> rudel-streetwear-backend@1.0.0 start
> node index.js

Conectado a MongoDB Atlas (base de datos: rudel)
Servidor seguro en https://localhost:3443
Documentación en https://localhost:3443/api-docs
http://localhost:3000 redirige a https://localhost:3443
{"fecha":"2026-10-29T03:04:57.070Z","evento":"login_fallido","ip":"127.0.0.1","usuario":"admin"}
{"fecha":"2026-10-29T03:04:57.427Z","evento":"login_fallido","ip":"127.0.0.1","usuario":"admin"}
{"fecha":"2026-10-29T03:04:57.787Z","evento":"login_fallido","ip":"127.0.0.1","usuario":"admin"}
{"fecha":"2026-10-29T03:04:58.157Z","evento":"login_fallido","ip":"127.0.0.1","usuario":"admin"}
{"fecha":"2026-10-29T03:04:58.528Z","evento":"login_fallido","ip":"127.0.0.1","usuario":"admin"}
{"fecha":"2026-10-29T03:04:58.545Z","evento":"login_bloqueado","ip":"127.0.0.1"}
```

*Figura 14. Registro del servidor: cada fallo y el bloqueo quedan como eventos en JSON con fecha, IP y usuario intentado.*

# 4. Parte 3 — Roles y control de acceso

**Idea.** Autenticarse no basta: hay que decidir qué puede hacer cada rol, siempre en el servidor. Esconder un botón en el frontend no es seguridad.

## 4.1 Proteger las rutas por rol

```js
// middlewares/autenticacion.js
  } catch {
    return null;
  }
}

async function requiereAdmin(req, res, next) {
  const sesion = leerSesion(req);
  if (!sesion) throw new HttpError(401, 'Debes iniciar sesión como administrador');
  const existe = await Administrador.exists({ _id: sesion.sub });
  if (!existe) {
    cerrarSesion(res);
    throw new HttpError(401, 'La sesión ya no es válida');
  }
  req.sesion = sesion;
  renovarSiCorresponde(res, sesion);
  next();
}

const requiereRol =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.sesion?.rol)) {
      registrarEvento('permiso_denegado', { ip: req.ip, usuario: req.sesion?.usuario, rol: req.sesion?.rol, ruta: req.originalUrl });
      throw new HttpError(403, 'Sin permiso');
    }
    next();
  };
```

*Figura 15. middlewares/autenticacion.js: requiereAdmin (sesión válida) y requiereRol (rol permitido, 403 y registro si no).*

```powershell
# 1) Cliente: token válido y firmado, pero con rol "cliente"
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" -X DELETE https://localhost:3443/api/productos/6ae2b6e11f14f927ffc3bbfd -H "Origin: https://localhost:4173" -H "X-CSRF-Token: x" -b "rudel_sesion=<token con rol cliente>"
{"error":"Sin permiso"}
HTTP 403
# 2) Visitante sin sesión
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" -X DELETE https://localhost:3443/api/productos/6ae2b6e11f14f927ffc3bbfd -H "Origin: https://localhost:4173"
{"error":"Debes iniciar sesión como administrador"}
HTTP 401
# 3) Administrador autenticado, con su token CSRF
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -o NUL -w "HTTP %{http_code}\n" -X DELETE https://localhost:3443/api/productos/6ae2b6e11f14f927ffc3bbfd -b jar.txt -H "Origin: https://localhost:4173" -H "X-CSRF-Token: $csrf"
HTTP 204
# 4) Registro público enviando "rol":"admin"
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/auth/registro -H "Content-Type: application/json" -d '{\"usuario\":\"hacker\",\"contrasena\":\"ClaveLarga12345\",\"rol\":\"admin\"}'
{"error":"Ruta no encontrada: POST /api/auth/registro"}
HTTP 404
```

*Figura 16. Un token válido con rol «cliente» recibe 403; sin sesión, 401; el administrador borra con 204; no existe endpoint de registro (404).*

Para la prueba del primer caso se firmó con el secreto del servidor un token de un usuario existente pero con rol: "cliente": la firma es válida y aun así el servidor lo rechaza, porque autenticar no basta.

## 4.2 IDOR (ver el recurso de otro)

**No aplica en este proyecto.** El IDOR requiere recursos que pertenezcan a un usuario concreto (el pedido de A consultado por B). La tienda no guarda pedidos ni tiene cuentas de clientes: el carrito vive únicamente en el navegador del visitante, y los productos y categorías son públicos de lectura. El único recurso privado, el listado /api/productos/admin, es exclusivo del administrador y no depende de ningún id elegido por el cliente. Se dejó constancia en el diagnóstico y se probó lo que sí existe: que nadie sin el rol correcto pueda leer o modificar.

# 5. Parte 4 — XSS: demostrar, corregir y reforzar

## 5.1 Demostrar el ataque

Se buscaron en el frontend todos los lugares donde se muestran textos escritos por el administrador (nombre y descripción de producto, categorías). La búsqueda de v-html, innerHTML, outerHTML y document.write no arrojó resultados (búsqueda global con Ctrl + Shift + F y con git grep). Aun así se probó el ataque con el texto de la guía, por las dos rutas posibles.

**Ruta 1: por la API.** Se publicó un producto con HTML activo en el nombre y la descripción. El servidor sanitiza toda entrada con la librería xss (lista blanca vacía): elimina las etiquetas y descarta por completo el contenido de \<script\>.

```powershell
# xss.json: nombre = Camiseta <img src=x onerror="alert(1)"> Prueba · descripcion = <script>alert(1)</script>Texto
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -H "Origin: https://localhost:4173" -H "X-CSRF-Token: $csrf" -d "@xss.json" | ConvertFrom-Json | Select-Object nombre, descripcion
nombre            descripcion
------            -----------
Camiseta  Prueba  Texto

# Cabeceras de seguridad de la respuesta
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -skI https://localhost:3443/api/categorias | Select-String "content-security|strict-transport|x-content-type|x-frame|referrer|cross-origin"
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'none';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=300
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

*Figura 17. POST con \<img onerror\> y \<script\>: el producto se guarda con el HTML eliminado. Debajo, las cabeceras de seguridad de la respuesta.*

**Ruta 2: saltándose el filtro del servidor.** Para comprobar que la defensa no depende de una sola capa, se insertó el texto \<img src=x onerror="alert('XSS')"\> **directamente en la base de datos**, como si el filtro hubiera fallado, y se abrió el catálogo real en el navegador. Se ve como texto literal, no se creó ningún elemento \<img\> ni se disparó ninguna alerta, porque Vue escapa lo que interpola.

[Captura del navegador: el catálogo muestra el payload como texto, sin alerta]

*Figura 18. El catálogo muestra el payload como texto (la tipografía lo pone en mayúsculas); no hay alerta.*

```powershell
> document.querySelectorAll('img[onerror]').length
< 0
> document.querySelector('.catalogo').innerText.includes('<IMG SRC=X')
< true
```

*Figura 19. Resultado medido en la consola del navegador: 0 elementos \<img onerror\> creados en el catálogo.*

## 5.2 Corregir

La regla es «todo dato de usuario es texto, no HTML»: el frontend solo usa interpolación {{ }} (equivalente a textContent) y no existe ningún v-html. En el servidor, sanitizarEntrada recorre recursivamente el cuerpo de cada petición: aplica el filtro xss a los textos, descarta las claves que empiezan por \$ o contienen . (operadores de MongoDB) y excluye únicamente el campo de contraseña para no alterarla. Además verificarOrigen rechaza las peticiones que modifican datos desde un origen no permitido.

```js
// middlewares/seguridad.js
function verificarOrigen(req, res, next) {
  if (METODOS_SEGUROS.has(req.method)) return next();
  const origen = req.get('origin');
  if (!origen || config.origenesPermitidos.includes(origen)) return next();
  registrarEvento('origen_rechazado', { ip: req.ip, origen, metodo: req.method, ruta: req.originalUrl });
  res.status(403).json({ error: 'Origen no permitido' });
}

function limpiar(valor, clave) {
  if (typeof valor === 'string') {
    return CAMPOS_SIN_SANITIZAR.has(clave) ? valor : filtroXss.process(valor).trim();
  }
  if (Array.isArray(valor)) return valor.map((elemento) => limpiar(elemento));
  if (valor && typeof valor === 'object') {
    const limpio = {};
    for (const [k, v] of Object.entries(valor)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      limpio[k] = limpiar(v, k);
    }
    return limpio;
  }
  return valor;
}

function sanitizarEntrada(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = limpiar(req.body);
  next();
}
```

*Figura 20. middlewares/seguridad.js: verificación de origen y sanitización recursiva de la entrada.*

## 5.3 Reforzar con cabeceras y CSP

Se configuró helmet con una Content-Security-Policy explícita: solo se ejecutan scripts del propio origen (script-src 'self'), no se permiten manejadores en línea (script-src-attr 'none'), ni plugins (object-src 'none'), ni que otro sitio incruste la página (frame-ancestors 'none'). HSTS usa 300 s en el laboratorio. El frontend publica su propia CSP por vercel.json y por una etiqueta \<meta\> que se inyecta en el build, más Permissions-Policy y Cross-Origin-Opener-Policy.

```js
// middlewares/seguridad.js
const cabecerasSeguridad = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: config.hstsSegundos ? { maxAge: config.hstsSegundos, includeSubDomains: config.produccion } : false,
  crossOriginResourcePolicy: { policy: 'same-site' },
});
```

*Figura 21. middlewares/seguridad.js: helmet con CSP explícita y HSTS tomado de la configuración.*

**Prueba de la defensa en profundidad.** Se inyectó en la página, con insertAdjacentHTML, un \<img onerror\> (lo que haría un innerHTML vulnerable). Con la CSP activa el navegador lo bloquea y lo informa en la consola; la misma inyección en una página sin CSP sí ejecuta el código. Eso demuestra por qué se necesita la segunda capa.

```powershell
https://localhost:4173  (con CSP)
> document.body.insertAdjacentHTML('beforeend', '<img src=x onerror="window.__xss=1">')
< undefined
Executing inline event handler violates the following Content Security Policy directive 'script-src 'self''. Either the 'unsafe-inline' keyword, a hash ('sha256-...'), or a nonce ('nonce-...') is required to enable inline execution. Note that hashes do not apply to event handlers, style attributes and javascript: navigation unless the 'unsafe-hashes' keyword is present. The action has been blocked.
> window.__xss
< undefined

about:blank  (misma inyección, sin CSP)
> document.body.insertAdjacentHTML('beforeend', '<img src=x onerror="window.__xss=1">')
< undefined
> window.__xss
< 1
```

*Figura 22. Con CSP el manejador onerror queda bloqueado; sin CSP se ejecuta.*

[Captura F12 → Network → Response Headers de GET /api/categorias: Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security max-age=300]

*Figura 23. F12 → Network → Response Headers de GET /api/categorias: Content-Security-Policy, X-Content-Type-Options y Strict-Transport-Security.*

# 6. Parte 5 — CSRF

**Idea.** Como la sesión va en una cookie, el navegador la envía solo, incluso desde una página maliciosa. Se defiende con SameSite en la cookie y con un token anti-CSRF que solo conoce la página legítima.

## 6.1 Estrategia usada y diferencia con la guía

La guía propone doble envío de cookie (una cookie csrf legible por JavaScript que se copia a una cabecera). El proyecto ya implementaba una variante más fuerte, el **token sincronizado**: al iniciar sesión el servidor genera un token aleatorio de 32 bytes, lo guarda **dentro del JWT firmado** (no en una cookie legible) y se lo entrega al frontend en la respuesta del login; el frontend lo guarda en memoria y lo envía en la cabecera X-CSRF-Token en cada POST, PUT, PATCH y DELETE. El servidor compara con timingSafeEqual. Se mantuvo esta estrategia porque cubre el mismo riesgo sin exponer el token en document.cookie y sin depender de que ningún subdominio hermano pueda plantar una cookie. A esto se suma la verificación de la cabecera Origin.

```js
// middlewares/autenticacion.js
function tokensIguales(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

function verificarCsrf(req, res, next) {
  if (METODOS_SEGUROS.has(req.method)) return next();
  const recibido = req.get('x-csrf-token');
  if (!recibido || !req.sesion?.csrf || !tokensIguales(recibido, req.sesion.csrf)) {
    registrarEvento('csrf_rechazado', { ip: req.ip, usuario: req.sesion?.usuario, metodo: req.method, ruta: req.originalUrl });
    throw new HttpError(403, 'Token CSRF ausente o no válido');
  }
  next();
}
```

*Figura 24. middlewares/autenticacion.js: comparación en tiempo constante del token recibido contra el que va dentro de la sesión firmada.*

```ts
// src/services/http.ts
export async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const metodo = (opciones.method ?? 'GET').toUpperCase()
  const encabezados = new Headers(opciones.headers)
  if (opciones.body !== undefined) encabezados.set('Content-Type', 'application/json')
  if (!METODOS_SEGUROS.has(metodo) && tokenCsrf) encabezados.set('X-CSRF-Token', tokenCsrf)

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, method: metodo, headers: encabezados, credentials: 'include' })
```

*Figura 25. Frontend (services/http.ts): el token se agrega a toda petición que no sea GET, HEAD u OPTIONS, con credentials: include.*

## 6.2 Comprobar: ataque.html

Se creó el archivo ataque.html fuera del proyecto, con un formulario que envía un POST a https://localhost:3443/api/productos, y se sirvió desde otro origen (http://localhost:9000) mientras la sesión de administrador estaba abierta en el mismo navegador.

> \<form action="https://localhost:3443/api/productos" method="POST" enctype="text/plain"\>
>
> \<input name='{"nombre":"producto-del-atacante","precio":1,"tallas":\[...\],"x":"' value='"}'\>
>
> \</form\>
>
> \<script\>document.forms\[0\].submit()\</script\>

Resultado: el servidor rechazó la petición y **no se creó ningún producto** (10 antes, 10 después). Esta es la capa 1: el navegador ya no adjunta la cookie por SameSite=Strict y, además, la cabecera Origin del atacante no está en la lista blanca.

[Captura del navegador: ataque.html abierto desde http://localhost:9000 → {"error":"Origen no permitido"}]

*Figura 26. Lo que ve el navegador al abrir ataque.html: «Origen no permitido».*

```powershell
# Productos antes de abrir ataque.html (servido desde http://localhost:9000, con la sesión de administrador abierta)
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> (curl.exe -sk https://localhost:3443/api/productos | ConvertFrom-Json).Count
10
# ... se abre ataque.html: el navegador muestra {"error":"Origen no permitido"}
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> (curl.exe -sk https://localhost:3443/api/productos | ConvertFrom-Json).Count
10
# Registro del servidor
{"fecha":"2026-10-29T03:04:38.029Z","evento":"origen_rechazado","ip":"127.0.0.1","origen":"http://localhost:9000","metodo":"POST","ruta":"/api/productos"}
```

*Figura 27. Cantidad de productos antes y después de abrir ataque.html (10 y 10) y evento origen_rechazado en el registro del servidor.*

**Capa 2.** Para probar el token de forma independiente se simuló el peor caso: que la cookie sí llegara (por ejemplo, un navegador que ignora SameSite). Con la cookie válida pero **sin token** o con un token **incorrecto**, el servidor responde 403; con el token correcto, desde el frontend legítimo, la creación funciona (201).

```powershell
# Capa 2: aunque la cookie de sesión llegara (SameSite ignorado), sin token correcto se rechaza
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -d "@producto.json" -H "Origin: https://localhost:4173"
{"error":"Token CSRF ausente o no válido"}
HTTP 403
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -d "@producto.json" -H "Origin: https://localhost:4173" -H "X-CSRF-Token: 00000000"
{"error":"Token CSRF ausente o no válido"}
HTTP 403
# Desde la página del atacante
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -d "@producto.json" -H "Origin: http://localhost:9000"
{"error":"Origen no permitido"}
HTTP 403
# Desde el frontend legítimo, con el token correcto
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -d "@producto.json" -H "Origin: https://localhost:4173" -H "X-CSRF-Token: $csrf"
HTTP 201
```

*Figura 28. Sin token y con token incorrecto: 403; desde el origen del atacante: 403; desde el frontend legítimo con el token correcto: 201.*

[Captura F12 → Network → Request Headers de PUT /api/productos/{id}: X-Csrf-Token presente]

*Figura 29. F12 → Network → Request Headers de PUT /api/productos/{id} hecho desde el frontend: lleva la cabecera X-Csrf-Token.*

**Pregunta: si ya usan SameSite=Strict, ¿por qué se añade además el token?**

Porque ninguna defensa es perfecta y cada una falla por razones distintas, y la seguridad se construye por capas. Primero, SameSite lo aplica el navegador: versiones antiguas o configuraciones especiales lo ignoran, y el servidor no puede comprobar que se aplicó. Segundo, SameSite define «mismo sitio» por dominio registrable, de modo que una página comprometida en un subdominio hermano (por ejemplo, un blog. o un entorno de pruebas) sí enviaría la cookie. Tercero, hay caminos legítimos de navegación de nivel superior donde el comportamiento de Lax/Strict genera excepciones, y errores de configuración que cambian la bandera sin que nadie lo note. El token exige un secreto que solo conoce la página legítima, de modo que si una capa falla la otra sigue protegiendo; la prueba de la capa 2 lo demuestra.

# 7. Parte 6 — Secretos, CORS, errores y dependencias

## 7.1 Secretos fuera del código

Todo lo secreto (cadena de Atlas, JWT_SECRET, credenciales del administrador) va en .env, que está en el .gitignore; .env.example documenta qué variables hacen falta sin valores reales. El secreto del token se genera con el comando de la guía:

> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

Se eliminó el valor por defecto de JWT_SECRET que estaba escrito en el código. Ahora es **obligatorio y de al menos 32 caracteres**: si falta o es corto, el servidor no arranca y el mensaje explica cómo generarlo.

```js
// config/entorno.js
const fs = require('fs');
const path = require('path');

const produccion = process.env.NODE_ENV === 'production';
const puerto = Number(process.env.PORT) || 3000;
const puertoHttps = Number(process.env.PUERTO_HTTPS) || 3443;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Falta JWT_SECRET en el archivo .env (mínimo 32 caracteres). Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
}

const carpetaCertificados = path.resolve(__dirname, '..', '..', 'certs');
```

*Figura 30. config/entorno.js: el servidor falla al arrancar si JWT_SECRET falta o tiene menos de 32 caracteres.*

```powershell
# .env sin JWT_SECRET
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> node index.js
Falta JWT_SECRET en el archivo .env (mínimo 32 caracteres). Genera uno con: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# JWT_SECRET demasiado corto
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> $env:JWT_SECRET="corto"; node index.js
Falta JWT_SECRET en el archivo .env (mínimo 32 caracteres). Genera uno con: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

*Figura 31. Arranque sin JWT_SECRET o con uno corto: mensaje claro y el proceso termina.*

**Búsqueda de secretos ya subidos.** git log --all -S"mongodb+srv" solo encuentra el marcador de .env.example, pero la búsqueda de la contraseña del administrador encontró el commit d724fbf (Figura 32): estaba en el ejemplo de la documentación Swagger. Es exactamente el caso que la guía describe: **no basta con borrarla, hay que rotarla**. Se reemplazó el ejemplo por un valor ficticio y se anotó como hallazgo A04/A02; la rotación de la contraseña en Render y en el .env local es el paso que cierra el hallazgo.

Los secretos reales (.env y los certificados de certs/) están ignorados por git, y solo los dos .env.example están versionados.

```powershell
# Solo los .env.example están versionados
PS C:\Users\simon_zkmbj72\...\RUDEL STREETWEAR SIMON> git ls-files | Select-String "\.env|\.pem|\.key"
rudel-streetwear-backend/.env.example
rudel-streetwear-frontend/.env.example
# El .env real y los certificados están ignorados (regla y línea del .gitignore)
PS C:\Users\simon_zkmbj72\...\RUDEL STREETWEAR SIMON> git check-ignore -v rudel-streetwear-backend/.env certs/key.pem certs/cert.pem
rudel-streetwear-backend/.gitignore:2:.env   rudel-streetwear-backend/.env
.gitignore:12:certs/   certs/key.pem
.gitignore:12:certs/   certs/cert.pem
# Búsqueda de secretos ya subidos al historial
PS C:\Users\simon_zkmbj72\...\RUDEL STREETWEAR SIMON> git log --all --oneline -S"mongodb+srv"
d724fbf CAMBIOS BACKEND
```

*Figura 32. Solo los .env.example están versionados, .env y certs/ están ignorados, y la búsqueda en el historial encuentra el commit d724fbf.*

## 7.2 Configuración de Atlas

Se revisaron dos puntos del panel de Atlas:

- **Network Access.** El servicio corre en Render con plan gratuito, que usa direcciones IP salientes dinámicas; por eso no es posible dejar solo una IP y la lista permite 0.0.0.0/0. Se documenta como **riesgo aceptado y mitigado** (contraseña larga y rotada, usuario con permiso mínimo, ver la matriz de riesgos). Si se pasa a un plan con IP fija se debe cerrar.

- **Database Access.** La aplicación se conecta con un usuario dedicado, rudel_app, que tiene únicamente el rol readWrite sobre la base rudel; el usuario anterior tenía atlasAdmin sobre todos los recursos y ya no lo usa la aplicación (Figura 34).

[Captura Atlas → Network Access → IP Access List: 0.0.0.0/0 activo junto a tres IP puntuales]

*Figura 33. Atlas → Network Access → IP Access List: 0.0.0.0/0 activo (riesgo aceptado por las IP dinámicas de Render) junto a tres IP puntuales.*

[Captura Atlas → Database Access → Database Users: rudel_app con readWrite@rudel; usuario anterior con atlasAdmin@admin sin uso en la aplicación]

*Figura 34. Atlas → Database Access → Database Users: rudel_app con readWrite@rudel; el usuario anterior conserva atlasAdmin y no lo usa la aplicación.*

## 7.3 CORS con orígenes específicos

El CORS ya estaba restringido: origin toma la lista blanca construida con FRONTEND_URL y API_URL, credentials: true, y solo se permiten las cabeceras Content-Type y X-CSRF-Token y los métodos que la API usa (app.js). Una prueba automática confirma que un origen ajeno no recibe Access-Control-Allow-Origin, ni \*.

## 7.4 Errores genéricos hacia afuera, detalle en el registro

El manejador de errores devuelve mensajes controlados y, para cualquier fallo inesperado, un 500 genérico mientras el detalle (fecha, método, URL y traza) va únicamente al registro del servidor. Express 5 ya propaga los errores de funciones async al manejador, por lo que no hace falta envolver cada controlador. Al probar el caso de un precio de tipo incorrecto se descubrió una **fuga menor**: la respuesta incluía el texto interno de Mongoose («Cast to Number failed for value…, type string»). Se corrigió para que devuelva un mensaje propio.

```powershell
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" https://localhost:3443/api/productos/no-es-un-id
{"error":"El id no tiene un formato válido"}
HTTP 400
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" https://localhost:3443/api/no-existe
{"error":"Ruta no encontrada: GET /api/no-existe"}
HTTP 404
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/auth/login -H "Content-Type: application/json" -d "{mal formado"
{"error":"El cuerpo de la petición no es un JSON válido"}
HTTP 400
# Inyección NoSQL en el login
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/auth/login -H "Content-Type: application/json" -d '{\"usuario\":{\"$gt\":\"\"},\"contrasena\":{\"$gt\":\"\"}}'
{"error":"Usuario y contraseña son obligatorios"}
HTTP 400
```

*Figura 35. Id mal formado, ruta inexistente, JSON inválido e inyección NoSQL: respuestas controladas, sin rutas de archivos ni trazas.*

Prueba del manejador: para ver el detalle solo en el servidor se detuvo la base de datos y se pidió el catálogo. El cliente recibe un 500 genérico y la terminal del servidor conserva fecha, método, URL y traza.

```powershell
# Se detiene la base de datos y se pide el catálogo: error inesperado
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -w "\nHTTP %{http_code}\n" https://localhost:3443/api/productos
{"error":"Error interno del servidor"}
HTTP 500

# Terminal donde corre el servidor: el detalle queda solo aquí
2026-10-29T14:04:08.530Z GET /api/productos MongoNotConnectedError: Client must be connected before running operations
    at autoConnect (C:\Users\simon_zkmbj72\...\rudel-streetwear-backend\node_modules\mongodb\lib\operations\execute_operation.js:98:19)
    at executeOperation (C:\Users\simon_zkmbj72\...\rudel-streetwear-backend\node_modules\mongodb\lib\operations\execute_operation.js:40:40)
    at FindCursor._initialize (C:\Users\simon_zkmbj72\...\rudel-streetwear-backend\node_modules\mongodb\lib\cursor\find_cursor.js:62:73)
    at model.Query._find (C:\Users\simon_zkmbj72\...\rudel-streetwear-backend\node_modules\mongoose\lib\query.js:2430:27) {
  errorLabelSet: Set(0) {}
}
```

*Figura 36. Error inesperado: mensaje genérico hacia afuera y detalle solo en la terminal del servidor.*

## 7.5 Dependencias

npm audit sobre el package-lock.json de master encontró **3 vulnerabilidades en el backend** (1 alta en body-parser, 2 moderadas en fast-uri y qs) y **3 en el frontend** (1 crítica en shell-quote, 2 altas en source-map-js y vite). Se aplicó npm audit fix, que corrige sin romper compatibilidad, y se repitió la auditoría: 0 vulnerabilidades en ambos proyectos. Las pruebas del backend y la compilación del frontend se volvieron a ejecutar después del cambio.

```powershell
# Backend, package-lock.json de master (antes de corregir)
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> npm audit
body-parser   high      Denial of Service via trailing bytes after a compressed request body
fast-uri      moderate  URI scheme spoofing via percent-encoded scheme decoding
qs            moderate  qs.stringify arrayFormat comma: uncaught TypeError (DoS)
3 vulnerabilities (2 moderate, 1 high)
# Frontend (antes de corregir)
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-frontend> npm audit
shell-quote   critical  quote() command injection via a line terminator in a token
source-map-js high      event-loop denial of service via indexed source-map section offsets
vite          high      launch-editor: escapeCmdArgs() omits % escaping on Windows
3 vulnerabilities (2 high, 1 critical)
# Después de npm audit fix
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> npm audit fix; npm audit
found 0 vulnerabilities
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-frontend> npm audit fix; npm audit
found 0 vulnerabilities
```

*Figura 37. Auditoría de dependencias antes (master) y después de npm audit fix.*

De nivel alto o crítico aparecieron en total 1 crítica (shell-quote, en el frontend) y 3 altas (body-parser, source-map-js y vite). npm outdated lista además los paquetes con una versión más reciente; no son vulnerabilidades pendientes (la auditoría da 0) y se actualizan con las pruebas en la mano.

```powershell
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> npm outdated
Package   Current  Wanted  Latest  Location               Depended by
bcryptjs    2.4.3   2.4.3   3.0.3  node_modules/bcryptjs  back
dotenv     16.6.1  16.6.1  18.0.9  node_modules/dotenv    back
express     5.2.1   5.3.0   5.3.0  node_modules/express   back
mongoose   8.24.5  8.24.7  9.11.4  node_modules/mongoose  back
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-frontend> npm outdated
Package                Current       Wanted   Latest  Location                         Depended by
@playwright/test        1.63.0       1.64.1   1.64.1  node_modules/@playwright/test    front
@types/node            24.13.6      24.19.2   26.6.6  node_modules/@types/node         front
@vitejs/plugin-vue       6.0.9       6.0.10   6.0.10  node_modules/@vitejs/plugin-vue  front
npm-run-all2             9.0.3        9.0.4    9.0.4  node_modules/npm-run-all2        front
sass                   1.105.0      1.107.0  1.107.0  node_modules/sass                front
typescript               6.0.3        6.0.3    7.0.2  node_modules/typescript          front
vue                 3.6.0-rc.9  3.6.0-rc.13   3.5.44  node_modules/vue                 front
vue-router               5.3.1        5.4.0    5.4.0  node_modules/vue-router          front
vue-tsc                 3.3.11       3.3.13   3.3.13  node_modules/vue-tsc             front
```

*Figura 38. npm outdated en el backend y en el frontend.*

# 8. Parte 7 — Auditoría OWASP Top 10 (2025)

| **OWASP**                          | **Pregunta de revisión**                                               | **Resultado en RUDEL Streetwear**                                                                                                                                       | **Dónde**       |
|------------------------------------|------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| A01 Control de acceso roto         | ¿Cada ruta verifica rol y propietario en el servidor?                  | Sí. Sesión + rol + CSRF en cada ruta privada; sin endpoint de registro; IDOR no aplica (no hay recursos por propietario).                                               | Parte 3         |
| A02 Configuración insegura         | ¿CORS, DEBUG, Atlas y cabeceras están bien?                            | CORS y cabeceras sí. Atlas con 0.0.0.0/0 por IP dinámicas de Render: riesgo aceptado. La fuga de mensajes de Mongoose se corrigió.                                      | Partes 4 y 6    |
| A03 Cadena de suministro           | ¿Se auditaron las dependencias?                                        | Sí: 6 vulnerabilidades antes, 0 después de npm audit fix.                                                                                                               | Parte 6.5       |
| A04 Fallas criptográficas          | ¿HTTPS? ¿Hash lento? ¿Secretos fuera del código?                       | HTTPS local y en producción; bcrypt de 12 rondas; JWT_SECRET obligatorio. Hallazgo: contraseña real en el ejemplo de Swagger (corregido en código, pendiente de rotar). | Partes 1, 2 y 6 |
| A05 Inyección (incluye XSS)        | ¿Salida escapada y entradas validadas por tipo?                        | Sí. Validación de tipos en login, operadores \$ descartados, sanitización XSS y Vue escapa la salida.                                                                   | Partes 2 y 4    |
| A06 Diseño inseguro                | ¿Hay lógica abusable (cantidades negativas, cupones)?                  | Probado: se rechazan valores negativos y de tipo incorrecto; se ignoran campos de más. No hay cupones ni totales calculados en el servidor.                             | 7.1             |
| A07 Fallas de autenticación        | ¿Límite de intentos, mensajes genéricos, tokens con vencimiento?       | Sí: 5 intentos → 429, mensaje genérico, token de 15 minutos.                                                                                                            | Parte 2         |
| A08 Integridad de software o datos | ¿El token está firmado y se verifica? ¿Se confía en datos del cliente? | Firma verificada con algoritmo fijo (HS256). Identidad y rol salen solo del token; el precio y los datos se validan en el servidor.                                     | Partes 2 y 3    |
| A09 Registros y alertas            | ¿Se registran los intentos de login fallidos y los errores?            | Sí: login_fallido, login_bloqueado, csrf_rechazado, origen_rechazado, permiso_denegado y errores 500 con fecha.                                                         | Parte 6.4       |
| A10 Condiciones excepcionales      | ¿Los errores fallan de forma segura (niegan, no permiten)?             | Sí: ante un token inválido o un error se niega el acceso y el cliente recibe un mensaje genérico.                                                                       | Parte 6.4       |

## 8.1 Dos pruebas de diseño inseguro (A06)

**Cantidad o precio negativo.** La tienda no tiene checkout: el carrito vive en el navegador y no se envía ningún precio al servidor, por lo que no existe un «total» que manipular en una compra. Lo equivalente que sí existe es el CRUD del administrador, y se probó con precio: -1, precio: "gratis" y existencias: -5: los tres se rechazan con 400.

**Campo de más.** Se envió rol: "admin" y un \_id elegido en el cuerpo al crear un producto: el producto se creó con un \_id nuevo generado por MongoDB y sin ningún campo rol. En cuanto al registro con rol: "admin", no existe el endpoint (404): el rol nunca viene del cliente.

```powershell
# Cada archivo es el mismo producto con un campo alterado
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -H "Origin: https://localhost:4173" -H "X-CSRF-Token: $csrf" -d "@precio-negativo.json"
{"error":"Datos no válidos","detalles":["El precio no puede ser negativo"]}
HTTP 400
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -H "Origin: https://localhost:4173" -H "X-CSRF-Token: $csrf" -d "@precio-texto.json"
{"error":"Datos no válidos","detalles":["El campo \"precio\" no tiene un formato válido"]}
HTTP 400
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -w "\nHTTP %{http_code}\n" -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -H "Origin: https://localhost:4173" -H "X-CSRF-Token: $csrf" -d "@existencias-negativas.json"
{"error":"Datos no válidos","detalles":["Las existencias no pueden ser negativas"]}
HTTP 400
# Campos de más: "rol":"admin" y un "_id" elegido por el cliente
PS C:\Users\simon_zkmbj72\...\rudel-streetwear-backend> curl.exe -sk -b jar.txt -X POST https://localhost:3443/api/productos -H "Content-Type: application/json" -H "Origin: https://localhost:4173" -H "X-CSRF-Token: $csrf" -d "@campos-de-mas.json" | ConvertFrom-Json | Select-Object _id, rol
_id                      rol
---                      ---
6ae2b73c1f14f927ffc3bc36
```

*Figura 39. Valores negativos, tipo incorrecto y campos de más.*

# 9. Tabla de hallazgos

Cada fila corresponde a un hallazgo del diagnóstico (Parte 0) o de las pruebas de las demás partes: qué era, a qué categoría OWASP pertenece, cómo se comprobó, qué se hizo y su estado.

| **\#** | **Hallazgo**                                                                                                                                           | **OWASP** | **Evidencia (cómo lo comprobé)**                                                                       | **Corrección aplicada**                                                                                                                                                         | **Estado**                                                                    |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|--------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| 1      | La contraseña real del administrador estaba escrita como ejemplo en la documentación Swagger y quedó en el historial de git y en GitHub.               | A04 / A02 | git log --all -S sobre la contraseña devuelve el commit d724fbf; el ejemplo estaba en docs/swagger.js. | Ejemplo sustituido por un valor ficticio. Rotación de la contraseña del administrador en Render y en el .env local.                                                             | **Mitigado.** La rotación en Render es manual y es lo que cierra el hallazgo. |
| 2      | JWT_SECRET con valor por defecto escrito en el código: cualquiera con acceso al repositorio podía firmar sesiones en desarrollo.                       | A04 / A08 | Lectura de config/entorno.js en master.                                                                | JWT_SECRET obligatorio de mínimo 32 caracteres; sin él el servidor no arranca y muestra cómo generarlo.                                                                         | **Corregido.** Figuras de la Parte 6.1.                                       |
| 3      | Desarrollo local por HTTP simple.                                                                                                                      | A04       | El servidor escuchaba solo en http://localhost:3000.                                                   | HTTPS local con mkcert (3443), redirección 301 desde 3000, HSTS de 300 s en local y cookie Secure. En producción: TLS de Render/Vercel, redirección forzada y HSTS de un año.   | **Corregido.** curl y pruebas automáticas.                                    |
| 4      | Sesión de 8 horas sin renovación.                                                                                                                      | A07       | horasSesion: 8 en config/entorno.js.                                                                   | Sesión de 15 minutos con renovación deslizante.                                                                                                                                 | **Corregido.** La prueba valida exp − iat ≤ 15 min.                           |
| 5      | Límite de 10 intentos de login y sin registro del bloqueo.                                                                                             | A07 / A09 | limitador.js en master.                                                                                | 5 intentos por 15 minutos desde la misma IP → 429, y registro de login_bloqueado.                                                                                               | **Corregido.** Seis intentos reales: 5×401 y 1×429.                           |
| 6      | Hash bcrypt de 10 rondas y contraseña mínima de 8 caracteres.                                                                                          | A04       | models/Administrador.js en master.                                                                     | 12 rondas y mínimo de 10 caracteres.                                                                                                                                            | **Corregido.** El hash guardado empieza por \$2a\$12\$.                       |
| 7      | La sesión no llevaba rol: el acceso se decidía solo porque «el administrador existe».                                                                  | A01       | Lectura de middlewares/autenticacion.js.                                                               | Claim rol firmado, middleware requiereRol, respuesta 403 y registro permiso_denegado.                                                                                           | **Corregido.** Un token válido con rol «cliente» recibe 403.                  |
| 8      | Sin registros de eventos de seguridad.                                                                                                                 | A09       | No existía ninguna salida de registro de seguridad.                                                    | registrarEvento en JSON con fecha: login_fallido, login_bloqueado, csrf_rechazado, origen_rechazado, permiso_denegado y errores 500.                                            | **Corregido.**                                                                |
| 9      | Content-Security-Policy con los valores por defecto de helmet y sin cabeceras adicionales en el frontend.                                              | A02       | Cabeceras de GET /api/categorias.                                                                      | Directivas explícitas (default-src 'self', frame-ancestors 'none', object-src 'none', script-src-attr 'none') y Permissions-Policy y Cross-Origin-Opener-Policy en vercel.json. | **Corregido.**                                                                |
| 10     | Dependencias vulnerables: backend 3 (1 alta body-parser, 2 moderadas fast-uri y qs); frontend 3 (1 crítica shell-quote, 2 altas source-map-js y vite). | A03       | npm audit sobre el package-lock.json de master.                                                        | npm audit fix en los dos proyectos.                                                                                                                                             | **Corregido.** 0 vulnerabilidades.                                            |
| 11     | Mensaje interno de Mongoose en la respuesta cuando el precio tiene un tipo incorrecto («Cast to Number failed…»).                                      | A10 / A02 | POST con precio: "gratis" durante las pruebas de A06.                                                  | El manejador de errores devuelve «El campo "precio" no tiene un formato válido».                                                                                                | **Corregido.** Con prueba automática.                                         |
| 12     | Atlas con acceso de red 0.0.0.0/0.                                                                                                                     | A02       | Panel de Atlas → Network Access.                                                                       | No se puede reducir a una IP porque Render gratuito usa IP dinámicas. Se compensa con contraseña larga, usuario de mínimo privilegio y rotación.                                | **Aceptado y mitigado.**                                                      |
| 13     | La aplicación se conectaba con un usuario con el rol atlasAdmin sobre todos los recursos del proyecto.                                                 | A02       | Panel de Atlas → Database Access.                                                                      | Usuario dedicado rudel_app con readWrite solo sobre rudel; la aplicación ya no usa el usuario atlasAdmin.                                                                       | **Corregido.** Figura 34.                                                     |
| 14     | Valores negativos o de tipo incorrecto en el CRUD.                                                                                                     | A06       | POST con precio: -1, precio: "gratis", existencias: -5.                                                | Validación del esquema en el servidor (400).                                                                                                                                    | **Ya estaba protegido.**                                                      |
| 15     | Campos de más (rol, \_id) en el cuerpo de la petición.                                                                                                 | A06 / A08 | POST con rol: "admin" y \_id propio; POST /api/auth/registro.                                          | El esquema descarta campos desconocidos y no existe endpoint de registro (404).                                                                                                 | **Ya estaba protegido.**                                                      |
| 16     | XSS almacenado en nombre y descripción de productos.                                                                                                   | A05       | Payloads \<img onerror\> y \<script\> por la API y directo en la base de datos.                        | Sanitización con xss en el servidor, escape de Vue, validación de URL de imagen y CSP.                                                                                          | **Ya estaba protegido.** Se demostró por las tres capas.                      |
| 17     | CSRF contra las operaciones de escritura.                                                                                                              | A01 / A08 | ataque.html desde otro origen y repetición de peticiones sin token.                                    | Token sincronizado + Origin + SameSite=Strict (diseño previo; se añadió registro de rechazos).                                                                                  | **Ya estaba protegido.** Se añadió el registro.                               |

# 10. Matriz de riesgos

Cinco riesgos que siguen presentes en el proyecto después de las correcciones. Probabilidad e impacto se estiman sobre una tienda académica con un único administrador y sin datos de clientes.

| **\#** | **Riesgo**                                                                                          | **Prob.** | **Impacto** | **Tratamiento**       | **Justificación y acción**                                                                                                                                                                                                            |
|--------|-----------------------------------------------------------------------------------------------------|-----------|-------------|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1      | Base de datos de Atlas accesible desde cualquier IP (0.0.0.0/0).                                    | Media     | Alto        | **Mitigar**           | Render gratuito no ofrece IP fija. Contraseña larga y aleatoria, usuario readWrite solo sobre rudel, rotación periódica y revisión del registro de accesos. Si se pasa a un plan con IP fija o a un peering privado, cerrar la lista. |
| 2      | La contraseña anterior del administrador sigue en el historial de git (commit d724fbf).             | Media     | Alto        | **Mitigar**           | Rotarla en Render y en el .env local la deja inservible; el historial conserva un valor muerto. Reescribir el historial es opcional y arriesgado en un repositorio compartido.                                                        |
| 3      | Un solo administrador y sin segundo factor: el robo de su contraseña da control total del catálogo. | Baja      | Alto        | **Mitigar y aceptar** | Límite de 5 intentos, sesión de 15 minutos, bcrypt de 12 rondas, contraseña de 10+ caracteres. MFA queda como mejora futura; el riesgo residual es aceptable para el alcance.                                                         |
| 4      | Aparición de nuevas vulnerabilidades en las dependencias.                                           | Media     | Medio       | **Mitigar**           | Ejecutar npm audit antes de cada entrega y activar Dependabot en el repositorio. El package-lock.json queda fijado.                                                                                                                   |
| 5      | Registros solo en la consola de Render, sin alertas ni retención larga.                             | Media     | Bajo        | **Aceptar**           | Suficiente para el proyecto académico. Un ataque de fuerza bruta quedaría registrado pero nadie recibiría un aviso; centralizar registros y alertar sería la mejora.                                                                  |

# 11. Plan ante un incidente: se filtra la cadena de conexión de Atlas

Escenario: hoy se descubre que la cadena mongodb+srv://usuario:clave@… quedó publicada (por ejemplo, en un commit, una captura o un mensaje). El plan sigue el ciclo de NIST SP 800-61.

<table>
<colgroup>
<col style="width: 24%" />
<col style="width: 75%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Fase</strong></th>
<th><strong>Qué se haría en RUDEL Streetwear</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>1. Preparación (antes del incidente)</td>
<td><p>Secretos solo en variables de entorno de Render y en el .env local, que está en el .gitignore.</p>
<p>Usuario de aplicación con el permiso mínimo (readWrite sobre rudel) para limitar el daño de una filtración.</p>
<p>Copia de los datos: el catálogo se reconstruye con datos/semilla.js y se mantiene un respaldo (snapshot o mongodump) del cluster.</p>
<p>Persona responsable y canal definidos entre los tres integrantes; lista de comprobación de este plan a mano.</p></td>
</tr>
<tr class="even">
<td>2. Detección y análisis</td>
<td><p>Fuentes: alerta del repositorio (escáner de secretos de GitHub), aviso de un compañero, o conexiones o escrituras inesperadas.</p>
<p>En Atlas se revisa el panel de monitoreo (picos de operaciones, conexiones desde IP desconocidas) y el historial de actividad del proyecto.</p>
<p>Se determina cuándo, dónde y quién pudo ver el secreto (git log -S para ubicar el commit) y qué base de datos y colecciones estuvieron expuestas.</p>
<p>Se revisa si hay datos modificados o colecciones nuevas.</p></td>
</tr>
<tr class="odd">
<td>3. Contención</td>
<td><p>Inmediato: cambiar la contraseña del usuario de Atlas (o eliminar el usuario y crear otro), con lo que la cadena filtrada deja de funcionar.</p>
<p>Actualizar MONGODB_URI en Render y redeplegar.</p>
<p>Rotar JWT_SECRET para cerrar todas las sesiones activas y ADMIN_CONTRASENA por precaución.</p>
<p>Si hay actividad hostil en curso, restringir temporalmente Network Access.</p></td>
</tr>
<tr class="even">
<td>4. Erradicación</td>
<td><p>Retirar el secreto de donde esté expuesto: historial de git (git filter-repo y nuevo push forzado coordinado), mensajes, documentos y capturas.</p>
<p>Buscar otras credenciales en el mismo lugar (el mismo error suele repetirse).</p>
<p>Eliminar usuarios, colecciones o datos creados por el atacante.</p></td>
</tr>
<tr class="odd">
<td>5. Recuperación</td>
<td><p>Desplegar con las credenciales nuevas y comprobar GET /api/salud, el catálogo público y el inicio de sesión del administrador.</p>
<p>Restaurar desde el respaldo o ejecutar de nuevo la semilla si se alteraron datos.</p>
<p>Vigilar los registros y el monitoreo de Atlas durante los días siguientes.</p></td>
</tr>
<tr class="even">
<td>6. Lecciones aprendidas</td>
<td><p>Documentar la línea de tiempo, la causa raíz y el tiempo que tardó cada fase.</p>
<p>Agregar un escáner de secretos antes de cada commit (por ejemplo, gitleaks) y activar el escaneo de secretos de GitHub.</p>
<p>Regla de equipo: ningún ejemplo de documentación usa credenciales reales (el hallazgo 1 fue exactamente esto).</p>
<p>Reducir la red permitida de Atlas cuando el plan lo permita.</p></td>
</tr>
</tbody>
</table>

# 12. Datos personales y Ley 1581 de 2012

## 12.1 Qué datos guarda la tienda y para qué

| **Dato**                                                        | **De quién**                 | **Dónde**                          | **Finalidad**                                               |
|-----------------------------------------------------------------|------------------------------|------------------------------------|-------------------------------------------------------------|
| Usuario, nombre visible y hash de la contraseña                 | Administrador                | Colección administradores en Atlas | Autenticar la gestión del catálogo.                         |
| IP y usuario intentado en intentos de login fallidos y bloqueos | Quien intente iniciar sesión | Registro del servidor (Render)     | Detectar ataques de fuerza bruta (seguridad).               |
| Cookie de sesión (token firmado)                                | Administrador                | Navegador, 15 minutos              | Mantener la sesión.                                         |
| Carrito de compras                                              | Visitante                    | Solo en el navegador del visitante | Calcular el total; no se envía ni se guarda en el servidor. |

**De los clientes la tienda no guarda ningún dato personal.** No hay registro, pedidos, formulario de contacto, newsletter ni analítica. Eso aplica directamente el principio de **necesidad y minimización** de la Ley 1581 de 2012 (tratar solo los datos indispensables para la finalidad) y reduce el impacto de una filtración: aunque se perdiera la base de datos completa no habría datos de clientes que proteger.

## 12.2 Qué sobra o conviene revisar

- **No sobra ningún dato de clientes**, porque no se recolecta ninguno.

- **La IP en los registros** es un dato personal. Se usa solo con finalidad de seguridad, el campo de usuario se recorta a 60 caracteres y la retención es la de los registros de Render. No se debe reutilizar para otros fines ni conservar indefinidamente.

- **Google Fonts.** El frontend carga tipografías desde fonts.googleapis.com y fonts.gstatic.com, lo que entrega la IP de cada visitante a un tercero. Es la única transferencia de datos de visitantes que hace el sitio hoy; la mejora es alojar las fuentes en el propio dominio.

## 12.3 Si se agregaran compras

La Ley 1581 y sus decretos reglamentarios exigirían: **autorización previa, expresa e informada** del titular; informar la finalidad; publicar una **política de tratamiento**; garantizar al titular sus derechos de conocer, actualizar, rectificar y suprimir sus datos y revocar la autorización; adoptar medidas de **seguridad** (hash, HTTPS, control de acceso, las de este laboratorio); y limitar la **circulación** a quienes la necesiten. Para una compra bastarían nombre, dirección de entrega, teléfono o correo de contacto y medio de pago a través de un procesador certificado (la tienda no debería almacenar datos de tarjeta). Sobrarían, y no deberían recolectarse, el número de documento de identidad, la fecha de nacimiento, el género y cualquier dato sensible o de menores, que no son necesarios para entregar un pedido.

# 13. Cierre: preguntas finales

## 13.1 ¿Cuál fue el hallazgo más grave de su proyecto y por qué?

El más grave fue haber dejado la contraseña real del administrador como ejemplo en la documentación Swagger y haberla subido a GitHub (hallazgo 1, A04/A02). Lo elegimos por tres razones. Primero, por el impacto: esa credencial da control total sobre el catálogo (crear, editar y borrar productos y categorías) en el sistema desplegado. Segundo, por la persistencia: aunque ya corregimos el archivo, git conserva el valor en el historial, así que corregir el código no cierra el problema; la única solución real es rotar la contraseña, y es una tarea manual en Render que depende de nosotros. Tercero, por su origen: no fue un fallo técnico sofisticado sino una decisión cómoda, copiar un valor real para que el ejemplo de la documentación «funcionara» al probar en Swagger. Los demás hallazgos (sesión de 8 horas, 10 intentos, secreto por defecto) debilitaban capas de defensa; este eliminaba la primera y más importante.

## 13.2 ¿Qué defensa habría evitado el caso de la clase que más les impactó?

El caso que más nos impactó fue **Uber (2016)**, porque es el mismo tipo de error que cometimos nosotros: credenciales de acceso a la nube dentro de un repositorio de código, a las que quien las encontró usó para acceder a los datos de unos 57 millones de usuarios y conductores. No fue una falla de cifrado ni un exploit; fue una credencial en el lugar equivocado, y la compañía además escondió el incidente, lo que agravó las consecuencias.

La defensa que lo habría evitado es sacar los secretos del repositorio (variables de entorno o un gestor de secretos) y poner un escáner de secretos antes del commit (gitleaks o el escaneo de GitHub); el mínimo privilegio y la rotación inmediata al detectar la exposición limitan el daño, y un plan de respuesta con notificación honesta evita agravarlo. En RUDEL ya aplicamos los secretos en un .env ignorado, el JWT_SECRET obligatorio y un usuario de aplicación de mínimo privilegio; la rotación de la contraseña del administrador sigue pendiente.

## 13.3 ¿Qué dejarían como mejora futura?

Ordenadas por la relación entre riesgo reducido y esfuerzo:

1.  **Escáner de secretos y auditoría de dependencias automáticos** en cada pull request (gitleaks, npm audit y Dependabot). Es lo de menor esfuerzo y habría detectado el hallazgo 1 y los 6 paquetes vulnerables antes de la entrega.

2.  **Segundo factor (MFA) para el administrador**, por ejemplo, con una aplicación de códigos de un solo uso. Hoy toda la seguridad del panel descansa en una sola contraseña; es el riesgo residual más relevante de la matriz.

3.  **Registros centralizados con alertas.** Los eventos ya se emiten en JSON, lo que facilita enviarlos a un servicio que avise de ráfagas de login_fallido o csrf_rechazado en vez de depender de que alguien lea la consola de Render.

4.  **Pruebas de seguridad automáticas en la integración continua.** Ya existen 20 pruebas de seguridad en el backend; ejecutarlas en cada push impediría que una regresión (por ejemplo, volver a quitar la verificación de rol) llegue a producción.

5.  **Renovación y revocación de tokens** con una lista de sesiones, para poder cerrar la sesión de un administrador de forma remota, y alojar las fuentes en el propio dominio para no entregar la IP de los visitantes a terceros.
