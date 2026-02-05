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
				upload_id: 'upload-123',
				upload_url: 'https://minio.example.com/presigned-url',
				expires_at: '2024-01-01T01:00:00Z'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await initiateUpload('test-token', {
				file_name: 'test.pdf',
				file_type: 'application/pdf',
				file_size: 1024
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/upload/initiate'),
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

		it('should include connector_id when provided', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({
					upload_id: 'upload-123',
					upload_url: 'https://example.com',
					expires_at: '2024-01-01T01:00:00Z'
				})
			});

			await initiateUpload('test-token', {
				file_name: 'test.pdf',
				file_type: 'application/pdf',
				file_size: 1024,
				connector_id: 5
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining('"connector_id":5')
				})
			);
		});

		it('should throw error on initiation failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'File too large' })
			});

			await expect(
				initiateUpload('test-token', {
					file_name: 'huge.pdf',
					file_type: 'application/pdf',
					file_size: 1000000000
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
				upload_id: 'upload-123'
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/upload/complete'),
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('upload-123')
				})
			);
			expect(result).toEqual(mockDocument);
		});

		it('should include title when provided', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ id: 1, title: 'Custom Title' })
			});

			await completeUpload('test-token', {
				upload_id: 'upload-123',
				title: 'Custom Title'
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining('Custom Title')
				})
			);
		});

		it('should throw error on completion failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Upload expired' })
			});

			await expect(
				completeUpload('test-token', { upload_id: 'expired-123' })
			).rejects.toEqual('Upload expired');
		});
	});

	describe('abortUpload', () => {
		it('should abort upload successfully', async () => {
			const mockResponse = {
				message: 'Upload aborted',
				upload_id: 'upload-123'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await abortUpload('test-token', {
				upload_id: 'upload-123'
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/upload/abort'),
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('upload-123')
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
				abortUpload('test-token', { upload_id: 'invalid-123' })
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
				upload_id: 'upload-123',
				upload_url: 'https://minio.example.com/presigned',
				expires_at: '2024-01-01T01:00:00Z'
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

		it('should pass options through the upload flow', async () => {
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
								upload_id: 'upload-123',
								upload_url: 'https://example.com/upload',
								expires_at: '2024-01-01T01:00:00Z'
							})
					});
				}
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ id: 1, title: 'Custom Title' })
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
				title: 'Custom Title',
				connectorId: 5,
				onProgress
			});

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/upload/initiate'),
				expect.objectContaining({
					body: expect.stringContaining('"connector_id":5')
				})
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/upload/complete'),
				expect.objectContaining({
					body: expect.stringContaining('Custom Title')
				})
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
