// Server-side data loading for the home page
// Fetches menu data once and passes to components, eliminating client-side fetches

import type { PageLoad } from './$types';
import { getAllFlavors, getAllConcoctions } from '$lib/services/menu';

export const load: PageLoad = async () => {
	// Fetch menu data in parallel
	const [flavors, concoctions] = await Promise.all([getAllFlavors(), getAllConcoctions()]);

	// Filter to active items only
	const activeFlavors = flavors.filter((f) => f.active);
	const activeConcoctions = concoctions.filter((c) => c.active);

	return {
		flavors: activeFlavors,
		concoctions: activeConcoctions
	};
};
