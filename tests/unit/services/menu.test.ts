import { describe, it, expect } from 'vitest';
import { getContentLabel } from '$lib/services/menu';

describe('menu service utilities', () => {
	describe('getContentLabel', () => {
		it('returns label for specials_message key', () => {
			expect(getContentLabel('specials_message')).toBe('Specials Message');
		});

		it('returns label for popsicle_wednesday_cta key', () => {
			expect(getContentLabel('popsicle_wednesday_cta')).toBe('Popsicle Wednesday CTA');
		});

		it('returns label for popsicle_wednesday_details key', () => {
			expect(getContentLabel('popsicle_wednesday_details')).toBe('Popsicle Wednesday Details');
		});

		it('returns key as fallback for unknown keys', () => {
			expect(getContentLabel('unknown_key')).toBe('unknown_key');
			expect(getContentLabel('some_other_key')).toBe('some_other_key');
		});
	});
});
