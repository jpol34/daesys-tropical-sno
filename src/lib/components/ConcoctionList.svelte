<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	type Concoction = {
		name: string;
		ingredients: string[];
	};
	
	let concoctions = $state<Concoction[]>([]);
	let isLoading = $state(true);
	
	onMount(async () => {
		const { data, error } = await supabase
			.from('concoctions')
			.select('name, ingredients')
			.eq('active', true)
			.order('sort_order', { ascending: true });
		
		if (data && !error) {
			concoctions = data;
		}
		isLoading = false;
	});
</script>

<div class="concoction-section">
	<h3 class="concoction-title">
		<span class="concoction-icon" aria-hidden="true">🌺</span>
		Popular Concoctions
	</h3>
	<p class="concoction-subtitle">Ask us about the secret menu — customer creations you won't find on the board!</p>
	
	{#if isLoading}
		<div class="concoction-grid" aria-hidden="true">
			{#each Array(12) as _}
				<div class="skeleton skeleton-card"></div>
			{/each}
		</div>
	{:else}
		<ul class="concoction-grid" role="list">
			{#each concoctions as concoction, i}
				<li class="concoction-card item-reveal" style="animation-delay: {i * 20}ms">
					<span class="concoction-name">{concoction.name}</span>
					<span class="concoction-ingredients">{concoction.ingredients.join(' + ')}</span>
				</li>
			{/each}
		</ul>
	{/if}
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
	
	.concoction-icon {
		font-size: 1.2em;
	}
	
	.secret-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5em;
		height: 1.5em;
		background: var(--color-yellow);
		color: var(--color-gray-900);
		font-family: var(--font-body);
		font-weight: 800;
		font-size: 0.6em;
		border-radius: var(--radius-full);
		margin-left: var(--space-xs);
		cursor: help;
		transition: transform var(--transition-fast);
	}
	
	.secret-badge:hover {
		transform: scale(1.1);
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
		transition: transform var(--transition-fast), box-shadow var(--transition-fast);
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
