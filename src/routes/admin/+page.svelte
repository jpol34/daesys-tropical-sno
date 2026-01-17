<script lang="ts">
	import { supabase, type CateringRequest } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	// Auth state
	let isAuthenticated = $state(false);
	let isLoading = $state(true);
	let authError = $state('');
	
	// Login form
	let loginEmail = $state('');
	let loginPassword = $state('');
	let isLoggingIn = $state(false);
	
	// Data state
	let requests = $state<CateringRequest[]>([]);
	let selectedRequest = $state<CateringRequest | null>(null);
	let filterStatus = $state('all');
	let isUpdating = $state(false);
	let adminNotesValue = $state('');
	let notesSaved = $state(false);
	
	// Check auth on mount
	onMount(async () => {
		const { data: { session } } = await supabase.auth.getSession();
		isAuthenticated = !!session;
		if (isAuthenticated) {
			await loadRequests();
		}
		isLoading = false;
		
		// Listen for auth changes
		supabase.auth.onAuthStateChange((event, session) => {
			isAuthenticated = !!session;
			if (isAuthenticated) {
				loadRequests();
			}
		});
	});
	
	// Load catering requests
	async function loadRequests() {
		const { data, error } = await supabase
			.from('catering_requests')
			.select('*')
			.order('created_at', { ascending: false });
		
		if (error) {
			console.error('Error loading requests:', error);
			return;
		}
		
		requests = data || [];
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
		
		if (error) {
			authError = error.message;
		}
		
		isLoggingIn = false;
	}
	
	// Logout handler
	async function handleLogout() {
		await supabase.auth.signOut();
		requests = [];
		selectedRequest = null;
	}
	
	// Update request status
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
	
	// Update admin notes
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
	
	// Sync admin notes when selection changes
	$effect(() => {
		if (selectedRequest) {
			adminNotesValue = selectedRequest.admin_notes || '';
			notesSaved = false;
		}
	});
	
	// Filter requests
	let filteredRequests = $derived(
		filterStatus === 'all' 
			? requests 
			: requests.filter(r => r.status === filterStatus)
	);
	
	// Format date for display
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
	
	// Status badge colors
	function getStatusColor(status: string): string {
		switch(status) {
			case 'new': return 'status-new';
			case 'contacted': return 'status-contacted';
			case 'confirmed': return 'status-confirmed';
			case 'completed': return 'status-completed';
			default: return '';
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
		<!-- Login Form -->
		<div class="login-container">
			<div class="login-card">
				<h1 class="login-title">Admin Login</h1>
				<p class="login-subtitle">Daesy's Tropical Sno Dashboard</p>
				
				<form onsubmit={handleLogin} class="login-form">
					{#if authError}
						<div class="auth-error" role="alert">
							{authError}
						</div>
					{/if}
					
					<div class="form-group">
						<label for="email" class="form-label">Email</label>
						<input
							type="email"
							id="email"
							class="form-input"
							bind:value={loginEmail}
							required
							autocomplete="email"
						/>
					</div>
					
					<div class="form-group">
						<label for="password" class="form-label">Password</label>
						<input
							type="password"
							id="password"
							class="form-input"
							bind:value={loginPassword}
							required
							autocomplete="current-password"
						/>
					</div>
					
					<button type="submit" class="btn btn-primary login-btn" disabled={isLoggingIn}>
						{#if isLoggingIn}
							<span class="spinner"></span> Signing in...
						{:else}
							Sign In
						{/if}
					</button>
				</form>
				
				<a href="/" class="back-link">← Back to website</a>
			</div>
		</div>
	{:else}
		<!-- Dashboard -->
		<div class="dashboard">
			<header class="dashboard-header">
				<h1>Catering Requests</h1>
				<div class="header-actions">
					<button onclick={loadRequests} class="btn btn-secondary refresh-btn">
						🔄 Refresh
					</button>
					<button onclick={handleLogout} class="btn logout-btn">
						Logout
					</button>
				</div>
			</header>
			
			<div class="dashboard-content">
				<!-- Filters -->
				<div class="filters">
					<label for="status-filter" class="visually-hidden">Filter by status</label>
					<select 
						id="status-filter" 
						class="form-select filter-select"
						bind:value={filterStatus}
					>
						<option value="all">All Requests ({requests.length})</option>
						<option value="new">New ({requests.filter(r => r.status === 'new').length})</option>
						<option value="contacted">Contacted ({requests.filter(r => r.status === 'contacted').length})</option>
						<option value="confirmed">Confirmed ({requests.filter(r => r.status === 'confirmed').length})</option>
						<option value="completed">Completed ({requests.filter(r => r.status === 'completed').length})</option>
					</select>
				</div>
				
				<div class="dashboard-layout">
					<!-- Request List -->
					<div class="request-list">
						{#if filteredRequests.length === 0}
							<div class="empty-state">
								<p>No requests found.</p>
							</div>
						{:else}
							{#each filteredRequests as request (request.id)}
								<button
									class="request-card"
									class:selected={selectedRequest?.id === request.id}
									onclick={() => selectedRequest = request}
								>
									<div class="request-card-header">
										<span class="request-name">{request.name}</span>
										<span class="status-badge {getStatusColor(request.status)}">
											{request.status}
										</span>
									</div>
									<div class="request-card-meta">
										<span>{request.event_type}</span>
										<span>{formatDate(request.event_date)}</span>
									</div>
								</button>
							{/each}
						{/if}
					</div>
					
					<!-- Request Details -->
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
									<select
										class="form-select"
										value={selectedRequest.status}
										onchange={(e) => updateStatus(selectedRequest!.id, (e.target as HTMLSelectElement).value)}
										disabled={isUpdating}
									>
										<option value="new">New</option>
										<option value="contacted">Contacted</option>
										<option value="confirmed">Confirmed</option>
										<option value="completed">Completed</option>
									</select>
								</div>
								
								<div class="details-section">
									<h3>Admin Notes</h3>
									<textarea
										class="form-textarea admin-notes"
										placeholder="Add private notes about this event..."
										bind:value={adminNotesValue}
									></textarea>
									<div class="notes-actions">
										<button 
											class="btn btn-save"
											onclick={saveNotes}
											disabled={isUpdating}
										>
											{#if isUpdating}
												<span class="spinner-small"></span> Saving...
											{:else}
												🌴 Save Notes
											{/if}
										</button>
										{#if notesSaved}
											<span class="saved-indicator">✓ Saved!</span>
										{/if}
									</div>
								</div>
								
								<div class="details-meta">
									Submitted: {formatDate(selectedRequest.created_at)}
								</div>
							</div>
						{:else}
							<div class="empty-details">
								<p>Select a request to view details</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.admin-page {
		min-height: 100vh;
		background: var(--color-gray-100);
	}
	
	/* Loading Screen */
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
	
	.refresh-btn {
		font-size: 0.9rem;
	}
	
	.logout-btn {
		background: var(--color-gray-200);
		color: var(--color-gray-800);
	}
	
	.filters {
		margin-bottom: var(--space-md);
	}
	
	.filter-select {
		max-width: 250px;
	}
	
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
	
	.request-card:hover {
		border-color: var(--color-blue-light);
	}
	
	.request-card.selected {
		border-color: var(--color-blue);
		background: var(--color-cream);
	}
	
	.request-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-xs);
	}
	
	.request-name {
		font-weight: 700;
		color: var(--color-gray-900);
	}
	
	.status-badge {
		font-size: 0.75rem;
		padding: 0.2em 0.6em;
		border-radius: var(--radius-full);
		font-weight: 600;
		text-transform: uppercase;
	}
	
	.status-new {
		background: #dbeafe;
		color: #1e40af;
	}
	
	.status-contacted {
		background: #fef3c7;
		color: #92400e;
	}
	
	.status-confirmed {
		background: #d1fae5;
		color: #065f46;
	}
	
	.status-completed {
		background: var(--color-gray-200);
		color: var(--color-gray-600);
	}
	
	.request-card-meta {
		display: flex;
		gap: var(--space-md);
		font-size: 0.85rem;
		color: var(--color-gray-600);
	}
	
	/* Request Details */
	.details-card {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}
	
	.details-card h2 {
		font-family: var(--font-heading);
		margin-bottom: var(--space-lg);
	}
	
	.details-section {
		margin-bottom: var(--space-lg);
	}
	
	.details-section h3 {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-gray-600);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-sm);
	}
	
	.details-section p {
		margin-bottom: var(--space-xs);
	}
	
	.admin-notes {
		min-height: 100px;
	}
	
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
	
	.btn-save:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	
	.btn-save:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	
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
	
	.empty-state,
	.empty-details {
		text-align: center;
		padding: var(--space-xl);
		color: var(--color-gray-600);
		background: var(--color-white);
		border-radius: var(--radius-lg);
	}
	
	@media (min-width: 768px) {
		.dashboard {
			padding: var(--space-xl);
		}
		
		.dashboard-header {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
		
		.dashboard-layout {
			grid-template-columns: 350px 1fr;
		}
		
		.request-list {
			max-height: 75vh;
		}
	}
	
	@media (min-width: 1024px) {
		.dashboard-layout {
			grid-template-columns: 400px 1fr;
		}
	}
</style>
