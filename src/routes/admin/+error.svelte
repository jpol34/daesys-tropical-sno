<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Admin Error | Daesy's Tropical Sno</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="admin-error">
	<div class="error-card">
		<h1>Admin Error</h1>

		<div class="error-status">
			Error {$page.status}
		</div>

		<p class="error-message">
			{$page.error?.message || 'An unexpected error occurred'}
		</p>

		<div class="error-actions">
			<a href="/admin" class="btn btn-primary">Back to Admin</a>
			<a href="/" class="btn btn-secondary">Go to Site</a>
		</div>

		{#if $page.status === 401 || $page.status === 403}
			<p class="login-hint">
				You may need to <a href="/admin">log in again</a>.
			</p>
		{/if}
	</div>
</main>

<style>
	.admin-error {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		background: var(--color-gray-100);
	}

	.error-card {
		max-width: 400px;
		width: 100%;
		background: var(--color-white);
		padding: var(--space-xl);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		text-align: center;
	}

	.error-card h1 {
		font-family: var(--font-body);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-gray-900);
		margin-bottom: var(--space-md);
	}

	.error-status {
		display: inline-block;
		background: var(--color-red);
		color: var(--color-white);
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: var(--space-md);
	}

	.error-message {
		color: var(--color-gray-600);
		margin-bottom: var(--space-lg);
	}

	.error-actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: center;
		flex-wrap: wrap;
	}

	.login-hint {
		margin-top: var(--space-lg);
		font-size: 0.875rem;
		color: var(--color-gray-600);
	}
</style>
