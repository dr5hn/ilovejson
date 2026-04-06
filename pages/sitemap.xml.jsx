import { tools } from '@constants/tools';

const SITE_URL = 'https://www.ilovejson.com';

const utilityPages = [
  '/compress', '/beautify', '/validate', '/viewer', '/editor',
  '/repair', '/generateschema', '/diff', '/merge', '/query',
  '/faker', '/minify',
];

const staticPages = [
  '/', '/pricing', '/api-docs', '/cli', '/about', '/contact',
  '/privacy', '/terms',
];

function generateSitemap() {
  const toolUrls = tools.map((t) => `
    <url>
      <loc>${SITE_URL}/${t.slug}</loc>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`).join('');

  const utilityUrls = utilityPages.map((p) => `
    <url>
      <loc>${SITE_URL}${p}</loc>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`).join('');

  const staticUrls = staticPages.map((p) => `
    <url>
      <loc>${SITE_URL}${p}</loc>
      <changefreq>weekly</changefreq>
      <priority>${p === '/' ? '1.0' : '0.5'}</priority>
    </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${utilityUrls}
  ${toolUrls}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSitemap();
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
