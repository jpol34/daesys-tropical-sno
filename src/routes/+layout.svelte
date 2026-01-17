<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
	
	const jsonLd = JSON.stringify({
		"@context": "https://schema.org",
		"@type": "FoodEstablishment",
		"name": "Daesy's Tropical Sno",
		"address": {
			"@type": "PostalAddress",
			"streetAddress": "3814 Little Rd",
			"addressLocality": "Arlington",
			"addressRegion": "TX",
			"postalCode": "76016",
			"addressCountry": "US"
		},
		"telephone": "+1-817-401-6310",
		"email": "info@daesyssno.com",
		"openingHoursSpecification": [
			{
				"@type": "OpeningHoursSpecification",
				"dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
				"opens": "13:00",
				"closes": "20:00"
			}
		],
		"priceRange": "$",
		"servesCuisine": "Dessert"
	});
</script>

<svelte:head>
	<title>Daesy's Tropical Sno | Arlington, TX</title>
	<meta name="description" content="Daesy's Tropical Sno - 40+ flavors and 55+ signature concoctions. Shaved ice, sno cones, and catering for events in Arlington, Texas. Open 1-8pm Tue-Sun." />
	<meta name="keywords" content="sno cones, shaved ice, Arlington TX, tropical sno, catering, party, events" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href="https://daesystropicalsno.com/" />
	
	<!-- Open Graph -->
	<meta property="og:title" content="Daesy's Tropical Sno | Arlington, TX" />
	<meta property="og:description" content="40+ flavors and 55+ signature concoctions. Shaved ice and catering for events in Arlington, TX." />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:url" content="https://daesystropicalsno.com/" />
	<meta property="og:site_name" content="Daesy's Tropical Sno" />
	<meta property="og:image" content="https://daesystropicalsno.com/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Daesy's Tropical Sno - Tropical vibes and icy delights in Arlington, TX" />
	
	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Daesy's Tropical Sno | Arlington, TX" />
	<meta name="twitter:description" content="40+ flavors and 55+ signature concoctions. Shaved ice and catering for events." />
	<meta name="twitter:image" content="https://daesystropicalsno.com/og-image.png" />
	
	<!-- LocalBusiness Schema -->
	{@html '<script type="application/ld+json">' + jsonLd + '</script>'}
</svelte:head>

<!-- Skip link for accessibility -->
<a href="#main-content" class="skip-link">Skip to main content</a>

{@render children()}
