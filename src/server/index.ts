import express, { Router } from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import type { Request, Response, NextFunction, RequestHandler } from 'express'

const app = express()
const router = Router()
app.use(cors())
app.use(express.json())

const ROMS_DIR = path.join(process.cwd(), 'roms')
const CACHE_DIR = path.join(process.cwd(), '.cache')

// Create directories if they don't exist
if (!fs.existsSync(ROMS_DIR)) {
  fs.mkdirSync(ROMS_DIR, { recursive: true })
}
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

// Interface for ROM metadata
interface RomMetadata {
  name: string;
  size: number;
  lastModified: number;
  path: string;
}

const listRoms: RequestHandler = async (_req, res) => {
  try {
    const files = fs.readdirSync(ROMS_DIR)
    const roms: RomMetadata[] = files
      .filter(file => {
        // Optional: Add file extension filtering here if needed
        // Example: return file.endsWith('.gba') || file.endsWith('.nds')
        return true
      })
      .map(file => {
        const filePath = path.join(ROMS_DIR, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          lastModified: stats.mtimeMs,
          path: `/api/roms/download/${encodeURIComponent(file)}`
        }
      })
      .sort((a, b) => b.lastModified - a.lastModified)

    res.json({
      success: true,
      data: roms,
      count: roms.length
    })
  } catch (error) {
    console.error('Error listing ROMs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to read ROMs directory',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

interface DownloadParams {
  filename: string;
}

const downloadRom: RequestHandler<DownloadParams> = async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename)
    const filePath = path.join(ROMS_DIR, filename)

    // Security check: Ensure the file is within ROMS_DIR and no path traversal
    const resolvedPath = path.resolve(filePath)
    const resolvedRomsDir = path.resolve(ROMS_DIR)
    if (!resolvedPath.startsWith(resolvedRomsDir)) {
      res.status(403).json({
        success: false,
        error: 'Access denied: Invalid file path'
      })
      return
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'ROM not found'
      })
      return
    }

    // Get file stats for Content-Length
    const stats = fs.statSync(filePath)

    // Set download headers
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.setHeader('Content-Length', stats.size)
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Accept-Ranges', 'bytes')

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath)
    
    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error(`Error streaming file ${filename}:`, error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to stream ROM file',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })

    // Handle client disconnect
    req.on('close', () => {
      fileStream.destroy()
    })

    // Stream the file
    fileStream.pipe(res)
  } catch (error) {
    console.error(`Error processing download for ${req.params.filename}:`, error)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to process download request',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

// API Routes
router.get('/api/roms', listRoms)
router.get('/api/roms/download/:filename', downloadRom)

app.use(router)

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message
  })
})

const PORT = process.env.PORT || 1248
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`ROMs directory: ${ROMS_DIR}`)
}) 