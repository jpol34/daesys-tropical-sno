<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import type { LoyaltyMember, LoyaltyHistory } from '$lib/types';

	interface Props {
		isUpdating: boolean;
		onUpdatingChange: (value: boolean) => void;
	}

	let { isUpdating, onUpdatingChange }: Props = $props();

	// Load data on mount
	onMount(() => {
		loadLoyaltyData();
	});

	// Loyalty state
	let loyaltyMembers = $state<LoyaltyMember[]>([]);
	let loyaltyHistory = $state<LoyaltyHistory[]>([]);
	let loyaltyView = $state<'lookup' | 'stats' | 'members'>('lookup');
	let phoneSearch = $state('');
	let searchResults = $state<LoyaltyMember[]>([]);
	let selectedMember = $state<LoyaltyMember | null>(null);
	let isSearching = $state(false);
	let punchesToAdd = $state(1);
	let punchesToRemove = $state(0);

	// Inline editing state
	let editingPhone = $state(false);
	let editingEmail = $state(false);
	let tempPhone = $state('');
	let tempEmail = $state('');
	let newMemberName = $state('');
	let newMemberEmail = $state('');
	let showNewMemberForm = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	// Load loyalty data
	export async function loadLoyaltyData() {
		const [membersRes, historyRes] = await Promise.all([
			supabase.from('loyalty_members').select('*').order('last_visit', { ascending: false }),
			supabase
				.from('loyalty_history')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(50)
		]);

		if (!membersRes.error) loyaltyMembers = membersRes.data || [];
		if (!historyRes.error) {
			loyaltyHistory = (historyRes.data || []).map((h) => ({
				...h,
				member_name: loyaltyMembers.find((m) => m.id === h.member_id)?.name || 'Unknown'
			}));
		}
	}

	// Normalize phone number to digits only
	function normalizePhone(phone: string): string {
		return phone.replace(/\D/g, '');
	}

	// Format phone for display
	function formatPhone(phone: string): string {
		const digits = normalizePhone(phone);
		if (digits.length === 10) {
			return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
		}
		return phone;
	}

	// Handle phone input with auto-formatting
	function handlePhoneInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const digits = normalizePhone(input.value);

		if (digits.length <= 3) {
			phoneSearch = digits;
		} else if (digits.length <= 6) {
			phoneSearch = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		} else {
			phoneSearch = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
		}

		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => searchLoyaltyMembers(), 300);
	}

	// Search for loyalty members
	async function searchLoyaltyMembers() {
		const searchDigits = normalizePhone(phoneSearch);

		if (searchDigits.length < 3) {
			searchResults = [];
			showNewMemberForm = false;
			return;
		}

		isSearching = true;

		const { data, error } = await supabase
			.from('loyalty_members')
			.select('*')
			.or(`phone.ilike.%${searchDigits}%,name.ilike.%${phoneSearch}%`)
			.limit(10);

		if (!error) {
			searchResults = data || [];
			const exactMatch = searchResults.find((m) => normalizePhone(m.phone) === searchDigits);
			showNewMemberForm = searchDigits.length === 10 && !exactMatch;
		}

		isSearching = false;
	}

	// Select a member from search results
	function selectMember(member: LoyaltyMember) {
		selectedMember = member;
		searchResults = [];
		phoneSearch = formatPhone(member.phone);
	}

	// Inline editing functions
	function startEditPhone() {
		if (selectedMember) {
			tempPhone = formatPhone(selectedMember.phone);
			editingPhone = true;
		}
	}

	function startEditEmail() {
		if (selectedMember) {
			tempEmail = selectedMember.email || '';
			editingEmail = true;
		}
	}

	async function savePhone() {
		if (!selectedMember) return;
		const newPhone = normalizePhone(tempPhone);
		if (newPhone.length !== 10) {
			editingPhone = false;
			return;
		}

		const { error } = await supabase
			.from('loyalty_members')
			.update({ phone: newPhone })
			.eq('id', selectedMember.id);

		if (!error) {
			selectedMember = { ...selectedMember, phone: newPhone };
			loyaltyMembers = loyaltyMembers.map((m) =>
				m.id === selectedMember!.id ? selectedMember! : m
			);
			phoneSearch = formatPhone(newPhone);
		}
		editingPhone = false;
	}

	async function saveEmail() {
		if (!selectedMember) return;
		const newEmail = tempEmail.trim() || null;

		const { error } = await supabase
			.from('loyalty_members')
			.update({ email: newEmail })
			.eq('id', selectedMember.id);

		if (!error) {
			selectedMember = { ...selectedMember, email: newEmail };
			loyaltyMembers = loyaltyMembers.map((m) =>
				m.id === selectedMember!.id ? selectedMember! : m
			);
		}
		editingEmail = false;
	}

	// Clear selection
	function clearSelection() {
		selectedMember = null;
		phoneSearch = '';
		searchResults = [];
		showNewMemberForm = false;
		newMemberName = '';
		newMemberEmail = '';
		punchesToAdd = 1;
		punchesToRemove = 0;
	}

	// Add new loyalty member
	async function addLoyaltyMember() {
		const phone = normalizePhone(phoneSearch);
		if (phone.length !== 10 || !newMemberName.trim()) return;

		onUpdatingChange(true);

		const { data, error } = await supabase
			.from('loyalty_members')
			.insert({
				phone,
				name: newMemberName.trim(),
				email: newMemberEmail.trim() || null,
				punches: 1,
				total_punches: 1,
				last_visit: new Date().toISOString()
			})
			.select()
			.single();

		if (!error && data) {
			await supabase.from('loyalty_history').insert({
				member_id: data.id,
				action: 'punch',
				punch_count: 1
			});

			loyaltyMembers = [data, ...loyaltyMembers];
			selectedMember = data;
			showNewMemberForm = false;
			newMemberName = '';
			newMemberEmail = '';
			await loadLoyaltyData();
		}

		onUpdatingChange(false);
	}

	// Add punches to member
	async function addPunches() {
		if (!selectedMember || punchesToAdd < 1) return;

		onUpdatingChange(true);

		const totalAfterAdd = selectedMember.punches + punchesToAdd;
		const willTriggerRedeem = totalAfterAdd >= 9;
		const carryOver = willTriggerRedeem ? totalAfterAdd - 9 : 0;
		const finalPunches = willTriggerRedeem ? carryOver : totalAfterAdd;

		const { error } = await supabase
			.from('loyalty_members')
			.update({
				punches: finalPunches,
				total_punches: selectedMember.total_punches + punchesToAdd,
				total_redeemed: willTriggerRedeem
					? selectedMember.total_redeemed + 1
					: selectedMember.total_redeemed,
				last_visit: new Date().toISOString()
			})
			.eq('id', selectedMember.id);

		if (!error) {
			// Log the punch action
			await supabase.from('loyalty_history').insert({
				member_id: selectedMember.id,
				action: 'punch',
				punch_count: punchesToAdd
			});

			// If redeemed, log that too
			if (willTriggerRedeem) {
				await supabase.from('loyalty_history').insert({
					member_id: selectedMember.id,
					action: 'redeem',
					punch_count: null,
					note: carryOver > 0 ? `${carryOver} punch${carryOver > 1 ? 'es' : ''} carried over` : null
				});
			}

			selectedMember = {
				...selectedMember,
				punches: finalPunches,
				total_punches: selectedMember.total_punches + punchesToAdd,
				total_redeemed: willTriggerRedeem
					? selectedMember.total_redeemed + 1
					: selectedMember.total_redeemed,
				last_visit: new Date().toISOString()
			};

			loyaltyMembers = loyaltyMembers.map((m) =>
				m.id === selectedMember!.id ? selectedMember! : m
			);

			punchesToAdd = 1;
			punchesToRemove = 0;
			await loadLoyaltyData();
		}

		onUpdatingChange(false);
	}

	// Remove punches from member
	async function removePunches() {
		if (!selectedMember || punchesToRemove < 1) return;

		onUpdatingChange(true);

		const newPunches = Math.max(0, selectedMember.punches - punchesToRemove);

		const { error } = await supabase
			.from('loyalty_members')
			.update({
				punches: newPunches,
				last_visit: new Date().toISOString()
			})
			.eq('id', selectedMember.id);

		if (!error) {
			await supabase.from('loyalty_history').insert({
				member_id: selectedMember.id,
				action: 'adjustment',
				punch_count: -punchesToRemove,
				note: `Removed ${punchesToRemove} punch${punchesToRemove > 1 ? 'es' : ''}`
			});

			selectedMember = {
				...selectedMember,
				punches: newPunches,
				last_visit: new Date().toISOString()
			};

			loyaltyMembers = loyaltyMembers.map((m) =>
				m.id === selectedMember!.id ? selectedMember! : m
			);

			punchesToAdd = 1;
			punchesToRemove = 0;
			await loadLoyaltyData();
		}

		onUpdatingChange(false);
	}

	// Redeem reward
	async function redeemReward() {
		if (!selectedMember || selectedMember.punches < 9) return;

		onUpdatingChange(true);

		const { error } = await supabase
			.from('loyalty_members')
			.update({
				punches: 0,
				total_redeemed: selectedMember.total_redeemed + 1,
				last_visit: new Date().toISOString()
			})
			.eq('id', selectedMember.id);

		if (!error) {
			await supabase.from('loyalty_history').insert({
				member_id: selectedMember.id,
				action: 'redeem',
				punch_count: null
			});

			selectedMember = {
				...selectedMember,
				punches: 0,
				total_redeemed: selectedMember.total_redeemed + 1,
				last_visit: new Date().toISOString()
			};

			loyaltyMembers = loyaltyMembers.map((m) =>
				m.id === selectedMember!.id ? selectedMember! : m
			);

			await loadLoyaltyData();
		}

		onUpdatingChange(false);
	}

	// Delete member
	async function deleteMember(id: string) {
		const member = loyaltyMembers.find((m) => m.id === id);
		const confirmed = confirm(`Delete ${member?.name}'s loyalty card? This cannot be undone.`);
		if (!confirmed) return;

		onUpdatingChange(true);

		const { error } = await supabase.from('loyalty_members').delete().eq('id', id);

		if (!error) {
			loyaltyMembers = loyaltyMembers.filter((m) => m.id !== id);
			if (selectedMember?.id === id) {
				clearSelection();
			}
		}

		onUpdatingChange(false);
	}

	// Stats calculations
	let loyaltyStats = $derived({
		totalMembers: loyaltyMembers.length,
		totalPunchesThisMonth: loyaltyHistory
			.filter(
				(h) => h.action === 'punch' && new Date(h.created_at).getMonth() === new Date().getMonth()
			)
			.reduce((sum, h) => sum + (h.punch_count || 0), 0),
		totalRedeemedThisMonth: loyaltyHistory.filter(
			(h) => h.action === 'redeem' && new Date(h.created_at).getMonth() === new Date().getMonth()
		).length,
		topCustomers: [...loyaltyMembers].sort((a, b) => b.total_punches - a.total_punches).slice(0, 10)
	});

	// Format relative time
	function formatRelativeTime(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins} min ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
		return date.toLocaleDateString();
	}

	// Export member count for parent badge
	export function getMemberCount() {
		return loyaltyMembers.length;
	}

	// Select member and switch to lookup (for members list)
	function selectMemberAndLookup(member: LoyaltyMember) {
		selectMember(member);
		loyaltyView = 'lookup';
	}
</script>

<div class="loyalty-section">
	<!-- Sub-navigation -->
	<div class="loyalty-nav">
		<button
			class="loyalty-nav-btn"
			class:active={loyaltyView === 'lookup'}
			onclick={() => (loyaltyView = 'lookup')}
		>
			📱 Lookup
		</button>
		<button
			class="loyalty-nav-btn"
			class:active={loyaltyView === 'members'}
			onclick={() => (loyaltyView = 'members')}
		>
			👥 All Members
		</button>
		<button
			class="loyalty-nav-btn"
			class:active={loyaltyView === 'stats'}
			onclick={() => (loyaltyView = 'stats')}
		>
			📊 Stats
		</button>
	</div>

	<!-- ===== LOOKUP VIEW ===== -->
	{#if loyaltyView === 'lookup'}
		<div class="lookup-section">
			<div class="lookup-panel">
				<h3>Customer Lookup</h3>
				<div class="phone-search">
					<label for="phone-search" class="sr-only">Phone Number</label>
					<input
						id="phone-search"
						type="tel"
						class="form-input phone-input"
						placeholder="(555) 123-4567"
						value={phoneSearch}
						oninput={handlePhoneInput}
						autocomplete="off"
					/>
					{#if phoneSearch}
						<button class="clear-btn" onclick={clearSelection} aria-label="Clear">×</button>
					{/if}
				</div>

				<!-- Search Results Dropdown -->
				{#if searchResults.length > 0 && !selectedMember}
					<div class="search-results">
						{#each searchResults as result (result.id)}
							<button class="search-result" onclick={() => selectMember(result)}>
								<span class="result-name">{result.name}</span>
								<span class="result-phone">{formatPhone(result.phone)}</span>
								<span class="result-punches">{result.punches}/9</span>
							</button>
						{/each}
					</div>
				{/if}

				<!-- New Member Form -->
				{#if showNewMemberForm && !selectedMember}
					<div class="new-member-form">
						<p class="new-member-notice">📱 No member found for {phoneSearch}</p>
						<div class="form-group">
							<label for="new-name" class="form-label">Name</label>
							<input
								id="new-name"
								type="text"
								class="form-input"
								placeholder="Customer name"
								bind:value={newMemberName}
							/>
						</div>
						<div class="form-group">
							<label for="new-email" class="form-label">Email (optional)</label>
							<input
								id="new-email"
								type="email"
								class="form-input"
								placeholder="email@example.com"
								bind:value={newMemberEmail}
							/>
						</div>
						<button
							class="btn btn-primary"
							onclick={addLoyaltyMember}
							disabled={isUpdating || !newMemberName.trim()}
						>
							+ Add Member & First Punch
						</button>
					</div>
				{/if}

				<!-- Searching indicator -->
				{#if isSearching}
					<div class="searching-indicator">
						<span class="spinner-small"></span> Searching...
					</div>
				{/if}
			</div>

			<!-- Selected Member Card -->
			{#if selectedMember}
				<div class="member-card" class:reward-ready={selectedMember.punches >= 9}>
					{#if selectedMember.punches >= 9}
						<div class="reward-banner">🎉 FREE SNO CONE EARNED!</div>
					{/if}

					<div class="member-header">
						<div class="member-info">
							<h2 class="member-name">{selectedMember.name}</h2>

							<!-- Editable Phone -->
							{#if editingPhone}
								<input
									type="tel"
									class="inline-edit-input"
									bind:value={tempPhone}
									onblur={savePhone}
									onkeydown={(e) => e.key === 'Enter' && savePhone()}
								/>
							{:else}
								<button class="inline-editable" onclick={startEditPhone}>
									{formatPhone(selectedMember.phone)}
									<span class="edit-hint">✎</span>
								</button>
							{/if}

							<!-- Editable Email -->
							{#if editingEmail}
								<input
									type="email"
									class="inline-edit-input"
									placeholder="Add email..."
									bind:value={tempEmail}
									onblur={saveEmail}
									onkeydown={(e) => e.key === 'Enter' && saveEmail()}
								/>
							{:else}
								<button class="inline-editable" onclick={startEditEmail}>
									{selectedMember.email || 'Add email...'}
									<span class="edit-hint">✎</span>
								</button>
							{/if}
							<p class="member-meta">
								Member since {new Date(selectedMember.created_at).toLocaleDateString('en-US', {
									month: 'short',
									year: 'numeric'
								})}
								· {selectedMember.total_punches} lifetime punch{selectedMember.total_punches !== 1
									? 'es'
									: ''}
								· {selectedMember.total_redeemed} reward{selectedMember.total_redeemed !== 1
									? 's'
									: ''}
							</p>
						</div>
						<div class="punch-count">
							<span class="punch-number">{selectedMember.punches}</span>
							<span class="punch-label">/9</span>
						</div>
					</div>

					<!-- Punch Dots -->
					<div class="punch-dots" aria-label="{selectedMember.punches} of 9 punches">
						{#each Array(9) as _, i (i)}
							{@const isFilled = i < selectedMember.punches}
							{@const isMarkedForRemoval =
								isFilled && i >= selectedMember.punches - punchesToRemove}
							{@const isPreview =
								!isFilled && i < selectedMember.punches + punchesToAdd && punchesToRemove === 0}
							<button
								type="button"
								class="punch-dot"
								class:filled={isFilled && !isMarkedForRemoval}
								class:removing={isMarkedForRemoval}
								class:preview={isPreview}
								onclick={() => {
									if (!selectedMember) return;

									if (isFilled) {
										// Clicking a filled dot: mark for removal
										const removeCount = selectedMember.punches - i;
										if (punchesToRemove === removeCount) {
											// Clicking same position: clear removal
											punchesToRemove = 0;
										} else {
											punchesToRemove = removeCount;
											punchesToAdd = 1; // Reset add preview
										}
									} else {
										// Clicking empty/preview dot
										punchesToRemove = 0; // Clear any removal selection
										const isCurrentPreview = i < selectedMember.punches + punchesToAdd;
										if (isCurrentPreview) {
											const newCount = i - selectedMember.punches;
											punchesToAdd = newCount > 0 ? newCount : 1;
										} else {
											punchesToAdd = i - selectedMember.punches + 1;
										}
									}
								}}
								aria-label="Punch {i + 1}{isFilled ? ' (filled)' : ''}{isMarkedForRemoval
									? ' (marked for removal)'
									: ''}"
							></button>
						{/each}
					</div>

					<!-- Actions -->
					{#if selectedMember.punches >= 9}
						<div class="reward-actions">
							<p class="reward-text">Any size · Any toppings · Or a popsicle!</p>
							<button class="btn btn-reward" onclick={redeemReward} disabled={isUpdating}>
								🎁 Redeem Reward
							</button>
							<button class="btn btn-secondary" onclick={clearSelection}> Skip for Now </button>
						</div>
					{:else if punchesToRemove > 0}
						<!-- Remove punches mode -->
						<div class="punch-actions">
							<button class="btn btn-remove" onclick={removePunches} disabled={isUpdating}>
								− Remove {punchesToRemove} Punch{punchesToRemove > 1 ? 'es' : ''}
							</button>
							<button class="btn btn-secondary" onclick={() => (punchesToRemove = 0)}>
								Cancel
							</button>
						</div>
					{:else}
						<!-- Add punches mode -->
						<div class="punch-actions">
							<div class="punch-input-row">
								<button
									class="punch-adjust"
									onclick={() => (punchesToAdd = Math.max(1, punchesToAdd - 1))}>−</button
								>
								<input
									type="number"
									class="punch-count-input"
									bind:value={punchesToAdd}
									min="1"
									max="20"
								/>
								<button
									class="punch-adjust"
									onclick={() => (punchesToAdd = Math.min(20, punchesToAdd + 1))}>+</button
								>
							</div>
							<button class="btn btn-primary" onclick={addPunches} disabled={isUpdating}>
								+ Add {punchesToAdd} Punch{punchesToAdd > 1 ? 'es' : ''}
							</button>
							{#if selectedMember.punches + punchesToAdd >= 9}
								{@const overflow = selectedMember.punches + punchesToAdd - 9}
								<p class="overflow-notice">
									🎉 Will redeem FREE SNO CONE{overflow > 0
										? ` + ${overflow} punch${overflow > 1 ? 'es' : ''} carry over`
										: ''}!
								</p>
							{:else if selectedMember.punches >= 7}
								<p class="almost-there">
									🎉 {9 - selectedMember.punches} more until FREE SNO CONE!
								</p>
							{/if}
						</div>
					{/if}

					<div class="member-card-footer">
						<button
							class="btn-delete-member"
							onclick={() => {
								if (selectedMember) deleteMember(selectedMember.id);
							}}
						>
							🗑️ Delete Member
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ===== ALL MEMBERS VIEW ===== -->
	{#if loyaltyView === 'members'}
		<div class="members-section">
			<div class="members-list">
				{#each loyaltyMembers as member (member.id)}
					<button class="member-row" onclick={() => selectMemberAndLookup(member)}>
						<div class="member-row-info">
							<span class="member-row-name">{member.name}</span>
							<span class="member-row-phone">{formatPhone(member.phone)}</span>
							{#if member.email}
								<span class="member-row-email">{member.email}</span>
							{/if}
						</div>
						<div class="member-row-stats">
							<span class="member-row-punches">{member.punches}/9 punches</span>
							<span class="member-row-lifetime-punches">{member.total_punches} lifetime</span>
							<span class="member-row-rewards">{member.total_redeemed} rewards</span>
							<span class="member-row-visit">Last: {formatRelativeTime(member.last_visit)}</span>
						</div>
					</button>
				{/each}
				{#if loyaltyMembers.length === 0}
					<div class="empty-state">
						<p>No loyalty members yet.</p>
						<p>Use the Lookup tab to add your first member!</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- ===== STATS VIEW ===== -->
	{#if loyaltyView === 'stats'}
		<div class="stats-section">
			<div class="stats-grid">
				<div class="stat-card">
					<span class="stat-value">{loyaltyStats.totalMembers}</span>
					<span class="stat-label">Total Members</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{loyaltyStats.totalPunchesThisMonth}</span>
					<span class="stat-label">Punches This Month</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{loyaltyStats.totalRedeemedThisMonth}</span>
					<span class="stat-label">Redeemed This Month</span>
				</div>
			</div>

			<div class="stats-panels">
				<div class="stats-panel">
					<h3>🏆 Top Customers</h3>
					<div class="top-customers">
						{#each loyaltyStats.topCustomers as customer, i (customer.id)}
							<div class="top-customer-row">
								<span class="rank">#{i + 1}</span>
								<span class="customer-name">{customer.name}</span>
								<span class="customer-phone">{formatPhone(customer.phone)}</span>
								<span class="customer-stats"
									>{customer.total_punches} punches · {customer.total_redeemed} rewards</span
								>
							</div>
						{/each}
						{#if loyaltyStats.topCustomers.length === 0}
							<p class="empty-state-small">No members yet</p>
						{/if}
					</div>
				</div>

				<div class="stats-panel">
					<h3>📅 Recent Activity</h3>
					<div class="recent-activity">
						{#each loyaltyHistory.slice(0, 15) as activity (activity.id)}
							<div class="activity-row">
								<span class="activity-icon">
									{#if activity.action === 'punch'}📍{:else if activity.action === 'redeem'}🎁{:else}✏️{/if}
								</span>
								<span class="activity-text">
									{#if activity.action === 'punch'}
										{activity.member_name} +{activity.punch_count} punch{activity.punch_count !== 1
											? 'es'
											: ''}
									{:else if activity.action === 'redeem'}
										{activity.member_name} redeemed reward
									{:else}
										{activity.member_name} adjusted
									{/if}
								</span>
								<span class="activity-time">{formatRelativeTime(activity.created_at)}</span>
							</div>
						{/each}
						{#if loyaltyHistory.length === 0}
							<p class="empty-state-small">No activity yet</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.loyalty-section {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}

	.loyalty-nav {
		display: flex;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
		border-bottom: 2px solid var(--color-gray-200);
		padding-bottom: var(--space-md);
	}

	.loyalty-nav-btn {
		padding: var(--space-sm) var(--space-md);
		background: transparent;
		border: none;
		font-weight: 600;
		color: var(--color-gray-600);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.loyalty-nav-btn:hover {
		background: var(--color-gray-100);
	}
	.loyalty-nav-btn.active {
		background: var(--color-blue);
		color: var(--color-white);
	}

	/* Lookup Section */
	.lookup-section {
		display: grid;
		gap: var(--space-lg);
	}

	.lookup-panel {
		position: relative;
	}

	.lookup-panel h3 {
		font-family: var(--font-heading);
		margin-bottom: var(--space-md);
	}

	.phone-search {
		position: relative;
	}

	.phone-input {
		font-size: 1.25rem;
		padding: var(--space-md);
		letter-spacing: 0.05em;
	}

	.clear-btn {
		position: absolute;
		right: var(--space-md);
		top: 50%;
		transform: translateY(-50%);
		background: var(--color-gray-200);
		border: none;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-full);
		font-size: 1.2rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-gray-600);
	}

	.clear-btn:hover {
		background: var(--color-gray-300);
	}

	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		z-index: 10;
		max-height: 300px;
		overflow-y: auto;
		margin-top: var(--space-xs);
	}

	.search-result {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		width: 100%;
		text-align: left;
		border: none;
		background: transparent;
		cursor: pointer;
		border-bottom: 1px solid var(--color-gray-100);
		transition: background var(--transition-fast);
	}

	.search-result:hover {
		background: var(--color-cream);
	}
	.search-result:last-child {
		border-bottom: none;
	}

	.result-name {
		font-weight: 600;
		flex: 1;
	}
	.result-phone {
		color: var(--color-gray-600);
		font-size: 0.9rem;
	}
	.result-punches {
		background: var(--color-blue);
		color: white;
		padding: 0.2em 0.6em;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.new-member-form {
		margin-top: var(--space-lg);
		padding: var(--space-lg);
		background: var(--color-cream);
		border-radius: var(--radius-lg);
	}

	.new-member-notice {
		font-weight: 600;
		margin-bottom: var(--space-md);
	}

	.new-member-form .form-group {
		margin-bottom: var(--space-md);
	}

	.searching-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		color: var(--color-gray-600);
	}

	.spinner-small {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: var(--color-blue);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Member Card */
	.member-card {
		background: var(--color-white);
		border: 3px solid var(--color-blue);
		border-radius: var(--radius-xl);
		padding: var(--space-xl);
		position: relative;
	}

	.member-card.reward-ready {
		border-color: var(--color-yellow);
		background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
	}

	.reward-banner {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-yellow);
		color: var(--color-gray-900);
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-full);
		font-weight: 700;
		font-size: 1.1rem;
		white-space: nowrap;
		box-shadow: var(--shadow-md);
	}

	.member-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-lg);
	}

	.member-name {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		margin-bottom: var(--space-xs);
	}

	/* Inline Editing */
	.inline-editable {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		background: transparent;
		border: none;
		padding: var(--space-xs) 0;
		font-size: inherit;
		color: inherit;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: background var(--transition-fast);
	}

	.inline-editable:hover {
		background: var(--color-gray-100);
		padding: var(--space-xs) var(--space-sm);
		margin-left: calc(-1 * var(--space-sm));
	}

	.inline-editable .edit-hint {
		opacity: 0;
		font-size: 0.8em;
		color: var(--color-gray-400);
		transition: opacity var(--transition-fast);
	}

	.inline-editable:hover .edit-hint {
		opacity: 1;
	}

	.inline-edit-input {
		font-size: inherit;
		font-family: inherit;
		padding: var(--space-xs) var(--space-sm);
		border: 2px solid var(--color-blue);
		border-radius: var(--radius-sm);
		outline: none;
		width: 100%;
		max-width: 250px;
	}

	.member-info .inline-editable,
	.member-info .inline-edit-input {
		display: block;
		font-size: 0.95rem;
		color: var(--color-gray-600);
		margin-bottom: var(--space-xs);
	}

	.member-meta {
		font-size: 0.85rem;
		color: var(--color-gray-500);
	}

	.punch-count {
		text-align: center;
	}

	.punch-number {
		font-family: var(--font-heading);
		font-size: 3rem;
		line-height: 1;
		color: var(--color-blue);
	}

	.punch-label {
		font-size: 1.5rem;
		color: var(--color-gray-400);
	}

	/* Punch Dots */
	.punch-dots {
		display: flex;
		justify-content: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.punch-dot {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-full);
		border: 3px solid var(--color-gray-300);
		background: var(--color-white);
		transition: all var(--transition-normal);
	}

	.punch-dot.filled {
		background: var(--color-blue);
		border-color: var(--color-blue);
		cursor: pointer;
	}

	.punch-dot.filled:hover {
		opacity: 0.8;
	}

	.punch-dot.removing {
		background: var(--color-red);
		border-color: var(--color-red);
		cursor: pointer;
		animation: pulse-remove 0.5s ease-in-out infinite alternate;
	}

	@keyframes pulse-remove {
		from {
			opacity: 1;
		}
		to {
			opacity: 0.6;
		}
	}

	.punch-dot.preview {
		background: var(--color-yellow);
		border-color: var(--color-yellow);
		cursor: pointer;
	}

	.punch-dot:not(.filled):not(.preview):not(.removing) {
		cursor: pointer;
	}

	.punch-dot:not(.filled):not(.preview):not(.removing):hover {
		border-color: var(--color-blue);
		background: var(--color-gray-100);
	}

	.member-card.reward-ready .punch-dot.filled:not(.removing) {
		background: var(--color-yellow);
		border-color: var(--color-yellow);
	}

	/* Punch Actions */
	.punch-actions,
	.reward-actions {
		text-align: center;
	}

	.almost-there {
		color: var(--color-blue);
		font-weight: 600;
		font-size: 1.1rem;
		margin-top: var(--space-md);
	}

	.punch-input-row {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.punch-adjust {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-full);
		border: 2px solid var(--color-gray-300);
		background: var(--color-white);
		font-size: 1.25rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.punch-adjust:hover {
		border-color: var(--color-blue);
		background: var(--color-blue);
		color: var(--color-white);
	}

	.punch-count-input {
		width: 60px;
		text-align: center;
		font-size: 1.25rem;
		font-weight: 700;
		padding: var(--space-xs) var(--space-sm);
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-md);
	}

	.punch-count-input:focus {
		outline: none;
		border-color: var(--color-blue);
	}

	/* Hide number input spinners */
	.punch-count-input::-webkit-outer-spin-button,
	.punch-count-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.punch-count-input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.overflow-notice {
		color: #059669;
		font-weight: 600;
		font-size: 1rem;
		margin-top: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: #d1fae5;
		border-radius: var(--radius-md);
	}

	.reward-text {
		font-size: 1.1rem;
		color: var(--color-gray-600);
		margin-bottom: var(--space-md);
	}

	.btn-reward {
		background: linear-gradient(135deg, var(--color-yellow) 0%, #f59e0b 100%);
		color: var(--color-gray-900);
		font-size: 1.25rem;
		padding: var(--space-md) var(--space-xl);
		font-weight: 700;
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-md);
		display: inline-block;
		transition: all var(--transition-fast);
	}

	.btn-reward:hover {
		transform: scale(1.05);
		box-shadow: var(--shadow-lg);
	}

	.btn-remove {
		background: var(--color-red);
		color: var(--color-white);
		font-weight: 700;
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-sm);
		transition: all var(--transition-fast);
	}

	.btn-remove:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.member-card-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-top: var(--space-lg);
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-gray-200);
	}

	.btn-delete-member {
		background: transparent;
		border: none;
		padding: var(--space-xs) var(--space-sm);
		color: var(--color-red);
		font-size: 0.85rem;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.btn-delete-member:hover {
		opacity: 0.7;
	}

	/* Stats Section */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.stat-card {
		background: linear-gradient(135deg, var(--color-blue) 0%, #1e40af 100%);
		color: var(--color-white);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		text-align: center;
	}

	.stat-value {
		display: block;
		font-family: var(--font-heading);
		font-size: 2.5rem;
		line-height: 1;
		margin-bottom: var(--space-xs);
	}

	.stat-label {
		font-size: 0.85rem;
		opacity: 0.9;
	}

	.stats-panels {
		display: grid;
		gap: var(--space-lg);
	}

	.stats-panel {
		background: var(--color-gray-100);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
	}

	.stats-panel h3 {
		font-family: var(--font-heading);
		margin-bottom: var(--space-md);
	}

	.top-customers,
	.recent-activity {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.top-customer-row,
	.activity-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm);
		background: var(--color-white);
		border-radius: var(--radius-md);
	}

	.rank {
		font-weight: 700;
		color: var(--color-blue);
		min-width: 30px;
	}

	.customer-name {
		font-weight: 600;
		flex: 1;
	}
	.customer-phone {
		color: var(--color-gray-500);
		font-size: 0.85rem;
	}
	.customer-stats {
		color: var(--color-gray-600);
		font-size: 0.85rem;
	}

	.activity-icon {
		font-size: 1.2rem;
	}
	.activity-text {
		flex: 1;
	}
	.activity-time {
		color: var(--color-gray-500);
		font-size: 0.85rem;
	}

	.empty-state-small {
		text-align: center;
		color: var(--color-gray-500);
		padding: var(--space-md);
	}

	/* Members List */
	.members-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 60vh;
		overflow-y: auto;
	}

	.member-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: var(--color-gray-100);
		border-radius: var(--radius-md);
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.member-row:hover {
		background: var(--color-gray-200);
		transform: translateY(-1px);
	}

	.member-row-info {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: baseline;
	}

	.member-row-name {
		font-weight: 600;
	}
	.member-row-phone {
		color: var(--color-gray-600);
		font-size: 0.9rem;
	}
	.member-row-email {
		color: var(--color-gray-500);
		font-size: 0.85rem;
	}

	.member-row-stats {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		font-size: 0.85rem;
		color: var(--color-gray-600);
	}

	.member-row-punches {
		color: var(--color-blue);
		font-weight: 600;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-xl);
		color: var(--color-gray-600);
		background: var(--color-white);
		border-radius: var(--radius-lg);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (min-width: 768px) {
		.lookup-section {
			grid-template-columns: 1fr 1fr;
		}
		.stats-panels {
			grid-template-columns: 1fr 1fr;
		}
		.member-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
		.member-row-info {
			flex: 1;
		}
		.member-row-stats {
			flex: 1;
			justify-content: center;
		}
	}
</style>
