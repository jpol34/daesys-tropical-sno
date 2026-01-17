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
 * Uses PromiseLike to support Supabase's query builders which are thenable but not strict Promises
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
export async function safeQuery<T>(
	queryFn: () => PromiseLike<SupabaseQueryResponse<T>>
): Promise<T> {
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
 * Executes a Supabase query that may return empty results
 * Returns empty array instead of throwing on no data
 *
 * @example
 * const flavors = await safeQueryArray(() =>
 *   supabase.from('flavors').select('*')
 * );
 */
export async function safeQueryArray<T>(
	queryFn: () => PromiseLike<SupabaseQueryResponse<T[]>>
): Promise<T[]> {
	const { data, error } = await queryFn();

	if (error) {
		throw ServiceError.fromPostgrestError(error);
	}

	return data || [];
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
	mutationFn: () => PromiseLike<{ error: PostgrestError | null }>
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
