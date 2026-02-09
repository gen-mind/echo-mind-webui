import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ConnectorCreateModal from './ConnectorCreateModal.svelte';
import * as echomindApi from '$lib/apis/echomind';

// Mock all API functions
vi.mock('$lib/apis/echomind', () => ({
	checkGoogleOAuthConfigured: vi.fn(),
	getGoogleAuthStatus: vi.fn(),
	openGoogleOAuthPopup: vi.fn(),
	createConnector: vi.fn()
}));

describe('ConnectorCreateModal - Google OAuth Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: OAuth is configured
		vi.mocked(echomindApi.checkGoogleOAuthConfigured).mockResolvedValue({
			configured: true
		});
		// Default: Not yet authorized
		vi.mocked(echomindApi.getGoogleAuthStatus).mockResolvedValue({
			connected: false,
			granted_scopes: [],
			email: null,
			services: { drive: false, gmail: false, calendar: false, contacts: false }
		});
		// Mock localStorage
		Object.defineProperty(window, 'localStorage', {
			value: { token: 'fake-token' },
			writable: true
		});
	});

	it('shows OAuth button when Google Drive is selected and not authorized', async () => {
		render(ConnectorCreateModal, { props: { show: true } });

		// Select Google Drive connector type
		const driveButton = screen.getByText('Google Drive');
		await fireEvent.click(driveButton);

		// Should show "Connect to Google" button
		await waitFor(() => {
			expect(screen.getByText('Connect to Google')).toBeInTheDocument();
		});
	});

	it('shows success state when already authorized', async () => {
		vi.mocked(echomindApi.getGoogleAuthStatus).mockResolvedValue({
			connected: true,
			granted_scopes: ['https://www.googleapis.com/auth/drive.readonly'],
			email: 'test@example.com',
			services: { drive: true, gmail: false, calendar: false, contacts: false }
		});

		render(ConnectorCreateModal, { props: { show: true } });

		const driveButton = screen.getByText('Google Drive');
		await fireEvent.click(driveButton);

		await waitFor(() => {
			expect(screen.getByText('Connected to Google')).toBeInTheDocument();
		});
	});

	it('shows admin error when OAuth is not configured on backend', async () => {
		vi.mocked(echomindApi.checkGoogleOAuthConfigured).mockResolvedValue({
			configured: false,
			message: 'Google OAuth not configured'
		});

		render(ConnectorCreateModal, { props: { show: true } });

		const gmailButton = screen.getByText('Gmail');
		await fireEvent.click(gmailButton);

		await waitFor(() => {
			expect(screen.getByText('Google Service Not Available')).toBeInTheDocument();
			expect(screen.getByText(/contact your system administrator/i)).toBeInTheDocument();
		});
	});

	it('calls openGoogleOAuthPopup when Connect button is clicked', async () => {
		vi.mocked(echomindApi.openGoogleOAuthPopup).mockResolvedValue({
			success: true,
			service: 'drive'
		});

		render(ConnectorCreateModal, { props: { show: true } });

		const driveButton = screen.getByText('Google Drive');
		await fireEvent.click(driveButton);

		const connectButton = await screen.findByText('Connect to Google');
		await fireEvent.click(connectButton);

		await waitFor(() => {
			expect(echomindApi.openGoogleOAuthPopup).toHaveBeenCalledWith('fake-token', 'drive');
		});
	});

	it('prevents form submission when Google OAuth required but not authorized', async () => {
		vi.mocked(echomindApi.createConnector).mockResolvedValue({
			id: 1,
			name: 'Test Connector',
			type: 'CONNECTOR_TYPE_GOOGLE_DRIVE'
		} as any);

		render(ConnectorCreateModal, { props: { show: true } });

		// Select Google Drive
		const driveButton = screen.getByText('Google Drive');
		await fireEvent.click(driveButton);

		// Enter name
		const nameInput = screen.getByPlaceholderText(/Company Wiki/i);
		await fireEvent.input(nameInput, { target: { value: 'My Drive Connector' } });

		// Try to submit (should be blocked)
		const createButton = screen.getByText('Create');
		await fireEvent.click(createButton);

		// Should show error toast, not call API
		await waitFor(() => {
			expect(echomindApi.createConnector).not.toHaveBeenCalled();
		});
	});

	it('allows form submission when Google OAuth is authorized', async () => {
		vi.mocked(echomindApi.getGoogleAuthStatus).mockResolvedValue({
			connected: true,
			granted_scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
			email: 'test@example.com',
			services: { drive: false, gmail: true, calendar: false, contacts: false }
		});

		vi.mocked(echomindApi.createConnector).mockResolvedValue({
			id: 2,
			name: 'Gmail Connector',
			type: 'CONNECTOR_TYPE_GMAIL'
		} as any);

		render(ConnectorCreateModal, { props: { show: true } });

		// Select Gmail
		const gmailButton = screen.getByText('Gmail');
		await fireEvent.click(gmailButton);

		// Wait for success state
		await waitFor(() => {
			expect(screen.getByText('Connected to Google')).toBeInTheDocument();
		});

		// Enter name
		const nameInput = screen.getByPlaceholderText(/Company Wiki/i);
		await fireEvent.input(nameInput, { target: { value: 'Gmail Connector' } });

		// Submit form (should succeed)
		const createButton = screen.getByText('Create');
		await fireEvent.click(createButton);

		await waitFor(() => {
			expect(echomindApi.createConnector).toHaveBeenCalledWith('fake-token', {
				name: 'Gmail Connector',
				type: 'CONNECTOR_TYPE_GMAIL',
				scope: 'CONNECTOR_SCOPE_USER',
				config: {},
				refresh_freq_minutes: 60
			});
		});
	});

	it('does not show error for non-Google connector types', async () => {
		vi.mocked(echomindApi.checkGoogleOAuthConfigured).mockResolvedValue({
			configured: false,
			message: 'Not configured'
		});

		render(ConnectorCreateModal, { props: { show: true } });

		// Select Web crawler (non-Google)
		const webButton = screen.getByText('Web Crawler');
		await fireEvent.click(webButton);

		// Should NOT show Google error
		await waitFor(() => {
			expect(screen.queryByText('Google Service Not Available')).not.toBeInTheDocument();
		});
	});

	it('shows loading state when OAuth is in progress', async () => {
		let resolveOAuth: (value: any) => void;
		const oauthPromise = new Promise((resolve) => {
			resolveOAuth = resolve;
		});
		vi.mocked(echomindApi.openGoogleOAuthPopup).mockReturnValue(oauthPromise as any);

		render(ConnectorCreateModal, { props: { show: true } });

		const calendarButton = screen.getByText('Google Calendar');
		await fireEvent.click(calendarButton);

		const connectButton = await screen.findByText('Connect to Google');
		await fireEvent.click(connectButton);

		// Should show loading state
		await waitFor(() => {
			expect(screen.getByText('Opening authorization window...')).toBeInTheDocument();
		});

		// Resolve OAuth
		resolveOAuth!({ success: true, service: 'calendar' });
	});

	it('handles OAuth popup failure gracefully', async () => {
		vi.mocked(echomindApi.openGoogleOAuthPopup).mockRejectedValue(
			new Error('Popup was blocked by the browser')
		);

		render(ConnectorCreateModal, { props: { show: true } });

		const contactsButton = screen.getByText('Google Contacts');
		await fireEvent.click(contactsButton);

		const connectButton = await screen.findByText('Connect to Google');
		await fireEvent.click(connectButton);

		// Should handle error and return to ready state
		await waitFor(() => {
			expect(screen.getByText('Connect to Google')).toBeInTheDocument();
		});
	});

	it('shows Drive ID field only for Google Drive when authorized', async () => {
		vi.mocked(echomindApi.getGoogleAuthStatus).mockResolvedValue({
			connected: true,
			granted_scopes: ['https://www.googleapis.com/auth/drive.readonly'],
			email: 'test@example.com',
			services: { drive: true, gmail: false, calendar: false, contacts: false }
		});

		render(ConnectorCreateModal, { props: { show: true } });

		const driveButton = screen.getByText('Google Drive');
		await fireEvent.click(driveButton);

		await waitFor(() => {
			expect(screen.getByPlaceholderText(/Optional - leave empty for My Drive/i)).toBeInTheDocument();
		});

		// Should not show Drive ID field for Gmail
		const gmailButton = screen.getByText('Gmail');
		await fireEvent.click(gmailButton);

		await waitFor(() => {
			expect(
				screen.queryByPlaceholderText(/Optional - leave empty for My Drive/i)
			).not.toBeInTheDocument();
		});
	});

	it('does not call createConnector when result is null', async () => {
		vi.mocked(echomindApi.createConnector).mockResolvedValue(null as any);

		render(ConnectorCreateModal, { props: { show: true } });

		// Select File connector (doesn't need OAuth)
		const fileButton = screen.getByText('File Upload');
		await fireEvent.click(fileButton);

		// Enter name
		const nameInput = screen.getByPlaceholderText(/Company Wiki/i);
		await fireEvent.input(nameInput, { target: { value: 'Test File Connector' } });

		// Submit form
		const createButton = screen.getByText('Create');
		await fireEvent.click(createButton);

		// Should call API but not show success toast or close modal
		await waitFor(() => {
			expect(echomindApi.createConnector).toHaveBeenCalled();
		});

		// Modal should still be open (not closed on error)
		expect(screen.getByText('Create Connector')).toBeInTheDocument();
	});
});
