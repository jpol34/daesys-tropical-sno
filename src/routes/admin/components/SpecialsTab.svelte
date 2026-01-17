<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { SiteContent } from '$lib/types';
	
	interface Props {
		isUpdating: boolean;
		onUpdatingChange: (value: boolean) => void;
	}
	
	let { isUpdating, onUpdatingChange }: Props = $props();
	
	// Site content state
	let siteContent = $state<SiteContent[]>([]);
	let contentSaved = $state(false);
	
	// Load site content
	export async function loadSiteContent() {
		const { data, error } = await supabase
			.from('site_content')
			.select('*')
			.order('key');
		
		if (!error) siteContent = data || [];
	}
	
	async function saveSiteContent(content: SiteContent) {
		onUpdatingChange(true);
		contentSaved = false;
		
		const { error } = await supabase
			.from('site_content')
			.update({ value: content.value })
			.eq('id', content.id);
		
		if (!error) {
			siteContent = siteContent.map(c => c.id === content.id ? content : c);
			contentSaved = true;
			setTimeout(() => contentSaved = false, 2000);
		}
		onUpdatingChange(false);
	}
	
	function getContentLabel(key: string): string {
		const labels: Record<string, string> = {
			specials_message: 'Specials Message',
			popsicle_wednesday_cta: 'Popsicle Wednesday CTA',
			popsicle_wednesday_details: 'Popsicle Wednesday Details'
		};
		return labels[key] || key;
	}
</script>

<div class="management-section specials-section">
	{#each siteContent as content (content.id)}
		<div class="content-editor">
			<label for="content-{content.key}" class="content-label">{getContentLabel(content.key)}</label>
			{#if content.description}
				<p class="content-description">{content.description}</p>
			{/if}
			<textarea 
				id="content-{content.key}"
				class="form-textarea" 
				bind:value={content.value}
				rows="3"
			></textarea>
			<button class="btn btn-save" onclick={() => saveSiteContent(content)} disabled={isUpdating}>
				🌴 Save
			</button>
		</div>
	{/each}
	
	{#if contentSaved}
		<div class="saved-banner">✓ Content saved successfully!</div>
	{/if}
	
	<p class="management-note">💡 Changes will appear on the website after saving.</p>
</div>

<style>
	.management-section {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}
	
	.specials-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	
	.content-editor {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	
	.content-label {
		font-weight: 700;
		color: var(--color-blue);
	}
	
	.content-description {
		font-size: 0.85rem;
		color: var(--color-gray-600);
		margin: 0;
	}
	
	.btn-save {
		background: linear-gradient(135deg, var(--color-yellow) 0%, var(--color-red) 100%);
		color: var(--color-white);
		font-weight: 700;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		transition: all var(--transition-fast);
		width: fit-content;
	}
	
	.btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-md); }
	.btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
	
	.saved-banner {
		background: #d1fae5;
		color: #065f46;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		text-align: center;
		font-weight: 600;
		animation: fadeIn 0.3s ease-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateX(-10px); }
		to { opacity: 1; transform: translateX(0); }
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
