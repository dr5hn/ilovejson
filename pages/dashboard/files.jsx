import { useState } from 'react'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { authOptions } from '@lib/auth'
import prisma from '@lib/prisma'

const STORAGE_CAP_BYTES = 100 * 1024 * 1024
const PAGE_SIZE = 50

export default function DashboardFiles({ files, total, page, tool: toolFilter, storageUsed }) {
  const router = useRouter()
  const [renaming, setRenaming] = useState(null) // { id, name }
  const [deleting, setDeleting] = useState(null) // id
  const [loading, setLoading] = useState(false)
  const usagePct = Math.min(100, (storageUsed / STORAGE_CAP_BYTES) * 100)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const refresh = () => router.replace(router.asPath)

  const handleRename = async (id, name) => {
    if (!name.trim()) return
    setLoading(true)
    await fetch(`/api/saved-files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setRenaming(null)
    setLoading(false)
    refresh()
  }

  const handleDelete = async (id) => {
    setLoading(true)
    await fetch(`/api/saved-files/${id}`, { method: 'DELETE' })
    setDeleting(null)
    setLoading(false)
    refresh()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Saved Files</h1>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">← Dashboard</Link>
        </div>

        {/* Storage bar */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Storage used</span>
            <span className="font-medium text-gray-900">{(storageUsed / 1024 / 1024).toFixed(1)} / 100 MB</span>
          </div>
          <div className="bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${usagePct > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['', 'json-to-csv', 'csv-to-json', 'json-to-yaml', 'yaml-to-json', 'json-to-xml', 'xml-to-json', 'json-to-markdown', 'json-to-html'].map((slug) => (
            <button
              key={slug}
              onClick={() => router.push({ pathname: '/dashboard/files', query: slug ? { tool: slug } : {} })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${toolFilter === slug || (!toolFilter && slug === '') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
            >
              {slug || 'All'}
            </button>
          ))}
        </div>

        {files.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <p className="text-gray-500 mb-4">No saved files yet.</p>
            <Link href="/" className="inline-block bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Try a tool
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Tool</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Size</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Saved</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {files.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {renaming?.id === f.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleRename(f.id, renaming.name) }} className="flex gap-2">
                          <input
                            autoFocus
                            value={renaming.name}
                            onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                          />
                          <button type="submit" disabled={loading} className="text-indigo-600 font-medium text-xs">Save</button>
                          <button type="button" onClick={() => setRenaming(null)} className="text-gray-400 text-xs">Cancel</button>
                        </form>
                      ) : (
                        <span className="font-medium text-gray-900">{f.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{f.type}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{(f.size / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 justify-end">
                        <a href={`/${f.path}`} download={f.name} className="text-indigo-600 hover:underline text-xs font-medium">Download</a>
                        <button onClick={() => setRenaming({ id: f.id, name: f.name })} className="text-gray-500 hover:text-gray-700 text-xs">Rename</button>
                        <button onClick={() => setDeleting(f.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{total} files</span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <button onClick={() => router.push({ pathname: '/dashboard/files', query: { ...(toolFilter ? { tool: toolFilter } : {}), page: page - 1 } })} className="text-xs text-indigo-600 hover:underline">← Previous</button>
                  )}
                  <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <button onClick={() => router.push({ pathname: '/dashboard/files', query: { ...(toolFilter ? { tool: toolFilter } : {}), page: page + 1 } })} className="text-xs text-indigo-600 hover:underline">Next →</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Delete file?</h2>
            <p className="text-sm text-gray-500 mb-6">This will permanently remove the file and cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleting(null)} className="text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={() => handleDelete(deleting)} disabled={loading} className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
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

  const where = { userId, ...(toolFilter ? { type: toolFilter } : {}) }

  const [files, total, storageResult] = await Promise.all([
    prisma.savedFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: { id: true, name: true, path: true, type: true, size: true, createdAt: true },
    }),
    prisma.savedFile.count({ where }),
    prisma.savedFile.aggregate({ where: { userId }, _sum: { size: true } }),
  ])

  return {
    props: {
      files: files.map(f => ({ ...f, createdAt: f.createdAt.toISOString() })),
      total,
      page,
      tool: toolFilter,
      storageUsed: storageResult._sum.size ?? 0,
    },
  }
}
