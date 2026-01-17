// Loyalty program service - handles all Supabase operations for the Sno Squad
// Uses factory pattern for dependency injection

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '$lib/supabase';
import { safeQuery, safeQueryArray, safeMutation } from './base';
import type { LoyaltyMember, LoyaltyHistory } from '$lib/types';

/**
 * Create a loyalty service instance with the given Supabase client
 *
 * @param client - Supabase client (defaults to shared instance)
 * @returns Loyalty service object with all methods
 *
 * @example
 * // Use default client
 * const loyaltyService = createLoyaltyService();
 *
 * // Use custom client (for testing)
 * const mockClient = createMockSupabaseClient();
 * const loyaltyService = createLoyaltyService(mockClient);
 */
export function createLoyaltyService(client: SupabaseClient = defaultClient) {
	return {
		// ============ QUERIES ============

		async getAllMembers(): Promise<LoyaltyMember[]> {
			return safeQueryArray(() =>
				client.from('loyalty_members').select('*').order('last_visit', { ascending: false })
			);
		},

		async getRecentHistory(limit = 50): Promise<LoyaltyHistory[]> {
			return safeQueryArray(() =>
				client
					.from('loyalty_history')
					.select('*')
					.order('created_at', { ascending: false })
					.limit(limit)
			);
		},

		async searchMembers(query: string): Promise<LoyaltyMember[]> {
			const digits = query.replace(/\D/g, '');

			if (digits.length < 3) return [];

			return safeQueryArray(() =>
				client
					.from('loyalty_members')
					.select('*')
					.or(`phone.ilike.%${digits}%,name.ilike.%${query}%`)
					.limit(10)
			);
		},

		// ============ MUTATIONS ============

		async createMember(phone: string, name: string, email: string | null): Promise<LoyaltyMember> {
			const member = await safeQuery<LoyaltyMember>(() =>
				client
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
					.single()
			);

			// Record first punch in history (using same client for consistency)
			await safeMutation(() =>
				client.from('loyalty_history').insert({
					member_id: member.id,
					action: 'punch',
					punch_count: 1
				})
			);

			return member;
		},

		async addPunches(
			memberId: string,
			currentPunches: number,
			currentTotalPunches: number,
			punchesToAdd: number
		): Promise<{ newPunches: number; actualAdded: number }> {
			const newPunches = Math.min(currentPunches + punchesToAdd, 9);
			const actualAdded = newPunches - currentPunches;

			await safeMutation(() =>
				client
					.from('loyalty_members')
					.update({
						punches: newPunches,
						total_punches: currentTotalPunches + actualAdded,
						last_visit: new Date().toISOString()
					})
					.eq('id', memberId)
			);

			// Record in history
			await safeMutation(() =>
				client.from('loyalty_history').insert({
					member_id: memberId,
					action: 'punch',
					punch_count: actualAdded
				})
			);

			return { newPunches, actualAdded };
		},

		async redeemReward(memberId: string, currentTotalRedeemed: number): Promise<void> {
			await safeMutation(() =>
				client
					.from('loyalty_members')
					.update({
						punches: 0,
						total_redeemed: currentTotalRedeemed + 1,
						last_visit: new Date().toISOString()
					})
					.eq('id', memberId)
			);

			// Record in history
			await safeMutation(() =>
				client.from('loyalty_history').insert({
					member_id: memberId,
					action: 'redeem',
					punch_count: null
				})
			);
		},

		async updateMemberPhone(memberId: string, phone: string): Promise<void> {
			await safeMutation(() => client.from('loyalty_members').update({ phone }).eq('id', memberId));
		},

		async updateMemberEmail(memberId: string, email: string | null): Promise<void> {
			await safeMutation(() => client.from('loyalty_members').update({ email }).eq('id', memberId));
		},

		async deleteMember(memberId: string): Promise<void> {
			await safeMutation(() => client.from('loyalty_members').delete().eq('id', memberId));
		}
	};
}

// Default service instance for convenience
const loyaltyService = createLoyaltyService();

// Export individual functions for backward compatibility
export const getAllMembers = loyaltyService.getAllMembers;
export const getRecentHistory = loyaltyService.getRecentHistory;
export const searchMembers = loyaltyService.searchMembers;
export const createMember = loyaltyService.createMember;
export const addPunches = loyaltyService.addPunches;
export const redeemReward = loyaltyService.redeemReward;
export const updateMemberPhone = loyaltyService.updateMemberPhone;
export const updateMemberEmail = loyaltyService.updateMemberEmail;
export const deleteMember = loyaltyService.deleteMember;

// ============ UTILITY FUNCTIONS ============
// These have no DB dependency and remain as standalone exports

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
