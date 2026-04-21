import { getServerSession } from 'next-auth/next'
import { authOptions } from '@lib/auth'
import prisma from '@lib/prisma'
import { ReE, ReS } from '@utils/reusables'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return ReE(res, 'Unauthorized', 401)

  const userId = session.user.id
  const { id } = req.query

  // Ensure the record belongs to this user
  const record = await prisma.savedFile.findUnique({ where: { id } })
  if (!record) return ReE(res, 'Not found', 404)
  if (record.userId !== userId) return ReE(res, 'Forbidden', 403)

  if (req.method === 'PATCH') {
    const { name } = req.body || {}
    if (!name || !name.trim()) return ReE(res, 'name is required', 400)

    const updated = await prisma.savedFile.update({
      where: { id },
      data: { name: name.trim() },
      select: { id: true, name: true },
    })
    return ReS(res, { file: updated })
  }

  if (req.method === 'DELETE') {
    // Remove from disk first, then DB
    const absPath = path.join(process.cwd(), 'public', record.path)
    try {
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath)
    } catch (err) {
      console.error('Failed to delete file from disk:', err)
    }

    await prisma.savedFile.delete({ where: { id } })
    return ReS(res, { deleted: true })
  }

  return ReE(res, 'Method not allowed', 405)
}
