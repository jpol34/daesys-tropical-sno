<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { siteConfig, buildUrl, getCanonicalUrl } from '$lib/config/site';
	import { businessInfo } from '$lib/data/businessInfo';
	import NavigationLoader from '$lib/components/NavigationLoader.svelte';

	let { children } = $props();

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FoodEstablishment',
		name: siteConfig.name,
		url: siteConfig.url,
		image: buildUrl(siteConfig.ogImage),
		address: {
			'@type': 'PostalAddress',
			streetAddress: businessInfo.address.street,
			addressLocality: businessInfo.address.city,
			addressRegion: businessInfo.address.state,
			postalCode: businessInfo.address.zip,
			addressCountry: 'US'
		},
		geo: {
			'@type': 'GeoCoordinates',
			latitude: siteConfig.geo.latitude,
			longitude: siteConfig.geo.longitude
		},
		telephone: businessInfo.phoneHref.replace('tel:', ''),
		email: businessInfo.email,
		openingHoursSpecification: [
			{
				'@type': 'OpeningHoursSpecification',
				dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
				opens: '13:00',
				closes: '20:00'
			}
		],
		priceRange: '$',
		servesCuisine: 'Dessert',
		areaServed: {
			'@type': 'City',
			name: businessInfo.address.city,
			containedInPlace: {
				'@type': 'State',
				name: 'Texas'
			}
		},
		sameAs: [businessInfo.social.instagram.url, businessInfo.social.facebook.url]
	});
</script>

<svelte:head>
	<title>{siteConfig.name} | Arlington, TX</title>
	<meta name="description" content={siteConfig.description} />
	<meta name="keywords" content={siteConfig.keywords} />
	<meta name="robots" content="index, follow" />

	<!-- Geo Meta Tags for Local SEO -->
	<meta name="geo.region" content={siteConfig.geo.region} />
	<meta name="geo.placename" content={siteConfig.geo.placename} />
	<meta name="geo.position" content="{siteConfig.geo.latitude};{siteConfig.geo.longitude}" />
	<meta name="ICBM" content="{siteConfig.geo.latitude}, {siteConfig.geo.longitude}" />

	<!-- Canonical URL (dynamic based on current page) -->
	<link rel="canonical" href={getCanonicalUrl($page.url.pathname)} />

	<!-- Open Graph -->
	<meta property="og:title" content="{siteConfig.name} | Arlington, TX" />
	<meta
		property="og:description"
		content="40+ flavors and 55+ signature concoctions. Shaved ice and catering for events in Arlington, TX."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:url" content={getCanonicalUrl($page.url.pathname)} />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:image" content={buildUrl(siteConfig.ogImage)} />
	<meta property="og:image:width" content={String(siteConfig.ogImageWidth)} />
	<meta property="og:image:height" content={String(siteConfig.ogImageHeight)} />
	<meta property="og:image:alt" content={siteConfig.ogImageAlt} />

	<!-- LocalBusiness Schema -->
	{@html '<script type="application/ld+json">' + jsonLd + '</script>'}
</svelte:head>

<NavigationLoader />

<!-- Skip link for accessibility -->
<a href="#main-content" class="skip-link">Skip to main content</a>

{@render children()}
