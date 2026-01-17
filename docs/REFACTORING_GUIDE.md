# Daesy's Tropical Sno - Best Practices Refactoring Guide

A comprehensive guide for implementing industry-standard best practices across the codebase. This document covers all 14 identified improvements with complete code examples, file locations, and implementation details.

---

## Table of Contents

1. [Test Coverage Thresholds](#1-test-coverage-thresholds)
2. [Environment Variable Schema Validation](#2-environment-variable-schema-validation)
3. [Error Boundaries](#3-error-boundaries)
4. [Loading States](#4-loading-states)
5. [Service Layer Standardization](#5-service-layer-standardization)
6. [Rate Limiting](#6-rate-limiting)
7. [Centralized Site Configuration](#7-centralized-site-configuration)
8. [Content Security Policy Headers](#8-content-security-policy-headers)
9. [API Response Caching](#9-api-response-caching)
10. [TypeScript Strictness](#10-typescript-strictness)
11. [Dependency Injection for Testing](#11-dependency-injection-for-testing)
12. [Pre-commit Hooks](#12-pre-commit-hooks)
13. [Cross-Browser Testing](#13-cross-browser-testing)
14. [Documentation Enhancement](#14-documentation-enhancement)

---

## 1. Test Coverage Thresholds

### Problem

Current coverage thresholds are set too low (20%) which doesn't enforce meaningful test coverage.

### Solution

Update `vite.config.ts` to enforce industry-standard coverage thresholds of 70%+.

### Implementation

**File: `vite.config.ts`**

Replace the current `test.coverage` configuration:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser']
	},
	test: {
		include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov', 'json'],
			include: [
				'src/lib/services/**/*.ts',
				'src/lib/data/**/*.ts',
				'src/lib/utils/**/*.ts',
				'src/lib/actions/**/*.ts'
			],
			exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts', '**/index.ts'],
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 60,
				statements: 70
			}
		}
	}
});
```

### Verification

```bash
npm run test:coverage
```

Coverage report should now fail if thresholds aren't met.

---

## 2. Environment Variable Schema Validation

### Problem

Environment variables are only checked for existence, not validated for correct format.

### Solution

Use Zod for runtime schema validation of environment variables.

### Implementation

**Step 1: Install Zod**

```bash
npm install zod
```

**Step 2: Create environment configuration**

**File: `src/lib/config/env.ts`** (new file)

```typescript
// Environment variable validation using Zod
// This ensures all required env vars are present and correctly formatted

import { z } from 'zod';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const envSchema = z.object({
	PUBLIC_SUPABASE_URL: z
		.string({
			required_error: 'PUBLIC_SUPABASE_URL is required'
		})
		.url('PUBLIC_SUPABASE_URL must be a valid URL')
		.refine(
			(url) => url.includes('supabase.co') || url.includes('localhost'),
			'PUBLIC_SUPABASE_URL must be a Supabase URL'
		),
	PUBLIC_SUPABASE_ANON_KEY: z
		.string({
			required_error: 'PUBLIC_SUPABASE_ANON_KEY is required'
		})
		.min(20, 'PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)')
		.regex(
			/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/,
			'PUBLIC_SUPABASE_ANON_KEY must be a valid JWT'
		)
});

// Parse and validate - throws ZodError if invalid
const parsed = envSchema.safeParse({
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
});

if (!parsed.success) {
	const formatted = parsed.error.format();
	console.error('❌ Invalid environment variables:');
	console.error(JSON.stringify(formatted, null, 2));
	throw new Error('Invalid environment variables. Check console for details.');
}

export const env = parsed.data;

// Type export for use elsewhere
export type Env = z.infer<typeof envSchema>;
```

**Step 3: Update Supabase client**

**File: `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import { env } from '$lib/config/env';

export const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);

// Re-export types for backwards compatibility
export type { CateringRequest, CateringRequestInsert } from '$lib/types';
```

**Step 4: Create .env.example**

**File: `.env.example`** (new file)

```bash
# Supabase Configuration
# Get these values from your Supabase project settings > API
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Note: Never commit your actual .env file to version control
# Copy this file to .env and fill in your actual values
```

### Verification

Start the dev server - it should fail immediately if env vars are missing or malformed:

```bash
npm run dev
```

---

## 3. Error Boundaries

### Problem

No graceful error handling for runtime errors - users see raw error messages or blank screens.

### Solution

Add SvelteKit error pages at both global and admin route levels.

### Implementation

**File: `src/routes/+error.svelte`** (new file)

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { businessInfo } from '$lib/data/businessInfo';
</script>

<svelte:head>
	<title>Oops! | {businessInfo.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="error-page">
	<div class="error-container">
		<div class="error-icon" aria-hidden="true">🍧</div>

		<h1 class="error-title">
			{#if $page.status === 404}
				Page Not Found
			{:else if $page.status === 500}
				Something Went Wrong
			{:else}
				Oops!
			{/if}
		</h1>

		<p class="error-message">
			{#if $page.status === 404}
				Looks like this flavor doesn't exist! The page you're looking for has melted away.
			{:else}
				We hit a brain freeze! Don't worry, our team has been notified.
			{/if}
		</p>

		{#if $page.error?.message && $page.status !== 404}
			<details class="error-details">
				<summary>Technical Details</summary>
				<code>{$page.error.message}</code>
			</details>
		{/if}

		<div class="error-actions">
			<a href="/" class="btn btn-primary">Back to Home</a>
			<a href="/#menu" class="btn btn-secondary">View Menu</a>
		</div>

		<p class="error-contact">
			Need help? Call us at
			<a href={businessInfo.phoneHref}>{businessInfo.phone}</a>
		</p>
	</div>
</main>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-blue-dark) 100%);
	}

	.error-container {
		max-width: 500px;
		text-align: center;
		background: var(--color-white);
		padding: var(--space-2xl);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: var(--space-md);
		animation: wobble 2s ease-in-out infinite;
	}

	@keyframes wobble {
		0%,
		100% {
			transform: rotate(-5deg);
		}
		50% {
			transform: rotate(5deg);
		}
	}

	.error-title {
		font-size: clamp(1.5rem, 4vw, 2rem);
		margin-bottom: var(--space-sm);
	}

	.error-message {
		color: var(--color-gray-600);
		margin-bottom: var(--space-lg);
	}

	.error-details {
		background: var(--color-gray-100);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
		text-align: left;
	}

	.error-details summary {
		cursor: pointer;
		font-weight: 600;
		color: var(--color-gray-600);
	}

	.error-details code {
		display: block;
		margin-top: var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-red);
		word-break: break-word;
	}

	.error-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: var(--space-lg);
	}

	.error-contact {
		font-size: 0.875rem;
		color: var(--color-gray-600);
	}

	.error-contact a {
		font-weight: 600;
	}
</style>
```

**File: `src/routes/admin/+error.svelte`** (new file)

```svelte
<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Admin Error | Daesy's Tropical Sno</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="admin-error">
	<div class="error-card">
		<h1>Admin Error</h1>

		<div class="error-status">
			Error {$page.status}
		</div>

		<p class="error-message">
			{$page.error?.message || 'An unexpected error occurred'}
		</p>

		<div class="error-actions">
			<a href="/admin" class="btn btn-primary">Back to Admin</a>
			<a href="/" class="btn btn-secondary">Go to Site</a>
		</div>

		{#if $page.status === 401 || $page.status === 403}
			<p class="login-hint">
				You may need to <a href="/admin">log in again</a>.
			</p>
		{/if}
	</div>
</main>

<style>
	.admin-error {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		background: var(--color-gray-100);
	}

	.error-card {
		max-width: 400px;
		width: 100%;
		background: var(--color-white);
		padding: var(--space-xl);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		text-align: center;
	}

	.error-card h1 {
		font-family: var(--font-body);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-gray-900);
		margin-bottom: var(--space-md);
	}

	.error-status {
		display: inline-block;
		background: var(--color-red);
		color: var(--color-white);
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: var(--space-md);
	}

	.error-message {
		color: var(--color-gray-600);
		margin-bottom: var(--space-lg);
	}

	.error-actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: center;
		flex-wrap: wrap;
	}

	.login-hint {
		margin-top: var(--space-lg);
		font-size: 0.875rem;
		color: var(--color-gray-600);
	}
</style>
```

### Verification

1. Navigate to a non-existent route like `/nonexistent`
2. Should see the custom 404 page
3. Test admin error by accessing `/admin/nonexistent`

---

## 4. Loading States

### Problem

No visual feedback during route transitions, making the app feel unresponsive.

### Solution

Add a navigation progress indicator using SvelteKit's `navigating` store.

### Implementation

**File: `src/lib/components/NavigationLoader.svelte`** (new file)

```svelte
<script lang="ts">
	import { navigating } from '$app/stores';

	// Delay showing loader to avoid flash on fast navigations
	let showLoader = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if ($navigating) {
			// Only show after 150ms to avoid flash
			timeoutId = setTimeout(() => {
				showLoader = true;
			}, 150);
		} else {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			// Keep visible briefly for smooth transition
			setTimeout(() => {
				showLoader = false;
			}, 200);
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});
</script>

{#if showLoader}
	<div class="nav-loader" role="progressbar" aria-label="Loading page">
		<div class="loader-bar"></div>
	</div>
{/if}

<style>
	.nav-loader {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		z-index: 9999;
		background: rgba(255, 215, 0, 0.3);
		overflow: hidden;
	}

	.loader-bar {
		height: 100%;
		width: 30%;
		background: linear-gradient(
			90deg,
			var(--color-yellow) 0%,
			var(--color-yellow-light) 50%,
			var(--color-yellow) 100%
		);
		animation: loading 1s ease-in-out infinite;
	}

	@keyframes loading {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(400%);
		}
	}
</style>
```

**File: `src/routes/+layout.svelte`** (update)

Add the import and component at the top of the file:

```svelte
<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import NavigationLoader from '$lib/components/NavigationLoader.svelte';

	let { children } = $props();

	// ... rest of existing script
</script>

<svelte:head>
	<!-- existing head content -->
</svelte:head>

<!-- Add the loader at the top -->
<NavigationLoader />

<!-- Skip link for accessibility -->
<a href="#main-content" class="skip-link">Skip to main content</a>

{@render children()}
```

### Verification

1. Navigate between pages (e.g., home to privacy)
2. Should see a yellow progress bar at the top during navigation

---

## 5. Service Layer Standardization

### Problem

Services have inconsistent error handling patterns, making debugging and testing difficult.

### Solution

Create a base service module with standardized error handling and query utilities.

### Implementation

**File: `src/lib/services/base.ts`** (new file)

```typescript
// Base service utilities for consistent error handling and query patterns

import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Custom error class for service-layer errors
 * Provides structured error information for logging and user feedback
 */
export class ServiceError extends Error {
	public readonly code: string;
	public readonly details: unknown;
	public readonly isServiceError = true;

	constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: unknown) {
		super(message);
		this.name = 'ServiceError';
		this.code = code;
		this.details = details;

		// Maintains proper stack trace in V8 environments
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ServiceError);
		}
	}

	/**
	 * Create a ServiceError from a Supabase/Postgrest error
	 */
	static fromPostgrestError(error: PostgrestError): ServiceError {
		return new ServiceError(error.message, error.code || 'DB_ERROR', {
			hint: error.hint,
			details: error.details
		});
	}

	/**
	 * Convert to a plain object for logging
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			details: this.details
		};
	}
}

/**
 * Type guard to check if an error is a ServiceError
 */
export function isServiceError(error: unknown): error is ServiceError {
	return (
		error instanceof ServiceError ||
		(typeof error === 'object' && error !== null && 'isServiceError' in error)
	);
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = ServiceError> = { success: true; data: T } | { success: false; error: E };

/**
 * Wraps an async operation and returns a Result type
 * Useful for operations where you want to handle errors explicitly
 */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
	try {
		const data = await fn();
		return { success: true, data };
	} catch (error) {
		if (isServiceError(error)) {
			return { success: false, error };
		}
		return {
			success: false,
			error: new ServiceError(
				error instanceof Error ? error.message : 'Unknown error',
				'UNKNOWN_ERROR',
				error
			)
		};
	}
}

/**
 * Type for Supabase query response
 */
type SupabaseQueryResponse<T> = {
	data: T | null;
	error: PostgrestError | null;
};

/**
 * Executes a Supabase query and handles errors consistently
 * Throws ServiceError on failure, returns data on success
 *
 * @example
 * const flavors = await safeQuery(() =>
 *   supabase.from('flavors').select('*')
 * );
 */
export async function safeQuery<T>(queryFn: () => Promise<SupabaseQueryResponse<T>>): Promise<T> {
	const { data, error } = await queryFn();

	if (error) {
		throw ServiceError.fromPostgrestError(error);
	}

	if (data === null) {
		throw new ServiceError('Query returned no data', 'NO_DATA');
	}

	return data;
}

/**
 * Executes a Supabase mutation (insert/update/delete) and handles errors
 * Returns void on success, throws ServiceError on failure
 *
 * @example
 * await safeMutation(() =>
 *   supabase.from('flavors').delete().eq('id', flavorId)
 * );
 */
export async function safeMutation(
	mutationFn: () => Promise<{ error: PostgrestError | null }>
): Promise<void> {
	const { error } = await mutationFn();

	if (error) {
		throw ServiceError.fromPostgrestError(error);
	}
}

/**
 * Logs service errors in a consistent format
 */
export function logServiceError(context: string, error: unknown): void {
	if (isServiceError(error)) {
		console.error(`[${context}] ServiceError:`, error.toJSON());
	} else if (error instanceof Error) {
		console.error(`[${context}] Error:`, {
			name: error.name,
			message: error.message,
			stack: error.stack
		});
	} else {
		console.error(`[${context}] Unknown error:`, error);
	}
}
```

**File: `src/lib/services/index.ts`** (update)

```typescript
// Service layer exports
export * from './base';
export * from './loyalty';
export * from './requests';
export * from './menu';
```

### Usage Example

Update services to use these utilities. Example for a query:

```typescript
import { safeQuery, safeMutation, ServiceError } from './base';

export async function getAllFlavors(): Promise<Flavor[]> {
	return safeQuery(() =>
		supabase.from('flavors').select('*').order('sort_order', { ascending: true })
	);
}
```

### Verification

1. Import and use `safeQuery` in one service
2. Test with network disconnected - should get structured ServiceError

---

## 6. Rate Limiting

### Problem

The catering form has no protection against rapid repeated submissions (beyond honeypot).

### Solution

Add client-side rate limiting utility with configurable time windows.

### Implementation

**File: `src/lib/utils/rateLimit.ts`** (new file)

```typescript
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
```

**File: `src/lib/components/CateringForm.svelte`** (update)

Add rate limiting to the form submission. In the `<script>` section:

```typescript
import { checkRateLimit, resetRateLimit } from '$lib/utils/rateLimit';

// In handleSubmit, before validation:
async function handleSubmit(e: Event) {
	e.preventDefault();

	// Honeypot check
	if (honeypot) {
		isSubmitted = true;
		return;
	}

	// Rate limit check
	const rateLimitResult = checkRateLimit('catering-form', {
		maxAttempts: 3,
		windowMs: 60_000, // 1 minute window
		blockDurationMs: 300_000 // 5 minute block
	});

	if (!rateLimitResult.allowed) {
		submitError = rateLimitResult.message;
		return;
	}

	// ... rest of existing validation and submission logic

	// On successful submission, reset the rate limit
	if (!error) {
		resetRateLimit('catering-form');
		isSubmitted = true;
	}
}
```

### Verification

1. Submit the catering form 3 times rapidly
2. Fourth attempt should show rate limit error
3. Wait for timeout or refresh page to reset

---

## 7. Centralized Site Configuration

### Problem

Site URL and metadata are hardcoded in multiple files, making updates error-prone.

### Solution

Create a centralized configuration file for all site-wide constants.

### Implementation

**File: `src/lib/config/site.ts`** (new file)

```typescript
// Centralized site configuration
// Single source of truth for site-wide constants

export const siteConfig = {
	// Core site info
	url: 'https://daesyssno.com',
	name: "Daesy's Tropical Sno",
	shortName: "Daesy's Sno",
	tagline: 'Tropical vibes & icy delights in Arlington, TX',

	// SEO
	description:
		"Daesy's Tropical Sno - 40+ flavors and 55+ signature concoctions. Shaved ice, sno cones, and catering for events in Arlington, Texas. Open 1-8pm Tue-Sun.",
	keywords: 'sno cones, shaved ice, Arlington TX, tropical sno, catering, party, events',

	// Social/OG
	ogImage: '/og-image.png',
	ogImageAlt: "Daesy's Tropical Sno - Tropical vibes and icy delights in Arlington, TX",
	ogImageWidth: 1200,
	ogImageHeight: 630,

	// Location (for geo meta tags)
	geo: {
		region: 'US-TX',
		placename: 'Arlington, Texas',
		latitude: 32.735,
		longitude: -97.155
	},

	// Social profiles
	social: {
		instagram: 'https://www.instagram.com/daesystropicalsno',
		facebook: 'https://www.facebook.com/share/1BpnqGxn1a/'
	}
} as const;

// Type export for use in components
export type SiteConfig = typeof siteConfig;

// Helper to build full URLs
export function buildUrl(path: string): string {
	const cleanPath = path.startsWith('/') ? path : `/${path}`;
	return `${siteConfig.url}${cleanPath}`;
}

// Helper for canonical URLs
export function getCanonicalUrl(pathname: string): string {
	// Remove trailing slashes except for root
	const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
	return buildUrl(cleanPath);
}
```

**File: `src/routes/+layout.svelte`** (update)

Replace hardcoded values with imports from config:

```svelte
<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import NavigationLoader from '$lib/components/NavigationLoader.svelte';
	import { siteConfig, getCanonicalUrl, buildUrl } from '$lib/config/site';

	let { children } = $props();

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FoodEstablishment',
		name: siteConfig.name,
		url: siteConfig.url,
		image: buildUrl(siteConfig.ogImage)
		// ... rest of JSON-LD using siteConfig values
	});
</script>

<svelte:head>
	<title>{siteConfig.name} | Arlington, TX</title>
	<meta name="description" content={siteConfig.description} />
	<meta name="keywords" content={siteConfig.keywords} />

	<!-- Canonical URL -->
	<link rel="canonical" href={getCanonicalUrl($page.url.pathname)} />

	<!-- Open Graph -->
	<meta property="og:title" content="{siteConfig.name} | Arlington, TX" />
	<meta property="og:description" content={siteConfig.description} />
	<meta property="og:url" content={getCanonicalUrl($page.url.pathname)} />
	<meta property="og:image" content={buildUrl(siteConfig.ogImage)} />
	<!-- etc -->
</svelte:head>
```

**File: `src/routes/sitemap.xml/+server.ts`** (update)

```typescript
import type { RequestHandler } from './$types';
import { siteConfig } from '$lib/config/site';

export const GET: RequestHandler = async () => {
	const pages = [
		{ url: '/', priority: '1.0', changefreq: 'weekly', lastmod: '2026-01-17' },
		{ url: '/privacy', priority: '0.3', changefreq: 'yearly', lastmod: '2026-01-17' }
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
	.map(
		(page) => `  <url>
    <loc>${siteConfig.url}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
```

### Verification

1. Search codebase for hardcoded `daesyssno.com` - should only exist in config
2. Build and verify sitemap still works: `curl http://localhost:5173/sitemap.xml`

---

## 8. Content Security Policy Headers

### Problem

No Content Security Policy configured, leaving the site vulnerable to XSS attacks.

### Solution

Add comprehensive security headers including CSP to `vercel.json`.

### Implementation

**File: `vercel.json`** (update)

```json
{
	"$schema": "https://openapi.vercel.sh/vercel.json",
	"framework": "sveltekit",
	"regions": ["iad1"],
	"headers": [
		{
			"source": "/fonts/(.*)",
			"headers": [
				{
					"key": "Cache-Control",
					"value": "public, max-age=31536000, immutable"
				}
			]
		},
		{
			"source": "/(.*)",
			"headers": [
				{
					"key": "X-Content-Type-Options",
					"value": "nosniff"
				},
				{
					"key": "X-Frame-Options",
					"value": "DENY"
				},
				{
					"key": "X-XSS-Protection",
					"value": "1; mode=block"
				},
				{
					"key": "Referrer-Policy",
					"value": "strict-origin-when-cross-origin"
				},
				{
					"key": "Permissions-Policy",
					"value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
				},
				{
					"key": "Content-Security-Policy",
					"value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://www.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
				}
			]
		}
	]
}
```

### CSP Directive Explanation

| Directive         | Value                                         | Reason                                           |
| ----------------- | --------------------------------------------- | ------------------------------------------------ |
| `default-src`     | `'self'`                                      | Only allow resources from same origin by default |
| `script-src`      | `'self' 'unsafe-inline'`                      | Allow own scripts + inline (needed for Svelte)   |
| `style-src`       | `'self' 'unsafe-inline' fonts.googleapis.com` | Own styles + inline + Google Fonts               |
| `font-src`        | `'self' fonts.gstatic.com`                    | Own fonts + Google Fonts CDN                     |
| `img-src`         | `'self' data: https:`                         | Own images + data URIs + any HTTPS               |
| `connect-src`     | `'self' *.supabase.co wss://*.supabase.co`    | API calls to Supabase                            |
| `frame-src`       | `'self' google.com`                           | Allow Google Maps embed                          |
| `frame-ancestors` | `'none'`                                      | Prevent clickjacking                             |

### Verification

1. Deploy to Vercel preview
2. Open DevTools > Network > check response headers
3. Test that site still works (no CSP violations in console)

---

## 9. API Response Caching

### Problem

Menu data (flavors, concoctions) is fetched client-side on every page load with no caching.

### Solution

Use SvelteKit's server-side `load` functions with proper cache headers.

### Implementation

**File: `src/routes/+page.ts`** (new file)

```typescript
// Server-side data loading with caching for the home page

import type { PageLoad } from './$types';
import { getAllFlavors, getAllConcoctions, getAllSiteContent } from '$lib/services/menu';

export const load: PageLoad = async ({ fetch, setHeaders }) => {
	// Fetch menu data in parallel
	const [flavors, concoctions, siteContent] = await Promise.all([
		getAllFlavors(),
		getAllConcoctions(),
		getAllSiteContent()
	]);

	// Filter to active items only
	const activeFlavors = flavors.filter((f) => f.active);
	const activeConcoctions = concoctions.filter((c) => c.active);

	// Set cache headers
	// - public: can be cached by CDN
	// - max-age=300: fresh for 5 minutes
	// - stale-while-revalidate=3600: serve stale for 1 hour while revalidating
	setHeaders({
		'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
	});

	return {
		flavors: activeFlavors,
		concoctions: activeConcoctions,
		siteContent
	};
};
```

**File: `src/routes/+page.svelte`** (update)

Update to receive data from load function:

```svelte
<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import PricingSection from '$lib/components/PricingSection.svelte';
	import FlavorList from '$lib/components/FlavorList.svelte';
	import ConcoctionList from '$lib/components/ConcoctionList.svelte';
	import CateringForm from '$lib/components/CateringForm.svelte';
	import ContactSection from '$lib/components/ContactSection.svelte';
	import StickyCallButton from '$lib/components/StickyCallButton.svelte';
	import { inview } from '$lib/actions/inview';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import SpecialsSection from '$lib/components/SpecialsSection.svelte';

	// Receive data from +page.ts load function
	let { data } = $props();
</script>

<!-- Rest of template, passing data to components -->
<main id="main-content">
	<Hero />

	<!-- ... -->

	<section id="menu" class="menu-section fade-in-section" aria-labelledby="menu-heading" use:inview>
		<div class="container">
			<!-- ... -->
			<div class="menu-grid">
				<FlavorList flavors={data.flavors} />
				<ConcoctionList concoctions={data.concoctions} />
			</div>
		</div>
	</section>

	<!-- ... -->

	<div class="fade-in-section" use:inview>
		<SpecialsSection siteContent={data.siteContent} />
	</div>

	<!-- ... -->
</main>
```

**File: `src/lib/components/FlavorList.svelte`** (update)

Change from fetching data to receiving via props:

```svelte
<script lang="ts">
	import type { Flavor } from '$lib/types';

	// Receive flavors as a prop instead of fetching
	let { flavors }: { flavors: Flavor[] } = $props();
</script>

<!-- Remove onMount fetch logic -->
<!-- Update template to use `flavors` prop directly -->
```

Apply same pattern to `ConcoctionList.svelte` and `SpecialsSection.svelte`.

### Verification

1. Run `npm run build && npm run preview`
2. Check Network tab - page data should come from server
3. Refresh page - should see cache headers in response

---

## 10. TypeScript Strictness

### Problem

`app.d.ts` has empty interface placeholders, missing opportunities for type safety.

### Solution

Define proper App namespace types and add comprehensive service types.

### Implementation

**File: `src/app.d.ts`** (update)

```typescript
// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		/**
		 * Custom error shape for error pages
		 */
		interface Error {
			message: string;
			code?: string;
			status?: number;
		}

		/**
		 * Server-side request locals
		 * Available in hooks and server load functions
		 */
		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
			session: Session | null;
		}

		/**
		 * Common page data shape
		 */
		interface PageData {
			user?: User | null;
		}

		/**
		 * Page state for shallow routing
		 */
		interface PageState {
			scrollY?: number;
		}

		/**
		 * Platform-specific context (Vercel)
		 */
		interface Platform {
			env?: {
				[key: string]: string;
			};
		}
	}
}

export {};
```

**File: `src/lib/types/index.ts`** (update - add new types)

Add these types to the existing file:

```typescript
// ============ SERVICE TYPES ============

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> =
	| {
			data: T;
			error: null;
	  }
	| {
			data: null;
			error: {
				message: string;
				code: string;
			};
	  };

/**
 * Pagination parameters
 */
export type PaginationParams = {
	page?: number;
	limit?: number;
	offset?: number;
};

/**
 * Paginated response
 */
export type PaginatedResponse<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
};

// ============ FORM TYPES ============

/**
 * Form field validation state
 */
export type FieldValidation = {
	error: string | null;
	touched: boolean;
	valid: boolean;
};

/**
 * Generic form state
 */
export type FormState<T extends Record<string, unknown>> = {
	values: T;
	errors: Partial<Record<keyof T, string>>;
	touched: Partial<Record<keyof T, boolean>>;
	isSubmitting: boolean;
	isValid: boolean;
};

/**
 * Catering form values
 */
export type CateringFormValues = {
	name: string;
	phone: string;
	email: string;
	eventDate: string;
	eventTime: string;
	eventType: string;
	notes: string;
};

// ============ COMPONENT PROP TYPES ============

/**
 * Common button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'cta' | 'ghost';

/**
 * Common size variants
 */
export type Size = 'sm' | 'md' | 'lg';

/**
 * Toast/notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type Toast = {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
};
```

**File: `src/lib/types/database.ts`** (new file - optional but recommended)

Generate with Supabase CLI: `npx supabase gen types typescript --local > src/lib/types/database.ts`

Or create manually:

```typescript
// Database types - generated from Supabase schema
// Regenerate with: npx supabase gen types typescript --local

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			catering_requests: {
				Row: {
					id: string;
					name: string;
					phone: string;
					email: string;
					event_date: string;
					event_type: string;
					customer_notes: string | null;
					admin_notes: string | null;
					status: 'new' | 'contacted' | 'confirmed' | 'completed';
					created_at: string;
				};
				Insert: Omit<
					Database['public']['Tables']['catering_requests']['Row'],
					'id' | 'admin_notes' | 'status' | 'created_at'
				>;
				Update: Partial<Database['public']['Tables']['catering_requests']['Row']>;
			};
			flavors: {
				Row: {
					id: string;
					name: string;
					active: boolean;
					sort_order: number;
				};
				Insert: Omit<Database['public']['Tables']['flavors']['Row'], 'id'>;
				Update: Partial<Database['public']['Tables']['flavors']['Row']>;
			};
			concoctions: {
				Row: {
					id: string;
					name: string;
					ingredients: string[];
					active: boolean;
					sort_order: number;
				};
				Insert: Omit<Database['public']['Tables']['concoctions']['Row'], 'id'>;
				Update: Partial<Database['public']['Tables']['concoctions']['Row']>;
			};
			loyalty_members: {
				Row: {
					id: string;
					phone: string;
					name: string;
					email: string | null;
					punches: number;
					total_punches: number;
					total_redeemed: number;
					created_at: string;
					last_visit: string;
				};
				Insert: Omit<
					Database['public']['Tables']['loyalty_members']['Row'],
					'id' | 'created_at' | 'last_visit'
				> & {
					last_visit?: string;
				};
				Update: Partial<Database['public']['Tables']['loyalty_members']['Row']>;
			};
			loyalty_history: {
				Row: {
					id: string;
					member_id: string;
					action: 'punch' | 'redeem' | 'adjustment';
					punch_count: number | null;
					note: string | null;
					created_at: string;
				};
				Insert: Omit<Database['public']['Tables']['loyalty_history']['Row'], 'id' | 'created_at'>;
				Update: Partial<Database['public']['Tables']['loyalty_history']['Row']>;
			};
			site_content: {
				Row: {
					id: string;
					key: string;
					value: string;
					description: string;
				};
				Insert: Omit<Database['public']['Tables']['site_content']['Row'], 'id'>;
				Update: Partial<Database['public']['Tables']['site_content']['Row']>;
			};
		};
	};
}
```

### Verification

```bash
npm run check
```

Should pass with no type errors.

---

## 11. Dependency Injection for Testing

### Problem

Services directly import the Supabase client, making unit tests require mocking modules.

### Solution

Refactor services to use factory functions that accept dependencies.

### Implementation

**File: `src/lib/services/menu.ts`** (refactor)

```typescript
// Menu service - handles Supabase operations for flavors and concoctions
// Uses factory pattern for dependency injection

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '$lib/supabase';
import { safeQuery, safeMutation } from './base';
import type { Flavor, Concoction, SiteContent } from '$lib/types';

/**
 * Create a menu service instance with the given Supabase client
 *
 * @param client - Supabase client (defaults to shared instance)
 * @returns Menu service object with all methods
 *
 * @example
 * // Use default client
 * const menuService = createMenuService();
 *
 * // Use custom client (for testing)
 * const mockClient = createMockSupabaseClient();
 * const menuService = createMenuService(mockClient);
 */
export function createMenuService(client: SupabaseClient = defaultClient) {
	return {
		// ============ FLAVORS ============

		async getAllFlavors(): Promise<Flavor[]> {
			return safeQuery(() =>
				client.from('flavors').select('*').order('sort_order', { ascending: true })
			);
		},

		async addFlavor(name: string, sortOrder: number): Promise<Flavor> {
			return safeQuery(() =>
				client.from('flavors').insert({ name, sort_order: sortOrder }).select().single()
			);
		},

		async updateFlavor(flavor: Flavor): Promise<void> {
			await safeMutation(() =>
				client
					.from('flavors')
					.update({ name: flavor.name, active: flavor.active })
					.eq('id', flavor.id)
			);
		},

		async deleteFlavor(flavorId: string): Promise<void> {
			await safeMutation(() => client.from('flavors').delete().eq('id', flavorId));
		},

		// ============ CONCOCTIONS ============

		async getAllConcoctions(): Promise<Concoction[]> {
			return safeQuery(() =>
				client.from('concoctions').select('*').order('sort_order', { ascending: true })
			);
		},

		async addConcoction(
			name: string,
			ingredients: string[],
			sortOrder: number
		): Promise<Concoction> {
			return safeQuery(() =>
				client
					.from('concoctions')
					.insert({ name, ingredients, sort_order: sortOrder })
					.select()
					.single()
			);
		},

		async updateConcoction(concoction: Concoction): Promise<void> {
			await safeMutation(() =>
				client
					.from('concoctions')
					.update({
						name: concoction.name,
						ingredients: concoction.ingredients,
						active: concoction.active
					})
					.eq('id', concoction.id)
			);
		},

		async deleteConcoction(concoctionId: string): Promise<void> {
			await safeMutation(() => client.from('concoctions').delete().eq('id', concoctionId));
		},

		// ============ SITE CONTENT ============

		async getAllSiteContent(): Promise<SiteContent[]> {
			return safeQuery(() => client.from('site_content').select('*').order('key'));
		},

		async updateSiteContent(contentId: string, value: string): Promise<void> {
			await safeMutation(() => client.from('site_content').update({ value }).eq('id', contentId));
		}
	};
}

// Default service instance for convenience
const menuService = createMenuService();

// Export individual functions for backward compatibility
export const getAllFlavors = menuService.getAllFlavors;
export const addFlavor = menuService.addFlavor;
export const updateFlavor = menuService.updateFlavor;
export const deleteFlavor = menuService.deleteFlavor;
export const getAllConcoctions = menuService.getAllConcoctions;
export const addConcoction = menuService.addConcoction;
export const updateConcoction = menuService.updateConcoction;
export const deleteConcoction = menuService.deleteConcoction;
export const getAllSiteContent = menuService.getAllSiteContent;
export const updateSiteContent = menuService.updateSiteContent;

// Utility function (no DB dependency)
export function getContentLabel(key: string): string {
	const labels: Record<string, string> = {
		specials_message: 'Specials Message',
		popsicle_wednesday_cta: 'Popsicle Wednesday CTA',
		popsicle_wednesday_details: 'Popsicle Wednesday Details'
	};
	return labels[key] || key;
}
```

**File: `tests/unit/services/menu.test.ts`** (new file - example test)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMenuService } from '$lib/services/menu';

// Mock Supabase client factory
function createMockClient(overrides: Record<string, unknown> = {}) {
	const mockFrom = vi.fn().mockReturnValue({
		select: vi.fn().mockReturnValue({
			order: vi.fn().mockReturnValue({
				data: [],
				error: null
			}),
			single: vi.fn().mockReturnValue({
				data: null,
				error: null
			}),
			eq: vi.fn().mockReturnValue({
				data: [],
				error: null
			})
		}),
		insert: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				single: vi.fn().mockReturnValue({
					data: { id: '1', name: 'Test', active: true, sort_order: 0 },
					error: null
				})
			})
		}),
		update: vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				error: null
			})
		}),
		delete: vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				error: null
			})
		})
	});

	return {
		from: mockFrom,
		...overrides
	} as unknown as Parameters<typeof createMenuService>[0];
}

describe('menu service', () => {
	describe('getAllFlavors', () => {
		it('returns flavors ordered by sort_order', async () => {
			const mockFlavors = [
				{ id: '1', name: 'Cherry', active: true, sort_order: 0 },
				{ id: '2', name: 'Blue Raspberry', active: true, sort_order: 1 }
			];

			const mockClient = createMockClient();
			(mockClient.from as ReturnType<typeof vi.fn>).mockReturnValue({
				select: vi.fn().mockReturnValue({
					order: vi.fn().mockReturnValue({
						data: mockFlavors,
						error: null
					})
				})
			});

			const service = createMenuService(mockClient);
			const result = await service.getAllFlavors();

			expect(result).toEqual(mockFlavors);
			expect(mockClient.from).toHaveBeenCalledWith('flavors');
		});

		it('throws ServiceError on database error', async () => {
			const mockClient = createMockClient();
			(mockClient.from as ReturnType<typeof vi.fn>).mockReturnValue({
				select: vi.fn().mockReturnValue({
					order: vi.fn().mockReturnValue({
						data: null,
						error: { message: 'Connection failed', code: 'PGRST000' }
					})
				})
			});

			const service = createMenuService(mockClient);

			await expect(service.getAllFlavors()).rejects.toThrow('Connection failed');
		});
	});
});
```

Apply the same factory pattern to:

- `src/lib/services/loyalty.ts`
- `src/lib/services/requests.ts`

### Verification

```bash
npm run test:run
```

Tests should pass using mock clients without network calls.

---

## 12. Pre-commit Hooks

### Problem

No automated checks before commits, allowing linting errors and unformatted code.

### Solution

Use Husky for Git hooks and lint-staged for running checks on staged files.

### Implementation

**Step 1: Install dependencies**

```bash
npm install -D husky lint-staged
```

**Step 2: Initialize Husky**

```bash
npx husky init
```

This creates a `.husky` directory with a pre-commit hook.

**Step 3: Configure pre-commit hook**

**File: `.husky/pre-commit`** (replace contents)

```bash
npx lint-staged
```

**Step 4: Configure lint-staged**

**File: `package.json`** (add at root level)

```json
{
	"lint-staged": {
		"*.{ts,svelte}": ["eslint --fix --max-warnings=0", "prettier --write"],
		"*.{json,md,css,html}": ["prettier --write"],
		"*.{js,cjs,mjs}": ["eslint --fix", "prettier --write"]
	}
}
```

**Step 5: Add prepare script** (if not already present)

**File: `package.json`** (add to scripts)

```json
{
	"scripts": {
		"prepare": "husky"
	}
}
```

**Step 6: Create commit-msg hook for conventional commits (optional but recommended)**

**File: `.husky/commit-msg`** (new file)

```bash
#!/usr/bin/env sh

# Validate commit message follows conventional commits format
# Examples: feat: add feature, fix: resolve bug, docs: update readme

commit_regex='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Commit message must match: type(scope?): description"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
    echo ""
    echo "Examples:"
    echo "  feat: add user authentication"
    echo "  fix(form): resolve validation bug"
    echo "  docs: update API documentation"
    echo ""
    exit 1
fi
```

Make it executable:

```bash
chmod +x .husky/commit-msg
```

### Verification

1. Make a change to a `.ts` file with a linting error
2. Stage the file: `git add .`
3. Attempt to commit: `git commit -m "test: verify pre-commit hook"`
4. Hook should run eslint and prettier, fixing or blocking as needed

---

## 13. Cross-Browser Testing

### Problem

Playwright only tests in Chromium, missing browser-specific bugs in Firefox and Safari.

### Solution

Expand Playwright configuration to test multiple browsers and devices.

### Implementation

**File: `playwright.config.ts`** (update)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : 'html',

	// Shared settings for all projects
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},

	// Configure projects for different browsers
	projects: [
		// Desktop browsers
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		},

		// Mobile browsers
		{
			name: 'mobile-chrome',
			use: { ...devices['Pixel 5'] }
		},
		{
			name: 'mobile-safari',
			use: { ...devices['iPhone 12'] }
		},

		// Tablet
		{
			name: 'tablet',
			use: { ...devices['iPad (gen 7)'] }
		}
	],

	// Local dev server
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
```

**File: `.github/workflows/ci.yml`** (update)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run check
        env:
          PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk5NjIxNTEsImV4cCI6MTk2NTUzODE1MX0.placeholder

      - name: Lint
        run: npm run lint

      - name: Unit & Component tests
        run: npm run test:coverage
        env:
          PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk5NjIxNTEsImV4cCI6MTk2NTUzODE1MX0.placeholder

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox webkit

      - name: E2E tests
        run: npm run test:e2e
        env:
          PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk5NjIxNTEsImV4cCI6MTk2NTUzODE1MX0.placeholder

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**File: `package.json`** (add scripts)

```json
{
	"scripts": {
		"test:e2e:chromium": "playwright test --project=chromium",
		"test:e2e:firefox": "playwright test --project=firefox",
		"test:e2e:webkit": "playwright test --project=webkit",
		"test:e2e:mobile": "playwright test --project=mobile-chrome --project=mobile-safari"
	}
}
```

### Verification

```bash
# Install all browsers locally
npx playwright install

# Run tests in all browsers
npm run test:e2e

# Or test specific browser
npm run test:e2e:firefox
```

---

## 14. Documentation Enhancement

### Problem

Limited documentation beyond basic README. No contribution guidelines or architecture docs.

### Solution

Create comprehensive documentation for contributors and maintainers.

### Implementation

**File: `CONTRIBUTING.md`** (new file)

````markdown
# Contributing to Daesy's Tropical Sno

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Be respectful, inclusive, and professional. We're all here to build something great together.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/daesys-tropical-sno.git
   cd daesys-tropical-sno
   ```
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Verify setup**
   ```bash
   npm run check    # Type check
   npm run lint     # Lint check
   npm run test:run # Unit tests
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feat/` - New features (e.g., `feat/loyalty-email-notifications`)
- `fix/` - Bug fixes (e.g., `fix/form-validation-date`)
- `docs/` - Documentation (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/service-layer`)
- `test/` - Test additions (e.g., `test/e2e-admin-flow`)

### Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests as needed
4. Ensure all checks pass
5. Submit a pull request

## Code Style

### TypeScript

- Use strict mode (enabled in `tsconfig.json`)
- Prefer explicit types over `any`
- Use interfaces for object shapes, types for unions/primitives
- Document public functions with JSDoc comments

### Svelte

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Keep components focused and single-purpose
- Use `$props()` for component properties
- Include proper accessibility attributes

### CSS

- Use CSS custom properties from `app.css`
- Follow mobile-first responsive design
- Use BEM-like naming for component styles
- Ensure 44px minimum touch targets

### File Organization

```
src/lib/
├── actions/      # Svelte actions (use:directive)
├── components/   # Reusable Svelte components
├── config/       # Configuration files
├── data/         # Static data and constants
├── services/     # Business logic and API calls
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

## Testing

### Running Tests

```bash
# Unit tests (watch mode)
npm run test

# Unit tests (single run)
npm run test:run

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Full CI suite
npm run test:ci
```

### Writing Tests

- **Unit tests**: Place in `tests/unit/` mirroring `src/lib/` structure
- **E2E tests**: Place in `tests/e2e/`
- **Component tests**: Use Testing Library's user-centric queries
- Aim for 70%+ coverage on service layer code

### Test File Naming

- Unit tests: `*.test.ts`
- E2E tests: `*.spec.ts`

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/). Commits must follow this format:

```
type(scope?): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system or external dependencies
- `ci`: CI configuration
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

```
feat(loyalty): add email notifications for punch milestones

fix(form): resolve date validation for timezone edge cases

docs: update contributing guidelines with test section

refactor(services): convert to factory pattern for DI
```

## Pull Request Process

1. **Before submitting**
   - Ensure all tests pass: `npm run test:ci`
   - Ensure type check passes: `npm run check`
   - Ensure linting passes: `npm run lint`
   - Update documentation if needed

2. **PR Title**
   - Use conventional commit format
   - Be descriptive but concise

3. **PR Description**
   - Describe what the PR does
   - Link related issues
   - Include screenshots for UI changes
   - Note any breaking changes

4. **Review Process**
   - PRs require at least one approval
   - Address review feedback promptly
   - Keep PRs focused and reasonably sized

5. **After Merge**
   - Delete your feature branch
   - Verify deployment succeeded

## Questions?

Open an issue or reach out to the maintainers. We're happy to help!

````

**File: `docs/ARCHITECTURE.md`** (new file)

```markdown
# Architecture Overview

This document describes the technical architecture of the Daesy's Tropical Sno website.

## System Architecture

````

┌─────────────────────────────────────────────────────────────┐
│ Client Browser │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ SvelteKit App ││
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ││
│ │ │ Routes │ │Components│ │ Services │ ││
│ │ └────┬─────┘ └────┬─────┘ └────┬─────┘ ││
│ │ │ │ │ ││
│ │ └─────────────┴─────────────┘ ││
│ └───────────────────────┬─────────────────────────────────┘│
└──────────────────────────┼──────────────────────────────────┘
│ HTTPS
┌──────────────────────────┼──────────────────────────────────┐
│ Vercel Edge │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Static Assets │ │ SSR/ISR │ │
│ │ (CDN Cached) │ │ Functions │ │
│ └─────────────────┘ └────────┬────────┘ │
└────────────────────────────────┼────────────────────────────┘
│ HTTPS
┌────────────────────────────────┼────────────────────────────┐
│ Supabase │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │PostgreSQL│ │ Auth │ │ Edge │ │ Realtime │ │
│ │ Database │ │ │ │Functions │ │ │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────┘

```

## Directory Structure

```

daesys-tropical-sno/
├── .github/
│ └── workflows/
│ └── ci.yml # GitHub Actions CI pipeline
├── .husky/ # Git hooks
├── docs/ # Documentation
├── src/
│ ├── app.css # Global styles
│ ├── app.d.ts # App-level TypeScript declarations
│ ├── app.html # HTML template
│ ├── lib/
│ │ ├── actions/ # Svelte actions
│ │ │ └── inview.ts # Intersection Observer action
│ │ ├── components/ # Reusable components
│ │ ├── config/ # Configuration modules
│ │ │ ├── env.ts # Environment validation
│ │ │ └── site.ts # Site constants
│ │ ├── data/ # Static data
│ │ │ ├── businessInfo.ts # Business details
│ │ │ ├── concoctions.ts # Fallback concoctions
│ │ │ ├── eventTypes.ts # Event type options
│ │ │ └── flavors.ts # Fallback flavors
│ │ ├── services/ # Business logic
│ │ │ ├── base.ts # Service utilities
│ │ │ ├── index.ts # Service exports
│ │ │ ├── loyalty.ts # Loyalty program
│ │ │ ├── menu.ts # Menu management
│ │ │ └── requests.ts # Catering requests
│ │ ├── types/ # TypeScript types
│ │ │ ├── database.ts # Database schema types
│ │ │ └── index.ts # Shared types
│ │ ├── utils/ # Utilities
│ │ │ └── rateLimit.ts # Rate limiting
│ │ └── supabase.ts # Supabase client
│ └── routes/
│ ├── +error.svelte # Error page
│ ├── +layout.svelte # Root layout
│ ├── +page.svelte # Home page
│ ├── +page.ts # Home page data loading
│ ├── admin/ # Admin dashboard
│ │ ├── +error.svelte # Admin error page
│ │ ├── +page.svelte # Admin page
│ │ ├── components/ # Admin components
│ │ └── styles/ # Admin styles
│ ├── privacy/ # Privacy policy
│ └── sitemap.xml/ # Dynamic sitemap
├── static/ # Static assets
├── supabase/
│ ├── functions/ # Edge functions
│ │ └── send-notification/ # Email notifications
│ └── migrations/ # Database migrations
└── tests/
├── e2e/ # Playwright E2E tests
├── setup.ts # Test setup
└── unit/ # Vitest unit tests

```

## Data Flow

### Public Pages

```

Browser Request
│
▼
┌─────────────┐
│ +page.ts │ ◄── Server-side data loading
│ (load) │ with cache headers
└──────┬──────┘
│
▼
┌─────────────┐
│ Services │ ◄── Business logic layer
│ (menu) │
└──────┬──────┘
│
▼
┌─────────────┐
│ Supabase │ ◄── Database queries
│ (client) │
└──────┬──────┘
│
▼
┌─────────────┐
│ PostgreSQL │
│ Database │
└─────────────┘

```

### Form Submission (Catering)

```

User Input
│
▼
┌──────────────────┐
│ Client Validation│ ◄── Zod validation
│ + Rate Limiting │ + honeypot check
└────────┬─────────┘
│
▼
┌──────────────────┐
│ Supabase Insert │ ◄── RLS: anon can insert
└────────┬─────────┘
│
▼
┌──────────────────┐
│ Database Trigger │ ◄── pg_net + HTTP
└────────┬─────────┘
│
▼
┌──────────────────┐
│ Edge Function │ ◄── send-notification
└────────┬─────────┘
│
▼
┌──────────────────┐
│ Resend API │ ◄── Email delivery
└──────────────────┘

```

## Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `catering_requests` | Customer event requests | Anon: insert only |
| `flavors` | Sno cone flavors | Anon: select, Auth: all |
| `concoctions` | Signature concoctions | Anon: select, Auth: all |
| `site_content` | Dynamic content | Anon: select, Auth: all |
| `loyalty_members` | Loyalty program members | Auth only |
| `loyalty_history` | Punch/redeem history | Auth only |

### Row Level Security

- **Public tables** (flavors, concoctions, site_content): Anyone can read, only authenticated users can modify
- **Catering requests**: Anyone can insert their own, only authenticated can read/update
- **Loyalty tables**: Only authenticated users (admin) can access

## Security Measures

1. **Environment Variables**: Validated with Zod schema
2. **CSP Headers**: Configured in vercel.json
3. **Form Protection**: Honeypot + rate limiting
4. **Database**: Row Level Security on all tables
5. **Auth**: Supabase Auth with session management
6. **HTTPS**: Enforced by Vercel

## Caching Strategy

| Resource | Cache Duration | Strategy |
|----------|---------------|----------|
| Static assets | 1 year | Immutable |
| Menu data | 5 min fresh, 1 hr stale | SWR |
| HTML pages | No cache | Dynamic |
| API responses | Varies | Per-endpoint |

## Performance Optimizations

- **Font preconnect**: Google Fonts domains
- **Image optimization**: Vercel Image Optimization
- **Code splitting**: Per-route bundles
- **Lazy loading**: Intersection Observer for sections
- **Skeleton loading**: Visual feedback during data fetch

## Deployment

### Production

1. Push to `main` branch
2. GitHub Actions runs CI pipeline
3. Vercel auto-deploys on success
4. Edge functions deployed via Supabase CLI

### Preview

1. Push to feature branch
2. Open pull request
3. Vercel creates preview deployment
4. CI runs on PR

## Monitoring

- **Vercel Analytics**: Performance metrics
- **Supabase Dashboard**: Database metrics, logs
- **GitHub Actions**: CI/CD status
```

**File: `README.md`** (update - add links section)

Add to the bottom of the existing README:

```markdown
## Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute to this project
- [Architecture Overview](docs/ARCHITECTURE.md) - Technical architecture documentation
- [Refactoring Guide](docs/REFACTORING_GUIDE.md) - Best practices implementation guide

## License

Private - All rights reserved
```

### Verification

1. All markdown files should render correctly on GitHub
2. Links between documents should work
3. Code blocks should have proper syntax highlighting

---

## Implementation Checklist

Use this checklist to track progress:

- [ ] 1. Test Coverage Thresholds - Update vite.config.ts
- [ ] 2. Environment Validation - Install zod, create env.ts, .env.example
- [ ] 3. Error Boundaries - Create +error.svelte pages
- [ ] 4. Loading States - Create NavigationLoader, add to layout
- [ ] 5. Service Standardization - Create base.ts with utilities
- [ ] 6. Rate Limiting - Create rateLimit.ts, update CateringForm
- [ ] 7. Site Configuration - Create site.ts, update consumers
- [ ] 8. CSP Headers - Update vercel.json
- [ ] 9. API Caching - Create +page.ts, update components
- [ ] 10. TypeScript Types - Update app.d.ts, add types
- [ ] 11. Dependency Injection - Refactor services to factory pattern
- [ ] 12. Pre-commit Hooks - Install husky/lint-staged, configure
- [ ] 13. Cross-Browser Testing - Update playwright.config.ts, CI
- [ ] 14. Documentation - Create CONTRIBUTING.md, ARCHITECTURE.md

---

## Order of Implementation

Recommended order to minimize conflicts:

1. **Foundation** (no dependencies)
   - #7 Site Configuration
   - #2 Environment Validation
   - #10 TypeScript Types

2. **Infrastructure** (depends on foundation)
   - #5 Service Standardization (base.ts)
   - #11 Dependency Injection
   - #6 Rate Limiting

3. **User Experience**
   - #3 Error Boundaries
   - #4 Loading States
   - #9 API Caching

4. **Security**
   - #8 CSP Headers

5. **Developer Experience**
   - #1 Coverage Thresholds
   - #12 Pre-commit Hooks
   - #13 Cross-Browser Testing

6. **Documentation**
   - #14 Documentation

---

## Estimated Effort

| Item                       | Complexity | Time Estimate |
| -------------------------- | ---------- | ------------- |
| 1. Coverage Thresholds     | Low        | 15 min        |
| 2. Environment Validation  | Medium     | 30 min        |
| 3. Error Boundaries        | Medium     | 45 min        |
| 4. Loading States          | Low        | 30 min        |
| 5. Service Standardization | Medium     | 45 min        |
| 6. Rate Limiting           | Medium     | 30 min        |
| 7. Site Configuration      | Low        | 30 min        |
| 8. CSP Headers             | Low        | 15 min        |
| 9. API Caching             | High       | 1 hour        |
| 10. TypeScript Types       | Medium     | 45 min        |
| 11. Dependency Injection   | High       | 1.5 hours     |
| 12. Pre-commit Hooks       | Low        | 20 min        |
| 13. Cross-Browser Testing  | Medium     | 30 min        |
| 14. Documentation          | Medium     | 1 hour        |

**Total Estimated Time**: ~8-10 hours

---

## Questions or Issues?

If you encounter any issues implementing these improvements, check:

1. Existing tests still pass: `npm run test:ci`
2. Build succeeds: `npm run build`
3. Type check passes: `npm run check`
4. Linting passes: `npm run lint`
