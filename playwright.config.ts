import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const PUERTO_API = 3100
const PUERTO_WEB = 4173

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm --prefix ../rudel-streetwear-backend run servidor:pruebas',
      url: `http://localhost:${PUERTO_API}/api/salud`,
      env: { PORT: String(PUERTO_API), FRONTEND_URL: `http://localhost:${PUERTO_WEB}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run build-only && npx vite preview --port ${PUERTO_WEB} --strictPort`,
      url: `http://localhost:${PUERTO_WEB}`,
      env: { BACKEND_URL: `http://localhost:${PUERTO_API}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
