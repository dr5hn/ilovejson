import { GetServerSideProps } from 'next'
import { tools } from '@constants/tools'

const SITE_URL = 'https://www.ilovejson.com'

function generateSitemap(): string {
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/pricing', priority: '0.7', changefreq: 'monthly' },
    { path: '/api-docs', priority: '0.7', changefreq: 'monthly' },
    { path: '/cli', priority: '0.7', changefreq: 'monthly' },
    { path: '/about', priority: '0.5', changefreq: 'monthly' },
    { path: '/contact', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  ]

  const utilityPages = [
    { path: '/beautify', priority: '0.8', changefreq: 'monthly' },
    { path: '/compress', priority: '0.8', changefreq: 'monthly' },
    { path: '/validate', priority: '0.8', changefreq: 'monthly' },
    { path: '/minify', priority: '0.8', changefreq: 'monthly' },
    { path: '/viewer', priority: '0.8', changefreq: 'monthly' },
    { path: '/editor', priority: '0.8', changefreq: 'monthly' },
    { path: '/repair', priority: '0.8', changefreq: 'monthly' },
    { path: '/generateschema', priority: '0.8', changefreq: 'monthly' },
    { path: '/diff', priority: '0.8', changefreq: 'monthly' },
    { path: '/merge', priority: '0.8', changefreq: 'monthly' },
    { path: '/query', priority: '0.8', changefreq: 'monthly' },
    { path: '/faker', priority: '0.8', changefreq: 'monthly' },
  ]

  const converterPages = tools.map((tool) => ({
    path: `/${tool.slug}`,
    priority: '0.9',
    changefreq: 'monthly' as const,
  }))

  const allPages = [...staticPages, ...utilityPages, ...converterPages]
  const today = new Date().toISOString().split('T')[0]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const sitemap = generateSitemap()

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
  res.write(sitemap)
  res.end()

  return { props: {} }
}

export default function Sitemap() {
  return null
}
