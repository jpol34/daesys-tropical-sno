<script lang="ts">
	import { navigating } from '$app/stores';

	// Delay showing loader to avoid flash on fast navigations
	let showLoader = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if ($navigating) {
			// Only show after 150ms to avoid flash
			timeoutId = setTimeout(() => {
				showLoader = true;
			}, 150);
		} else {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			// Keep visible briefly for smooth transition
			setTimeout(() => {
				showLoader = false;
			}, 200);
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});
</script>

{#if showLoader}
	<div class="nav-loader" role="progressbar" aria-label="Loading page">
		<div class="loader-bar"></div>
	</div>
{/if}

<style>
	.nav-loader {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		z-index: 9999;
		background: rgba(255, 215, 0, 0.3);
		overflow: hidden;
	}

	.loader-bar {
		height: 100%;
		width: 30%;
		background: linear-gradient(
			90deg,
			var(--color-yellow) 0%,
			var(--color-yellow-light) 50%,
			var(--color-yellow) 100%
		);
		animation: loading 1s ease-in-out infinite;
	}

	@keyframes loading {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(400%);
		}
	}
</style>
