import { describe, it, expect } from 'vitest';
import { normalizePhone, formatPhone, formatRelativeTime } from './loyalty';

describe('loyalty service utilities', () => {
	describe('normalizePhone', () => {
		it('strips non-digit characters', () => {
			expect(normalizePhone('(817) 401-6310')).toBe('8174016310');
			expect(normalizePhone('817-401-6310')).toBe('8174016310');
			expect(normalizePhone('817.401.6310')).toBe('8174016310');
			expect(normalizePhone('8174016310')).toBe('8174016310');
		});

		it('handles empty string', () => {
			expect(normalizePhone('')).toBe('');
		});
	});

	describe('formatPhone', () => {
		it('formats 10-digit phone numbers', () => {
			expect(formatPhone('8174016310')).toBe('(817) 401-6310');
		});

		it('returns input for non-10-digit strings', () => {
			expect(formatPhone('123')).toBe('123');
			expect(formatPhone('12345678901')).toBe('12345678901');
		});

		it('handles already formatted numbers', () => {
			expect(formatPhone('(817) 401-6310')).toBe('(817) 401-6310');
		});
	});

	describe('formatRelativeTime', () => {
		it('returns "just now" for recent timestamps', () => {
			const now = new Date().toISOString();
			expect(formatRelativeTime(now)).toBe('just now');
		});

		it('returns minutes ago for timestamps under an hour', () => {
			const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
			expect(formatRelativeTime(thirtyMinsAgo)).toBe('30 min ago');
		});

		it('returns hours ago for timestamps under a day', () => {
			const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
			expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
		});

		it('returns days ago for timestamps under a week', () => {
			const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
			expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');
		});
	});
});
