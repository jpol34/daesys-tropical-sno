<script lang="ts">
	import { page } from '$app/stores';
	import { businessInfo } from '$lib/data/businessInfo';
</script>

<svelte:head>
	<title>Oops! | {businessInfo.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="error-page">
	<div class="error-container">
		<div class="error-icon" aria-hidden="true">🍧</div>

		<h1 class="error-title">
			{#if $page.status === 404}
				Page Not Found
			{:else if $page.status === 500}
				Something Went Wrong
			{:else}
				Oops!
			{/if}
		</h1>

		<p class="error-message">
			{#if $page.status === 404}
				Looks like this flavor doesn't exist! The page you're looking for has melted away.
			{:else}
				We hit a brain freeze! Don't worry, our team has been notified.
			{/if}
		</p>

		{#if $page.error?.message && $page.status !== 404}
			<details class="error-details">
				<summary>Technical Details</summary>
				<code>{$page.error.message}</code>
			</details>
		{/if}

		<div class="error-actions">
			<a href="/" class="btn btn-primary">Back to Home</a>
			<a href="/#menu" class="btn btn-secondary">View Menu</a>
		</div>

		<p class="error-contact">
			Need help? Call us at
			<a href={businessInfo.phoneHref}>{businessInfo.phone}</a>
		</p>
	</div>
</main>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-blue-dark) 100%);
	}

	.error-container {
		max-width: 500px;
		text-align: center;
		background: var(--color-white);
		padding: var(--space-2xl);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: var(--space-md);
		animation: wobble 2s ease-in-out infinite;
	}

	@keyframes wobble {
		0%,
		100% {
			transform: rotate(-5deg);
		}
		50% {
			transform: rotate(5deg);
		}
	}

	.error-title {
		font-size: clamp(1.5rem, 4vw, 2rem);
		margin-bottom: var(--space-sm);
	}

	.error-message {
		color: var(--color-gray-600);
		margin-bottom: var(--space-lg);
	}

	.error-details {
		background: var(--color-gray-100);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
		text-align: left;
	}

	.error-details summary {
		cursor: pointer;
		font-weight: 600;
		color: var(--color-gray-600);
	}

	.error-details code {
		display: block;
		margin-top: var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-red);
		word-break: break-word;
	}

	.error-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: var(--space-lg);
	}

	.error-contact {
		font-size: 0.875rem;
		color: var(--color-gray-600);
	}

	.error-contact a {
		font-weight: 600;
	}
</style>
