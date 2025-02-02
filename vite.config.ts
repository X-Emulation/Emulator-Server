import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ProxyOptions } from 'vite'

const ROMS_DIR = path.join(process.cwd(), 'roms')

// Create roms directory if it doesn't exist
if (!fs.existsSync(ROMS_DIR)) {
  fs.mkdirSync(ROMS_DIR, { recursive: true })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5174,
    proxy: {
      '/api/roms': {
        target: 'http://localhost:5174',
        bypass: (req: IncomingMessage, res: ServerResponse<IncomingMessage> | undefined, options: ProxyOptions) => {
          if (!res) return
          res.setHeader('Content-Type', 'application/json')
          try {
            const files = fs.readdirSync(ROMS_DIR)
            const roms = files.map((file) => ({
              name: file,
              size: fs.statSync(path.join(ROMS_DIR, file)).size,
              path: path.join(ROMS_DIR, file)
            }))
            res.end(JSON.stringify(roms))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to read ROMs directory' }))
          }
        }
      }
    }
  }
})
