import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLLMs, getLLMById, createLLM, updateLLM, deleteLLM, testLLM } from './llms';
import type { LLM, CreateLLMRequest, UpdateLLMRequest } from './llms';

// Mock WEBUI_API_BASE_URL
vi.mock('$lib/constants', () => ({
	WEBUI_API_BASE_URL: 'http://localhost:8000/api/v1'
}));

const mockLLM: LLM = {
	id: 1,
	name: 'GPT-4',
	provider: 'LLM_PROVIDER_OPENAI_COMPATIBLE',
	model_id: 'gpt-4',
	endpoint: 'https://api.openai.com/v1',
	has_api_key: true,
	max_tokens: 4096,
	temperature: 0.7,
	is_default: true,
	is_active: true,
	creation_date: '2024-01-01T00:00:00Z',
	last_update: '2024-01-01T00:00:00Z'
};

describe('LLMs API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getLLMs', () => {
		it('should fetch LLMs successfully', async () => {
			const mockResponse = { llms: [mockLLM], pagination: { page: 1, total: 1 } };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getLLMs('test-token');

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/llms?',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					})
				})
			);
			expect(result.llms).toHaveLength(1);
			expect(result.llms[0].name).toBe('GPT-4');
		});

		it('should include query params when provided', async () => {
			const mockResponse = { llms: [mockLLM] };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			await getLLMs('test-token', { page: 2, page_size: 10, is_active: true });

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('page=2'),
				expect.any(Object)
			);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('page_size=10'),
				expect.any(Object)
			);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('is_active=true'),
				expect.any(Object)
			);
		});

		it('should throw error on API failure', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Unauthorized' })
			});

			await expect(getLLMs('invalid-token')).rejects.toBe('Unauthorized');
		});
	});

	describe('getLLMById', () => {
		it('should fetch single LLM by ID', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockLLM)
			});

			const result = await getLLMById('test-token', 1);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/llms/1',
				expect.objectContaining({ method: 'GET' })
			);
			expect(result.id).toBe(1);
			expect(result.name).toBe('GPT-4');
		});

		it('should throw error when LLM not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'LLM not found' })
			});

			await expect(getLLMById('test-token', 999)).rejects.toBe('LLM not found');
		});
	});

	describe('createLLM', () => {
		it('should create LLM with required fields', async () => {
			const createRequest: CreateLLMRequest = {
				name: 'New LLM',
				provider: 'LLM_PROVIDER_ANTHROPIC',
				model_id: 'claude-3-opus',
				api_key: 'sk-test'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockLLM, ...createRequest, id: 2 })
			});

			const result = await createLLM('test-token', createRequest);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/llms',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(createRequest)
				})
			);
			expect(result.name).toBe('New LLM');
		});

		it('should create LLM with all optional fields', async () => {
			const createRequest: CreateLLMRequest = {
				name: 'Full LLM',
				provider: 'LLM_PROVIDER_OPENAI_COMPATIBLE',
				model_id: 'gpt-4',
				endpoint: 'https://api.openai.com/v1',
				api_key: 'sk-test',
				max_tokens: 8192,
				temperature: 0.5,
				is_default: true,
				is_active: true
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockLLM, ...createRequest, id: 3 })
			});

			const result = await createLLM('test-token', createRequest);

			expect(result.max_tokens).toBe(8192);
			expect(result.temperature).toBe(0.5);
		});

		it('should throw error on validation failure', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Name is required' })
			});

			await expect(
				createLLM('test-token', { name: '', provider: 'LLM_PROVIDER_ANTHROPIC', model_id: 'test' })
			).rejects.toBe('Name is required');
		});
	});

	describe('updateLLM', () => {
		it('should update LLM with partial data', async () => {
			const updateRequest: UpdateLLMRequest = {
				name: 'Updated Name',
				temperature: 0.9
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockLLM, ...updateRequest })
			});

			const result = await updateLLM('test-token', 1, updateRequest);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/llms/1',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(updateRequest)
				})
			);
			expect(result.name).toBe('Updated Name');
			expect(result.temperature).toBe(0.9);
		});

		it('should update API key', async () => {
			const updateRequest: UpdateLLMRequest = {
				api_key: 'new-secret-key'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockLLM, has_api_key: true })
			});

			const result = await updateLLM('test-token', 1, updateRequest);

			expect(result.has_api_key).toBe(true);
		});
	});

	describe('deleteLLM', () => {
		it('should delete LLM successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await deleteLLM('test-token', 1);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/llms/1',
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('should throw error when LLM not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'LLM not found' })
			});

			await expect(deleteLLM('test-token', 999)).rejects.toBe('LLM not found');
		});
	});

	describe('testLLM', () => {
		it('should test LLM connection successfully', async () => {
			const testResponse = { success: true, message: 'Connection successful', latency_ms: 150 };

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(testResponse)
			});

			const result = await testLLM('test-token', 1);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/llms/1/test',
				expect.objectContaining({ method: 'POST' })
			);
			expect(result.success).toBe(true);
			expect(result.latency_ms).toBe(150);
		});

		it('should return failure on connection error', async () => {
			const testResponse = { success: false, message: 'Connection refused', latency_ms: 0 };

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(testResponse)
			});

			const result = await testLLM('test-token', 1);

			expect(result.success).toBe(false);
			expect(result.message).toBe('Connection refused');
		});
	});
});
