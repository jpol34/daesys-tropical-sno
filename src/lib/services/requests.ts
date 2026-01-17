// Catering requests service - handles all Supabase operations for event requests
// Uses factory pattern for dependency injection

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '$lib/supabase';
import { safeQueryArray, safeMutation } from './base';
import type { CateringRequest, RequestStatus } from '$lib/types';

/**
 * Create a requests service instance with the given Supabase client
 *
 * @param client - Supabase client (defaults to shared instance)
 * @returns Requests service object with all methods
 *
 * @example
 * // Use default client
 * const requestsService = createRequestsService();
 *
 * // Use custom client (for testing)
 * const mockClient = createMockSupabaseClient();
 * const requestsService = createRequestsService(mockClient);
 */
export function createRequestsService(client: SupabaseClient = defaultClient) {
	return {
		async getAllRequests(): Promise<CateringRequest[]> {
			return safeQueryArray(() =>
				client.from('catering_requests').select('*').order('created_at', { ascending: false })
			);
		},

		async updateRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
			await safeMutation(() =>
				client.from('catering_requests').update({ status }).eq('id', requestId)
			);
		},

		async updateRequestNotes(requestId: string, adminNotes: string): Promise<void> {
			await safeMutation(() =>
				client.from('catering_requests').update({ admin_notes: adminNotes }).eq('id', requestId)
			);
		},

		async deleteRequest(requestId: string): Promise<void> {
			await safeMutation(() => client.from('catering_requests').delete().eq('id', requestId));
		}
	};
}

// Default service instance for convenience
const requestsService = createRequestsService();

// Export individual functions for backward compatibility
export const getAllRequests = requestsService.getAllRequests;
export const updateRequestStatus = requestsService.updateRequestStatus;
export const updateRequestNotes = requestsService.updateRequestNotes;
export const deleteRequest = requestsService.deleteRequest;

// ============ UTILITY FUNCTIONS ============
// These have no DB dependency and remain as standalone exports

export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

export function getStatusColor(status: RequestStatus): string {
	const colors: Record<RequestStatus, string> = {
		new: 'status-new',
		contacted: 'status-contacted',
		confirmed: 'status-confirmed',
		completed: 'status-completed'
	};
	return colors[status] || '';
}
