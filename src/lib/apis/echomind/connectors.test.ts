import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getConnectors,
	getConnectorById,
	createConnector,
	updateConnector,
	deleteConnector,
	triggerConnectorSync,
	getConnectorStatus
} from './connectors';

describe('Connectors API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getConnectors', () => {
		it('should fetch connectors list successfully', async () => {
			const mockResponse = {
				connectors: [
					{
						id: 1,
						name: 'Test Connector',
						type: 'CONNECTOR_TYPE_FILE',
						status: 'CONNECTOR_STATUS_ACTIVE'
					}
				],
				pagination: { page: 1, page_size: 100, total: 1, total_pages: 1 }
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getConnectors('test-token');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/connectors?'),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					})
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should include filter params when provided', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ connectors: [], pagination: {} })
			});

			await getConnectors('test-token', {
				page: 2,
				page_size: 50,
				type: 'CONNECTOR_TYPE_WEB',
				status: 'CONNECTOR_STATUS_ACTIVE'
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringMatching(/page=2.*page_size=50/),
				expect.any(Object)
			);
		});

		it('should throw error on failed request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Unauthorized' })
			});

			await expect(getConnectors('test-token')).rejects.toEqual('Unauthorized');
		});
	});

	describe('getConnectorById', () => {
		it('should fetch single connector successfully', async () => {
			const mockConnector = {
				id: 1,
				name: 'Test Connector',
				type: 'CONNECTOR_TYPE_FILE'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockConnector)
			});

			const result = await getConnectorById('test-token', 1);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/connectors/1'),
				expect.objectContaining({
					method: 'GET'
				})
			);
			expect(result).toEqual(mockConnector);
		});

		it('should throw error when connector not found', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Connector not found' })
			});

			await expect(getConnectorById('test-token', 999)).rejects.toEqual('Connector not found');
		});
	});

	describe('createConnector', () => {
		it('should create connector successfully', async () => {
			const mockConnector = {
				id: 1,
				name: 'New Connector',
				type: 'CONNECTOR_TYPE_WEB',
				status: 'CONNECTOR_STATUS_PENDING'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockConnector)
			});

			const result = await createConnector('test-token', {
				name: 'New Connector',
				type: 'CONNECTOR_TYPE_WEB',
				scope: 'CONNECTOR_SCOPE_USER',
				config: { url: 'https://example.com' },
				refresh_freq_minutes: 60
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/connectors'),
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('New Connector')
				})
			);
			expect(result).toEqual(mockConnector);
		});

		it('should throw error on creation failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Invalid configuration' })
			});

			await expect(
				createConnector('test-token', {
					name: 'Test',
					type: 'CONNECTOR_TYPE_FILE',
					scope: 'CONNECTOR_SCOPE_USER'
				})
			).rejects.toEqual('Invalid configuration');
		});
	});

	describe('updateConnector', () => {
		it('should update connector successfully', async () => {
			const mockConnector = {
				id: 1,
				name: 'Updated Connector',
				type: 'CONNECTOR_TYPE_FILE'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockConnector)
			});

			const result = await updateConnector('test-token', 1, {
				name: 'Updated Connector',
				refresh_freq_minutes: 120
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/connectors/1'),
				expect.objectContaining({
					method: 'PUT',
					body: expect.stringContaining('Updated Connector')
				})
			);
			expect(result).toEqual(mockConnector);
		});

		it('should throw error on update failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Update failed' })
			});

			await expect(
				updateConnector('test-token', 1, { name: 'Test' })
			).rejects.toEqual('Update failed');
		});
	});

	describe('deleteConnector', () => {
		it('should delete connector successfully', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true
			});

			await deleteConnector('test-token', 1);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/connectors/1'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});

		it('should throw error on delete failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Cannot delete connector' })
			});

			await expect(deleteConnector('test-token', 1)).rejects.toEqual('Cannot delete connector');
		});
	});

	describe('triggerConnectorSync', () => {
		it('should trigger sync successfully', async () => {
			const mockResponse = {
				success: true,
				message: 'Sync triggered'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await triggerConnectorSync('test-token', 1);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/connectors/1/sync'),
				expect.objectContaining({
					method: 'POST'
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should throw error on sync trigger failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Sync in progress' })
			});

			await expect(triggerConnectorSync('test-token', 1)).rejects.toEqual('Sync in progress');
		});
	});

	describe('getConnectorStatus', () => {
		it('should fetch connector status successfully', async () => {
			const mockStatus = {
				status: 'CONNECTOR_STATUS_ACTIVE',
				status_message: 'All synced',
				last_sync_at: '2024-01-01T00:00:00Z',
				docs_analyzed: 100,
				docs_pending: 5
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockStatus)
			});

			const result = await getConnectorStatus('test-token', 1);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/connectors/1/status'),
				expect.objectContaining({
					method: 'GET'
				})
			);
			expect(result).toEqual(mockStatus);
		});

		it('should throw error on status fetch failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Status unavailable' })
			});

			await expect(getConnectorStatus('test-token', 1)).rejects.toEqual('Status unavailable');
		});
	});
});
