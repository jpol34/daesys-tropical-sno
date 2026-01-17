<script lang="ts">
	// Pricing data
	const sizes = [
		{ name: 'Mini', price: 2 },
		{ name: 'Small', price: 3 },
		{ name: 'Medium', price: 4 },
		{ name: 'Large', price: 5 }
	];
	
	const candyToppings = [
		'Gummy Sharks',
		'Gummy Worms',
		'Gummy Bears',
		'Sour Gummy Worms',
		'Sour Patch Kids',
		'Sour Watermelons',
		'Pop Rocks',
		'Sour Spray',
		'Chamoy',
		'Tajín'
	];
	
	const creamToppings = ['Vanilla', 'Coconut'];
</script>

<div class="pricing-section">
	<!-- Sizes -->
	<div class="pricing-card sizes-card">
		<h3 class="pricing-title">
			<span class="pricing-icon" aria-hidden="true">🍧</span>
			Size It Up
		</h3>
		<div class="sizes-grid">
			{#each sizes as size}
				<div class="size-item">
					<span class="size-name">{size.name}</span>
					<span class="size-price">${size.price}</span>
				</div>
			{/each}
		</div>
		<p class="pricing-note">No tax — flat rate pricing!</p>
	</div>
	
	<!-- Toppings -->
	<div class="pricing-card toppings-card">
		<h3 class="pricing-title">
			<span class="pricing-icon" aria-hidden="true">🍬</span>
			Top It Off
			<span class="topping-price">50¢ each</span>
		</h3>
		
		<div class="toppings-group">
			<h4 class="toppings-category">Candy</h4>
			<ul class="toppings-list">
				{#each candyToppings as topping}
					<li>{topping}</li>
				{/each}
			</ul>
		</div>
		
		<div class="toppings-group">
			<h4 class="toppings-category">Cream</h4>
			<ul class="toppings-list cream-list">
				{#each creamToppings as topping}
					<li>{topping}</li>
				{/each}
			</ul>
		</div>
	</div>
	
	<!-- Sugar-free note -->
	<div class="sugar-free-banner">
		<span>Sugar-free options available!</span>
	</div>
</div>

<style>
	.pricing-section {
		display: grid;
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
	}
	
	.pricing-card {
		background: var(--color-white);
		border-radius: var(--radius-xl);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
		border: 3px solid transparent;
	}
	
	.sizes-card {
		border-color: var(--color-yellow);
	}
	
	.toppings-card {
		border-color: var(--color-red-light);
	}
	
	.pricing-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		font-family: var(--font-heading);
		font-size: clamp(1.25rem, 3vw, 1.5rem);
		color: var(--color-blue);
		margin-bottom: var(--space-md);
		text-align: center;
		flex-wrap: wrap;
	}
	
	.pricing-icon {
		font-size: 1.3em;
	}
	
	.topping-price {
		display: inline-block;
		background: var(--color-red);
		color: var(--color-white);
		font-family: var(--font-body);
		font-size: 0.65em;
		font-weight: 700;
		padding: 0.2em 0.6em;
		border-radius: var(--radius-full);
		margin-left: var(--space-xs);
	}
	
	/* Sizes Grid */
	.sizes-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}
	
	.size-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-sm);
		background: linear-gradient(135deg, var(--color-cream) 0%, var(--color-white) 100%);
		border-radius: var(--radius-md);
		transition: transform var(--transition-fast);
	}
	
	.size-item:hover {
		transform: scale(1.05);
	}
	
	.size-name {
		font-weight: 600;
		color: var(--color-gray-800);
		font-size: 0.85rem;
	}
	
	.size-price {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		color: var(--color-blue);
	}
	
	.pricing-note {
		text-align: center;
		color: var(--color-gray-600);
		font-size: 0.9rem;
		margin: 0;
		font-style: italic;
	}
	
	/* Toppings */
	.toppings-group {
		margin-bottom: var(--space-md);
	}
	
	.toppings-group:last-child {
		margin-bottom: 0;
	}
	
	.toppings-category {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-red);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-xs);
		padding-bottom: var(--space-xs);
		border-bottom: 2px dashed var(--color-gray-200);
	}
	
	.toppings-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs) var(--space-md);
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.toppings-list li {
		font-size: 0.9rem;
		color: var(--color-gray-800);
		padding-left: 1.2em;
		position: relative;
	}
	
	.toppings-list li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--color-yellow);
		font-weight: bold;
	}
	
	/* Sugar-free banner */
	.sugar-free-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		background: linear-gradient(90deg, var(--color-blue) 0%, var(--color-blue-light) 100%);
		color: var(--color-white);
		padding: var(--space-md);
		border-radius: var(--radius-full);
		font-weight: 600;
		font-size: 1rem;
		box-shadow: var(--shadow-md);
	}
	
	.sugar-free-icon {
		font-size: 1.3em;
	}
	
	/* Responsive */
	@media (min-width: 640px) {
		.pricing-section {
			grid-template-columns: 1fr 1fr;
		}
		
		.sugar-free-banner {
			grid-column: 1 / -1;
		}
	}
	
	@media (min-width: 768px) {
		.pricing-card {
			padding: var(--space-xl);
		}
		
		.sizes-grid {
			gap: var(--space-md);
		}
		
		.size-name {
			font-size: 0.95rem;
		}
		
		.size-price {
			font-size: 1.75rem;
		}
	}
</style>
