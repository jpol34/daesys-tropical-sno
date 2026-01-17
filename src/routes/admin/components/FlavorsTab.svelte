<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import type { Flavor } from '$lib/types';

	interface Props {
		isUpdating: boolean;
		onUpdatingChange: (value: boolean) => void;
	}

	let { isUpdating, onUpdatingChange }: Props = $props();

	// Load data on mount
	onMount(() => {
		loadFlavors();
	});

	// Flavors state
	let flavors = $state<Flavor[]>([]);
	let newFlavorName = $state('');
	let editingFlavor = $state<Flavor | null>(null);

	// Load flavors
	export async function loadFlavors() {
		const { data, error } = await supabase
			.from('flavors')
			.select('*')
			.order('sort_order', { ascending: true });

		if (!error) flavors = data || [];
	}

	async function addFlavor() {
		if (!newFlavorName.trim()) return;
		onUpdatingChange(true);

		const maxOrder = Math.max(0, ...flavors.map((f) => f.sort_order));
		const { data, error } = await supabase
			.from('flavors')
			.insert({ name: newFlavorName.trim(), sort_order: maxOrder + 1 })
			.select()
			.single();

		if (!error && data) {
			flavors = [...flavors, data];
			newFlavorName = '';
		}
		onUpdatingChange(false);
	}

	async function updateFlavor(flavor: Flavor) {
		onUpdatingChange(true);
		const { error } = await supabase
			.from('flavors')
			.update({ name: flavor.name, active: flavor.active })
			.eq('id', flavor.id);

		if (!error) {
			flavors = flavors.map((f) => (f.id === flavor.id ? flavor : f));
			editingFlavor = null;
		}
		onUpdatingChange(false);
	}

	async function deleteFlavor(id: string) {
		const confirmed = confirm('Delete this flavor?');
		if (!confirmed) return;

		onUpdatingChange(true);
		const { error } = await supabase.from('flavors').delete().eq('id', id);
		if (!error) flavors = flavors.filter((f) => f.id !== id);
		onUpdatingChange(false);
	}

	async function toggleFlavorActive(flavor: Flavor) {
		const updated = { ...flavor, active: !flavor.active };
		await updateFlavor(updated);
	}

	// Get active count for badge
	export function getActiveCount() {
		return flavors.filter((f) => f.active).length;
	}
</script>

<div class="management-section">
	<div class="add-form">
		<input
			type="text"
			class="form-input"
			placeholder="New flavor name..."
			bind:value={newFlavorName}
		/>
		<button
			class="btn btn-primary"
			onclick={addFlavor}
			disabled={isUpdating || !newFlavorName.trim()}
		>
			+ Add Flavor
		</button>
	</div>

	<div class="items-list">
		{#each flavors as flavor (flavor.id)}
			<div class="item-row" class:inactive={!flavor.active}>
				{#if editingFlavor?.id === flavor.id}
					<input type="text" class="form-input edit-input" bind:value={editingFlavor.name} />
					<div class="item-actions">
						<button class="btn btn-small btn-save" onclick={() => updateFlavor(editingFlavor!)}
							>Save</button
						>
						<button class="btn btn-small" onclick={() => (editingFlavor = null)}>Cancel</button>
					</div>
				{:else}
					<span class="item-name">{flavor.name}</span>
					<div class="item-actions">
						<button
							class="btn btn-small"
							class:active={flavor.active}
							onclick={() => toggleFlavorActive(flavor)}
						>
							{flavor.active ? '✓ Active' : '✗ Hidden'}
						</button>
						<button class="btn btn-small" onclick={() => (editingFlavor = { ...flavor })}
							>Edit</button
						>
						<button class="btn btn-small btn-delete-small" onclick={() => deleteFlavor(flavor.id)}
							>×</button
						>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<p class="management-note">
		💡 Hidden flavors won't appear on the website but are kept for future use.
	</p>
</div>

<style>
	.management-section {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}

	.add-form {
		display: flex;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
		flex-wrap: wrap;
	}

	.add-form .form-input {
		flex: 1;
		min-width: 200px;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		max-height: 50vh;
		overflow-y: auto;
	}

	.item-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-gray-100);
		border-radius: var(--radius-md);
		gap: var(--space-md);
	}

	.item-row.inactive {
		opacity: 0.6;
	}
	.item-name {
		font-weight: 600;
	}

	.item-actions {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.btn-small {
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.8rem;
		background: var(--color-gray-200);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.btn-small:hover {
		background: var(--color-gray-300);
	}
	.btn-small.active {
		background: #d1fae5;
		color: #065f46;
	}
	.btn-small.btn-save {
		background: var(--color-blue);
		color: white;
	}
	.btn-delete-small {
		color: var(--color-red);
	}
	.btn-delete-small:hover {
		background: var(--color-red);
		color: white;
	}

	.edit-input {
		flex: 1;
	}

	.management-note {
		margin-top: var(--space-lg);
		padding: var(--space-md);
		background: var(--color-cream);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		color: var(--color-gray-600);
	}
</style>
