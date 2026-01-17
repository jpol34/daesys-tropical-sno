<script lang="ts">
	import { supabase, type CateringRequest } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	// Types
	type Flavor = { id: string; name: string; active: boolean; sort_order: number };
	type Concoction = { id: string; name: string; ingredients: string[]; active: boolean; sort_order: number };
	type SiteContent = { id: string; key: string; value: string; description: string };
	
	// Auth state
	let isAuthenticated = $state(false);
	let isLoading = $state(true);
	let authError = $state('');
	
	// Login form
	let loginEmail = $state('');
	let loginPassword = $state('');
	let isLoggingIn = $state(false);
	
	// Tab state
	let activeTab = $state<'requests' | 'flavors' | 'concoctions' | 'specials'>('requests');
	
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
			loadSiteContent()
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
	
	@media (min-width: 768px) {
		.dashboard { padding: var(--space-xl); }
		.dashboard-header { flex-direction: row; justify-content: space-between; align-items: center; }
		.dashboard-layout { grid-template-columns: 350px 1fr; }
		.request-list { max-height: 75vh; }
		.concoction-row { flex-direction: row; align-items: center; }
	}
	
	@media (min-width: 1024px) {
		.dashboard-layout { grid-template-columns: 400px 1fr; }
	}
</style>
