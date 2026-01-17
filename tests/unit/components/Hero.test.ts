import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Hero from '$lib/components/Hero.svelte';

describe('Hero component', () => {
	it('renders business name', () => {
		render(Hero);
		expect(screen.getByText("Daesy's Tropical Sno")).toBeInTheDocument();
	});

	it('renders tagline', () => {
		render(Hero);
		expect(screen.getByText(/Tropical vibes/i)).toBeInTheDocument();
	});

	it('renders CTA buttons', () => {
		render(Hero);
		expect(screen.getByRole('link', { name: /View The Menu/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Book Your Event/i })).toBeInTheDocument();
	});

	it('renders flavor and concoction counts', () => {
		render(Hero);
		expect(screen.getByText(/40\+ Flavors/i)).toBeInTheDocument();
		expect(screen.getByText(/55\+ Signature Concoctions/i)).toBeInTheDocument();
	});
});
