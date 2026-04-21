import { getServerSession } from 'next-auth/next'
import { authOptions } from '@lib/auth'
import prisma from '@lib/prisma'

/**
 * Silently log a conversion row if a session exists.
 * Never throws — failures are logged and ignored.
 */
export async function logConversion(req, res, { tool, fileName, inputSize, outputSize }) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) return
    await prisma.conversion.create({
      data: {
        userId: session.user.id,
        tool,
        fileName: fileName ?? null,
        inputSize,
        outputSize,
      },
    })
  } catch (err) {
    console.error('[logConversion] failed:', err?.message)
  }
}
