<script lang="ts">
	import { onMount } from 'svelte';
	import { businessInfo } from '$lib/data/businessInfo';
	
	let canShare = $state(false);
	let copied = $state(false);
	
	const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}#menu` : '';
	const shareTitle = "Daesy's Tropical Sno - 40+ Flavors & Signature Concoctions!";
	const shareText = "Check out this amazing sno cone menu! 🍧🌴";
	
	onMount(() => {
		canShare = typeof navigator !== 'undefined' && !!navigator.share;
	});
	
	async function handleNativeShare() {
		try {
			await navigator.share({
				title: shareTitle,
				text: shareText,
				url: shareUrl
			});
		} catch (err) {
			// User cancelled or error
			console.log('Share cancelled');
		}
	}
	
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => copied = false, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
	
	function shareToFacebook() {
		const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
		window.open(url, '_blank', 'width=550,height=420');
	}
</script>

<div class="share-buttons">
	<div class="share-actions">
		{#if canShare}
			<button 
				class="share-btn share-native" 
				onclick={handleNativeShare}
				aria-label="Share menu"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="18" cy="5" r="3"></circle>
					<circle cx="6" cy="12" r="3"></circle>
					<circle cx="18" cy="19" r="3"></circle>
					<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
					<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
				</svg>
				Share
			</button>
		{/if}
		
		<a 
			href={businessInfo.social.instagram.url}
			target="_blank"
			rel="noopener noreferrer"
			class="share-btn share-instagram" 
			aria-label="Follow us on Instagram"
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
			</svg>
		</a>
		
		<button 
			class="share-btn share-facebook" 
			onclick={shareToFacebook}
			aria-label="Share on Facebook"
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
				<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
			</svg>
		</button>
		
		<button 
			class="share-btn share-copy" 
			onclick={copyToClipboard}
			aria-label="Copy link to clipboard"
		>
			{#if copied}
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
				Copied!
			{:else}
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
					<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
				</svg>
				Copy Link
			{/if}
		</button>
	</div>
</div>

<style>
	.share-buttons {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		margin-bottom: var(--space-xl);
	}
	
	.share-label {
		font-size: 0.85rem;
		color: var(--color-gray-600);
	}
	
	.share-actions {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
		justify-content: center;
	}
	
	.share-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.8rem;
		font-weight: 600;
		border: none;
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: all var(--transition-fast);
		min-height: 36px;
	}
	
	.share-native {
		background: var(--color-blue);
		color: var(--color-white);
	}
	
	.share-native:hover {
		background: var(--color-blue-light);
		transform: translateY(-2px);
	}
	
	.share-copy {
		background: var(--color-gray-200);
		color: var(--color-gray-800);
	}
	
	.share-copy:hover {
		background: var(--color-gray-300);
		transform: translateY(-2px);
	}
	
	.share-instagram {
		background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
		color: #fff;
		padding: var(--space-xs);
		width: 36px;
		text-decoration: none;
	}
	
	.share-instagram:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}
	
	.share-facebook {
		background: #1877f2;
		color: #fff;
		padding: var(--space-xs);
		width: 36px;
	}
	
	.share-facebook:hover {
		background: #166fe5;
		transform: translateY(-2px);
	}
	
	@media (min-width: 480px) {
		.share-buttons {
			flex-direction: row;
			gap: var(--space-md);
		}
	}
</style>
