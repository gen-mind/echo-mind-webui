import { vi } from 'vitest';

// Define global constants used by the app
(global as Record<string, unknown>).APP_VERSION = '0.0.0-test';
(global as Record<string, unknown>).APP_BUILD_HASH = 'test-hash';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	clear: vi.fn(),
	removeItem: vi.fn(),
	token: 'test-token'
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
});
