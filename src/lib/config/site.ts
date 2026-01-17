// Centralized site configuration
// Single source of truth for site-wide constants

export const siteConfig = {
	url: 'https://daesyssno.com',
	name: "Daesy's Tropical Sno",
	shortName: "Daesy's Sno",
	tagline: 'Tropical vibes & icy delights in Arlington, TX',

	// SEO
	description:
		"Daesy's Tropical Sno - 40+ flavors and 55+ signature concoctions. Shaved ice, sno cones, and catering for events in Arlington, Texas. Open 1-8pm Tue-Sun.",
	keywords: 'sno cones, shaved ice, Arlington TX, tropical sno, catering, party, events',

	// Open Graph
	ogImage: '/og-image.png',
	ogImageAlt: "Daesy's Tropical Sno - Tropical vibes and icy delights in Arlington, TX",
	ogImageWidth: 1200,
	ogImageHeight: 630,

	// Geo (for local SEO meta tags)
	geo: {
		region: 'US-TX',
		placename: 'Arlington, Texas',
		latitude: 32.735,
		longitude: -97.155
	}
} as const;

export type SiteConfig = typeof siteConfig;

// Helper: Build full URL from path
export function buildUrl(path: string): string {
	const cleanPath = path.startsWith('/') ? path : `/${path}`;
	return `${siteConfig.url}${cleanPath}`;
}

// Helper: Get canonical URL (removes trailing slashes)
export function getCanonicalUrl(pathname: string): string {
	const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
	return buildUrl(cleanPath);
}
