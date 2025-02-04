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

// Add proper stream handling and cleanup
const streamFile = (filePath: string, res: ServerResponse) => {
  // Set headers for binary file
  res.setHeader('Content-Type', 'application/octet-stream')
  
  // Create read stream and pipe directly to response
  const fileStream = fs.createReadStream(filePath)
  
  fileStream.on('error', (error) => {
    console.error(`Error streaming file:`, error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.end()
    }
    fileStream.destroy()
  })

  // Clean up on response events
  res.on('close', () => fileStream.destroy())
  res.on('finish', () => fileStream.destroy())

  // Pipe directly without any transformations
  fileStream.pipe(res)
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
    host: true,
    cors: true,
    proxy: {
      '/api/roms': {
        target: 'http://localhost:1248',
        changeOrigin: true,
        bypass: (req: IncomingMessage, res: ServerResponse<IncomingMessage> | undefined, options: ProxyOptions) => {
          if (!res) return

          // Add CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          // Handle ROM downloads
          if (req.url?.startsWith('/api/roms/download/')) {
            const filename = decodeURIComponent(req.url.replace('/api/roms/download/', ''))
            const filePath = path.join(ROMS_DIR, filename)
            
            // Security check
            const resolvedPath = path.resolve(filePath)
            if (!resolvedPath.startsWith(path.resolve(ROMS_DIR))) {
              res.statusCode = 403
              res.end()
              return
            }

            // Check if file exists
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.end()
              return
            }

            // Set headers
            res.setHeader('Content-Type', 'application/octet-stream')
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
            res.setHeader('Content-Length', fs.statSync(filePath).size)
            
            // Stream the raw file
            streamFile(filePath, res)
            return
          }

          // Handle ROM listing with better error handling
          try {
            const files = fs.readdirSync(ROMS_DIR)
            const roms = files.map((file) => {
              const filePath = path.join(ROMS_DIR, file)
              const stats = fs.statSync(filePath)
              return {
                name: file,
                size: stats.size,
                lastModified: stats.mtimeMs,
                path: `/api/roms/download/${encodeURIComponent(file)}`
              }
            })

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              data: roms,
              count: roms.length
            }))
          } catch (error) {
            console.error('Error reading ROMs directory:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ 
              success: false,
              error: 'Failed to read ROMs directory',
              details: error instanceof Error ? error.message : 'Unknown error'
            }))
          }
        }
      }
    }
  }
})
