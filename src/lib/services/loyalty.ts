// Loyalty program service - handles all Supabase operations for the Sno Squad

import { supabase } from '$lib/supabase';
import type { LoyaltyMember, LoyaltyHistory } from '$lib/types';

// ============ QUERIES ============

export async function getAllMembers(): Promise<LoyaltyMember[]> {
	const { data, error } = await supabase
		.from('loyalty_members')
		.select('*')
		.order('last_visit', { ascending: false });
	
	if (error) throw error;
	return data || [];
}

export async function getRecentHistory(limit = 50): Promise<LoyaltyHistory[]> {
	const { data, error } = await supabase
		.from('loyalty_history')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(limit);
	
	if (error) throw error;
	return data || [];
}

export async function searchMembers(query: string): Promise<LoyaltyMember[]> {
	const digits = query.replace(/\D/g, '');
	
	if (digits.length < 3) return [];
	
	const { data, error } = await supabase
		.from('loyalty_members')
		.select('*')
		.or(`phone.ilike.%${digits}%,name.ilike.%${query}%`)
		.limit(10);
	
	if (error) throw error;
	return data || [];
}

// ============ MUTATIONS ============

export async function createMember(
	phone: string,
	name: string,
	email: string | null
): Promise<LoyaltyMember> {
	const { data, error } = await supabase
		.from('loyalty_members')
		.insert({
			phone,
			name,
			email,
			punches: 1,
			total_punches: 1,
			last_visit: new Date().toISOString()
		})
		.select()
		.single();
	
	if (error) throw error;
	
	// Record first punch in history
	await supabase.from('loyalty_history').insert({
		member_id: data.id,
		action: 'punch',
		punch_count: 1
	});
	
	return data;
}

export async function addPunches(
	memberId: string,
	currentPunches: number,
	currentTotalPunches: number,
	punchesToAdd: number
): Promise<{ newPunches: number; actualAdded: number }> {
	const newPunches = Math.min(currentPunches + punchesToAdd, 9);
	const actualAdded = newPunches - currentPunches;
	
	const { error } = await supabase
		.from('loyalty_members')
		.update({
			punches: newPunches,
			total_punches: currentTotalPunches + actualAdded,
			last_visit: new Date().toISOString()
		})
		.eq('id', memberId);
	
	if (error) throw error;
	
	// Record in history
	await supabase.from('loyalty_history').insert({
		member_id: memberId,
		action: 'punch',
		punch_count: actualAdded
	});
	
	return { newPunches, actualAdded };
}

export async function redeemReward(
	memberId: string,
	currentTotalRedeemed: number
): Promise<void> {
	const { error } = await supabase
		.from('loyalty_members')
		.update({
			punches: 0,
			total_redeemed: currentTotalRedeemed + 1,
			last_visit: new Date().toISOString()
		})
		.eq('id', memberId);
	
	if (error) throw error;
	
	// Record in history
	await supabase.from('loyalty_history').insert({
		member_id: memberId,
		action: 'redeem',
		punch_count: null
	});
}

export async function updateMemberPhone(memberId: string, phone: string): Promise<void> {
	const { error } = await supabase
		.from('loyalty_members')
		.update({ phone })
		.eq('id', memberId);
	
	if (error) throw error;
}

export async function updateMemberEmail(memberId: string, email: string | null): Promise<void> {
	const { error } = await supabase
		.from('loyalty_members')
		.update({ email })
		.eq('id', memberId);
	
	if (error) throw error;
}

export async function deleteMember(memberId: string): Promise<void> {
	const { error } = await supabase
		.from('loyalty_members')
		.delete()
		.eq('id', memberId);
	
	if (error) throw error;
}

// ============ UTILITIES ============

export function normalizePhone(phone: string): string {
	return phone.replace(/\D/g, '');
}

export function formatPhone(phone: string): string {
	const digits = normalizePhone(phone);
	if (digits.length === 10) {
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}
	return phone;
}

export function formatRelativeTime(dateStr: string): string {
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
