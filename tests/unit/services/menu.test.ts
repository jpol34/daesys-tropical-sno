import { describe, it, expect, beforeEach } from 'vitest';
import { createMenuService, getContentLabel } from '$lib/services/menu';
import {
	createMockSupabaseClient,
	asMockClient,
	createPostgrestError,
	type MockSupabaseClient
} from '../../mocks/supabase';
import { ServiceError } from '$lib/services/base';
import type { Flavor, Concoction, SiteContent } from '$lib/types';

describe('menu service utilities', () => {
	describe('getContentLabel', () => {
		it('returns label for specials_message key', () => {
			expect(getContentLabel('specials_message')).toBe('Specials Message');
		});

		it('returns label for popsicle_wednesday_cta key', () => {
			expect(getContentLabel('popsicle_wednesday_cta')).toBe('Popsicle Wednesday CTA');
		});

		it('returns label for popsicle_wednesday_details key', () => {
			expect(getContentLabel('popsicle_wednesday_details')).toBe('Popsicle Wednesday Details');
		});

		it('returns key as fallback for unknown keys', () => {
			expect(getContentLabel('unknown_key')).toBe('unknown_key');
			expect(getContentLabel('some_other_key')).toBe('some_other_key');
		});
	});
});

describe('menu service with dependency injection', () => {
	let mockClient: MockSupabaseClient;

	beforeEach(() => {
		mockClient = createMockSupabaseClient();
	});

	describe('getAllFlavors', () => {
		it('returns flavors ordered by sort_order', async () => {
			const mockFlavors: Flavor[] = [
				{ id: '1', name: 'Cherry', active: true, sort_order: 0 },
				{ id: '2', name: 'Blue Raspberry', active: true, sort_order: 1 },
				{ id: '3', name: 'Grape', active: false, sort_order: 2 }
			];

			mockClient._queryBuilder.mockResolvedValue({
				data: mockFlavors,
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			const result = await service.getAllFlavors();

			expect(result).toEqual(mockFlavors);
			expect(mockClient.from).toHaveBeenCalledWith('flavors');
			expect(mockClient._queryBuilder.select).toHaveBeenCalledWith('*');
			expect(mockClient._queryBuilder.order).toHaveBeenCalledWith('sort_order', {
				ascending: true
			});
		});

		it('returns empty array when no flavors exist', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: [],
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			const result = await service.getAllFlavors();

			expect(result).toEqual([]);
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Connection failed', 'PGRST000')
			});

			const service = createMenuService(asMockClient(mockClient));

			await expect(service.getAllFlavors()).rejects.toThrow(ServiceError);
			await expect(service.getAllFlavors()).rejects.toThrow('Connection failed');
		});
	});

	describe('addFlavor', () => {
		it('inserts a new flavor and returns it', async () => {
			const newFlavor: Flavor = {
				id: 'new-id',
				name: 'Watermelon',
				active: true,
				sort_order: 5
			};

			mockClient._queryBuilder.mockResolvedValue({
				data: newFlavor,
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			const result = await service.addFlavor('Watermelon', 5);

			expect(result).toEqual(newFlavor);
			expect(mockClient.from).toHaveBeenCalledWith('flavors');
			expect(mockClient._queryBuilder.insert).toHaveBeenCalledWith({
				name: 'Watermelon',
				sort_order: 5
			});
			expect(mockClient._queryBuilder.single).toHaveBeenCalled();
		});

		it('throws ServiceError on duplicate name', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError(
					'duplicate key value violates unique constraint',
					'23505',
					'Key (name)=(Cherry) already exists.'
				)
			});

			const service = createMenuService(asMockClient(mockClient));

			await expect(service.addFlavor('Cherry', 0)).rejects.toThrow(ServiceError);
		});
	});

	describe('updateFlavor', () => {
		it('updates flavor name and active status', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const flavor: Flavor = {
				id: 'flavor-1',
				name: 'Updated Cherry',
				active: false,
				sort_order: 0
			};

			const service = createMenuService(asMockClient(mockClient));
			await service.updateFlavor(flavor);

			expect(mockClient.from).toHaveBeenCalledWith('flavors');
			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				name: 'Updated Cherry',
				active: false
			});
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'flavor-1');
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Permission denied', '42501')
			});

			const flavor: Flavor = {
				id: 'flavor-1',
				name: 'Test',
				active: true,
				sort_order: 0
			};

			const service = createMenuService(asMockClient(mockClient));

			await expect(service.updateFlavor(flavor)).rejects.toThrow(ServiceError);
		});
	});

	describe('deleteFlavor', () => {
		it('deletes a flavor by id', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			await service.deleteFlavor('flavor-123');

			expect(mockClient.from).toHaveBeenCalledWith('flavors');
			expect(mockClient._queryBuilder.delete).toHaveBeenCalled();
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'flavor-123');
		});

		it('throws ServiceError when flavor not found', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Record not found', 'PGRST116')
			});

			const service = createMenuService(asMockClient(mockClient));

			await expect(service.deleteFlavor('nonexistent')).rejects.toThrow(ServiceError);
		});
	});

	describe('getAllConcoctions', () => {
		it('returns concoctions ordered by sort_order', async () => {
			const mockConcoctions: Concoction[] = [
				{
					id: '1',
					name: 'Tiger Blood',
					ingredients: ['Strawberry', 'Watermelon', 'Coconut'],
					active: true,
					sort_order: 0
				},
				{
					id: '2',
					name: 'Rainbow',
					ingredients: ['Cherry', 'Lemon', 'Blue Raspberry'],
					active: true,
					sort_order: 1
				}
			];

			mockClient._queryBuilder.mockResolvedValue({
				data: mockConcoctions,
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			const result = await service.getAllConcoctions();

			expect(result).toEqual(mockConcoctions);
			expect(mockClient.from).toHaveBeenCalledWith('concoctions');
			expect(mockClient._queryBuilder.order).toHaveBeenCalledWith('sort_order', {
				ascending: true
			});
		});

		it('returns empty array when no concoctions exist', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: [],
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			const result = await service.getAllConcoctions();

			expect(result).toEqual([]);
		});
	});

	describe('addConcoction', () => {
		it('inserts a new concoction and returns it', async () => {
			const newConcoction: Concoction = {
				id: 'new-id',
				name: 'Sunset',
				ingredients: ['Orange', 'Mango', 'Pineapple'],
				active: true,
				sort_order: 10
			};

			mockClient._queryBuilder.mockResolvedValue({
				data: newConcoction,
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			const result = await service.addConcoction('Sunset', ['Orange', 'Mango', 'Pineapple'], 10);

			expect(result).toEqual(newConcoction);
			expect(mockClient._queryBuilder.insert).toHaveBeenCalledWith({
				name: 'Sunset',
				ingredients: ['Orange', 'Mango', 'Pineapple'],
				sort_order: 10
			});
		});
	});

	describe('updateConcoction', () => {
		it('updates concoction name, ingredients, and active status', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const concoction: Concoction = {
				id: 'concoction-1',
				name: 'Updated Tiger Blood',
				ingredients: ['Strawberry', 'Watermelon'],
				active: false,
				sort_order: 0
			};

			const service = createMenuService(asMockClient(mockClient));
			await service.updateConcoction(concoction);

			expect(mockClient.from).toHaveBeenCalledWith('concoctions');
			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				name: 'Updated Tiger Blood',
				ingredients: ['Strawberry', 'Watermelon'],
				active: false
			});
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'concoction-1');
		});
	});

	describe('deleteConcoction', () => {
		it('deletes a concoction by id', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			await service.deleteConcoction('concoction-123');

			expect(mockClient.from).toHaveBeenCalledWith('concoctions');
			expect(mockClient._queryBuilder.delete).toHaveBeenCalled();
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'concoction-123');
		});
	});

	describe('getAllSiteContent', () => {
		it('returns site content ordered by key', async () => {
			const mockContent: SiteContent[] = [
				{ id: '1', key: 'popsicle_wednesday_cta', value: 'Get yours!', description: 'CTA text' },
				{ id: '2', key: 'specials_message', value: 'Summer special!', description: 'Specials' }
			];

			mockClient._queryBuilder.mockResolvedValue({
				data: mockContent,
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			const result = await service.getAllSiteContent();

			expect(result).toEqual(mockContent);
			expect(mockClient.from).toHaveBeenCalledWith('site_content');
			expect(mockClient._queryBuilder.order).toHaveBeenCalledWith('key');
		});
	});

	describe('updateSiteContent', () => {
		it('updates site content value by id', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: null
			});

			const service = createMenuService(asMockClient(mockClient));
			await service.updateSiteContent('content-1', 'New value here');

			expect(mockClient.from).toHaveBeenCalledWith('site_content');
			expect(mockClient._queryBuilder.update).toHaveBeenCalledWith({
				value: 'New value here'
			});
			expect(mockClient._queryBuilder.eq).toHaveBeenCalledWith('id', 'content-1');
		});

		it('throws ServiceError on database error', async () => {
			mockClient._queryBuilder.mockResolvedValue({
				data: null,
				error: createPostgrestError('Update failed', 'PGRST204')
			});

			const service = createMenuService(asMockClient(mockClient));

			await expect(service.updateSiteContent('content-1', 'value')).rejects.toThrow(ServiceError);
		});
	});
});
