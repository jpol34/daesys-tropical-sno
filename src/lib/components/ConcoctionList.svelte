<script lang="ts">
	import type { Concoction } from '$lib/types';

	// Receive concoctions as a prop from the page load function
	let { concoctions }: { concoctions: Concoction[] } = $props();
</script>

<div class="concoction-section">
	<h3 class="concoction-title">Trust the Pros</h3>
	<p class="concoction-subtitle">
		Don't forget to ask about the secret menu — customer creations you won't find on the board!
	</p>

	<ul class="concoction-grid" role="list">
		{#each concoctions as concoction, i (concoction.name)}
			<li class="concoction-card item-reveal" style="animation-delay: {i * 20}ms">
				<span class="concoction-name">{concoction.name}</span>
				<span class="concoction-ingredients">{concoction.ingredients.join(' + ')}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.concoction-section {
		background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-blue-dark) 100%);
		border-radius: var(--radius-xl);
		padding: var(--space-lg);
		box-shadow: var(--shadow-lg);
	}

	.concoction-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 4vw, 2rem);
		color: var(--color-white);
		margin-bottom: var(--space-sm);
		text-align: center;
	}

	.concoction-subtitle {
		text-align: center;
		color: var(--color-cream);
		margin-bottom: var(--space-lg);
		font-size: 0.95rem;
	}

	.concoction-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-sm);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.concoction-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
		display: flex;
		flex-direction: column;
		gap: 2px;
		transition:
			transform var(--transition-fast),
			box-shadow var(--transition-fast);
	}

	.concoction-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.concoction-name {
		font-weight: 700;
		color: var(--color-blue);
		font-size: 1rem;
	}

	.concoction-ingredients {
		font-size: 0.85rem;
		color: var(--color-gray-600);
	}

	@media (min-width: 480px) {
		.concoction-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 768px) {
		.concoction-section {
			padding: var(--space-xl);
		}

		.concoction-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.concoction-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>
