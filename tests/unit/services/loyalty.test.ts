import { describe, it, expect, beforeEach } from 'vitest';
import {
	createLoyaltyService,
	normalizePhone,
	formatPhone,
	formatRelativeTime
} from '$lib/services/loyalty';
import {
	createMockSupabaseClient,
	asMockClient,
	createPostgrestError,
	type MockSupabaseClient
} from '../../mocks/supabase';
import { ServiceError } from '$lib/services/base';
import type { LoyaltyMember, LoyaltyHistory } from '$lib/types';

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

describe('loyalty service with dependency injection', () => {
	let mockClient: MockSupabaseClient;

	beforeEach(() => {
		mockClient = createMockSupabaseClient();
	});

	describe('getAllMembers', () => {
		it('returns members ordered by last_visit descending', async () => {
			const mockMembers: LoyaltyMember[] = [
				{
					id: '1',
					phone: '8174016310',
					name: 'John Doe',
					email: 'john@example.com',
					punches: 5,
					total_punches: 15,
					total_redeemed: 1,
					created_at: '2026-01-01T00:00:00Z',
					last_visit: '2026-01-17T12:00:00Z'
				},
				{
					id: '2',
					phone: '8175551234',
					name: 'Jane Smith',
					email: null,
					punches: 2,
					total_punches: 2,
					total_redeemed: 0,
					created_at: '2026-01-15T00:00:00Z',
					last_visit: '2026-01-16T12:00:00Z'
				}
			];

			mockClient._queryBuilder.mockResolvedValue({
				data: mockMembers,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.getAllMembers();

			expect(result).toEqual(mockMembers);
			expect(mockClient.from).toHaveBeenCalledWith('loyalty_members');
			expect(mockClient._queryBuilder.order).toHaveBeenCalledWith('last_visit', {
				ascending: false
			});
		});

		it('returns empty array when no members exist', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: [],
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.getAllMembers();

			expect(result).toEqual([]);
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Connection failed', 'PGRST000')
			});

			const service = createLoyaltyService(asMockClient(mockClient));

			await expect(service.getAllMembers()).rejects.toThrow(ServiceError);
		});
	});

	describe('getRecentHistory', () => {
		it('returns history ordered by created_at descending with default limit', async () => {
			const mockHistory: LoyaltyHistory[] = [
				{
					id: '1',
					member_id: 'member-1',
					action: 'punch',
					punch_count: 2,
					note: null,
					created_at: '2026-01-17T12:00:00Z'
				},
				{
					id: '2',
					member_id: 'member-1',
					action: 'redeem',
					punch_count: null,
					note: 'Free sno cone',
					created_at: '2026-01-16T12:00:00Z'
				}
			];

			mockClient._queryBuilder.mockResolvedValue({
				data: mockHistory,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.getRecentHistory();

			expect(result).toEqual(mockHistory);
			expect(mockClient.from).toHaveBeenCalledWith('loyalty_history');
			expect(mockClient._queryBuilder.order).toHaveBeenCalledWith('created_at', {
				ascending: false
			});
			expect(mockClient._queryBuilder.limit).toHaveBeenCalledWith(50);
		});

		it('uses custom limit when provided', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: [],
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.getRecentHistory(10);

			expect(mockClient._queryBuilder.limit).toHaveBeenCalledWith(10);
		});
	});

	describe('searchMembers', () => {
		it('searches by phone number digits', async () => {
			const mockMembers: LoyaltyMember[] = [
				{
					id: '1',
					phone: '8174016310',
					name: 'John Doe',
					email: null,
					punches: 5,
					total_punches: 15,
					total_redeemed: 1,
					created_at: '2026-01-01T00:00:00Z',
					last_visit: '2026-01-17T12:00:00Z'
				}
			];

			mockClient._queryBuilder.mockResolvedValue({
				data: mockMembers,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.searchMembers('817-401');

			expect(result).toEqual(mockMembers);
			expect(mockClient._queryBuilder.or).toHaveBeenCalledWith(
				'phone.ilike.%817401%,name.ilike.%817-401%'
			);
			expect(mockClient._queryBuilder.limit).toHaveBeenCalledWith(10);
		});

		it('returns empty array for queries with less than 3 digits', async () => {
			const service = createLoyaltyService(asMockClient(mockClient));

			const result1 = await service.searchMembers('81');
			const result2 = await service.searchMembers('ab');

			expect(result1).toEqual([]);
			expect(result2).toEqual([]);
			expect(mockClient.from).not.toHaveBeenCalled();
		});

		it('searches by name when query contains letters', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: [],
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.searchMembers('John123');

			expect(mockClient._queryBuilder.or).toHaveBeenCalledWith(
				'phone.ilike.%123%,name.ilike.%John123%'
			);
		});
	});

	describe('createMember', () => {
		it('creates a new member with initial punch and records history', async () => {
			const newMember: LoyaltyMember = {
				id: 'new-member-id',
				phone: '8175551234',
				name: 'New Member',
				email: 'new@example.com',
				punches: 1,
				total_punches: 1,
				total_redeemed: 0,
				created_at: '2026-01-17T12:00:00Z',
				last_visit: '2026-01-17T12:00:00Z'
			};

			mockClient._queryBuilder.mockResolvedValue({
				data: newMember,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.createMember('8175551234', 'New Member', 'new@example.com');

			expect(result).toEqual(newMember);
			expect(mockClient.from).toHaveBeenCalledWith('loyalty_members');
			expect(mockClient._queryBuilder.insert).toHaveBeenCalledWith(
				expect.objectContaining({
					phone: '8175551234',
					name: 'New Member',
					email: 'new@example.com',
					punches: 1,
					total_punches: 1
				})
			);
		});

		it('creates member with null email', async () => {
			const newMember: LoyaltyMember = {
				id: 'new-member-id',
				phone: '8175551234',
				name: 'New Member',
				email: null,
				punches: 1,
				total_punches: 1,
				total_redeemed: 0,
				created_at: '2026-01-17T12:00:00Z',
				last_visit: '2026-01-17T12:00:00Z'
			};

			mockClient._queryBuilder.mockResolvedValue({
				data: newMember,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.createMember('8175551234', 'New Member', null);

			expect(result.email).toBeNull();
		});

		it('throws ServiceError on duplicate phone', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError(
					'duplicate key value violates unique constraint',
					'23505',
					'Key (phone)=(8175551234) already exists.'
				)
			});

			const service = createLoyaltyService(asMockClient(mockClient));

			await expect(service.createMember('8175551234', 'Test', null)).rejects.toThrow(ServiceError);
		});
	});

	describe('addPunches', () => {
		it('adds punches and updates last_visit', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.addPunches('member-1', 3, 10, 2);

			expect(result).toEqual({ newPunches: 5, actualAdded: 2 });
			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith(
				expect.objectContaining({
					punches: 5,
					total_punches: 12
				})
			);
		});

		it('caps punches at 9 maximum', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.addPunches('member-1', 7, 20, 5);

			// Should only add 2 punches to reach 9, not 5
			expect(result).toEqual({ newPunches: 9, actualAdded: 2 });
			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith(
				expect.objectContaining({
					punches: 9,
					total_punches: 22 // 20 + 2 actual added
				})
			);
		});

		it('returns zero actual added when already at 9', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			const result = await service.addPunches('member-1', 9, 25, 3);

			expect(result).toEqual({ newPunches: 9, actualAdded: 0 });
		});

		it('records punch in history', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.addPunches('member-1', 3, 10, 2);

			// Second call to from should be for loyalty_history
			expect(mockClient.from).toHaveBeenCalledWith('loyalty_history');
			expect(mockClient._queryBuilder.insert).toHaveBeenCalledWith(
				expect.objectContaining({
					member_id: 'member-1',
					action: 'punch',
					punch_count: 2
				})
			);
		});
	});

	describe('redeemReward', () => {
		it('resets punches to 0 and increments total_redeemed', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.redeemReward('member-1', 2);

			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith(
				expect.objectContaining({
					punches: 0,
					total_redeemed: 3
				})
			);
		});

		it('records redemption in history', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.redeemReward('member-1', 2);

			expect(mockClient.from).toHaveBeenCalledWith('loyalty_history');
			expect(mockClient._queryBuilder.insert).toHaveBeenCalledWith(
				expect.objectContaining({
					member_id: 'member-1',
					action: 'redeem',
					punch_count: null
				})
			);
		});
	});

	describe('updateMemberPhone', () => {
		it('updates member phone number', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.updateMemberPhone('member-1', '8175559999');

			expect(mockClient.from).toHaveBeenCalledWith('loyalty_members');
			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				phone: '8175559999'
			});
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'member-1');
		});
	});

	describe('updateMemberEmail', () => {
		it('updates member email', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.updateMemberEmail('member-1', 'newemail@example.com');

			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				email: 'newemail@example.com'
			});
		});

		it('allows setting email to null', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.updateMemberEmail('member-1', null);

			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				email: null
			});
		});
	});

	describe('deleteMember', () => {
		it('deletes a member by id', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createLoyaltyService(asMockClient(mockClient));
			await service.deleteMember('member-123');

			expect(mockClient.from).toHaveBeenCalledWith('loyalty_members');
			expect(mockClient._queryBuilder.delete).toHaveBeenCalled();
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'member-123');
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Foreign key constraint violation', '23503')
			});

			const service = createLoyaltyService(asMockClient(mockClient));

			await expect(service.deleteMember('member-123')).rejects.toThrow(ServiceError);
		});
	});
});
