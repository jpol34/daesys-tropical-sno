// Client-side rate limiting utility
// Prevents abuse of forms and APIs by tracking submission attempts

type RateLimitEntry = {
	attempts: number[];
	blocked: boolean;
	blockedUntil: number | null;
};

// In-memory store for rate limit tracking
// Note: This resets on page refresh - for persistent limiting, use localStorage
const rateLimitStore = new Map<string, RateLimitEntry>();

export type RateLimitConfig = {
	/** Maximum number of attempts allowed in the time window */
	maxAttempts: number;
	/** Time window in milliseconds */
	windowMs: number;
	/** How long to block after exceeding limit (ms) */
	blockDurationMs: number;
};

export type RateLimitResult = {
	/** Whether the action is allowed */
	allowed: boolean;
	/** Remaining attempts in current window */
	remaining: number;
	/** Milliseconds until the limit resets (if blocked) */
	retryAfterMs: number | null;
	/** Human-readable message */
	message: string;
};

const DEFAULT_CONFIG: RateLimitConfig = {
	maxAttempts: 3,
	windowMs: 60_000, // 1 minute
	blockDurationMs: 300_000 // 5 minutes
};

/**
 * Check if an action is rate limited
 *
 * @param key - Unique identifier for the rate limit (e.g., 'catering-form', 'login')
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 *
 * @example
 * const result = checkRateLimit('catering-form');
 * if (!result.allowed) {
 *   showError(result.message);
 *   return;
 * }
 */
export function checkRateLimit(
	key: string,
	config: Partial<RateLimitConfig> = {}
): RateLimitResult {
	const { maxAttempts, windowMs, blockDurationMs } = {
		...DEFAULT_CONFIG,
		...config
	};

	const now = Date.now();
	let entry = rateLimitStore.get(key);

	// Initialize entry if it doesn't exist
	if (!entry) {
		entry = { attempts: [], blocked: false, blockedUntil: null };
		rateLimitStore.set(key, entry);
	}

	// Check if currently blocked
	if (entry.blocked && entry.blockedUntil) {
		if (now < entry.blockedUntil) {
			const retryAfterMs = entry.blockedUntil - now;
			return {
				allowed: false,
				remaining: 0,
				retryAfterMs,
				message: `Too many attempts. Please try again in ${formatDuration(retryAfterMs)}.`
			};
		}
		// Block period expired - reset
		entry.blocked = false;
		entry.blockedUntil = null;
		entry.attempts = [];
	}

	// Clean up old attempts outside the window
	entry.attempts = entry.attempts.filter((time) => now - time < windowMs);

	// Check if limit exceeded
	if (entry.attempts.length >= maxAttempts) {
		entry.blocked = true;
		entry.blockedUntil = now + blockDurationMs;
		return {
			allowed: false,
			remaining: 0,
			retryAfterMs: blockDurationMs,
			message: `Too many attempts. Please try again in ${formatDuration(blockDurationMs)}.`
		};
	}

	// Record this attempt
	entry.attempts.push(now);
	const remaining = maxAttempts - entry.attempts.length;

	return {
		allowed: true,
		remaining,
		retryAfterMs: null,
		message: remaining <= 1 ? `${remaining} attempt remaining` : ''
	};
}

/**
 * Reset rate limit for a specific key
 * Useful after successful actions or manual reset
 */
export function resetRateLimit(key: string): void {
	rateLimitStore.delete(key);
}

/**
 * Clear all rate limits
 * Useful for testing or admin functions
 */
export function clearAllRateLimits(): void {
	rateLimitStore.clear();
}

/**
 * Get current status without recording an attempt
 */
export function getRateLimitStatus(
	key: string,
	config: Partial<RateLimitConfig> = {}
): Omit<RateLimitResult, 'message'> & { attemptsInWindow: number } {
	const { maxAttempts, windowMs } = { ...DEFAULT_CONFIG, ...config };
	const now = Date.now();
	const entry = rateLimitStore.get(key);

	if (!entry) {
		return {
			allowed: true,
			remaining: maxAttempts,
			retryAfterMs: null,
			attemptsInWindow: 0
		};
	}

	if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterMs: entry.blockedUntil - now,
			attemptsInWindow: entry.attempts.length
		};
	}

	const recentAttempts = entry.attempts.filter((time) => now - time < windowMs);
	return {
		allowed: recentAttempts.length < maxAttempts,
		remaining: maxAttempts - recentAttempts.length,
		retryAfterMs: null,
		attemptsInWindow: recentAttempts.length
	};
}

/**
 * Format milliseconds into human-readable duration
 */
function formatDuration(ms: number): string {
	const seconds = Math.ceil(ms / 1000);
	if (seconds < 60) {
		return `${seconds} second${seconds !== 1 ? 's' : ''}`;
	}
	const minutes = Math.ceil(seconds / 60);
	return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
