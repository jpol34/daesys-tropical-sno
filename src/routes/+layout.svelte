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
	<meta name="description" content="Daesy's Tropical Sno - 40+ flavors and 56 signature concoctions. Shaved ice, sno cones, and catering for events in Arlington, Texas. Open 1-8pm Tue-Sun." />
	<meta name="keywords" content="sno cones, shaved ice, Arlington TX, tropical sno, catering, party, events" />
	
	<!-- Open Graph -->
	<meta property="og:title" content="Daesy's Tropical Sno | Arlington, TX" />
	<meta property="og:description" content="40+ flavors and 56 signature concoctions. Shaved ice and catering for events." />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	
	<!-- LocalBusiness Schema -->
	{@html '<script type="application/ld+json">' + jsonLd + '</script>'}
</svelte:head>

<!-- Skip link for accessibility -->
<a href="#main-content" class="skip-link">Skip to main content</a>

{@render children()}
