import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { authOptions } from '@lib/auth'
import prisma from '@lib/prisma'

const STORAGE_CAP_BYTES = 100 * 1024 * 1024 // 100 MB

export default function DashboardIndex({ stats }) {
  const usagePct = Math.min(100, (stats.storageUsed / STORAGE_CAP_BYTES) * 100)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Conversions (last 30 days)</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.conversions30d}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Most-used tool</p>
            <p className="text-lg font-semibold text-gray-900 mt-1 truncate">{stats.topTool || '—'}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Storage used</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {(stats.storageUsed / 1024 / 1024).toFixed(1)} MB <span className="text-gray-400 text-sm">/ 100 MB</span>
            </p>
            <div className="mt-2 bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${usagePct > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent saved files</h2>
            <Link href="/dashboard/files" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {stats.recentFiles.length === 0 ? (
            <p className="text-sm text-gray-500">No saved files yet. Run a conversion and click <strong>Save</strong> to keep it.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.recentFiles.map((f) => (
                <li key={f.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.type} · {new Date(f.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  <a
                    href={`/${f.path}`}
                    download={f.name}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }

  const userId = session.user.id
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [conversions30d, toolGroups, savedFiles] = await Promise.all([
    prisma.conversion.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.conversion.groupBy({
      by: ['tool'],
      where: { userId },
      _count: { tool: true },
      orderBy: { _count: { tool: 'desc' } },
      take: 1,
    }),
    prisma.savedFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, path: true, type: true, size: true, createdAt: true },
    }),
  ])

  const storageResult = await prisma.savedFile.aggregate({
    where: { userId },
    _sum: { size: true },
  })

  return {
    props: {
      stats: {
        conversions30d,
        topTool: toolGroups[0]?.tool ?? null,
        storageUsed: storageResult._sum.size ?? 0,
        recentFiles: savedFiles.map(f => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
        })),
      },
    },
  }
}
