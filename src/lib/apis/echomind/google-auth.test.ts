import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	getGoogleAuthStatus,
	getGoogleAuthUrl,
	revokeGoogleAuth,
	openGoogleOAuthPopup
} from './google-auth';

describe('Google Auth API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getGoogleAuthStatus', () => {
		it('should fetch auth status successfully', async () => {
			const mockStatus = {
				connected: true,
				granted_scopes: ['https://www.googleapis.com/auth/drive.readonly'],
				email: 'user@example.com',
				services: {
					drive: true,
					gmail: false,
					calendar: false,
					contacts: false
				}
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockStatus)
			});

			const result = await getGoogleAuthStatus('test-token');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/google/auth/status'),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					})
				})
			);
			expect(result).toEqual(mockStatus);
		});

		it('should throw error on failed request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Unauthorized' })
			});

			await expect(getGoogleAuthStatus('bad-token')).rejects.toEqual('Unauthorized');
		});

		it('should return not connected status', async () => {
			const mockStatus = {
				connected: false,
				granted_scopes: [],
				email: null,
				services: {
					drive: false,
					gmail: false,
					calendar: false,
					contacts: false
				}
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockStatus)
			});

			const result = await getGoogleAuthStatus('test-token');

			expect(result.connected).toBe(false);
			expect(result.services.drive).toBe(false);
		});
	});

	describe('getGoogleAuthUrl', () => {
		it('should fetch auth URL with service param', async () => {
			const mockResponse = {
				url: 'https://accounts.google.com/o/oauth2/v2/auth?...'
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getGoogleAuthUrl('test-token', 'drive');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringMatching(/service=drive/),
				expect.objectContaining({
					method: 'GET'
				})
			);
			expect(result.url).toContain('accounts.google.com');
		});

		it('should pass mode parameter', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ url: 'https://example.com' })
			});

			await getGoogleAuthUrl('test-token', 'gmail', 'redirect');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('mode=redirect'),
				expect.any(Object)
			);
		});

		it('should default to popup mode', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ url: 'https://example.com' })
			});

			await getGoogleAuthUrl('test-token', 'calendar');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('mode=popup'),
				expect.any(Object)
			);
		});

		it('should throw error on failed request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'Not configured' })
			});

			await expect(getGoogleAuthUrl('test-token', 'drive')).rejects.toEqual('Not configured');
		});
	});

	describe('revokeGoogleAuth', () => {
		it('should revoke auth successfully', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true
			});

			await revokeGoogleAuth('test-token');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/google/auth'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});

		it('should throw error on failed revoke', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ detail: 'No credentials found' })
			});

			await expect(revokeGoogleAuth('test-token')).rejects.toEqual('No credentials found');
		});
	});

	describe('openGoogleOAuthPopup', () => {
		let mockWindow: Record<string, unknown>;
		let messageListeners: ((event: MessageEvent) => void)[];

		beforeEach(() => {
			messageListeners = [];

			mockWindow = {
				open: vi.fn(),
				addEventListener: vi.fn().mockImplementation((_event: string, handler: (event: MessageEvent) => void) => {
					messageListeners.push(handler);
				}),
				removeEventListener: vi.fn()
			};

			// Set up global window mock for node environment
			(globalThis as Record<string, unknown>).window = mockWindow;
		});

		afterEach(() => {
			delete (globalThis as Record<string, unknown>).window;
		});

		it('should throw error when popup is blocked', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ url: 'https://accounts.google.com/auth' })
			});

			(mockWindow.open as ReturnType<typeof vi.fn>).mockReturnValue(null);

			await expect(openGoogleOAuthPopup('test-token', 'drive')).rejects.toThrow(
				'Popup was blocked'
			);
		});

		it('should resolve with success when popup posts success message', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ url: 'https://accounts.google.com/auth' })
			});

			const mockPopup = { closed: false, close: vi.fn() };
			(mockWindow.open as ReturnType<typeof vi.fn>).mockReturnValue(mockPopup);

			const resultPromise = openGoogleOAuthPopup('test-token', 'drive');

			// Wait for event listener to be registered
			await new Promise((r) => setTimeout(r, 10));

			// Simulate success message
			for (const listener of messageListeners) {
				listener(
					new MessageEvent('message', {
						data: { type: 'google-oauth-success', service: 'drive' }
					})
				);
			}

			const result = await resultPromise;
			expect(result.success).toBe(true);
			expect(result.service).toBe('drive');
		});

		it('should resolve with failure on error message', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ url: 'https://accounts.google.com/auth' })
			});

			const mockPopup = { closed: false, close: vi.fn() };
			(mockWindow.open as ReturnType<typeof vi.fn>).mockReturnValue(mockPopup);

			const resultPromise = openGoogleOAuthPopup('test-token', 'drive');

			await new Promise((r) => setTimeout(r, 10));

			for (const listener of messageListeners) {
				listener(
					new MessageEvent('message', {
						data: { type: 'google-oauth-error', error: 'access_denied' }
					})
				);
			}

			const result = await resultPromise;
			expect(result.success).toBe(false);
			expect(result.service).toBe('drive');
		});

		it('should resolve with failure when popup is closed', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ url: 'https://accounts.google.com/auth' })
			});

			const mockPopup = { closed: false, close: vi.fn() };
			(mockWindow.open as ReturnType<typeof vi.fn>).mockReturnValue(mockPopup);

			const resultPromise = openGoogleOAuthPopup('test-token', 'drive');

			// Simulate popup closing
			setTimeout(() => {
				mockPopup.closed = true;
			}, 100);

			const result = await resultPromise;
			expect(result.success).toBe(false);
			expect(result.service).toBe('drive');
		});
	});
});
