import { useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import DashboardLayout from '@components/dashboard/DashboardLayout';
import prisma from '@lib/prisma';

const EXPIRY_OPTIONS = [
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year', value: '365d' },
  { label: 'No expiry', value: 'never' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ApiTokensPage({ initialTokens }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [name, setName] = useState('');
  const [expiresIn, setExpiresIn] = useState('never');
  const [creating, setCreating] = useState(false);
  const [newPlaintext, setNewPlaintext] = useState(null);
  const [error, setError] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [actionError, setActionError] = useState('');

  async function createToken() {
    if (!name.trim()) { setError('Token name is required.'); return; }
    setCreating(true); setError('');
    const r = await fetch('/api/v1/tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), expiresIn }) });
    const data = await r.json();
    setCreating(false);
    if (!r.ok) { setError(data.message || data.error || 'Failed to create token.'); return; }
    setTokens(prev => [data.token, ...prev]);
    setNewPlaintext(data.plaintext);
    setName(''); setExpiresIn('never');
  }

  async function revokeToken(id) {
    setActionError('');
    const r = await fetch(`/api/v1/tokens/${id}`, { method: 'DELETE' });
    if (r.ok) setTokens(prev => prev.filter(t => t.id !== id));
    else setActionError('Failed to revoke token. Please try again.');
  }

  async function renameToken(id) {
    if (!renameValue.trim()) return;
    setActionError('');
    const r = await fetch(`/api/v1/tokens/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: renameValue }) });
    const data = await r.json();
    if (r.ok) {
      setTokens(prev => prev.map(t => t.id === id ? { ...t, name: data.token.name } : t));
      setRenamingId(null); setRenameValue('');
    } else setActionError(data.error || 'Failed to rename token. Please try again.');
  }

  return (
    <DashboardLayout title="API Tokens" description="Manage your API keys">
      <div className="space-y-6">
        {/* Create new token */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Create new token</h2>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              placeholder="Token name (e.g. CI/CD, Zapier)"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createToken()}
            />
            <select
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              value={expiresIn}
              onChange={e => setExpiresIn(e.target.value)}
            >
              {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={createToken}
              disabled={creating}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create token'}
            </button>
          </div>
        </div>

        {/* Show plaintext once */}
        {newPlaintext && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl p-5">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Copy this token now — you won&apos;t see it again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm bg-white dark:bg-black/30 border border-yellow-200 dark:border-yellow-700 rounded px-3 py-2 break-all">{newPlaintext}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(newPlaintext); }}
                className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 whitespace-nowrap"
              >Copy</button>
            </div>
            <button onClick={() => setNewPlaintext(null)} className="mt-3 text-xs text-yellow-700 dark:text-yellow-400 underline">I&apos;ve saved it</button>
          </div>
        )}

        {/* Token list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground px-6 py-4 border-b border-border">Your tokens ({tokens.length})</h2>
          {actionError && <p className="px-6 py-3 text-sm text-red-500 border-b border-border">{actionError}</p>}
          {tokens.length === 0 ? (
            <p className="px-6 py-8 text-muted-foreground text-sm text-center">No tokens yet. Create one above to get started.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tokens.map(token => (
                <li key={token.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {renamingId === token.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            autoFocus
                            className="px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') renameToken(token.id); if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); } }}
                          />
                          <button onClick={() => renameToken(token.id)} className="text-xs text-red-500 hover:underline">Save</button>
                          <button onClick={() => { setRenamingId(null); setRenameValue(''); }} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <p className="font-medium text-foreground text-sm">{token.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{token.tokenPrefix}…</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Created {formatDate(token.createdAt)}</span>
                        <span>Last used {formatDate(token.lastUsedAt)}</span>
                        {token.expiresAt && <span>Expires {formatDate(token.expiresAt)}</span>}
                        <span>{token._count?.usages ?? 0} requests</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setRenamingId(token.id); setRenameValue(token.name); }}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >Rename</button>
                      <button
                        onClick={() => revokeToken(token.id)}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                      >Revoke</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick start */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Quick start</h2>
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto">{`curl -X POST https://www.ilovejson.com/api/v1/convert/json/csv \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"input":[{"name":"Alice","age":30},{"name":"Bob","age":25}]}'`}</pre>
        </div>
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: {
      id: true, name: true, tokenPrefix: true,
      lastUsedAt: true, createdAt: true, expiresAt: true,
      _count: { select: { usages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    props: {
      initialTokens: JSON.parse(JSON.stringify(tokens)),
    },
  };
}
