// Menu service - handles Supabase operations for flavors and concoctions
// Uses factory pattern for dependency injection

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '$lib/supabase';
import { safeQuery, safeQueryArray, safeMutation } from './base';
import type { Flavor, Concoction, SiteContent } from '$lib/types';

/**
 * Create a menu service instance with the given Supabase client
 *
 * @param client - Supabase client (defaults to shared instance)
 * @returns Menu service object with all methods
 *
 * @example
 * // Use default client
 * const menuService = createMenuService();
 *
 * // Use custom client (for testing)
 * const mockClient = createMockSupabaseClient();
 * const menuService = createMenuService(mockClient);
 */
export function createMenuService(client: SupabaseClient = defaultClient) {
	return {
		// ============ FLAVORS ============

		async getAllFlavors(): Promise<Flavor[]> {
			return safeQueryArray(() =>
				client.from('flavors').select('*').order('sort_order', { ascending: true })
			);
		},

		async addFlavor(name: string, sortOrder: number): Promise<Flavor> {
			return safeQuery(() =>
				client.from('flavors').insert({ name, sort_order: sortOrder }).select().single()
			);
		},

		async updateFlavor(flavor: Flavor): Promise<void> {
			await safeMutation(() =>
				client
					.from('flavors')
					.update({ name: flavor.name, active: flavor.active })
					.eq('id', flavor.id)
			);
		},

		async deleteFlavor(flavorId: string): Promise<void> {
			await safeMutation(() => client.from('flavors').delete().eq('id', flavorId));
		},

		// ============ CONCOCTIONS ============

		async getAllConcoctions(): Promise<Concoction[]> {
			return safeQueryArray(() =>
				client.from('concoctions').select('*').order('sort_order', { ascending: true })
			);
		},

		async addConcoction(
			name: string,
			ingredients: string[],
			sortOrder: number
		): Promise<Concoction> {
			return safeQuery(() =>
				client
					.from('concoctions')
					.insert({ name, ingredients, sort_order: sortOrder })
					.select()
					.single()
			);
		},

		async updateConcoction(concoction: Concoction): Promise<void> {
			await safeMutation(() =>
				client
					.from('concoctions')
					.update({
						name: concoction.name,
						ingredients: concoction.ingredients,
						active: concoction.active
					})
					.eq('id', concoction.id)
			);
		},

		async deleteConcoction(concoctionId: string): Promise<void> {
			await safeMutation(() => client.from('concoctions').delete().eq('id', concoctionId));
		},

		// ============ SITE CONTENT ============

		async getAllSiteContent(): Promise<SiteContent[]> {
			return safeQueryArray(() => client.from('site_content').select('*').order('key'));
		},

		async updateSiteContent(contentId: string, value: string): Promise<void> {
			await safeMutation(() => client.from('site_content').update({ value }).eq('id', contentId));
		}
	};
}

// Default service instance for convenience
const menuService = createMenuService();

// Export individual functions for backward compatibility
export const getAllFlavors = menuService.getAllFlavors;
export const addFlavor = menuService.addFlavor;
export const updateFlavor = menuService.updateFlavor;
export const deleteFlavor = menuService.deleteFlavor;
export const getAllConcoctions = menuService.getAllConcoctions;
export const addConcoction = menuService.addConcoction;
export const updateConcoction = menuService.updateConcoction;
export const deleteConcoction = menuService.deleteConcoction;
export const getAllSiteContent = menuService.getAllSiteContent;
export const updateSiteContent = menuService.updateSiteContent;

// Utility function (no DB dependency)
export function getContentLabel(key: string): string {
	const labels: Record<string, string> = {
		specials_message: 'Specials Message',
		popsicle_wednesday_cta: 'Popsicle Wednesday CTA',
		popsicle_wednesday_details: 'Popsicle Wednesday Details'
	};
	return labels[key] || key;
}
