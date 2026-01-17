import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FlavorList from '$lib/components/FlavorList.svelte';
import type { Flavor } from '$lib/types';

const mockFlavors: Flavor[] = [
	{ id: '1', name: 'Cherry', active: true, sort_order: 0 },
	{ id: '2', name: 'Blue Raspberry', active: true, sort_order: 1 },
	{ id: '3', name: 'Grape', active: true, sort_order: 2 }
];

describe('FlavorList component', () => {
	it('renders section title', () => {
		render(FlavorList, { props: { flavors: mockFlavors } });
		expect(screen.getByText('Take Your Pick')).toBeInTheDocument();
	});

	it('renders flavors as list items', () => {
		render(FlavorList, { props: { flavors: mockFlavors } });

		const list = screen.getByRole('list');
		expect(list).toBeInTheDocument();

		const items = screen.getAllByRole('listitem');
		expect(items.length).toBe(3);
	});

	it('displays flavor names', () => {
		render(FlavorList, { props: { flavors: mockFlavors } });

		expect(screen.getByText('Cherry')).toBeInTheDocument();
		expect(screen.getByText('Blue Raspberry')).toBeInTheDocument();
		expect(screen.getByText('Grape')).toBeInTheDocument();
	});

	it('renders empty list when no flavors provided', () => {
		render(FlavorList, { props: { flavors: [] } });

		const list = screen.getByRole('list');
		expect(list).toBeInTheDocument();

		const items = screen.queryAllByRole('listitem');
		expect(items.length).toBe(0);
	});
});
