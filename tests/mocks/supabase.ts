// Mock Supabase client factory for unit testing
// Allows services to be tested without network calls

import { vi, type Mock } from 'vitest';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

/**
 * Mock query builder that chains methods and returns configurable results
 */
export interface MockQueryBuilder {
	select: Mock;
	insert: Mock;
	update: Mock;
	delete: Mock;
	eq: Mock;
	or: Mock;
	order: Mock;
	limit: Mock;
	single: Mock;
	// Internal: stores the resolved value for the promise
	_resolvedValue: { data: unknown; error: PostgrestError | null };
	// Helper to set the mock response
	mockResolvedValue: (value: { data: unknown; error: PostgrestError | null }) => void;
}

/**
 * Mock Supabase client with chainable query builder
 */
export interface MockSupabaseClient {
	from: Mock;
	_queryBuilder: MockQueryBuilder;
}

/**
 * Creates a mock Supabase client for testing services
 *
 * @example
 * // Basic usage
 * const mockClient = createMockSupabaseClient();
 * mockClient._queryBuilder.mockResolvedValue({
 *   data: [{ id: '1', name: 'Test' }],
 *   error: null
 * });
 *
 * const service = createMenuService(mockClient as unknown as SupabaseClient);
 * const result = await service.getAllFlavors();
 *
 * @example
 * // Testing error scenarios
 * mockClient._queryBuilder.mockResolvedValue({
 *   data: null,
 *   error: { message: 'Connection failed', code: 'PGRST000' }
 * });
 */
export function createMockSupabaseClient(): MockSupabaseClient {
	// Default resolved value
	let resolvedValue: { data: unknown; error: PostgrestError | null } = {
		data: [],
		error: null
	};

	// Create a thenable object that resolves to the configured value
	const createThenable = () => ({
		then: (resolve: (value: { data: unknown; error: PostgrestError | null }) => void) => {
			resolve(resolvedValue);
			return Promise.resolve(resolvedValue);
		}
	});

	// Query builder with chainable methods
	const mockQueryBuilder: MockQueryBuilder = {
		select: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		insert: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		update: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		delete: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		eq: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		or: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		order: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		limit: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		single: vi.fn().mockImplementation(() => {
			return { ...mockQueryBuilder, ...createThenable() };
		}),
		_resolvedValue: resolvedValue,
		mockResolvedValue: (value: { data: unknown; error: PostgrestError | null }) => {
			resolvedValue = value;
			mockQueryBuilder._resolvedValue = value;
		}
	};

	return {
		from: vi.fn(() => mockQueryBuilder),
		_queryBuilder: mockQueryBuilder
	};
}

/**
 * Type helper to cast mock client to SupabaseClient
 */
export function asMockClient(mock: MockSupabaseClient): SupabaseClient {
	return mock as unknown as SupabaseClient;
}

/**
 * Creates a PostgrestError-like object for testing error scenarios
 */
export function createPostgrestError(
	message: string,
	code: string = 'PGRST000',
	details?: string,
	hint?: string
): PostgrestError {
	return {
		name: 'PostgrestError',
		message,
		code,
		details: details || '',
		hint: hint || ''
	};
}
