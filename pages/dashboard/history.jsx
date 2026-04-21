import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { authOptions } from '@lib/auth'
import prisma from '@lib/prisma'

const PAGE_SIZE = 50

export default function DashboardHistory({ conversions, total, page, tool: toolFilter }) {
  const router = useRouter()
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Conversion History</h1>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">← Dashboard</Link>
        </div>

        {/* Tool filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['', 'jsontocsv', 'csvtojson', 'jsontoyaml', 'yamltojson', 'jsontoxml', 'xmltojson', 'jsontomarkdown', 'markdowntojson', 'jsontohtml', 'htmltojson'].map((slug) => (
            <button
              key={slug}
              onClick={() => router.push({ pathname: '/dashboard/history', query: slug ? { tool: slug } : {} })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${toolFilter === slug || (!toolFilter && slug === '') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
            >
              {slug || 'All'}
            </button>
          ))}
        </div>

        {conversions.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <p className="text-gray-500 mb-4">No conversions yet.</p>
            <Link href="/" className="inline-block bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Start converting
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tool</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">File</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Input</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Output</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {conversions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.tool}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{c.fileName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{(c.inputSize / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{(c.outputSize / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{total} entries</span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <button onClick={() => router.push({ pathname: '/dashboard/history', query: { ...(toolFilter ? { tool: toolFilter } : {}), page: page - 1 } })} className="text-xs text-indigo-600 hover:underline">← Previous</button>
                  )}
                  <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <button onClick={() => router.push({ pathname: '/dashboard/history', query: { ...(toolFilter ? { tool: toolFilter } : {}), page: page + 1 } })} className="text-xs text-indigo-600 hover:underline">Next →</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res, query }) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }

  const userId = session.user.id
  const page = Math.max(1, parseInt(query.page) || 1)
  const toolFilter = query.tool || null
  const skip = (page - 1) * PAGE_SIZE

  const where = { userId, ...(toolFilter ? { tool: toolFilter } : {}) }

  const [conversions, total] = await Promise.all([
    prisma.conversion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: { id: true, tool: true, fileName: true, inputSize: true, outputSize: true, createdAt: true },
    }),
    prisma.conversion.count({ where }),
  ])

  return {
    props: {
      conversions: conversions.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
      total,
      page,
      tool: toolFilter,
    },
  }
}
