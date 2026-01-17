<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { getBadgeCounts } from '$lib/services';
	import { onMount } from 'svelte';
	import './styles/admin.css';

	// Import components
	import LoginForm from './components/LoginForm.svelte';
	import LoyaltyTab from './components/LoyaltyTab.svelte';
	import RequestsTab from './components/RequestsTab.svelte';
	import FlavorsTab from './components/FlavorsTab.svelte';
	import ConcoctionsTab from './components/ConcoctionsTab.svelte';
	import SpecialsTab from './components/SpecialsTab.svelte';

	// Auth state
	let isAuthenticated = $state(false);
	let isLoading = $state(true);

	// Tab state
	let activeTab = $state<'loyalty' | 'requests' | 'flavors' | 'concoctions' | 'specials'>(
		'loyalty'
	);

	// Shared updating state
	let isUpdating = $state(false);

	// Component refs for binding
	let loyaltyTab = $state<LoyaltyTab>();
	let requestsTab = $state<RequestsTab>();
	let flavorsTab = $state<FlavorsTab>();
	let concoctionsTab = $state<ConcoctionsTab>();
	let specialsTab = $state<SpecialsTab>();

	// Badge counts (reactive)
	let memberCount = $state(0);
	let newRequestsCount = $state(0);
	let activeFlavorsCount = $state(0);
	let activeConcoctionsCount = $state(0);

	// Check auth on mount
	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		isAuthenticated = !!session;
		if (isAuthenticated) {
			await loadBadgeCounts();
		}
		isLoading = false;

		supabase.auth.onAuthStateChange((event, session) => {
			isAuthenticated = !!session;
			if (isAuthenticated) {
				loadBadgeCounts();
			}
		});
	});

	// Load badge counts from service
	async function loadBadgeCounts() {
		try {
			const counts = await getBadgeCounts();
			memberCount = counts.memberCount;
			newRequestsCount = counts.newRequestsCount;
			activeFlavorsCount = counts.activeFlavorsCount;
			activeConcoctionsCount = counts.activeConcoctionsCount;
		} catch {
			// Silently fail - badge counts are non-critical
		}
	}

	function handleLoginSuccess() {
		loadBadgeCounts();
	}

	// Logout handler
	async function handleLogout() {
		await supabase.auth.signOut();
	}

	function handleUpdatingChange(value: boolean) {
		isUpdating = value;
		if (!value) {
			// After any update, refresh badge counts from Supabase
			loadBadgeCounts();
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard | Daesy's Tropical Sno</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-page">
	{#if isLoading}
		<div class="loading-screen">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{:else if !isAuthenticated}
		<LoginForm onLoginSuccess={handleLoginSuccess} />
	{:else}
		<!-- Dashboard -->
		<div class="dashboard">
			<header class="dashboard-header">
				<h1>🌴 Admin Dashboard</h1>
				<button onclick={handleLogout} class="btn logout-btn">Logout</button>
			</header>

			<!-- Tabs -->
			<div class="tabs">
				<button
					class="tab"
					class:active={activeTab === 'loyalty'}
					onclick={() => (activeTab = 'loyalty')}
				>
					🎫 Sno Squad <span class="badge">{memberCount}</span>
				</button>
				<button
					class="tab"
					class:active={activeTab === 'requests'}
					onclick={() => (activeTab = 'requests')}
				>
					📋 Event Requests <span class="badge">{newRequestsCount}</span>
				</button>
				<button
					class="tab"
					class:active={activeTab === 'flavors'}
					onclick={() => (activeTab = 'flavors')}
				>
					🍧 Flavors <span class="badge">{activeFlavorsCount}</span>
				</button>
				<button
					class="tab"
					class:active={activeTab === 'concoctions'}
					onclick={() => (activeTab = 'concoctions')}
				>
					🌺 Concoctions <span class="badge">{activeConcoctionsCount}</span>
				</button>
				<button
					class="tab"
					class:active={activeTab === 'specials'}
					onclick={() => (activeTab = 'specials')}
				>
					🎁 Specials
				</button>
			</div>

			<div class="tab-content">
				{#if activeTab === 'loyalty'}
					<LoyaltyTab bind:this={loyaltyTab} {isUpdating} onUpdatingChange={handleUpdatingChange} />
				{/if}

				{#if activeTab === 'requests'}
					<RequestsTab
						bind:this={requestsTab}
						{isUpdating}
						onUpdatingChange={handleUpdatingChange}
					/>
				{/if}

				{#if activeTab === 'flavors'}
					<FlavorsTab bind:this={flavorsTab} {isUpdating} onUpdatingChange={handleUpdatingChange} />
				{/if}

				{#if activeTab === 'concoctions'}
					<ConcoctionsTab
						bind:this={concoctionsTab}
						{isUpdating}
						onUpdatingChange={handleUpdatingChange}
					/>
				{/if}

				{#if activeTab === 'specials'}
					<SpecialsTab
						bind:this={specialsTab}
						{isUpdating}
						onUpdatingChange={handleUpdatingChange}
					/>
				{/if}
			</div>
		</div>
	{/if}
</div>
