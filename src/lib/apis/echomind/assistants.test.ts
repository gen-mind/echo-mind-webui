import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getAssistants,
	getAssistantById,
	createAssistant,
	updateAssistant,
	deleteAssistant
} from './assistants';
import type { Assistant, CreateAssistantRequest, UpdateAssistantRequest } from './assistants';

// Mock WEBUI_API_BASE_URL
vi.mock('$lib/constants', () => ({
	WEBUI_API_BASE_URL: 'http://localhost:8000/api/v1'
}));

const mockAssistant: Assistant = {
	id: 1,
	name: 'Research Assistant',
	description: 'Helps with research tasks',
	llm_id: 1,
	system_prompt: 'You are a helpful research assistant.',
	task_prompt: '',
	starter_messages: ['Help me find papers on AI'],
	is_default: false,
	is_visible: true,
	display_priority: 0,
	created_by: 1,
	creation_date: '2024-01-01T00:00:00Z',
	last_update: '2024-01-01T00:00:00Z'
};

describe('Assistants API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getAssistants', () => {
		it('should fetch assistants successfully', async () => {
			const mockResponse = { assistants: [mockAssistant] };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getAssistants('test-token');

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/assistants?',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					})
				})
			);
			expect(result.assistants).toHaveLength(1);
			expect(result.assistants[0].name).toBe('Research Assistant');
		});

		it('should filter by visibility', async () => {
			const mockResponse = { assistants: [mockAssistant] };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			await getAssistants('test-token', { is_visible: true });

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('is_visible=true'),
				expect.any(Object)
			);
		});

		it('should throw error on API failure', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Unauthorized' })
			});

			await expect(getAssistants('invalid-token')).rejects.toBe('Unauthorized');
		});
	});

	describe('getAssistantById', () => {
		it('should fetch single assistant by ID', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockAssistant)
			});

			const result = await getAssistantById('test-token', 1);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/assistants/1',
				expect.objectContaining({ method: 'GET' })
			);
			expect(result.id).toBe(1);
			expect(result.system_prompt).toBe('You are a helpful research assistant.');
		});

		it('should throw error when assistant not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Assistant not found' })
			});

			await expect(getAssistantById('test-token', 999)).rejects.toBe('Assistant not found');
		});
	});

	describe('createAssistant', () => {
		it('should create assistant with required fields', async () => {
			const createRequest: CreateAssistantRequest = {
				name: 'New Assistant',
				llm_id: 1,
				system_prompt: 'You are helpful.'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockAssistant, ...createRequest, id: 2 })
			});

			const result = await createAssistant('test-token', createRequest);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/assistants',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(createRequest)
				})
			);
			expect(result.name).toBe('New Assistant');
		});

		it('should create assistant with starter messages', async () => {
			const createRequest: CreateAssistantRequest = {
				name: 'Assistant with starters',
				llm_id: 1,
				system_prompt: 'You are helpful.',
				starter_messages: ['Hello!', 'How can I help?', 'What would you like to do?']
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockAssistant, ...createRequest, id: 3 })
			});

			const result = await createAssistant('test-token', createRequest);

			expect(result.starter_messages).toHaveLength(3);
		});

		it('should create default assistant', async () => {
			const createRequest: CreateAssistantRequest = {
				name: 'Default Assistant',
				llm_id: 1,
				system_prompt: 'Default prompt',
				is_default: true
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockAssistant, ...createRequest, is_default: true })
			});

			const result = await createAssistant('test-token', createRequest);

			expect(result.is_default).toBe(true);
		});

		it('should throw error on validation failure', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'LLM not found' })
			});

			await expect(
				createAssistant('test-token', { name: 'Test', llm_id: 999, system_prompt: 'Test' })
			).rejects.toBe('LLM not found');
		});
	});

	describe('updateAssistant', () => {
		it('should update assistant name', async () => {
			const updateRequest: UpdateAssistantRequest = {
				name: 'Updated Name'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockAssistant, name: 'Updated Name' })
			});

			const result = await updateAssistant('test-token', 1, updateRequest);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/assistants/1',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(updateRequest)
				})
			);
			expect(result.name).toBe('Updated Name');
		});

		it('should update system prompt', async () => {
			const updateRequest: UpdateAssistantRequest = {
				system_prompt: 'New system prompt with different behavior.'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						...mockAssistant,
						system_prompt: 'New system prompt with different behavior.'
					})
			});

			const result = await updateAssistant('test-token', 1, updateRequest);

			expect(result.system_prompt).toBe('New system prompt with different behavior.');
		});

		it('should update starter messages', async () => {
			const updateRequest: UpdateAssistantRequest = {
				starter_messages: ['New starter 1', 'New starter 2']
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({ ...mockAssistant, starter_messages: ['New starter 1', 'New starter 2'] })
			});

			const result = await updateAssistant('test-token', 1, updateRequest);

			expect(result.starter_messages).toEqual(['New starter 1', 'New starter 2']);
		});
	});

	describe('deleteAssistant', () => {
		it('should delete assistant successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await deleteAssistant('test-token', 1);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/assistants/1',
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('should throw error when assistant not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Assistant not found' })
			});

			await expect(deleteAssistant('test-token', 999)).rejects.toBe('Assistant not found');
		});

		it('should throw error when assistant is in use', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Cannot delete assistant in use by active chats' })
			});

			await expect(deleteAssistant('test-token', 1)).rejects.toBe(
				'Cannot delete assistant in use by active chats'
			);
		});
	});
});
