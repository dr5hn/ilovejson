import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import DashboardLayout from '@components/dashboard/DashboardLayout';
import prisma from '@lib/prisma';
import { getEntitlements } from '@lib/entitlements';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function hoursUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.ceil((midnight - now) / 3600000);
}

function BarChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    import('chart.js/auto').then(({ default: Chart }) => {
      if (canvas._chartInstance) canvas._chartInstance.destroy();
      canvas._chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.date),
          datasets: [{
            label: 'Requests',
            data: data.map(d => d.count),
            backgroundColor: 'rgba(239,68,68,0.7)',
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    });

    return () => { if (canvas._chartInstance) canvas._chartInstance.destroy(); };
  }, [data]);

  return <canvas ref={canvasRef} height={140} />;
}

export default function ApiUsagePage({ dailyUsage, routeBreakdown, topTokens, totals, dailyLimit }) {
  const router = useRouter();

  // Re-fetch server props when the tab regains focus so plan changes
  // (e.g. returning from the billing portal) are reflected immediately.
  useEffect(() => {
    const refresh = () => router.replace(router.asPath);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [router]);

  const usedToday = totals.today;
  const remaining = dailyLimit === null ? null : Math.max(0, dailyLimit - usedToday);
  const pct = dailyLimit ? Math.min(100, Math.round((usedToday / dailyLimit) * 100)) : 0;

  return (
    <DashboardLayout title="API Usage" description="Monitor your API consumption">
      <div className="space-y-6">

        {/* Daily limit meter */}
        {dailyLimit !== null && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Daily requests</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{usedToday.toLocaleString()}</span>
                {' / '}{dailyLimit.toLocaleString()}
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {remaining.toLocaleString()} requests remaining today · resets in {hoursUntilMidnight()} h
            </p>
          </div>
        )}

        {/* Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total requests (30d)', value: totals.requests },
            { label: 'Success (2xx)', value: totals.success },
            { label: 'Errors (4xx/5xx)', value: totals.errors },
            { label: 'Avg duration', value: `${totals.avgDuration}ms` },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Daily chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Requests per day (last 30 days)</h2>
          {dailyUsage.length ? <BarChart data={dailyUsage} /> : <p className="text-sm text-muted-foreground">No data yet.</p>}
        </div>

        {/* Route breakdown */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Breakdown by route</h2>
          {routeBreakdown.length ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Route</th>
                <th className="pb-2 font-medium text-right">Requests</th>
                <th className="pb-2 font-medium text-right">Errors</th>
              </tr></thead>
              <tbody>
                {routeBreakdown.map(r => (
                  <tr key={r.route} className="border-b border-border/50 last:border-0">
                    <td className="py-2 font-mono text-xs">{r.route}</td>
                    <td className="py-2 text-right">{r._count._all}</td>
                    <td className="py-2 text-right text-red-500">{r.errorCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-muted-foreground">No data yet.</p>}
        </div>

        {/* Top tokens */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Top tokens by usage</h2>
          {topTokens.length ? (
            <ul className="space-y-2">
              {topTokens.map(t => (
                <li key={t.tokenId} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{t.token?.name ?? 'Revoked token'} <span className="font-mono text-xs text-muted-foreground">{t.token?.tokenPrefix}…</span></span>
                  <span className="text-muted-foreground">{t._count._all} requests</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No data yet.</p>}
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

  const since30d = new Date(Date.now() - 30 * 86400000);
  const since24h = new Date(Date.now() - 86400000);

  const entitlements = await getEntitlements(session.user.id);
  const dailyLimit = entitlements.apiEnabled ? entitlements.apiRateLimit.perDay : null;

  const tokenIds = (await prisma.apiToken.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })).map(t => t.id);

  const [allUsage, routeBreakdown, topTokens, todayCount] = await Promise.all([
    prisma.apiUsage.findMany({
      where: { tokenId: { in: tokenIds }, createdAt: { gte: since30d } },
      select: { createdAt: true, status: true, durationMs: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.apiUsage.groupBy({
      by: ['route'],
      where: { tokenId: { in: tokenIds }, createdAt: { gte: since30d } },
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.apiUsage.groupBy({
      by: ['tokenId'],
      where: { tokenId: { in: tokenIds }, createdAt: { gte: since30d } },
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.apiUsage.count({
      where: { tokenId: { in: tokenIds }, createdAt: { gte: since24h } },
    }),
  ]);

  // Build daily buckets
  const dayMap = {};
  allUsage.forEach(u => {
    const d = new Date(u.createdAt).toISOString().split('T')[0];
    dayMap[d] = (dayMap[d] || 0) + 1;
  });
  const dailyUsage = Object.entries(dayMap).map(([date, count]) => ({ date: formatDate(date + 'T00:00:00Z'), count }));

  // Enrich topTokens with token info
  const tokenMap = Object.fromEntries(
    (await prisma.apiToken.findMany({ where: { id: { in: tokenIds } }, select: { id: true, name: true, tokenPrefix: true } })).map(t => [t.id, t])
  );
  const topTokensEnriched = topTokens.map(t => ({ ...t, token: tokenMap[t.tokenId] || null }));

  // Route error counts
  const errorCounts = await prisma.apiUsage.groupBy({
    by: ['route'],
    where: { tokenId: { in: tokenIds }, createdAt: { gte: since30d }, status: { gte: 400 } },
    _count: { _all: true },
  });
  const errorMap = Object.fromEntries(errorCounts.map(e => [e.route, e._count._all]));
  const routeBreakdownEnriched = routeBreakdown.map(r => ({ ...r, errorCount: errorMap[r.route] || 0 }));

  const totals = {
    requests: allUsage.length,
    success: allUsage.filter(u => u.status >= 200 && u.status < 300).length,
    errors: allUsage.filter(u => u.status >= 400).length,
    avgDuration: allUsage.length ? Math.round(allUsage.reduce((s, u) => s + u.durationMs, 0) / allUsage.length) : 0,
    today: todayCount,
  };

  return {
    props: {
      dailyUsage,
      routeBreakdown: JSON.parse(JSON.stringify(routeBreakdownEnriched)),
      topTokens: JSON.parse(JSON.stringify(topTokensEnriched)),
      totals,
      dailyLimit,
    },
  };
}
