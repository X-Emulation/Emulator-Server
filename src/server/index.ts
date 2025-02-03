import express, { Router } from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import type { Request, Response, NextFunction, RequestHandler } from 'express'

const app = express()
const router = Router()
app.use(cors())

const ROMS_DIR = path.join(process.cwd(), 'roms') // You can change this path
const CACHE_DIR = path.join(process.cwd(), '.cache')

// Create roms directory if it doesn't exist
if (!fs.existsSync(ROMS_DIR)) {
  fs.mkdirSync(ROMS_DIR, { recursive: true })
}
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

const listRoms: RequestHandler = (_req, res) => {
  try {
    const files = fs.readdirSync(ROMS_DIR)
    const roms = files.map(file => ({
      name: file,
      size: fs.statSync(path.join(ROMS_DIR, file)).size,
      path: path.join(ROMS_DIR, file)
    }))
    res.json(roms)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read ROMs directory' })
  }
}

interface DownloadParams {
  filename: string;
}

const downloadRom: RequestHandler<DownloadParams> = (req, res, next): void => {
  try {
    const filename = decodeURIComponent(req.params.filename)
    const filePath = path.join(ROMS_DIR, filename)

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'ROM not found' })
      return
    }

    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(path.resolve(ROMS_DIR))) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

    fileStream.on('error', (error) => {
      console.error(`Error streaming file ${filename}:`, error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download ROM' })
      }
    })
  } catch (error) {
    console.error(`Error processing download for ${req.params.filename}:`, error)
    res.status(500).json({ error: 'Failed to process download request' })
  }
}

router.get('/api/roms', listRoms)
router.get('/api/roms/download/:filename', downloadRom)

app.use(router)

app.listen(1248, () => {
  console.log('Server running on port 1248')
}) 