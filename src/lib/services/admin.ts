// Admin service - handles Supabase operations for admin dashboard
// Uses factory pattern for dependency injection

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '$lib/supabase';

/**
 * Badge counts for the admin dashboard tabs
 */
export interface AdminBadgeCounts {
	memberCount: number;
	newRequestsCount: number;
	activeFlavorsCount: number;
	activeConcoctionsCount: number;
}

/**
 * Create an admin service instance with the given Supabase client
 *
 * @param client - Supabase client (defaults to shared instance)
 * @returns Admin service object with all methods
 *
 * @example
 * // Use default client
 * const adminService = createAdminService();
 *
 * // Use custom client (for testing)
 * const mockClient = createMockSupabaseClient();
 * const adminService = createAdminService(mockClient);
 */
export function createAdminService(client: SupabaseClient = defaultClient) {
	return {
		/**
		 * Fetch badge counts for admin dashboard tabs
		 * Uses lightweight count queries (head: true) for efficiency
		 */
		async getBadgeCounts(): Promise<AdminBadgeCounts> {
			const [membersRes, requestsRes, flavorsRes, concoctionsRes] = await Promise.all([
				client.from('loyalty_members').select('id', { count: 'exact', head: true }),
				client
					.from('catering_requests')
					.select('id', { count: 'exact', head: true })
					.eq('status', 'new'),
				client.from('flavors').select('id', { count: 'exact', head: true }).eq('active', true),
				client.from('concoctions').select('id', { count: 'exact', head: true }).eq('active', true)
			]);

			return {
				memberCount: membersRes.count ?? 0,
				newRequestsCount: requestsRes.count ?? 0,
				activeFlavorsCount: flavorsRes.count ?? 0,
				activeConcoctionsCount: concoctionsRes.count ?? 0
			};
		}
	};
}

// Default service instance for convenience
const adminService = createAdminService();

// Export individual functions for direct use
export const getBadgeCounts = adminService.getBadgeCounts;
