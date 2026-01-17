import { describe, it, expect } from 'vitest';
import { formatDate, getStatusColor } from '$lib/services/requests';

describe('requests service utilities', () => {
	describe('formatDate', () => {
		it('formats ISO date string to readable format', () => {
			const result = formatDate('2026-01-17T14:30:00.000Z');
			expect(result).toContain('2026');
			expect(result).toContain('Jan');
			expect(result).toContain('17');
		});

		it('includes time in format', () => {
			const result = formatDate('2026-06-15T09:00:00.000Z');
			expect(result).toMatch(/\d{1,2}:\d{2}/);
		});

		it('includes day of week', () => {
			// Jan 17, 2026 is a Saturday
			const result = formatDate('2026-01-17T12:00:00.000Z');
			expect(result).toContain('Sat');
		});
	});

	describe('getStatusColor', () => {
		it('returns correct class for new status', () => {
			expect(getStatusColor('new')).toBe('status-new');
		});

		it('returns correct class for contacted status', () => {
			expect(getStatusColor('contacted')).toBe('status-contacted');
		});

		it('returns correct class for confirmed status', () => {
			expect(getStatusColor('confirmed')).toBe('status-confirmed');
		});

		it('returns correct class for completed status', () => {
			expect(getStatusColor('completed')).toBe('status-completed');
		});
	});
});
