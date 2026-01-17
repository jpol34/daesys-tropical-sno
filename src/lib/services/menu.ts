// Menu service - handles Supabase operations for flavors and concoctions

import { supabase } from '$lib/supabase';
import type { Flavor, Concoction, SiteContent } from '$lib/types';

// ============ FLAVORS ============

export async function getAllFlavors(): Promise<Flavor[]> {
	const { data, error } = await supabase
		.from('flavors')
		.select('*')
		.order('sort_order', { ascending: true });
	
	if (error) throw error;
	return data || [];
}

export async function addFlavor(name: string, sortOrder: number): Promise<Flavor> {
	const { data, error } = await supabase
		.from('flavors')
		.insert({ name, sort_order: sortOrder })
		.select()
		.single();
	
	if (error) throw error;
	return data;
}

export async function updateFlavor(flavor: Flavor): Promise<void> {
	const { error } = await supabase
		.from('flavors')
		.update({ name: flavor.name, active: flavor.active })
		.eq('id', flavor.id);
	
	if (error) throw error;
}

export async function deleteFlavor(flavorId: string): Promise<void> {
	const { error } = await supabase
		.from('flavors')
		.delete()
		.eq('id', flavorId);
	
	if (error) throw error;
}

// ============ CONCOCTIONS ============

export async function getAllConcoctions(): Promise<Concoction[]> {
	const { data, error } = await supabase
		.from('concoctions')
		.select('*')
		.order('sort_order', { ascending: true });
	
	if (error) throw error;
	return data || [];
}

export async function addConcoction(
	name: string,
	ingredients: string[],
	sortOrder: number
): Promise<Concoction> {
	const { data, error } = await supabase
		.from('concoctions')
		.insert({ name, ingredients, sort_order: sortOrder })
		.select()
		.single();
	
	if (error) throw error;
	return data;
}

export async function updateConcoction(concoction: Concoction): Promise<void> {
	const { error } = await supabase
		.from('concoctions')
		.update({
			name: concoction.name,
			ingredients: concoction.ingredients,
			active: concoction.active
		})
		.eq('id', concoction.id);
	
	if (error) throw error;
}

export async function deleteConcoction(concoctionId: string): Promise<void> {
	const { error } = await supabase
		.from('concoctions')
		.delete()
		.eq('id', concoctionId);
	
	if (error) throw error;
}

// ============ SITE CONTENT ============

export async function getAllSiteContent(): Promise<SiteContent[]> {
	const { data, error } = await supabase
		.from('site_content')
		.select('*')
		.order('key');
	
	if (error) throw error;
	return data || [];
}

export async function updateSiteContent(contentId: string, value: string): Promise<void> {
	const { error } = await supabase
		.from('site_content')
		.update({ value })
		.eq('id', contentId);
	
	if (error) throw error;
}

export function getContentLabel(key: string): string {
	const labels: Record<string, string> = {
		specials_message: 'Specials Message',
		popsicle_wednesday_cta: 'Popsicle Wednesday CTA',
		popsicle_wednesday_details: 'Popsicle Wednesday Details'
	};
	return labels[key] || key;
}
