import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getEmbeddingModels,
	getActiveEmbeddingModel,
	createEmbeddingModel,
	activateEmbeddingModel
} from './embedding-models';

describe('Embedding Models API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getEmbeddingModels', () => {
		it('should fetch embedding models list successfully', async () => {
			const mockResponse = {
				models: [
					{
						id: 1,
						model_id: 'all-MiniLM-L6-v2',
						model_name: 'MiniLM L6 v2',
						model_dimension: 384,
						is_active: true
					},
					{
						id: 2,
						model_id: 'text-embedding-ada-002',
						model_name: 'OpenAI Ada 002',
						model_dimension: 1536,
						is_active: false
					}
				]
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getEmbeddingModels('test-token');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/embedding-models'),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					})
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should throw error on failed request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Unauthorized' })
			});

			await expect(getEmbeddingModels('test-token')).rejects.toEqual('Unauthorized');
		});
	});

	describe('getActiveEmbeddingModel', () => {
		it('should fetch active embedding model successfully', async () => {
			const mockModel = {
				id: 1,
				model_id: 'all-MiniLM-L6-v2',
				model_name: 'MiniLM L6 v2',
				model_dimension: 384,
				is_active: true
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockModel)
			});

			const result = await getActiveEmbeddingModel('test-token');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/embedding-models/active'),
				expect.objectContaining({
					method: 'GET'
				})
			);
			expect(result).toEqual(mockModel);
		});

		it('should throw error when no active model', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'No active embedding model' })
			});

			await expect(getActiveEmbeddingModel('test-token')).rejects.toEqual('No active embedding model');
		});
	});

	describe('createEmbeddingModel', () => {
		it('should create embedding model successfully', async () => {
			const mockModel = {
				id: 1,
				model_id: 'all-MiniLM-L6-v2',
				model_name: 'MiniLM L6 v2',
				model_dimension: 384,
				is_active: false
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockModel)
			});

			const result = await createEmbeddingModel('test-token', {
				model_id: 'all-MiniLM-L6-v2',
				model_name: 'MiniLM L6 v2',
				model_dimension: 384
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/embedding-models'),
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('all-MiniLM-L6-v2')
				})
			);
			expect(result).toEqual(mockModel);
		});

		it('should include endpoint when provided', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ id: 1 })
			});

			await createEmbeddingModel('test-token', {
				model_id: 'custom-model',
				model_name: 'Custom Model',
				model_dimension: 512,
				endpoint: 'https://custom.endpoint.com'
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining('custom.endpoint.com')
				})
			);
		});

		it('should throw error on creation failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Model ID already exists' })
			});

			await expect(
				createEmbeddingModel('test-token', {
					model_id: 'duplicate',
					model_name: 'Duplicate',
					model_dimension: 384
				})
			).rejects.toEqual('Model ID already exists');
		});
	});

	describe('activateEmbeddingModel', () => {
		it('should activate embedding model successfully', async () => {
			const mockResponse = {
				success: true,
				message: 'Model activated',
				requires_reindex: false,
				documents_affected: 0
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await activateEmbeddingModel('test-token', 1);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/embedding-models/1/activate'),
				expect.objectContaining({
					method: 'PUT'
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should return reindex info when dimension changes', async () => {
			const mockResponse = {
				success: true,
				message: 'Model activated, reindex required',
				requires_reindex: true,
				documents_affected: 150
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await activateEmbeddingModel('test-token', 2);

			expect(result.requires_reindex).toBe(true);
			expect(result.documents_affected).toBe(150);
		});

		it('should throw error on activation failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Model not found' })
			});

			await expect(activateEmbeddingModel('test-token', 999)).rejects.toEqual('Model not found');
		});
	});
});
