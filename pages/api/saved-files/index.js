import { getServerSession } from 'next-auth/next'
import { authOptions } from '@lib/auth'
import prisma from '@lib/prisma'
import { ReE, ReS } from '@utils/reusables'
import { globals } from '@constants/globals'
import fs from 'fs'
import path from 'path'

const STORAGE_CAP_BYTES = 100 * 1024 * 1024 // 100 MB
const PAGE_SIZE = 50
// expiresAt sentinel for "saved permanently"
const PERMANENT = new Date('9999-12-31T23:59:59Z')

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return ReE(res, 'Unauthorized', 401)

  const userId = session.user.id

  if (req.method === 'GET') {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const toolFilter = req.query.tool || null
    const skip = (page - 1) * PAGE_SIZE
    const where = { userId, ...(toolFilter ? { type: toolFilter } : {}) }

    const [files, total] = await Promise.all([
      prisma.savedFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: { id: true, name: true, path: true, type: true, size: true, createdAt: true },
      }),
      prisma.savedFile.count({ where }),
    ])

    return ReS(res, { files, total, page })
  }

  if (req.method === 'POST') {
    const { downloadPath, tool, name } = req.body || {}

    if (!downloadPath || !tool || !name) {
      return ReE(res, 'downloadPath, tool, and name are required', 400)
    }

    // Resolve the source file on disk
    const srcAbs = path.join(process.cwd(), 'public', downloadPath.replace(/^\//, ''))
    if (!fs.existsSync(srcAbs)) {
      return ReE(res, 'Source file not found', 404)
    }

    const fileSize = fs.statSync(srcAbs).size

    // Check per-user storage cap
    const storageResult = await prisma.savedFile.aggregate({
      where: { userId },
      _sum: { size: true },
    })
    const storageUsed = storageResult._sum.size ?? 0
    if (storageUsed + fileSize > STORAGE_CAP_BYTES) {
      return ReE(res, "You've reached your 100 MB storage limit. Delete older saved files to make room.", 413)
    }

    // Copy file into per-user saved directory
    const userDir = path.join(process.cwd(), globals.savedDir, userId)
    fs.mkdirSync(userDir, { recursive: true })

    const ext = path.extname(srcAbs)
    const timestamp = Date.now()
    const destFilename = `${timestamp}${ext}`
    const destAbs = path.join(userDir, destFilename)
    fs.copyFileSync(srcAbs, destAbs)

    const storedPath = `saved/${userId}/${destFilename}`

    const saved = await prisma.savedFile.create({
      data: {
        userId,
        name,
        path: storedPath,
        size: fileSize,
        type: tool,
        expiresAt: PERMANENT,
      },
    })

    return ReS(res, { file: { id: saved.id, name: saved.name, path: saved.path } }, 201)
  }

  return ReE(res, 'Method not allowed', 405)
}
