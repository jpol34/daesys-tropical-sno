<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { CateringRequest } from '$lib/types';
	
	interface Props {
		isUpdating: boolean;
		onUpdatingChange: (value: boolean) => void;
	}
	
	let { isUpdating, onUpdatingChange }: Props = $props();
	
	// Requests state
	let requests = $state<CateringRequest[]>([]);
	let selectedRequest = $state<CateringRequest | null>(null);
	let filterStatus = $state('all');
	let adminNotesValue = $state('');
	let notesSaved = $state(false);
	
	// Load catering requests
	export async function loadRequests() {
		const { data, error } = await supabase
			.from('catering_requests')
			.select('*')
			.order('created_at', { ascending: false });
		
		if (!error) requests = data || [];
	}
	
	async function updateStatus(id: string, newStatus: string) {
		onUpdatingChange(true);
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
		onUpdatingChange(false);
	}
	
	async function saveNotes() {
		if (!selectedRequest) return;
		onUpdatingChange(true);
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
		onUpdatingChange(false);
	}
	
	async function deleteRequest() {
		if (!selectedRequest) return;
		const confirmed = confirm(`Delete request from "${selectedRequest.name}"?`);
		if (!confirmed) return;
		
		onUpdatingChange(true);
		const { error } = await supabase
			.from('catering_requests')
			.delete()
			.eq('id', selectedRequest.id);
		
		if (!error) {
			requests = requests.filter(r => r.id !== selectedRequest!.id);
			selectedRequest = null;
		}
		onUpdatingChange(false);
	}
	
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
	
	// Get new requests count for badge
	export function getNewCount() {
		return requests.filter(r => r.status === 'new').length;
	}
</script>

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

<style>
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
	
	@keyframes spin {
		to { transform: rotate(360deg); }
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
	
	@media (min-width: 768px) {
		.dashboard-layout { grid-template-columns: 350px 1fr; }
		.request-list { max-height: 75vh; }
	}
	
	@media (min-width: 1024px) {
		.dashboard-layout { grid-template-columns: 400px 1fr; }
	}
</style>
