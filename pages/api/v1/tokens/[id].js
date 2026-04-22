import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import prisma from '@lib/prisma';
import { setCorsHeaders } from '@middleware/apiTokenAuth';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  const { id } = req.query;
  const token = await prisma.apiToken.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!token) return res.status(404).json({ error: 'token_not_found' });

  // PATCH — rename
  if (req.method === 'PATCH') {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'missing_field', field: 'name' });
    }
    const updated = await prisma.apiToken.update({
      where: { id },
      data: { name: name.trim() },
      select: { id: true, name: true, tokenPrefix: true, updatedAt: true },
    });
    return res.status(200).json({ token: updated });
  }

  // DELETE — revoke
  if (req.method === 'DELETE') {
    if (token.revokedAt) return res.status(400).json({ error: 'already_revoked' });
    await prisma.apiToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return res.status(200).json({ revoked: true, id });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
