import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import FlavorList from '$lib/components/FlavorList.svelte';

// Mock Supabase
vi.mock('$lib/supabase', () => ({
	supabase: {
		from: () => ({
			select: () => ({
				eq: () => ({
					order: () => Promise.resolve({
						data: [
							{ name: 'Cherry' },
							{ name: 'Blue Raspberry' },
							{ name: 'Grape' }
						],
						error: null
					})
				})
			})
		})
	}
}));

describe('FlavorList component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders section title', () => {
		render(FlavorList);
		expect(screen.getByText('Take Your Pick')).toBeInTheDocument();
	});

	it('shows loading skeletons initially', () => {
		render(FlavorList);
		expect(document.querySelector('.skeleton-grid')).toBeInTheDocument();
	});

	it('renders flavor list after loading', async () => {
		render(FlavorList);
		
		await waitFor(() => {
			expect(screen.getByText('Cherry')).toBeInTheDocument();
		});
		
		expect(screen.getByText('Blue Raspberry')).toBeInTheDocument();
		expect(screen.getByText('Grape')).toBeInTheDocument();
	});

	it('renders flavors as list items', async () => {
		render(FlavorList);
		
		await waitFor(() => {
			const list = screen.getByRole('list');
			expect(list).toBeInTheDocument();
		});
		
		const items = screen.getAllByRole('listitem');
		expect(items.length).toBe(3);
	});
});
