import { describe, it, expect, beforeEach } from 'vitest';
import { createRequestsService, formatDate, getStatusColor } from '$lib/services/requests';
import {
	createMockSupabaseClient,
	asMockClient,
	createPostgrestError,
	type MockSupabaseClient
} from '../../mocks/supabase';
import { ServiceError } from '$lib/services/base';
import type { CateringRequest, RequestStatus } from '$lib/types';

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

describe('requests service with dependency injection', () => {
	let mockClient: MockSupabaseClient;

	beforeEach(() => {
		mockClient = createMockSupabaseClient();
	});

	describe('getAllRequests', () => {
		it('returns requests ordered by created_at descending', async () => {
			const mockRequests: CateringRequest[] = [
				{
					id: '1',
					name: 'John Doe',
					phone: '8174016310',
					email: 'john@example.com',
					event_date: '2026-02-14',
					event_type: 'Birthday Party',
					customer_notes: 'Need 50 servings',
					admin_notes: null,
					status: 'new',
					created_at: '2026-01-17T12:00:00Z'
				},
				{
					id: '2',
					name: 'Jane Smith',
					phone: '8175551234',
					email: 'jane@example.com',
					event_date: '2026-03-01',
					event_type: 'Corporate Event',
					customer_notes: null,
					admin_notes: 'Called back',
					status: 'contacted',
					created_at: '2026-01-16T12:00:00Z'
				}
			];

			mockClient._queryBuilder.mockResolvedValue({
				data: mockRequests,
				error: null
			});

			const service = createRequestsService(asMockClient(mockClient));
			const result = await service.getAllRequests();

			expect(result).toEqual(mockRequests);
			expect(mockClient.from).toHaveBeenCalledWith('catering_requests');
			expect(mockClient._queryBuilder.select).toHaveBeenCalledWith('*');
			expect(mockClient._queryBuilder.order).toHaveBeenCalledWith('created_at', {
				ascending: false
			});
		});

		it('returns empty array when no requests exist', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: [],
				error: null
			});

			const service = createRequestsService(asMockClient(mockClient));
			const result = await service.getAllRequests();

			expect(result).toEqual([]);
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Connection failed', 'PGRST000')
			});

			const service = createRequestsService(asMockClient(mockClient));

			await expect(service.getAllRequests()).rejects.toThrow(ServiceError);
			await expect(service.getAllRequests()).rejects.toThrow('Connection failed');
		});

		it('throws ServiceError on permission denied', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Permission denied for table catering_requests', '42501')
			});

			const service = createRequestsService(asMockClient(mockClient));

			await expect(service.getAllRequests()).rejects.toThrow(ServiceError);
		});
	});

	describe('updateRequestStatus', () => {
		const testStatuses: RequestStatus[] = ['new', 'contacted', 'confirmed', 'completed'];

		testStatuses.forEach((status) => {
			it(`updates request status to "${status}"`, async () => {
				mockClient._queryBuilder.mockResolvedValue({
					data: null,
					error: null
				});

				const service = createRequestsService(asMockClient(mockClient));
				await service.updateRequestStatus('request-1', status);

				expect(mockClient.from).toHaveBeenCalledWith('catering_requests');
				expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({ status });
				expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'request-1');
			});
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Update failed', 'PGRST204')
			});

			const service = createRequestsService(asMockClient(mockClient));

			await expect(service.updateRequestStatus('request-1', 'confirmed')).rejects.toThrow(
				ServiceError
			);
		});

		it('throws ServiceError when request not found', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Record not found', 'PGRST116')
			});

			const service = createRequestsService(asMockClient(mockClient));

			await expect(service.updateRequestStatus('nonexistent', 'contacted')).rejects.toThrow(
				ServiceError
			);
		});
	});

	describe('updateRequestNotes', () => {
		it('updates admin notes for a request', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createRequestsService(asMockClient(mockClient));
			await service.updateRequestNotes('request-1', 'Called customer, confirmed for Feb 14');

			expect(mockClient.from).toHaveBeenCalledWith('catering_requests');
			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				admin_notes: 'Called customer, confirmed for Feb 14'
			});
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'request-1');
		});

		it('allows empty notes', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createRequestsService(asMockClient(mockClient));
			await service.updateRequestNotes('request-1', '');

			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				admin_notes: ''
			});
		});

		it('preserves special characters in notes', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const notesWithSpecialChars = "Customer's note: 50% deposit paid! (ref: #123)";

			const service = createRequestsService(asMockClient(mockClient));
			await service.updateRequestNotes('request-1', notesWithSpecialChars);

			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				admin_notes: notesWithSpecialChars
			});
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Update failed', 'PGRST204')
			});

			const service = createRequestsService(asMockClient(mockClient));

			await expect(service.updateRequestNotes('request-1', 'notes')).rejects.toThrow(ServiceError);
		});
	});

	describe('deleteRequest', () => {
		it('deletes a request by id', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createRequestsService(asMockClient(mockClient));
			await service.deleteRequest('request-123');

			expect(mockClient.from).toHaveBeenCalledWith('catering_requests');
			expect(mockClient._queryBuilder.delete).toHaveBeenCalled();
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'request-123');
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Delete failed', 'PGRST204')
			});

			const service = createRequestsService(asMockClient(mockClient));

			await expect(service.deleteRequest('request-123')).rejects.toThrow(ServiceError);
		});

		it('throws ServiceError when request not found', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Record not found', 'PGRST116')
			});

			const service = createRequestsService(asMockClient(mockClient));

			await expect(service.deleteRequest('nonexistent')).rejects.toThrow(ServiceError);
		});

		it('throws ServiceError on permission denied', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Permission denied', '42501')
			});

			const service = createRequestsService(asMockClient(mockClient));

			await expect(service.deleteRequest('request-123')).rejects.toThrow(ServiceError);
		});
	});
});
