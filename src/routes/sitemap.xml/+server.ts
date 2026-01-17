import type { RequestHandler } from './$types';
import { siteConfig } from '$lib/config/site';

export const GET: RequestHandler = async () => {
	// Use fixed lastmod dates to accurately reflect when content was last updated
	// Update these dates when you make significant changes to each page
	const pages = [
		{ url: '/', priority: '1.0', changefreq: 'weekly', lastmod: '2026-01-17' },
		{ url: '/privacy', priority: '0.3', changefreq: 'yearly', lastmod: '2026-01-17' }
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
	.map(
		(page) => `  <url>
    <loc>${siteConfig.url}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
