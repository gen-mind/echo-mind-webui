import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getDocuments,
	getDocumentById,
	deleteDocument,
	searchDocuments
} from './documents';

describe('Documents API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getDocuments', () => {
		it('should fetch documents list successfully', async () => {
			const mockResponse = {
				documents: [
					{
						id: 1,
						title: 'Test Document',
						status: 'DOCUMENT_STATUS_COMPLETED',
						chunk_count: 10
					}
				],
				pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 }
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getDocuments('test-token');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents?'),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					})
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should include query params when provided', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ documents: [], pagination: {} })
			});

			await getDocuments('test-token', {
				page: 2,
				limit: 10,
				connector_id: 5,
				doc_status: 'completed'
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringMatching(/page=2.*limit=10.*connector_id=5.*doc_status=completed/),
				expect.any(Object)
			);
		});

		it('should throw error on failed request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Not found' })
			});

			await expect(getDocuments('test-token')).rejects.toEqual('Not found');
		});
	});

	describe('getDocumentById', () => {
		it('should fetch single document successfully', async () => {
			const mockDocument = {
				id: 1,
				title: 'Test Document',
				status: 'DOCUMENT_STATUS_COMPLETED'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockDocument)
			});

			const result = await getDocumentById('test-token', 1);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/1'),
				expect.objectContaining({
					method: 'GET'
				})
			);
			expect(result).toEqual(mockDocument);
		});

		it('should throw error when document not found', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Document not found' })
			});

			await expect(getDocumentById('test-token', 999)).rejects.toEqual('Document not found');
		});
	});

	describe('deleteDocument', () => {
		it('should delete document successfully', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true
			});

			await deleteDocument('test-token', 1);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/1'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});

		it('should throw error on delete failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Cannot delete document' })
			});

			await expect(deleteDocument('test-token', 1)).rejects.toEqual('Cannot delete document');
		});
	});

	describe('searchDocuments', () => {
		it('should search documents successfully', async () => {
			const mockResponse = {
				results: [
					{
						document: { id: 1, title: 'Test' },
						chunk_id: 'chunk-1',
						chunk_content: 'Matching content',
						score: 0.95
					}
				]
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await searchDocuments('test-token', { query: 'test query' });

			expect(fetch).toHaveBeenCalledWith(
				expect.stringMatching(/\/documents\/search\?.*query=test(\+|%20)query/),
				expect.objectContaining({
					method: 'GET'
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should include optional search params', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ results: [] })
			});

			await searchDocuments('test-token', {
				query: 'test',
				connector_id: 3,
				limit: 5,
				min_score: 0.8
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringMatching(/connector_id=3.*limit=5.*min_score=0\.8/),
				expect.any(Object)
			);
		});

		it('should throw error on search failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Search failed' })
			});

			await expect(searchDocuments('test-token', { query: 'test' })).rejects.toEqual('Search failed');
		});
	});
});
