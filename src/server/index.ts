import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

const app = express()
app.use(cors())

const ROMS_DIR = path.join(process.cwd(), 'roms') // You can change this path

// Create roms directory if it doesn't exist
if (!fs.existsSync(ROMS_DIR)) {
  fs.mkdirSync(ROMS_DIR, { recursive: true })
}

app.get('/api/roms', (req, res) => {
  try {
    const files = fs.readdirSync(ROMS_DIR)
    const roms = files.map(file => {
      const stats = fs.statSync(path.join(ROMS_DIR, file))
      return {
        name: file,
        size: stats.size,
        path: path.join(ROMS_DIR, file)
      }
    })
    res.json(roms)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read ROMs directory' })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
}) 