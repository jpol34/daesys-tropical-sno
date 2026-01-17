import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	checkRateLimit,
	resetRateLimit,
	clearAllRateLimits,
	getRateLimitStatus,
	type RateLimitConfig
} from '$lib/utils/rateLimit';

describe('rateLimit utilities', () => {
	beforeEach(() => {
		// Reset all rate limits before each test
		clearAllRateLimits();
		// Use fake timers for time-dependent tests
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('checkRateLimit', () => {
		it('allows first attempt', () => {
			const result = checkRateLimit('test-key');

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(2); // 3 max - 1 used = 2 remaining
			expect(result.retryAfterMs).toBeNull();
			expect(result.message).toBe('');
		});

		it('tracks multiple attempts within window', () => {
			const result1 = checkRateLimit('test-key');
			const result2 = checkRateLimit('test-key');

			expect(result1.allowed).toBe(true);
			expect(result1.remaining).toBe(2);

			expect(result2.allowed).toBe(true);
			expect(result2.remaining).toBe(1);
			expect(result2.message).toBe('1 attempt remaining');
		});

		it('blocks after maxAttempts exceeded', () => {
			// Use all 3 default attempts
			checkRateLimit('test-key');
			checkRateLimit('test-key');
			checkRateLimit('test-key');

			// Fourth attempt should be blocked
			const result = checkRateLimit('test-key');

			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
			expect(result.retryAfterMs).toBe(300_000); // 5 minutes default
		});

		it('returns human-readable message when blocked', () => {
			// Exhaust attempts
			checkRateLimit('test-key');
			checkRateLimit('test-key');
			checkRateLimit('test-key');
			const result = checkRateLimit('test-key');

			expect(result.message).toContain('Too many attempts');
			expect(result.message).toContain('5 minutes');
		});

		it('uses default config when not provided', () => {
			// Default: maxAttempts: 3, windowMs: 60000, blockDurationMs: 300000
			const r1 = checkRateLimit('test-key');
			const r2 = checkRateLimit('test-key');
			const r3 = checkRateLimit('test-key');

			expect(r1.remaining).toBe(2);
			expect(r2.remaining).toBe(1);
			expect(r3.remaining).toBe(0);
			expect(r3.allowed).toBe(true); // 3rd attempt is still allowed
		});

		it('respects custom maxAttempts', () => {
			const config: Partial<RateLimitConfig> = { maxAttempts: 5 };

			const r1 = checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);
			const r5 = checkRateLimit('test-key', config);

			expect(r1.remaining).toBe(4);
			expect(r5.remaining).toBe(0);
			expect(r5.allowed).toBe(true);

			// 6th attempt should be blocked
			const r6 = checkRateLimit('test-key', config);
			expect(r6.allowed).toBe(false);
		});

		it('respects custom windowMs - cleans up old attempts', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 3,
				windowMs: 10_000 // 10 seconds
			};

			// Make 2 attempts (not hitting the limit yet)
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);

			// Verify we have 1 attempt remaining
			let result = checkRateLimit('test-key', config);
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(0);

			// Advance time past the window so old attempts are cleaned up
			vi.advanceTimersByTime(11_000);

			// Should have full attempts again (old attempts cleaned up)
			result = checkRateLimit('test-key', config);
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(2); // Fresh start
		});

		it('respects custom blockDurationMs', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 1,
				blockDurationMs: 5_000 // 5 seconds
			};

			// Exhaust the single attempt
			checkRateLimit('test-key', config);

			// Should be blocked
			let result = checkRateLimit('test-key', config);
			expect(result.allowed).toBe(false);
			expect(result.message).toContain('5 seconds');

			// Advance time past block duration
			vi.advanceTimersByTime(6_000);

			// Should be allowed again
			result = checkRateLimit('test-key', config);
			expect(result.allowed).toBe(true);
		});

		it('resets after blockDurationMs expires', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 2,
				blockDurationMs: 10_000
			};

			// Exhaust attempts and trigger block
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);

			// Verify blocked
			let result = checkRateLimit('test-key', config);
			expect(result.allowed).toBe(false);

			// Advance time past block
			vi.advanceTimersByTime(11_000);

			// Should be fully reset
			result = checkRateLimit('test-key', config);
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(1); // Fresh start with new attempt recorded
		});

		it('tracks different keys independently', () => {
			checkRateLimit('key-1');
			checkRateLimit('key-1');
			checkRateLimit('key-1');

			// key-1 should be at limit
			const r1 = checkRateLimit('key-1');
			expect(r1.allowed).toBe(false);

			// key-2 should be fresh
			const r2 = checkRateLimit('key-2');
			expect(r2.allowed).toBe(true);
			expect(r2.remaining).toBe(2);
		});

		it('shows remaining warning on last allowed attempt', () => {
			checkRateLimit('test-key');
			const result = checkRateLimit('test-key');

			expect(result.message).toBe('1 attempt remaining');
		});

		it('formats seconds in block message', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 1,
				blockDurationMs: 30_000 // 30 seconds
			};

			checkRateLimit('test-key', config);
			const result = checkRateLimit('test-key', config);

			expect(result.message).toContain('30 seconds');
		});

		it('formats single second correctly', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 1,
				blockDurationMs: 1_000 // 1 second
			};

			checkRateLimit('test-key', config);
			const result = checkRateLimit('test-key', config);

			expect(result.message).toContain('1 second');
			expect(result.message).not.toContain('1 seconds');
		});

		it('formats single minute correctly', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 1,
				blockDurationMs: 60_000 // 1 minute
			};

			checkRateLimit('test-key', config);
			const result = checkRateLimit('test-key', config);

			expect(result.message).toContain('1 minute');
			expect(result.message).not.toContain('1 minutes');
		});

		it('shows decreasing retryAfterMs while blocked', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 1,
				blockDurationMs: 10_000
			};

			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config); // Triggers block

			// Check immediately
			let result = checkRateLimit('test-key', config);
			expect(result.retryAfterMs).toBe(10_000);

			// Advance 3 seconds
			vi.advanceTimersByTime(3_000);
			result = checkRateLimit('test-key', config);
			expect(result.retryAfterMs).toBe(7_000);

			// Advance 5 more seconds
			vi.advanceTimersByTime(5_000);
			result = checkRateLimit('test-key', config);
			expect(result.retryAfterMs).toBe(2_000);
		});
	});

	describe('resetRateLimit', () => {
		it('clears rate limit for specific key', () => {
			// Exhaust attempts
			checkRateLimit('test-key');
			checkRateLimit('test-key');
			checkRateLimit('test-key');

			// Verify blocked
			let result = checkRateLimit('test-key');
			expect(result.allowed).toBe(false);

			// Reset
			resetRateLimit('test-key');

			// Should be allowed again
			result = checkRateLimit('test-key');
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(2);
		});

		it('does not affect other keys', () => {
			// Use up attempts on both keys
			checkRateLimit('key-1');
			checkRateLimit('key-1');
			checkRateLimit('key-2');
			checkRateLimit('key-2');

			// Reset only key-1
			resetRateLimit('key-1');

			// key-1 should be fresh
			const r1 = checkRateLimit('key-1');
			expect(r1.remaining).toBe(2);

			// key-2 should still have its attempts tracked
			const r2 = checkRateLimit('key-2');
			expect(r2.remaining).toBe(0);
		});

		it('handles resetting non-existent key', () => {
			// Should not throw
			expect(() => resetRateLimit('non-existent-key')).not.toThrow();
		});
	});

	describe('clearAllRateLimits', () => {
		it('clears all rate limits', () => {
			// Create multiple rate limits
			checkRateLimit('key-1');
			checkRateLimit('key-1');
			checkRateLimit('key-2');
			checkRateLimit('key-2');
			checkRateLimit('key-3');

			// Clear all
			clearAllRateLimits();

			// All keys should be fresh
			const r1 = checkRateLimit('key-1');
			const r2 = checkRateLimit('key-2');
			const r3 = checkRateLimit('key-3');

			expect(r1.remaining).toBe(2);
			expect(r2.remaining).toBe(2);
			expect(r3.remaining).toBe(2);
		});

		it('clears blocked state', () => {
			// Trigger block
			checkRateLimit('test-key');
			checkRateLimit('test-key');
			checkRateLimit('test-key');
			checkRateLimit('test-key');

			// Verify blocked
			let result = checkRateLimit('test-key');
			expect(result.allowed).toBe(false);

			// Clear all
			clearAllRateLimits();

			// Should be unblocked
			result = checkRateLimit('test-key');
			expect(result.allowed).toBe(true);
		});
	});

	describe('getRateLimitStatus', () => {
		it('returns status without recording attempt', () => {
			// Record one attempt
			checkRateLimit('test-key');

			// Check status multiple times
			const status1 = getRateLimitStatus('test-key');
			const status2 = getRateLimitStatus('test-key');
			const status3 = getRateLimitStatus('test-key');

			// All should show same remaining (2)
			expect(status1.remaining).toBe(2);
			expect(status2.remaining).toBe(2);
			expect(status3.remaining).toBe(2);
			expect(status1.attemptsInWindow).toBe(1);
		});

		it('shows correct remaining count', () => {
			const config: Partial<RateLimitConfig> = { maxAttempts: 5 };

			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);

			const status = getRateLimitStatus('test-key', config);

			expect(status.remaining).toBe(3);
			expect(status.attemptsInWindow).toBe(2);
			expect(status.allowed).toBe(true);
		});

		it('shows blocked status when applicable', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 2,
				blockDurationMs: 10_000
			};

			// Trigger block
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);

			const status = getRateLimitStatus('test-key', config);

			expect(status.allowed).toBe(false);
			expect(status.remaining).toBe(0);
			expect(status.retryAfterMs).toBe(10_000);
		});

		it('returns default values for non-existent key', () => {
			const status = getRateLimitStatus('non-existent-key');

			expect(status.allowed).toBe(true);
			expect(status.remaining).toBe(3); // Default maxAttempts
			expect(status.retryAfterMs).toBeNull();
			expect(status.attemptsInWindow).toBe(0);
		});

		it('respects custom config', () => {
			const config: Partial<RateLimitConfig> = { maxAttempts: 10 };

			const status = getRateLimitStatus('test-key', config);

			expect(status.remaining).toBe(10);
		});

		it('filters out old attempts outside window', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 5,
				windowMs: 10_000
			};

			// Make some attempts
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);

			// Advance time past window
			vi.advanceTimersByTime(15_000);

			// Status should show no recent attempts
			const status = getRateLimitStatus('test-key', config);

			expect(status.attemptsInWindow).toBe(0);
			expect(status.remaining).toBe(5);
			expect(status.allowed).toBe(true);
		});

		it('shows decreasing retryAfterMs while blocked', () => {
			const config: Partial<RateLimitConfig> = {
				maxAttempts: 1,
				blockDurationMs: 20_000
			};

			// Trigger block
			checkRateLimit('test-key', config);
			checkRateLimit('test-key', config);

			// Check immediately
			let status = getRateLimitStatus('test-key', config);
			expect(status.retryAfterMs).toBe(20_000);

			// Advance 5 seconds
			vi.advanceTimersByTime(5_000);
			status = getRateLimitStatus('test-key', config);
			expect(status.retryAfterMs).toBe(15_000);
		});
	});
});
