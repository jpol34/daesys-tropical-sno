<script lang="ts">
	import { businessInfo } from '$lib/data/businessInfo';
</script>

<div class="sticky-cta">
	<a href={businessInfo.phoneHref} class="btn btn-cta call-btn">
		<span class="call-icon" aria-hidden="true">📞</span>
		Call Now: {businessInfo.phone}
	</a>
</div>

<style>
	.call-btn {
		width: 100%;
		max-width: 320px;
		justify-content: center;
		font-size: 1rem;
		padding: var(--space-sm) var(--space-lg);
	}
	
	.call-icon {
		font-size: 1.2em;
	}
</style>
