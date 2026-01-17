// Catering requests service - handles all Supabase operations for event requests

import { supabase } from '$lib/supabase';
import type { CateringRequest, RequestStatus } from '$lib/types';

export async function getAllRequests(): Promise<CateringRequest[]> {
	const { data, error } = await supabase
		.from('catering_requests')
		.select('*')
		.order('created_at', { ascending: false });
	
	if (error) throw error;
	return data || [];
}

export async function updateRequestStatus(
	requestId: string,
	status: RequestStatus
): Promise<void> {
	const { error } = await supabase
		.from('catering_requests')
		.update({ status })
		.eq('id', requestId);
	
	if (error) throw error;
}

export async function updateRequestNotes(
	requestId: string,
	adminNotes: string
): Promise<void> {
	const { error } = await supabase
		.from('catering_requests')
		.update({ admin_notes: adminNotes })
		.eq('id', requestId);
	
	if (error) throw error;
}

export async function deleteRequest(requestId: string): Promise<void> {
	const { error } = await supabase
		.from('catering_requests')
		.delete()
		.eq('id', requestId);
	
	if (error) throw error;
}

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
