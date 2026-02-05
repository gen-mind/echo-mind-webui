import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	initiateUpload,
	completeUpload,
	abortUpload,
	uploadFileToPresignedUrl,
	uploadDocument
} from './upload';

describe('Upload API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('initiateUpload', () => {
		it('should initiate upload successfully', async () => {
			const mockResponse = {
				document_id: 123,
				upload_url: 'https://minio.example.com/presigned-url',
				expires_in: 3600,
				storage_path: 'uploads/123/test.pdf'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await initiateUpload('test-token', {
				filename: 'test.pdf',
				content_type: 'application/pdf',
				size: 1024
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/upload/initiate'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					}),
					body: expect.stringContaining('test.pdf')
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should throw error on initiation failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'File too large' })
			});

			await expect(
				initiateUpload('test-token', {
					filename: 'huge.pdf',
					content_type: 'application/pdf',
					size: 1000000000
				})
			).rejects.toEqual('File too large');
		});
	});

	describe('completeUpload', () => {
		it('should complete upload successfully', async () => {
			const mockDocument = {
				id: 1,
				title: 'Test Document',
				status: 'DOCUMENT_STATUS_PENDING'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockDocument)
			});

			const result = await completeUpload('test-token', {
				document_id: 123
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/upload/complete'),
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('123')
				})
			);
			expect(result).toEqual(mockDocument);
		});

		it('should throw error on completion failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Upload expired' })
			});

			await expect(
				completeUpload('test-token', { document_id: 123 })
			).rejects.toEqual('Upload expired');
		});
	});

	describe('abortUpload', () => {
		it('should abort upload successfully', async () => {
			const mockResponse = {
				success: true
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await abortUpload('test-token', {
				document_id: 123
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/upload/abort'),
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('123')
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should throw error on abort failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Upload not found' })
			});

			await expect(
				abortUpload('test-token', { document_id: 123 })
			).rejects.toEqual('Upload not found');
		});
	});

	describe('uploadFileToPresignedUrl', () => {
		let mockXHR: {
			open: ReturnType<typeof vi.fn>;
			send: ReturnType<typeof vi.fn>;
			setRequestHeader: ReturnType<typeof vi.fn>;
			upload: { addEventListener: ReturnType<typeof vi.fn> };
			addEventListener: ReturnType<typeof vi.fn>;
			status: number;
		};

		beforeEach(() => {
			mockXHR = {
				open: vi.fn(),
				send: vi.fn(),
				setRequestHeader: vi.fn(),
				upload: { addEventListener: vi.fn() },
				addEventListener: vi.fn(),
				status: 200
			};

			global.XMLHttpRequest = vi.fn(() => mockXHR) as unknown as typeof XMLHttpRequest;
		});

		it('should upload file to presigned URL successfully', async () => {
			const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
			const uploadUrl = 'https://minio.example.com/presigned-url';

			mockXHR.send = vi.fn(() => {
				const loadHandler = mockXHR.addEventListener.mock.calls.find(
					(call) => call[0] === 'load'
				)?.[1];
				if (loadHandler) loadHandler();
			});

			await uploadFileToPresignedUrl(uploadUrl, mockFile);

			expect(mockXHR.open).toHaveBeenCalledWith('PUT', uploadUrl);
			expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
			expect(mockXHR.send).toHaveBeenCalledWith(mockFile);
		});

		it('should call onProgress callback during upload', async () => {
			const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
			const onProgress = vi.fn();

			mockXHR.send = vi.fn(() => {
				const progressHandler = mockXHR.upload.addEventListener.mock.calls.find(
					(call) => call[0] === 'progress'
				)?.[1];
				if (progressHandler) {
					progressHandler({ lengthComputable: true, loaded: 50, total: 100 });
				}

				const loadHandler = mockXHR.addEventListener.mock.calls.find(
					(call) => call[0] === 'load'
				)?.[1];
				if (loadHandler) loadHandler();
			});

			await uploadFileToPresignedUrl('https://example.com/upload', mockFile, onProgress);

			expect(onProgress).toHaveBeenCalledWith(50);
		});

		it('should reject on upload error status', async () => {
			const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
			mockXHR.status = 403;

			mockXHR.send = vi.fn(() => {
				const loadHandler = mockXHR.addEventListener.mock.calls.find(
					(call) => call[0] === 'load'
				)?.[1];
				if (loadHandler) loadHandler();
			});

			await expect(
				uploadFileToPresignedUrl('https://example.com/upload', mockFile)
			).rejects.toThrow('Upload failed with status 403');
		});

		it('should reject on network error', async () => {
			const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

			mockXHR.send = vi.fn(() => {
				const errorHandler = mockXHR.addEventListener.mock.calls.find(
					(call) => call[0] === 'error'
				)?.[1];
				if (errorHandler) errorHandler();
			});

			await expect(
				uploadFileToPresignedUrl('https://example.com/upload', mockFile)
			).rejects.toThrow('Upload failed');
		});
	});

	describe('uploadDocument', () => {
		let mockXHR: {
			open: ReturnType<typeof vi.fn>;
			send: ReturnType<typeof vi.fn>;
			setRequestHeader: ReturnType<typeof vi.fn>;
			upload: { addEventListener: ReturnType<typeof vi.fn> };
			addEventListener: ReturnType<typeof vi.fn>;
			status: number;
		};

		beforeEach(() => {
			mockXHR = {
				open: vi.fn(),
				send: vi.fn(),
				setRequestHeader: vi.fn(),
				upload: { addEventListener: vi.fn() },
				addEventListener: vi.fn(),
				status: 200
			};

			global.XMLHttpRequest = vi.fn(() => mockXHR) as unknown as typeof XMLHttpRequest;
		});

		it('should complete full upload flow successfully', async () => {
			const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
			const mockInitResponse = {
				document_id: 123,
				upload_url: 'https://minio.example.com/presigned',
				expires_in: 3600,
				storage_path: 'uploads/123/test.pdf'
			};
			const mockDocument = {
				id: 1,
				title: 'test.pdf',
				status: 'DOCUMENT_STATUS_PENDING'
			};

			let fetchCallCount = 0;
			global.fetch = vi.fn().mockImplementation(() => {
				fetchCallCount++;
				if (fetchCallCount === 1) {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve(mockInitResponse)
					});
				}
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockDocument)
				});
			});

			mockXHR.send = vi.fn(() => {
				const loadHandler = mockXHR.addEventListener.mock.calls.find(
					(call) => call[0] === 'load'
				)?.[1];
				if (loadHandler) loadHandler();
			});

			const result = await uploadDocument('test-token', mockFile);

			expect(result).toEqual(mockDocument);
			expect(global.fetch).toHaveBeenCalledTimes(2);
			expect(mockXHR.open).toHaveBeenCalledWith('PUT', mockInitResponse.upload_url);
		});

		it('should pass onProgress through the upload flow', async () => {
			const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
			const onProgress = vi.fn();

			let fetchCallCount = 0;
			global.fetch = vi.fn().mockImplementation(() => {
				fetchCallCount++;
				if (fetchCallCount === 1) {
					return Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								document_id: 123,
								upload_url: 'https://example.com/upload',
								expires_in: 3600,
								storage_path: 'uploads/123/test.pdf'
							})
					});
				}
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ id: 1, title: 'test.pdf' })
				});
			});

			mockXHR.send = vi.fn(() => {
				const progressHandler = mockXHR.upload.addEventListener.mock.calls.find(
					(call) => call[0] === 'progress'
				)?.[1];
				if (progressHandler) {
					progressHandler({ lengthComputable: true, loaded: 100, total: 100 });
				}

				const loadHandler = mockXHR.addEventListener.mock.calls.find(
					(call) => call[0] === 'load'
				)?.[1];
				if (loadHandler) loadHandler();
			});

			await uploadDocument('test-token', mockFile, {
				onProgress
			});

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/upload/initiate'),
				expect.any(Object)
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/upload/complete'),
				expect.any(Object)
			);

			expect(onProgress).toHaveBeenCalledWith(100);
		});

		it('should propagate initiation errors', async () => {
			const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'File type not allowed' })
			});

			await expect(uploadDocument('test-token', mockFile)).rejects.toEqual(
				'File type not allowed'
			);
		});
	});
});
