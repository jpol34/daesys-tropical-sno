<script>
	import { businessInfo } from '$lib/data/businessInfo';
</script>

<svelte:head>
	<title>Privacy Policy | Daesy's Tropical Sno</title>
	<meta name="description" content="Privacy Policy for Daesy's Tropical Sno" />
</svelte:head>

<main class="privacy-page">
	<div class="container">
		<a href="/" class="back-link top">← Back to the Chill</a>
		<h1>Privacy Policy</h1>
		<p class="last-updated">Last updated: January 17, 2026</p>

		<section>
			<h2>Who We Are</h2>
			<p>
				Daesy's Tropical Sno is a mobile sno cone business based in Arlington, Texas. 
				This policy explains how we collect and use your information.
			</p>
		</section>

		<section>
			<h2>What We Collect</h2>
			<p>We collect the following information when you provide it to us:</p>
			<ul>
				<li><strong>Sno Squad (Loyalty Program):</strong> Name, phone number, and optionally email address</li>
				<li><strong>Event Booking Requests:</strong> Name, phone number, email, event date, location, and event details</li>
			</ul>
		</section>

		<section>
			<h2>How We Use Your Information</h2>
			<ul>
				<li>To track your loyalty punches and rewards</li>
				<li>To contact you about your event booking request</li>
				<li>To send occasional updates about specials or promotions (only if you've opted in)</li>
			</ul>
		</section>

		<section>
			<h2>What We Don't Do</h2>
			<ul>
				<li>We <strong>never</strong> sell your information to third parties</li>
				<li>We <strong>never</strong> share your information with other businesses</li>
				<li>We <strong>never</strong> spam you</li>
			</ul>
		</section>

		<section>
			<h2>How We Protect Your Information</h2>
			<p>
				Your data is stored securely using industry-standard encryption and security practices.
			</p>
		</section>

		<section>
			<h2>Your Rights</h2>
			<p>You can request to:</p>
			<ul>
				<li>See what information we have about you</li>
				<li>Correct any incorrect information</li>
				<li>Delete your information entirely</li>
			</ul>
			<p>
				Just contact us and we'll take care of it — no hassle, no questions asked.
			</p>
		</section>

		<section>
			<h2>Contact Us</h2>
			<p>
				If you have any questions about this privacy policy or your data, reach out:
			</p>
			<ul class="contact-list">
				<li>📧 <a href="mailto:{businessInfo.email}">{businessInfo.email}</a></li>
				<li>📞 <a href="{businessInfo.phoneHref}">{businessInfo.phone}</a></li>
			</ul>
		</section>

		<a href="/" class="back-link">← Back to the Chill</a>
	</div>
</main>

<style>
	.privacy-page {
		padding: var(--space-2xl) var(--space-md);
		min-height: 100vh;
		background: var(--color-cream);
	}

	.container {
		max-width: 700px;
		margin: 0 auto;
	}

	h1 {
		font-family: var(--font-heading);
		font-size: 2.5rem;
		color: var(--color-blue);
		margin-bottom: 1rem;
	}

	.last-updated {
		color: var(--color-gray-500);
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
	}

	section {
		margin-bottom: 1.25rem;
		padding: 0;
	}

	h2 {
		font-family: var(--font-heading);
		font-size: 1.3rem;
		color: var(--color-red);
		margin: 0 0 1rem 0;
	}

	p {
		color: var(--color-gray-700);
		line-height: 1.5;
		margin: 0 0 0.25rem 0;
	}

	section p:last-child,
	section ul:last-child {
		margin-bottom: 0;
	}

	ul {
		color: var(--color-gray-700);
		line-height: 1.4;
		padding-left: 1.25rem;
		margin: 0;
	}

	li {
		margin: 0;
	}

	.contact-list {
		list-style: none;
		padding-left: 0;
	}

	.contact-list a {
		color: var(--color-blue);
		text-decoration: none;
	}

	.contact-list a:hover {
		text-decoration: underline;
	}

.back-link {
		display: inline-block;
		color: var(--color-blue);
		text-decoration: none;
		font-weight: 500;
	}
	
	.back-link.top {
		margin-bottom: var(--space-md);
	}
	
	.back-link:not(.top) {
		margin-top: var(--space-lg);
	}
	
	.back-link:hover {
		text-decoration: underline;
	}
</style>
