import { describe, it, expect, vi } from 'vitest';
import {
	ServiceError,
	isServiceError,
	tryCatch,
	safeQuery,
	safeQueryArray,
	safeMutation,
	logServiceError
} from '$lib/services/base';
import type { PostgrestError } from '@supabase/supabase-js';

describe('ServiceError', () => {
	describe('constructor', () => {
		it('creates error with message only', () => {
			const error = new ServiceError('Something went wrong');

			expect(error.message).toBe('Something went wrong');
			expect(error.code).toBe('UNKNOWN_ERROR');
			expect(error.details).toBeUndefined();
			expect(error.name).toBe('ServiceError');
			expect(error.isServiceError).toBe(true);
		});

		it('creates error with message and code', () => {
			const error = new ServiceError('Not found', 'NOT_FOUND');

			expect(error.message).toBe('Not found');
			expect(error.code).toBe('NOT_FOUND');
		});

		it('creates error with message, code, and details', () => {
			const details = { table: 'flavors', id: '123' };
			const error = new ServiceError('Record not found', 'NOT_FOUND', details);

			expect(error.message).toBe('Record not found');
			expect(error.code).toBe('NOT_FOUND');
			expect(error.details).toEqual(details);
		});

		it('is an instance of Error', () => {
			const error = new ServiceError('Test');
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(ServiceError);
		});
	});

	describe('fromPostgrestError', () => {
		it('converts PostgrestError to ServiceError', () => {
			const pgError: PostgrestError = {
				message: 'duplicate key value violates unique constraint',
				code: '23505',
				details: 'Key (phone)=(1234567890) already exists.',
				hint: ''
			};

			const serviceError = ServiceError.fromPostgrestError(pgError);

			expect(serviceError.message).toBe('duplicate key value violates unique constraint');
			expect(serviceError.code).toBe('23505');
			expect(serviceError.details).toEqual({
				hint: '',
				details: 'Key (phone)=(1234567890) already exists.'
			});
		});

		it('uses DB_ERROR as fallback code when code is empty', () => {
			const pgError: PostgrestError = {
				message: 'Connection failed',
				code: '',
				details: '',
				hint: ''
			};

			const serviceError = ServiceError.fromPostgrestError(pgError);
			expect(serviceError.code).toBe('DB_ERROR');
		});
	});

	describe('toJSON', () => {
		it('serializes error to plain object', () => {
			const error = new ServiceError('Test error', 'TEST_CODE', { extra: 'data' });
			const json = error.toJSON();

			expect(json).toEqual({
				name: 'ServiceError',
				message: 'Test error',
				code: 'TEST_CODE',
				details: { extra: 'data' }
			});
		});
	});
});

describe('isServiceError', () => {
	it('returns true for ServiceError instances', () => {
		const error = new ServiceError('Test');
		expect(isServiceError(error)).toBe(true);
	});

	it('returns true for objects with isServiceError property', () => {
		const errorLike = {
			message: 'Test',
			code: 'TEST',
			isServiceError: true
		};
		expect(isServiceError(errorLike)).toBe(true);
	});

	it('returns false for regular Error instances', () => {
		const error = new Error('Test');
		expect(isServiceError(error)).toBe(false);
	});

	it('returns false for non-error objects', () => {
		expect(isServiceError({})).toBe(false);
		expect(isServiceError({ message: 'Test' })).toBe(false);
	});

	it('returns false for primitives', () => {
		expect(isServiceError(null)).toBe(false);
		expect(isServiceError(undefined)).toBe(false);
		expect(isServiceError('error')).toBe(false);
		expect(isServiceError(42)).toBe(false);
	});
});

describe('tryCatch', () => {
	it('returns success result on successful operation', async () => {
		const result = await tryCatch(async () => 'success');

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe('success');
		}
	});

	it('returns failure result with ServiceError on ServiceError throw', async () => {
		const serviceError = new ServiceError('Failed', 'FAIL_CODE');
		const result = await tryCatch(async () => {
			throw serviceError;
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe(serviceError);
		}
	});

	it('wraps regular Error in ServiceError', async () => {
		const result = await tryCatch(async () => {
			throw new Error('Regular error');
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(ServiceError);
			expect(result.error.message).toBe('Regular error');
			expect(result.error.code).toBe('UNKNOWN_ERROR');
		}
	});

	it('wraps non-Error throws in ServiceError', async () => {
		const result = await tryCatch(async () => {
			throw 'string error';
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(ServiceError);
			expect(result.error.message).toBe('Unknown error');
			expect(result.error.details).toBe('string error');
		}
	});
});

describe('safeQuery', () => {
	it('returns data on successful query', async () => {
		const mockData = { id: '1', name: 'Test' };
		const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null });

		const result = await safeQuery(queryFn);

		expect(result).toEqual(mockData);
		expect(queryFn).toHaveBeenCalled();
	});

	it('throws ServiceError on database error', async () => {
		const pgError: PostgrestError = {
			message: 'Table not found',
			code: '42P01',
			details: '',
			hint: ''
		};
		const queryFn = vi.fn().mockResolvedValue({ data: null, error: pgError });

		await expect(safeQuery(queryFn)).rejects.toThrow(ServiceError);
		await expect(safeQuery(queryFn)).rejects.toThrow('Table not found');
	});

	it('throws ServiceError when data is null without error', async () => {
		const queryFn = vi.fn().mockResolvedValue({ data: null, error: null });

		await expect(safeQuery(queryFn)).rejects.toThrow(ServiceError);
		await expect(safeQuery(queryFn)).rejects.toThrow('Query returned no data');
	});
});

describe('safeQueryArray', () => {
	it('returns data array on successful query', async () => {
		const mockData = [
			{ id: '1', name: 'Cherry' },
			{ id: '2', name: 'Grape' }
		];
		const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null });

		const result = await safeQueryArray(queryFn);

		expect(result).toEqual(mockData);
	});

	it('returns empty array when data is null', async () => {
		const queryFn = vi.fn().mockResolvedValue({ data: null, error: null });

		const result = await safeQueryArray(queryFn);

		expect(result).toEqual([]);
	});

	it('throws ServiceError on database error', async () => {
		const pgError: PostgrestError = {
			message: 'Permission denied',
			code: '42501',
			details: '',
			hint: ''
		};
		const queryFn = vi.fn().mockResolvedValue({ data: null, error: pgError });

		await expect(safeQueryArray(queryFn)).rejects.toThrow(ServiceError);
		await expect(safeQueryArray(queryFn)).rejects.toThrow('Permission denied');
	});
});

describe('safeMutation', () => {
	it('resolves successfully when no error', async () => {
		const mutationFn = vi.fn().mockResolvedValue({ error: null });

		await expect(safeMutation(mutationFn)).resolves.toBeUndefined();
		expect(mutationFn).toHaveBeenCalled();
	});

	it('throws ServiceError on database error', async () => {
		const pgError: PostgrestError = {
			message: 'Foreign key violation',
			code: '23503',
			details: '',
			hint: ''
		};
		const mutationFn = vi.fn().mockResolvedValue({ error: pgError });

		await expect(safeMutation(mutationFn)).rejects.toThrow(ServiceError);
		await expect(safeMutation(mutationFn)).rejects.toThrow('Foreign key violation');
	});
});

describe('logServiceError', () => {
	it('logs ServiceError with toJSON format', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const error = new ServiceError('Test error', 'TEST', { detail: 'info' });

		logServiceError('TestContext', error);

		expect(consoleSpy).toHaveBeenCalledWith('[TestContext] ServiceError:', error.toJSON());
		consoleSpy.mockRestore();
	});

	it('logs regular Error with structured format', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const error = new Error('Regular error');

		logServiceError('TestContext', error);

		expect(consoleSpy).toHaveBeenCalledWith('[TestContext] Error:', {
			name: 'Error',
			message: 'Regular error',
			stack: expect.any(String)
		});
		consoleSpy.mockRestore();
	});

	it('logs unknown error types', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		logServiceError('TestContext', 'string error');

		expect(consoleSpy).toHaveBeenCalledWith('[TestContext] Unknown error:', 'string error');
		consoleSpy.mockRestore();
	});
});
