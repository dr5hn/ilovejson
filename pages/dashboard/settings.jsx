import { useState } from 'react'
import { getServerSession } from 'next-auth/next'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { authOptions } from '@lib/auth'
import prisma from '@lib/prisma'

const STORAGE_CAP_BYTES = 100 * 1024 * 1024

export default function DashboardSettings({ user, accounts, storageUsed }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const usagePct = Math.min(100, (storageUsed / STORAGE_CAP_BYTES) * 100)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) {
      await signOut({ callbackUrl: '/' })
    } else {
      setDeleting(false)
      setConfirmDelete(false)
      alert('Failed to delete account. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">← Dashboard</Link>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            {user.image ? (
              <img src={user.image} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{user.name || '—'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Connected providers */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Sign-in methods</h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-500">No connected providers.</p>
          ) : (
            <ul className="space-y-2">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-medium capitalize text-gray-700">{a.provider}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Storage */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Storage</h2>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Used</span>
            <span className="font-medium">{(storageUsed / 1024 / 1024).toFixed(1)} / 100 MB</span>
          </div>
          <div className="bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${usagePct > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <Link href="/dashboard/files" className="inline-block mt-3 text-xs text-indigo-600 hover:underline">
            Manage saved files →
          </Link>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl shadow p-6 border border-red-100">
          <h2 className="text-base font-semibold text-red-600 mb-2">Danger zone</h2>
          <p className="text-sm text-gray-500 mb-4">
            Deleting your account is permanent. All saved files will be removed from disk and your data will be erased.
          </p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Delete account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-700">Are you sure? This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </button>
              </div>
            </div>
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

  const [userRecord, accounts, storageResult] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, image: true } }),
    prisma.account.findMany({ where: { userId }, select: { id: true, provider: true } }),
    prisma.savedFile.aggregate({ where: { userId }, _sum: { size: true } }),
  ])

  return {
    props: {
      user: userRecord,
      accounts,
      storageUsed: storageResult._sum.size ?? 0,
    },
  }
}
