<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	let flavors = $state<string[]>([]);
	let isLoading = $state(true);
	
	onMount(async () => {
		const { data, error } = await supabase
			.from('flavors')
			.select('name')
			.eq('active', true)
			.order('sort_order', { ascending: true });
		
		if (data && !error) {
			flavors = data.map(f => f.name);
		}
		isLoading = false;
	});
</script>

<div class="flavor-section">
	<h3 class="flavor-title">
		<span class="flavor-icon" aria-hidden="true">🍧</span>
		Our Flavors
	</h3>
	
	{#if isLoading}
		<div class="flavor-grid skeleton-grid" aria-hidden="true">
			{#each Array(20) as _}
				<div class="skeleton skeleton-item"></div>
			{/each}
		</div>
	{:else}
		<ul class="flavor-grid" role="list">
			{#each flavors as flavor, i}
				<li class="flavor-item item-reveal" style="animation-delay: {i * 15}ms">{flavor}</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.flavor-section {
		background: var(--color-white);
		border-radius: var(--radius-xl);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}
	
	.flavor-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 4vw, 2rem);
		color: var(--color-blue);
		margin-bottom: var(--space-sm);
		text-align: center;
	}
	
	.flavor-icon {
		font-size: 1.2em;
	}
	
	
	
	.flavor-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-xs) var(--space-md);
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.flavor-item {
		padding: var(--space-xs) 0;
		color: var(--color-gray-800);
		font-size: 0.95rem;
		border-bottom: 1px dashed var(--color-gray-200);
		position: relative;
		padding-left: 1em;
	}
	
	.flavor-item::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--color-red);
		font-weight: bold;
	}
	
	@media (min-width: 480px) {
		.flavor-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	
	@media (min-width: 768px) {
		.flavor-section {
			padding: var(--space-xl);
		}
		
		.flavor-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	
	@media (min-width: 1024px) {
		.flavor-grid {
			grid-template-columns: repeat(5, 1fr);
		}
	}
	
	/* Skeleton styles */
	.skeleton-grid {
		list-style: none;
	}
</style>
