import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const POLITICA_CONTENIDO = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' https: data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const politicaSeguridad = (): Plugin => ({
  name: 'rudel-politica-seguridad',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: POLITICA_CONTENIDO }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
  ],
})

export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, process.cwd(), '')
  const archivoClave = resolve(process.cwd(), '../certs/key.pem')
  const archivoCertificado = resolve(process.cwd(), '../certs/cert.pem')
  const certificadosLocales = existsSync(archivoClave) && existsSync(archivoCertificado)
  const https = certificadosLocales
    ? { key: readFileSync(archivoClave), cert: readFileSync(archivoCertificado) }
    : undefined
  const objetivo = entorno.BACKEND_URL || (certificadosLocales ? 'https://localhost:3443' : 'http://localhost:3000')
  const proxy = {
    '/api': { target: objetivo, changeOrigin: true, secure: !certificadosLocales },
  }

  return {
    plugins: [vue(), vueDevTools(), politicaSeguridad()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { proxy, https },
    preview: { proxy, https },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: (source: string, archivo: string) =>
            archivo.includes('/assets/styles/') || archivo.includes('\\assets\\styles\\')
              ? source
              : `@use '@/assets/styles/tokens' as *;\n@use '@/assets/styles/mixins' as *;\n${source}`,
        },
      },
    },
  }
})
