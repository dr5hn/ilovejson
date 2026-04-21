import { getServerSession } from 'next-auth/next'
import { authOptions } from '@lib/auth'
import prisma from '@lib/prisma'
import { ReE, ReS } from '@utils/reusables'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return ReE(res, 'Method not allowed', 405)

  const session = await getServerSession(req, res, authOptions)
  if (!session) return ReE(res, 'Unauthorized', 401)

  const userId = session.user.id

  // Remove all on-disk saved files for this user
  const userSavedDir = path.join(process.cwd(), 'public', 'saved', userId)
  try {
    if (fs.existsSync(userSavedDir)) {
      fs.rmSync(userSavedDir, { recursive: true, force: true })
    }
  } catch (err) {
    console.error('Failed to delete user saved directory:', err)
  }

  // Cascade-delete all user data (Prisma schema has onDelete: Cascade)
  await prisma.user.delete({ where: { id: userId } })

  return ReS(res, { deleted: true })
}
