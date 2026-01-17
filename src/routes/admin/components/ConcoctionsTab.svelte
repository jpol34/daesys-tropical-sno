<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { Concoction } from '$lib/types';
	
	interface Props {
		isUpdating: boolean;
		onUpdatingChange: (value: boolean) => void;
	}
	
	let { isUpdating, onUpdatingChange }: Props = $props();
	
	// Concoctions state
	let concoctions = $state<Concoction[]>([]);
	let newConcoctionName = $state('');
	let newConcoctionIngredients = $state('');
	let editingConcoction = $state<Concoction | null>(null);
	
	// Load concoctions
	export async function loadConcoctions() {
		const { data, error } = await supabase
			.from('concoctions')
			.select('*')
			.order('sort_order', { ascending: true });
		
		if (!error) concoctions = data || [];
	}
	
	async function addConcoction() {
		if (!newConcoctionName.trim() || !newConcoctionIngredients.trim()) return;
		onUpdatingChange(true);
		
		const ingredients = newConcoctionIngredients.split(',').map(i => i.trim()).filter(Boolean);
		const maxOrder = Math.max(0, ...concoctions.map(c => c.sort_order));
		
		const { data, error } = await supabase
			.from('concoctions')
			.insert({ name: newConcoctionName.trim(), ingredients, sort_order: maxOrder + 1 })
			.select()
			.single();
		
		if (!error && data) {
			concoctions = [...concoctions, data];
			newConcoctionName = '';
			newConcoctionIngredients = '';
		}
		onUpdatingChange(false);
	}
	
	async function updateConcoction(concoction: Concoction) {
		onUpdatingChange(true);
		const { error } = await supabase
			.from('concoctions')
			.update({ name: concoction.name, ingredients: concoction.ingredients, active: concoction.active })
			.eq('id', concoction.id);
		
		if (!error) {
			concoctions = concoctions.map(c => c.id === concoction.id ? concoction : c);
			editingConcoction = null;
		}
		onUpdatingChange(false);
	}
	
	async function deleteConcoction(id: string) {
		const confirmed = confirm('Delete this concoction?');
		if (!confirmed) return;
		
		onUpdatingChange(true);
		const { error } = await supabase.from('concoctions').delete().eq('id', id);
		if (!error) concoctions = concoctions.filter(c => c.id !== id);
		onUpdatingChange(false);
	}
	
	async function toggleConcoctionActive(concoction: Concoction) {
		const updated = { ...concoction, active: !concoction.active };
		await updateConcoction(updated);
	}
	
	// Get active count for badge
	export function getActiveCount() {
		return concoctions.filter(c => c.active).length;
	}
</script>

<div class="management-section">
	<div class="add-form add-form-vertical">
		<input type="text" class="form-input" placeholder="Concoction name..." bind:value={newConcoctionName} />
		<input type="text" class="form-input" placeholder="Ingredients (comma separated)..." bind:value={newConcoctionIngredients} />
		<button class="btn btn-primary" onclick={addConcoction} disabled={isUpdating || !newConcoctionName.trim() || !newConcoctionIngredients.trim()}>
			+ Add Concoction
		</button>
	</div>
	
	<div class="items-list">
		{#each concoctions as concoction (concoction.id)}
			<div class="item-row concoction-row" class:inactive={!concoction.active}>
				{#if editingConcoction?.id === concoction.id}
					<div class="edit-concoction">
						<input type="text" class="form-input" placeholder="Name" bind:value={editingConcoction.name} />
						<input type="text" class="form-input" placeholder="Ingredients (comma separated)" value={editingConcoction.ingredients.join(', ')} 
							oninput={(e) => editingConcoction!.ingredients = (e.target as HTMLInputElement).value.split(',').map(i => i.trim())} />
						<div class="item-actions">
							<button class="btn btn-small btn-save" onclick={() => updateConcoction(editingConcoction!)}>Save</button>
							<button class="btn btn-small" onclick={() => editingConcoction = null}>Cancel</button>
						</div>
					</div>
				{:else}
					<div class="concoction-info">
						<span class="item-name">{concoction.name}</span>
						<span class="item-ingredients">{concoction.ingredients.join(' + ')}</span>
					</div>
					<div class="item-actions">
						<button class="btn btn-small" class:active={concoction.active} onclick={() => toggleConcoctionActive(concoction)}>
							{concoction.active ? '✓ Active' : '✗ Hidden'}
						</button>
						<button class="btn btn-small" onclick={() => editingConcoction = { ...concoction }}>Edit</button>
						<button class="btn btn-small btn-delete-small" onclick={() => deleteConcoction(concoction.id)}>×</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>
	
	<p class="management-note">💡 Hidden concoctions won't appear on the website but are kept for future use.</p>
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
	
	.add-form .form-input { flex: 1; min-width: 200px; }
	
	.add-form-vertical {
		flex-direction: column;
	}
	
	.add-form-vertical .form-input { width: 100%; }
	
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
	
	.item-row.inactive { opacity: 0.6; }
	.item-name { font-weight: 600; }
	.item-ingredients { font-size: 0.85rem; color: var(--color-gray-600); }
	
	.concoction-row {
		flex-direction: column;
		align-items: flex-start;
	}
	
	.concoction-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	
	.edit-concoction {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		width: 100%;
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
	
	.btn-small:hover { background: var(--color-gray-300); }
	.btn-small.active { background: #d1fae5; color: #065f46; }
	.btn-small.btn-save { background: var(--color-blue); color: white; }
	.btn-delete-small { color: var(--color-red); }
	.btn-delete-small:hover { background: var(--color-red); color: white; }
	
	.management-note {
		margin-top: var(--space-lg);
		padding: var(--space-md);
		background: var(--color-cream);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		color: var(--color-gray-600);
	}
	
	@media (min-width: 768px) {
		.concoction-row { flex-direction: row; align-items: center; }
	}
</style>
