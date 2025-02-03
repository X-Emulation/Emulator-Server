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
    port: 1248,
    proxy: {
      '/api/roms': {
        target: 'http://localhost:1248',
        bypass: (req: IncomingMessage, res: ServerResponse<IncomingMessage> | undefined, options: ProxyOptions) => {
          if (!res) return

          // Handle ROM downloads
          if (req.url?.startsWith('/api/roms/download/')) {
            const filename = decodeURIComponent(req.url.replace('/api/roms/download/', ''))
            const filePath = path.join(ROMS_DIR, filename)
            
            // Security check
            const resolvedPath = path.resolve(filePath)
            if (!resolvedPath.startsWith(path.resolve(ROMS_DIR))) {
              res.statusCode = 403
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Access denied: Invalid file path' 
              }))
              return
            }

            // Check if file exists
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.end(JSON.stringify({ 
                success: false, 
                error: 'ROM not found' 
              }))
              return
            }

            // Set download headers
            res.setHeader('Content-Type', 'application/octet-stream')
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
            res.setHeader('Content-Length', fs.statSync(filePath).size)
            
            // Stream the file
            const fileStream = fs.createReadStream(filePath)
            fileStream.pipe(res)
            return
          }

          // Handle ROM listing
          res.setHeader('Content-Type', 'application/json')
          try {
            const files = fs.readdirSync(ROMS_DIR)
            const roms = files.map((file) => ({
              name: file,
              size: fs.statSync(path.join(ROMS_DIR, file)).size,
              lastModified: fs.statSync(path.join(ROMS_DIR, file)).mtimeMs,
              path: `/api/roms/download/${encodeURIComponent(file)}`
            }))
            res.end(JSON.stringify({
              success: true,
              data: roms,
              count: roms.length
            }))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ 
              success: false,
              error: 'Failed to read ROMs directory' 
            }))
          }
        }
      }
    }
  }
})
