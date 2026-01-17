<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import PricingSection from '$lib/components/PricingSection.svelte';
	import FlavorList from '$lib/components/FlavorList.svelte';
	import ConcoctionList from '$lib/components/ConcoctionList.svelte';
	import CateringForm from '$lib/components/CateringForm.svelte';
	import ContactSection from '$lib/components/ContactSection.svelte';
	import StickyCallButton from '$lib/components/StickyCallButton.svelte';
	import { inview } from '$lib/actions/inview';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import SpecialsSection from '$lib/components/SpecialsSection.svelte';
</script>

<main id="main-content">
	<Hero />
	
	<!-- Menu Section -->
	<section id="menu" class="menu-section fade-in-section" aria-labelledby="menu-heading" use:inview>
		<div class="container">
			<h2 id="menu-heading" class="section-title text-center">Our Menu</h2>
			<p class="section-subtitle text-center">
				From classic favorites to tropical creations — find your perfect flavor!
			</p>
			
			<ShareButtons />
			
			<PricingSection />
			
			<div class="menu-grid">
				<FlavorList />
				<ConcoctionList />
			</div>
		</div>
	</section>
	
	<!-- Specials Section -->
	<div class="fade-in-section" use:inview>
		<SpecialsSection />
	</div>
	
	<!-- Wave Divider -->
	<div class="wave-divider yellow" aria-hidden="true"></div>
	
	<div class="fade-in-section" use:inview>
		<CateringForm />
	</div>
	
	<!-- Wave Divider -->
	<div class="wave-divider inverted" aria-hidden="true"></div>
	
	<div class="fade-in-section" use:inview>
		<ContactSection />
	</div>
</main>

<StickyCallButton />

<style>
	.menu-section {
		background: var(--color-cream);
		padding: var(--space-2xl) 0;
	}
	
	.section-title {
		margin-bottom: var(--space-sm);
	}
	
	.section-subtitle {
		color: var(--color-gray-600);
		max-width: 500px;
		margin: 0 auto var(--space-xl);
	}
	
	.text-center {
		text-align: center;
	}
	
	.menu-grid {
		display: grid;
		gap: var(--space-xl);
	}
	
	@media (min-width: 1024px) {
		.menu-grid {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}
	
	/* Add padding to account for sticky CTA on mobile */
	main {
		padding-bottom: 70px;
	}
	
	@media (min-width: 768px) {
		main {
			padding-bottom: 0;
		}
	}
</style>
