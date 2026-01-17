<script lang="ts">
	import { supabase, type CateringRequest } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	// Types
	type Flavor = { id: string; name: string; active: boolean; sort_order: number };
	type Concoction = { id: string; name: string; ingredients: string[]; active: boolean; sort_order: number };
	type SiteContent = { id: string; key: string; value: string; description: string };
	type LoyaltyMember = {
		id: string;
		phone: string;
		name: string;
		email: string | null;
		punches: number;
		total_punches: number;
		total_redeemed: number;
		created_at: string;
		last_visit: string;
	};
	type LoyaltyHistory = {
		id: string;
		member_id: string;
		action: 'punch' | 'redeem' | 'adjustment';
		punch_count: number | null;
		note: string | null;
		created_at: string;
		member_name?: string;
	};
	
	// Auth state
	let isAuthenticated = $state(false);
	let isLoading = $state(true);
	let authError = $state('');
	
	// Login form
	let loginEmail = $state('');
	let loginPassword = $state('');
	let isLoggingIn = $state(false);
	
	// Tab state
	let activeTab = $state<'requests' | 'flavors' | 'concoctions' | 'specials' | 'loyalty'>('requests');
	
	// Requests state
	let requests = $state<CateringRequest[]>([]);
	let selectedRequest = $state<CateringRequest | null>(null);
	let filterStatus = $state('all');
	let isUpdating = $state(false);
	let adminNotesValue = $state('');
	let notesSaved = $state(false);
	
	// Flavors state
	let flavors = $state<Flavor[]>([]);
	let newFlavorName = $state('');
	let editingFlavor = $state<Flavor | null>(null);
	
	// Concoctions state
	let concoctions = $state<Concoction[]>([]);
	let newConcoctionName = $state('');
	let newConcoctionIngredients = $state('');
	let editingConcoction = $state<Concoction | null>(null);
	
	// Site content state
	let siteContent = $state<SiteContent[]>([]);
	let contentSaved = $state(false);
	
	// Loyalty state
	let loyaltyMembers = $state<LoyaltyMember[]>([]);
	let loyaltyHistory = $state<LoyaltyHistory[]>([]);
	let loyaltyView = $state<'lookup' | 'stats' | 'members'>('lookup');
	let phoneSearch = $state('');
	let searchResults = $state<LoyaltyMember[]>([]);
	let selectedMember = $state<LoyaltyMember | null>(null);
	let isSearching = $state(false);
	let punchesToAdd = $state(1);
	let newMemberName = $state('');
	let newMemberEmail = $state('');
	let showNewMemberForm = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Check auth on mount
	onMount(async () => {
		const { data: { session } } = await supabase.auth.getSession();
		isAuthenticated = !!session;
		if (isAuthenticated) {
			await loadAllData();
		}
		isLoading = false;
		
		supabase.auth.onAuthStateChange((event, session) => {
			isAuthenticated = !!session;
			if (isAuthenticated) {
				loadAllData();
			}
		});
	});
	
	// Load all data
	async function loadAllData() {
		await Promise.all([
			loadRequests(),
			loadFlavors(),
			loadConcoctions(),
			loadSiteContent(),
			loadLoyaltyData()
		]);
	}
	
	// Load catering requests
	async function loadRequests() {
		const { data, error } = await supabase
			.from('catering_requests')
			.select('*')
			.order('created_at', { ascending: false });
		
		if (!error) requests = data || [];
	}
	
	// Load flavors
	async function loadFlavors() {
		const { data, error } = await supabase
			.from('flavors')
			.select('*')
			.order('sort_order', { ascending: true });
		
		if (!error) flavors = data || [];
	}
	
	// Load concoctions
	async function loadConcoctions() {
		const { data, error } = await supabase
			.from('concoctions')
			.select('*')
			.order('sort_order', { ascending: true });
		
		if (!error) concoctions = data || [];
	}
	
	// Load site content
	async function loadSiteContent() {
		const { data, error } = await supabase
			.from('site_content')
			.select('*')
			.order('key');
		
		if (!error) siteContent = data || [];
	}
	
	// Load loyalty data
	async function loadLoyaltyData() {
		const [membersRes, historyRes] = await Promise.all([
			supabase
				.from('loyalty_members')
				.select('*')
				.order('last_visit', { ascending: false }),
			supabase
				.from('loyalty_history')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(50)
		]);
		
		if (!membersRes.error) loyaltyMembers = membersRes.data || [];
		if (!historyRes.error) {
			// Attach member names to history
			loyaltyHistory = (historyRes.data || []).map(h => ({
				...h,
				member_name: loyaltyMembers.find(m => m.id === h.member_id)?.name || 'Unknown'
			}));
		}
	}
	
	// Login handler
	async function handleLogin(e: Event) {
		e.preventDefault();
		isLoggingIn = true;
		authError = '';
		
		const { error } = await supabase.auth.signInWithPassword({
			email: loginEmail,
			password: loginPassword
		});
		
		if (error) authError = error.message;
		isLoggingIn = false;
	}
	
	// Logout handler
	async function handleLogout() {
		await supabase.auth.signOut();
		requests = [];
		selectedRequest = null;
	}
	
	// ============ REQUEST MANAGEMENT ============
	
	async function updateStatus(id: string, newStatus: string) {
		isUpdating = true;
		const { error } = await supabase
			.from('catering_requests')
			.update({ status: newStatus })
			.eq('id', id);
		
		if (!error) {
			requests = requests.map(r => 
				r.id === id ? { ...r, status: newStatus as CateringRequest['status'] } : r
			);
			if (selectedRequest?.id === id) {
				selectedRequest = { ...selectedRequest, status: newStatus as CateringRequest['status'] };
			}
		}
		isUpdating = false;
	}
	
	async function saveNotes() {
		if (!selectedRequest) return;
		isUpdating = true;
		notesSaved = false;
		
		const { error } = await supabase
			.from('catering_requests')
			.update({ admin_notes: adminNotesValue })
			.eq('id', selectedRequest.id);
		
		if (!error) {
			requests = requests.map(r => 
				r.id === selectedRequest!.id ? { ...r, admin_notes: adminNotesValue } : r
			);
			selectedRequest = { ...selectedRequest, admin_notes: adminNotesValue };
			notesSaved = true;
			setTimeout(() => notesSaved = false, 2000);
		}
		isUpdating = false;
	}
	
	async function deleteRequest() {
		if (!selectedRequest) return;
		const confirmed = confirm(`Delete request from "${selectedRequest.name}"?`);
		if (!confirmed) return;
		
		isUpdating = true;
		const { error } = await supabase
			.from('catering_requests')
			.delete()
			.eq('id', selectedRequest.id);
		
		if (!error) {
			requests = requests.filter(r => r.id !== selectedRequest!.id);
			selectedRequest = null;
		}
		isUpdating = false;
	}
	
	// ============ FLAVOR MANAGEMENT ============
	
	async function addFlavor() {
		if (!newFlavorName.trim()) return;
		isUpdating = true;
		
		const maxOrder = Math.max(0, ...flavors.map(f => f.sort_order));
		const { data, error } = await supabase
			.from('flavors')
			.insert({ name: newFlavorName.trim(), sort_order: maxOrder + 1 })
			.select()
			.single();
		
		if (!error && data) {
			flavors = [...flavors, data];
			newFlavorName = '';
		}
		isUpdating = false;
	}
	
	async function updateFlavor(flavor: Flavor) {
		isUpdating = true;
		const { error } = await supabase
			.from('flavors')
			.update({ name: flavor.name, active: flavor.active })
			.eq('id', flavor.id);
		
		if (!error) {
			flavors = flavors.map(f => f.id === flavor.id ? flavor : f);
			editingFlavor = null;
		}
		isUpdating = false;
	}
	
	async function deleteFlavor(id: string) {
		const confirmed = confirm('Delete this flavor?');
		if (!confirmed) return;
		
		isUpdating = true;
		const { error } = await supabase.from('flavors').delete().eq('id', id);
		if (!error) flavors = flavors.filter(f => f.id !== id);
		isUpdating = false;
	}
	
	async function toggleFlavorActive(flavor: Flavor) {
		const updated = { ...flavor, active: !flavor.active };
		await updateFlavor(updated);
	}
	
	// ============ CONCOCTION MANAGEMENT ============
	
	async function addConcoction() {
		if (!newConcoctionName.trim() || !newConcoctionIngredients.trim()) return;
		isUpdating = true;
		
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
		isUpdating = false;
	}
	
	async function updateConcoction(concoction: Concoction) {
		isUpdating = true;
		const { error } = await supabase
			.from('concoctions')
			.update({ name: concoction.name, ingredients: concoction.ingredients, active: concoction.active })
			.eq('id', concoction.id);
		
		if (!error) {
			concoctions = concoctions.map(c => c.id === concoction.id ? concoction : c);
			editingConcoction = null;
		}
		isUpdating = false;
	}
	
	async function deleteConcoction(id: string) {
		const confirmed = confirm('Delete this concoction?');
		if (!confirmed) return;
		
		isUpdating = true;
		const { error } = await supabase.from('concoctions').delete().eq('id', id);
		if (!error) concoctions = concoctions.filter(c => c.id !== id);
		isUpdating = false;
	}
	
	async function toggleConcoctionActive(concoction: Concoction) {
		const updated = { ...concoction, active: !concoction.active };
		await updateConcoction(updated);
	}
	
	// ============ SITE CONTENT MANAGEMENT ============
	
	async function saveSiteContent(content: SiteContent) {
		isUpdating = true;
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
		isUpdating = false;
	}
	
	// ============ LOYALTY MANAGEMENT ============
	
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
		
		// Auto-format as they type
		if (digits.length <= 3) {
			phoneSearch = digits;
		} else if (digits.length <= 6) {
			phoneSearch = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		} else {
			phoneSearch = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
		}
		
		// Debounced search
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
			// Show new member form if no exact phone match
			const exactMatch = searchResults.find(m => normalizePhone(m.phone) === searchDigits);
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
	
	// Clear selection
	function clearSelection() {
		selectedMember = null;
		phoneSearch = '';
		searchResults = [];
		showNewMemberForm = false;
		newMemberName = '';
		newMemberEmail = '';
		punchesToAdd = 1;
	}
	
	// Add new loyalty member
	async function addLoyaltyMember() {
		const phone = normalizePhone(phoneSearch);
		if (phone.length !== 10 || !newMemberName.trim()) return;
		
		isUpdating = true;
		
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
			// Add to history
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
		
		isUpdating = false;
	}
	
	// Add punches to member
	async function addPunches() {
		if (!selectedMember || punchesToAdd < 1) return;
		
		isUpdating = true;
		
		const newPunches = Math.min(selectedMember.punches + punchesToAdd, 9);
		const actualAdded = newPunches - selectedMember.punches;
		
		const { error } = await supabase
			.from('loyalty_members')
			.update({
				punches: newPunches,
				total_punches: selectedMember.total_punches + actualAdded,
				last_visit: new Date().toISOString()
			})
			.eq('id', selectedMember.id);
		
		if (!error) {
			// Add to history
			await supabase.from('loyalty_history').insert({
				member_id: selectedMember.id,
				action: 'punch',
				punch_count: actualAdded
			});
			
			selectedMember = {
				...selectedMember,
				punches: newPunches,
				total_punches: selectedMember.total_punches + actualAdded,
				last_visit: new Date().toISOString()
			};
			
			loyaltyMembers = loyaltyMembers.map(m => 
				m.id === selectedMember!.id ? selectedMember! : m
			);
			
			punchesToAdd = 1;
			await loadLoyaltyData();
		}
		
		isUpdating = false;
	}
	
	// Redeem reward
	async function redeemReward() {
		if (!selectedMember || selectedMember.punches < 9) return;
		
		isUpdating = true;
		
		const { error } = await supabase
			.from('loyalty_members')
			.update({
				punches: 0,
				total_redeemed: selectedMember.total_redeemed + 1,
				last_visit: new Date().toISOString()
			})
			.eq('id', selectedMember.id);
		
		if (!error) {
			// Add to history
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
			
			loyaltyMembers = loyaltyMembers.map(m => 
				m.id === selectedMember!.id ? selectedMember! : m
			);
			
			await loadLoyaltyData();
		}
		
		isUpdating = false;
	}
	
	// Edit member
	let editingMember = $state<LoyaltyMember | null>(null);
	
	async function updateMember() {
		if (!editingMember) return;
		
		isUpdating = true;
		
		const { error } = await supabase
			.from('loyalty_members')
			.update({
				name: editingMember.name,
				email: editingMember.email,
				punches: Math.max(0, Math.min(9, editingMember.punches))
			})
			.eq('id', editingMember.id);
		
		if (!error) {
			loyaltyMembers = loyaltyMembers.map(m => 
				m.id === editingMember!.id ? editingMember! : m
			);
			if (selectedMember?.id === editingMember.id) {
				selectedMember = editingMember;
			}
			editingMember = null;
		}
		
		isUpdating = false;
	}
	
	// Delete member
	async function deleteMember(id: string) {
		const member = loyaltyMembers.find(m => m.id === id);
		const confirmed = confirm(`Delete ${member?.name}'s loyalty card? This cannot be undone.`);
		if (!confirmed) return;
		
		isUpdating = true;
		
		const { error } = await supabase.from('loyalty_members').delete().eq('id', id);
		
		if (!error) {
			loyaltyMembers = loyaltyMembers.filter(m => m.id !== id);
			if (selectedMember?.id === id) {
				clearSelection();
			}
		}
		
		isUpdating = false;
	}
	
	// Stats calculations
	let loyaltyStats = $derived({
		totalMembers: loyaltyMembers.length,
		totalPunchesThisMonth: loyaltyHistory
			.filter(h => h.action === 'punch' && new Date(h.created_at).getMonth() === new Date().getMonth())
			.reduce((sum, h) => sum + (h.punch_count || 0), 0),
		totalRedeemedThisMonth: loyaltyHistory
			.filter(h => h.action === 'redeem' && new Date(h.created_at).getMonth() === new Date().getMonth())
			.length,
		topCustomers: [...loyaltyMembers]
			.sort((a, b) => b.total_punches - a.total_punches)
			.slice(0, 10)
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
	
	// ============ HELPERS ============
	
	$effect(() => {
		if (selectedRequest) {
			adminNotesValue = selectedRequest.admin_notes || '';
			notesSaved = false;
		}
	});
	
	let filteredRequests = $derived(
		filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus)
	);
	
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
		});
	}
	
	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			new: 'status-new', contacted: 'status-contacted', confirmed: 'status-confirmed', completed: 'status-completed'
		};
		return colors[status] || '';
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
		<!-- Login Form -->
		<div class="login-container">
			<div class="login-card">
				<h1 class="login-title">Admin Login</h1>
				<p class="login-subtitle">Daesy's Tropical Sno Dashboard</p>
				
				<form onsubmit={handleLogin} class="login-form">
					{#if authError}
						<div class="auth-error" role="alert">{authError}</div>
					{/if}
					
					<div class="form-group">
						<label for="email" class="form-label">Email</label>
						<input type="email" id="email" class="form-input" bind:value={loginEmail} required autocomplete="email" />
					</div>
					
					<div class="form-group">
						<label for="password" class="form-label">Password</label>
						<input type="password" id="password" class="form-input" bind:value={loginPassword} required autocomplete="current-password" />
					</div>
					
					<button type="submit" class="btn btn-primary login-btn" disabled={isLoggingIn}>
						{#if isLoggingIn}<span class="spinner"></span> Signing in...{:else}Sign In{/if}
					</button>
				</form>
				
				<a href="/" class="back-link">← Back to website</a>
			</div>
		</div>
	{:else}
		<!-- Dashboard -->
		<div class="dashboard">
			<header class="dashboard-header">
				<h1>🌴 Admin Dashboard</h1>
				<div class="header-actions">
					<button onclick={loadAllData} class="btn btn-secondary refresh-btn">🔄 Refresh</button>
					<button onclick={handleLogout} class="btn logout-btn">Logout</button>
				</div>
			</header>
			
			<!-- Tabs -->
			<div class="tabs">
				<button class="tab" class:active={activeTab === 'requests'} onclick={() => activeTab = 'requests'}>
					📋 Requests <span class="badge">{requests.filter(r => r.status === 'new').length}</span>
				</button>
				<button class="tab" class:active={activeTab === 'flavors'} onclick={() => activeTab = 'flavors'}>
					🍧 Flavors <span class="badge">{flavors.filter(f => f.active).length}</span>
				</button>
				<button class="tab" class:active={activeTab === 'concoctions'} onclick={() => activeTab = 'concoctions'}>
					🌺 Concoctions <span class="badge">{concoctions.filter(c => c.active).length}</span>
				</button>
				<button class="tab" class:active={activeTab === 'specials'} onclick={() => activeTab = 'specials'}>
					🎁 Specials
				</button>
				<button class="tab" class:active={activeTab === 'loyalty'} onclick={() => activeTab = 'loyalty'}>
					🎫 Sno Squad <span class="badge">{loyaltyMembers.length}</span>
				</button>
			</div>
			
			<div class="tab-content">
				<!-- ============ REQUESTS TAB ============ -->
				{#if activeTab === 'requests'}
					<div class="filters">
						<select id="status-filter" class="form-select filter-select" bind:value={filterStatus}>
							<option value="all">All Requests ({requests.length})</option>
							<option value="new">New ({requests.filter(r => r.status === 'new').length})</option>
							<option value="contacted">Contacted ({requests.filter(r => r.status === 'contacted').length})</option>
							<option value="confirmed">Confirmed ({requests.filter(r => r.status === 'confirmed').length})</option>
							<option value="completed">Completed ({requests.filter(r => r.status === 'completed').length})</option>
						</select>
					</div>
					
					<div class="dashboard-layout">
						<div class="request-list">
							{#if filteredRequests.length === 0}
								<div class="empty-state"><p>No requests found.</p></div>
							{:else}
								{#each filteredRequests as request (request.id)}
									<button class="request-card" class:selected={selectedRequest?.id === request.id} onclick={() => selectedRequest = request}>
										<div class="request-card-header">
											<span class="request-name">{request.name}</span>
											<span class="status-badge {getStatusColor(request.status)}">{request.status}</span>
										</div>
										<div class="request-card-meta">
											<span>{request.event_type}</span>
											<span>{formatDate(request.event_date)}</span>
										</div>
									</button>
								{/each}
							{/if}
						</div>
						
						<div class="request-details">
							{#if selectedRequest}
								<div class="details-card">
									<h2>{selectedRequest.name}</h2>
									
									<div class="details-section">
										<h3>Contact Info</h3>
										<p><strong>Phone:</strong> <a href="tel:{selectedRequest.phone}">{selectedRequest.phone}</a></p>
										<p><strong>Email:</strong> <a href="mailto:{selectedRequest.email}">{selectedRequest.email}</a></p>
									</div>
									
									<div class="details-section">
										<h3>Event Details</h3>
										<p><strong>Type:</strong> {selectedRequest.event_type}</p>
										<p><strong>Date:</strong> {formatDate(selectedRequest.event_date)}</p>
										{#if selectedRequest.customer_notes}
											<p><strong>Notes:</strong> {selectedRequest.customer_notes}</p>
										{/if}
									</div>
									
									<div class="details-section">
										<h3>Status</h3>
										<select class="form-select" value={selectedRequest.status} onchange={(e) => updateStatus(selectedRequest!.id, (e.target as HTMLSelectElement).value)} disabled={isUpdating}>
											<option value="new">New</option>
											<option value="contacted">Contacted</option>
											<option value="confirmed">Confirmed</option>
											<option value="completed">Completed</option>
										</select>
									</div>
									
									<div class="details-section">
										<h3>Admin Notes</h3>
										<textarea class="form-textarea admin-notes" placeholder="Add private notes..." bind:value={adminNotesValue}></textarea>
										<div class="notes-actions">
											<button class="btn btn-save" onclick={saveNotes} disabled={isUpdating}>
												{#if isUpdating}<span class="spinner-small"></span> Saving...{:else}🌴 Save Notes{/if}
											</button>
											<button class="btn btn-delete" onclick={deleteRequest} disabled={isUpdating}>🗑️ Delete</button>
											{#if notesSaved}<span class="saved-indicator">✓ Saved!</span>{/if}
										</div>
									</div>
									
									<div class="details-meta">Submitted: {formatDate(selectedRequest.created_at)}</div>
								</div>
							{:else}
								<div class="empty-details"><p>Select a request to view details</p></div>
							{/if}
						</div>
					</div>
				{/if}
				
				<!-- ============ FLAVORS TAB ============ -->
				{#if activeTab === 'flavors'}
					<div class="management-section">
						<div class="add-form">
							<input type="text" class="form-input" placeholder="New flavor name..." bind:value={newFlavorName} />
							<button class="btn btn-primary" onclick={addFlavor} disabled={isUpdating || !newFlavorName.trim()}>
								+ Add Flavor
							</button>
						</div>
						
						<div class="items-list">
							{#each flavors as flavor (flavor.id)}
								<div class="item-row" class:inactive={!flavor.active}>
									{#if editingFlavor?.id === flavor.id}
										<input type="text" class="form-input edit-input" bind:value={editingFlavor.name} />
										<div class="item-actions">
											<button class="btn btn-small btn-save" onclick={() => updateFlavor(editingFlavor!)}>Save</button>
											<button class="btn btn-small" onclick={() => editingFlavor = null}>Cancel</button>
										</div>
									{:else}
										<span class="item-name">{flavor.name}</span>
										<div class="item-actions">
											<button class="btn btn-small" class:active={flavor.active} onclick={() => toggleFlavorActive(flavor)}>
												{flavor.active ? '✓ Active' : '✗ Hidden'}
											</button>
											<button class="btn btn-small" onclick={() => editingFlavor = { ...flavor }}>Edit</button>
											<button class="btn btn-small btn-delete-small" onclick={() => deleteFlavor(flavor.id)}>×</button>
										</div>
									{/if}
								</div>
							{/each}
						</div>
						
						<p class="management-note">💡 Hidden flavors won't appear on the website but are kept for future use.</p>
					</div>
				{/if}
				
				<!-- ============ CONCOCTIONS TAB ============ -->
				{#if activeTab === 'concoctions'}
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
				{/if}
				
				<!-- ============ SPECIALS TAB ============ -->
				{#if activeTab === 'specials'}
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
				{/if}
				
				<!-- ============ LOYALTY TAB ============ -->
				{#if activeTab === 'loyalty'}
					<div class="loyalty-section">
						<!-- Sub-navigation -->
						<div class="loyalty-nav">
							<button class="loyalty-nav-btn" class:active={loyaltyView === 'lookup'} onclick={() => loyaltyView = 'lookup'}>
								📱 Lookup
							</button>
							<button class="loyalty-nav-btn" class:active={loyaltyView === 'stats'} onclick={() => loyaltyView = 'stats'}>
								📊 Stats
							</button>
							<button class="loyalty-nav-btn" class:active={loyaltyView === 'members'} onclick={() => loyaltyView = 'members'}>
								👥 All Members
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
												<input id="new-name" type="text" class="form-input" placeholder="Customer name" bind:value={newMemberName} />
											</div>
											<div class="form-group">
												<label for="new-email" class="form-label">Email (optional)</label>
												<input id="new-email" type="email" class="form-input" placeholder="email@example.com" bind:value={newMemberEmail} />
											</div>
											<button class="btn btn-primary" onclick={addLoyaltyMember} disabled={isUpdating || !newMemberName.trim()}>
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
											<div class="reward-banner">
												🎉 FREE SNO CONE EARNED!
											</div>
										{/if}
										
										<div class="member-header">
											<div class="member-info">
												<h2 class="member-name">{selectedMember.name}</h2>
												<p class="member-phone">{formatPhone(selectedMember.phone)}</p>
												{#if selectedMember.email}
													<p class="member-email">{selectedMember.email}</p>
												{/if}
												<p class="member-meta">
													Member since {new Date(selectedMember.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
													· {selectedMember.total_punches} lifetime punch{selectedMember.total_punches !== 1 ? 'es' : ''}
													· {selectedMember.total_redeemed} reward{selectedMember.total_redeemed !== 1 ? 's' : ''}
												</p>
											</div>
											<div class="punch-count">
												<span class="punch-number">{selectedMember.punches}</span>
												<span class="punch-label">/9</span>
											</div>
										</div>
										
										<!-- Punch Dots -->
										<div class="punch-dots" aria-label="{selectedMember.punches} of 9 punches">
											{#each Array(9) as _, i}
												<button 
													type="button"
													class="punch-dot" 
													class:filled={i < selectedMember.punches}
													class:preview={i >= selectedMember.punches && i < selectedMember.punches + punchesToAdd}
													onclick={() => {
														if (selectedMember && i >= selectedMember.punches) {
															punchesToAdd = i - selectedMember.punches + 1;
														}
													}}
													disabled={i < selectedMember.punches}
													aria-label="Punch {i + 1}{i < selectedMember.punches ? ' (filled)' : ''}"
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
												<button class="btn btn-secondary" onclick={clearSelection}>
													Skip for Now
												</button>
											</div>
										{:else}
											<div class="punch-actions">
												<button class="btn btn-primary" onclick={addPunches} disabled={isUpdating}>
													+ Add {punchesToAdd} Punch{punchesToAdd > 1 ? 'es' : ''}
												</button>
												{#if selectedMember.punches >= 7}
													<p class="almost-there">🎉 {9 - selectedMember.punches} more until FREE SNO CONE!</p>
												{/if}
											</div>
										{/if}
										
										<button class="btn-close-member" onclick={clearSelection}>Done</button>
									</div>
								{/if}
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
													<span class="customer-stats">{customer.total_punches} punches · {customer.total_redeemed} rewards</span>
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
															{activity.member_name} +{activity.punch_count} punch{activity.punch_count !== 1 ? 'es' : ''}
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
						
						<!-- ===== ALL MEMBERS VIEW ===== -->
						{#if loyaltyView === 'members'}
							<div class="members-section">
								<div class="members-list">
									{#each loyaltyMembers as member (member.id)}
										<div class="member-row" class:editing={editingMember?.id === member.id}>
											{#if editingMember?.id === member.id}
												<div class="edit-member-form">
													<input type="text" class="form-input" placeholder="Name" bind:value={editingMember.name} />
													<input type="email" class="form-input" placeholder="Email (optional)" bind:value={editingMember.email} />
													<div class="edit-punches">
														<label for="edit-punches-{member.id}">Punches:</label>
														<input id="edit-punches-{member.id}" type="number" class="form-input punch-input" min="0" max="9" bind:value={editingMember.punches} />
													</div>
													<div class="edit-actions">
														<button class="btn btn-small btn-save" onclick={updateMember}>Save</button>
														<button class="btn btn-small" onclick={() => editingMember = null}>Cancel</button>
													</div>
												</div>
											{:else}
												<div class="member-row-info">
													<span class="member-row-name">{member.name}</span>
													<span class="member-row-phone">{formatPhone(member.phone)}</span>
													{#if member.email}
														<span class="member-row-email">{member.email}</span>
													{/if}
												</div>
												<div class="member-row-stats">
													<span class="member-row-punches">{member.punches}/9 punches</span>
													<span class="member-row-lifetime">{member.total_redeemed} rewards</span>
													<span class="member-row-visit">Last: {formatRelativeTime(member.last_visit)}</span>
												</div>
												<div class="member-row-actions">
													<button class="btn btn-small" onclick={() => { selectMember(member); loyaltyView = 'lookup'; }}>
														View
													</button>
													<button class="btn btn-small" onclick={() => editingMember = { ...member }}>
														Edit
													</button>
													<button class="btn btn-small btn-delete-small" onclick={() => deleteMember(member.id)}>
														×
													</button>
												</div>
											{/if}
										</div>
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
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.admin-page {
		min-height: 100vh;
		background: var(--color-gray-100);
	}
	
	/* Loading */
	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: var(--space-md);
	}
	
	.loading-screen .spinner {
		width: 40px;
		height: 40px;
	}
	
	/* Login */
	.login-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-md);
	}
	
	.login-card {
		background: var(--color-white);
		padding: var(--space-xl);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		width: 100%;
		max-width: 400px;
	}
	
	.login-title {
		font-family: var(--font-heading);
		text-align: center;
		margin-bottom: var(--space-xs);
	}
	
	.login-subtitle {
		text-align: center;
		color: var(--color-gray-600);
		margin-bottom: var(--space-lg);
	}
	
	.login-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	
	.auth-error {
		background: #fef2f2;
		border: 1px solid var(--color-red);
		color: var(--color-red);
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
	}
	
	.login-btn {
		width: 100%;
		margin-top: var(--space-sm);
	}
	
	.back-link {
		display: block;
		text-align: center;
		margin-top: var(--space-lg);
		color: var(--color-gray-600);
		font-size: 0.9rem;
	}
	
	/* Dashboard */
	.dashboard {
		padding: var(--space-md);
		max-width: 1400px;
		margin: 0 auto;
	}
	
	.dashboard-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}
	
	.dashboard-header h1 {
		font-family: var(--font-heading);
		font-size: 1.75rem;
	}
	
	.header-actions {
		display: flex;
		gap: var(--space-sm);
	}
	
	.refresh-btn { font-size: 0.9rem; }
	.logout-btn { background: var(--color-gray-200); color: var(--color-gray-800); }
	
	/* Tabs */
	.tabs {
		display: flex;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
		overflow-x: auto;
		padding-bottom: var(--space-xs);
	}
	
	.tab {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	
	.tab:hover { border-color: var(--color-blue-light); }
	.tab.active {
		background: var(--color-blue);
		color: var(--color-white);
		border-color: var(--color-blue);
	}
	
	.tab .badge {
		background: rgba(255,255,255,0.2);
		padding: 0.1em 0.5em;
		border-radius: var(--radius-full);
		font-size: 0.8em;
	}
	
	.tab.active .badge { background: rgba(255,255,255,0.3); }
	
	/* Filters */
	.filters { margin-bottom: var(--space-md); }
	.filter-select { max-width: 250px; }
	
	.dashboard-layout {
		display: grid;
		gap: var(--space-md);
	}
	
	/* Request List */
	.request-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 60vh;
		overflow-y: auto;
	}
	
	.request-card {
		background: var(--color-white);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		padding: var(--space-md);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
		width: 100%;
	}
	
	.request-card:hover { border-color: var(--color-blue-light); }
	.request-card.selected { border-color: var(--color-blue); background: var(--color-cream); }
	
	.request-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-xs);
	}
	
	.request-name { font-weight: 700; color: var(--color-gray-900); }
	
	.status-badge {
		font-size: 0.75rem;
		padding: 0.2em 0.6em;
		border-radius: var(--radius-full);
		font-weight: 600;
		text-transform: uppercase;
	}
	
	.status-new { background: #dbeafe; color: #1e40af; }
	.status-contacted { background: #fef3c7; color: #92400e; }
	.status-confirmed { background: #d1fae5; color: #065f46; }
	.status-completed { background: var(--color-gray-200); color: var(--color-gray-600); }
	
	.request-card-meta {
		display: flex;
		gap: var(--space-md);
		font-size: 0.85rem;
		color: var(--color-gray-600);
	}
	
	/* Details */
	.details-card {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}
	
	.details-card h2 { font-family: var(--font-heading); margin-bottom: var(--space-lg); }
	.details-section { margin-bottom: var(--space-lg); }
	.details-section h3 {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-gray-600);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-sm);
	}
	
	.details-section p { margin-bottom: var(--space-xs); }
	.admin-notes { min-height: 100px; }
	
	.notes-actions {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-top: var(--space-sm);
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
	}
	
	.btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-md); }
	.btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
	
	.btn-delete {
		background: var(--color-gray-200);
		color: var(--color-red);
		font-weight: 600;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}
	
	.btn-delete:hover:not(:disabled) { background: var(--color-red); color: var(--color-white); }
	
	.spinner-small {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255,255,255,0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	.saved-indicator {
		color: #059669;
		font-weight: 600;
		animation: fadeIn 0.3s ease-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateX(-10px); }
		to { opacity: 1; transform: translateX(0); }
	}
	
	.details-meta {
		font-size: 0.8rem;
		color: var(--color-gray-600);
		border-top: 1px solid var(--color-gray-200);
		padding-top: var(--space-md);
		margin-top: var(--space-md);
	}
	
	.empty-state, .empty-details {
		text-align: center;
		padding: var(--space-xl);
		color: var(--color-gray-600);
		background: var(--color-white);
		border-radius: var(--radius-lg);
	}
	
	/* Management sections */
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
	
	.edit-input { flex: 1; }
	
	.management-note {
		margin-top: var(--space-lg);
		padding: var(--space-md);
		background: var(--color-cream);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		color: var(--color-gray-600);
	}
	
	/* Specials section */
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
	
	.saved-banner {
		background: #d1fae5;
		color: #065f46;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		text-align: center;
		font-weight: 600;
		animation: fadeIn 0.3s ease-out;
	}
	
	/* ============ LOYALTY SECTION ============ */
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
	
	.loyalty-nav-btn:hover { background: var(--color-gray-100); }
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
	
	.clear-btn:hover { background: var(--color-gray-300); }
	
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
	
	.search-result:hover { background: var(--color-cream); }
	.search-result:last-child { border-bottom: none; }
	
	.result-name { font-weight: 600; flex: 1; }
	.result-phone { color: var(--color-gray-600); font-size: 0.9rem; }
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
	
	.member-phone {
		font-size: 1.1rem;
		color: var(--color-gray-600);
		margin-bottom: var(--space-xs);
	}
	
	.member-email {
		font-size: 0.9rem;
		color: var(--color-gray-500);
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
		cursor: default;
	}
	
	.punch-dot.preview {
		background: var(--color-yellow);
		border-color: var(--color-yellow);
		cursor: pointer;
	}
	
	.punch-dot:not(.filled):not(.preview) {
		cursor: pointer;
	}
	
	.punch-dot:not(.filled):hover {
		border-color: var(--color-blue);
		background: var(--color-gray-100);
	}
	
	.member-card.reward-ready .punch-dot.filled {
		background: var(--color-yellow);
		border-color: var(--color-yellow);
	}
	
	/* Punch Actions */
	.punch-actions, .reward-actions {
		text-align: center;
	}
	
	.add-punch-row {
		display: flex;
		justify-content: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}
	
	.punch-select {
		width: auto;
		min-width: 120px;
	}
	
	.almost-there {
		color: var(--color-blue);
		font-weight: 600;
		font-size: 1.1rem;
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
	
	.btn-reward:hover { transform: scale(1.05); box-shadow: var(--shadow-lg); }
	
	.btn-close-member {
		position: absolute;
		top: var(--space-md);
		right: var(--space-md);
		background: var(--color-gray-200);
		border: none;
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-md);
		font-size: 0.85rem;
		cursor: pointer;
	}
	
	.btn-close-member:hover { background: var(--color-gray-300); }
	
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
	
	.top-customers, .recent-activity {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	
	.top-customer-row, .activity-row {
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
	
	.customer-name { font-weight: 600; flex: 1; }
	.customer-phone { color: var(--color-gray-500); font-size: 0.85rem; }
	.customer-stats { color: var(--color-gray-600); font-size: 0.85rem; }
	
	.activity-icon { font-size: 1.2rem; }
	.activity-text { flex: 1; }
	.activity-time { color: var(--color-gray-500); font-size: 0.85rem; }
	
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
	}
	
	.member-row-info {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: baseline;
	}
	
	.member-row-name { font-weight: 600; }
	.member-row-phone { color: var(--color-gray-600); font-size: 0.9rem; }
	.member-row-email { color: var(--color-gray-500); font-size: 0.85rem; }
	
	.member-row-stats {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		font-size: 0.85rem;
		color: var(--color-gray-600);
	}
	
	.member-row-punches { color: var(--color-blue); font-weight: 600; }
	
	.member-row-actions {
		display: flex;
		gap: var(--space-xs);
	}
	
	.edit-member-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	
	.edit-punches {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	
	.edit-punches .punch-input {
		width: 80px;
	}
	
	.edit-actions {
		display: flex;
		gap: var(--space-xs);
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
		.dashboard { padding: var(--space-xl); }
		.dashboard-header { flex-direction: row; justify-content: space-between; align-items: center; }
		.dashboard-layout { grid-template-columns: 350px 1fr; }
		.request-list { max-height: 75vh; }
		.concoction-row { flex-direction: row; align-items: center; }
		
		.lookup-section { grid-template-columns: 1fr 1fr; }
		.stats-panels { grid-template-columns: 1fr 1fr; }
		.member-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
		.member-row-info { flex: 1; }
		.member-row-stats { flex: 1; justify-content: center; }
	}
	
	@media (min-width: 1024px) {
		.dashboard-layout { grid-template-columns: 400px 1fr; }
	}
</style>
