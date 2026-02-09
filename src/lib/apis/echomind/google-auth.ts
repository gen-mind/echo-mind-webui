import { WEBUI_API_BASE_URL } from '$lib/constants';

export type GoogleService = 'drive' | 'gmail' | 'calendar' | 'contacts';

export interface GoogleAuthStatus {
	connected: boolean;
	granted_scopes: string[];
	email: string | null;
	services: Record<GoogleService, boolean>;
}

export interface GoogleAuthUrlResponse {
	url: string;
}

export interface GoogleOAuthResult {
	success: boolean;
	service: GoogleService;
}

export interface GoogleOAuthConfigStatus {
	configured: boolean;
	message?: string;
}

const OAUTH_POPUP_TIMEOUT_MS = 120_000; // 2 minutes

/**
 * Check if Google OAuth is configured on the backend.
 *
 * Public endpoint (no auth required) - checks if GOOGLE_CLIENT_ID etc. are set.
 * Frontend uses this to decide whether to show Google connector options.
 *
 * @returns Promise<GoogleOAuthConfigStatus> - Configuration status
 *
 * @example
 * const status = await checkGoogleOAuthConfigured();
 * if (!status.configured) {
 *   console.warn('Google OAuth not available:', status.message);
 * }
 */
export const checkGoogleOAuthConfigured = async (): Promise<GoogleOAuthConfigStatus> => {
	try {
		const res = await fetch(`${WEBUI_API_BASE_URL}/google/auth/configured`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		});

		if (!res.ok) {
			return {
				configured: false,
				message: 'Unable to check Google OAuth configuration'
			};
		}

		return await res.json();
	} catch (error) {
		console.error('[Google OAuth] Failed to check configuration:', error);
		return {
			configured: false,
			message: 'Backend not reachable'
		};
	}
};

export const getGoogleAuthStatus = async (token: string): Promise<GoogleAuthStatus> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/google/auth/status`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getGoogleAuthUrl = async (
	token: string,
	service: GoogleService,
	mode: 'popup' | 'redirect' = 'popup'
): Promise<GoogleAuthUrlResponse> => {
	let error = null;

	const params = new URLSearchParams({ service, mode });
	const res = await fetch(`${WEBUI_API_BASE_URL}/google/auth/url?${params.toString()}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const revokeGoogleAuth = async (token: string): Promise<void> => {
	let error = null;

	await fetch(`${WEBUI_API_BASE_URL}/google/auth`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}
};

export const openGoogleOAuthPopup = async (
	token: string,
	service: GoogleService
): Promise<GoogleOAuthResult> => {
	const authUrlResponse = await getGoogleAuthUrl(token, service, 'popup');
	if (!authUrlResponse?.url) {
		return { success: false, service };
	}

	const popup = window.open(
		authUrlResponse.url,
		'google-oauth',
		'width=500,height=600,popup=yes,scrollbars=yes'
	);

	if (!popup) {
		throw new Error('Popup was blocked by the browser. Please allow popups for this site.');
	}

	return new Promise<GoogleOAuthResult>((resolve, reject) => {
		let settled = false;

		const timeout = setTimeout(() => {
			if (!settled) {
				settled = true;
				window.removeEventListener('message', handler);
				reject(new Error('OAuth popup timed out'));
			}
		}, OAUTH_POPUP_TIMEOUT_MS);

		const pollClosed = setInterval(() => {
			if (popup.closed && !settled) {
				settled = true;
				clearInterval(pollClosed);
				clearTimeout(timeout);
				window.removeEventListener('message', handler);
				resolve({ success: false, service });
			}
		}, 500);

		function handler(event: MessageEvent) {
			if (event.data?.type === 'google-oauth-success' && event.data?.service === service) {
				settled = true;
				clearTimeout(timeout);
				clearInterval(pollClosed);
				window.removeEventListener('message', handler);
				resolve({ success: true, service });
			} else if (event.data?.type === 'google-oauth-error') {
				settled = true;
				clearTimeout(timeout);
				clearInterval(pollClosed);
				window.removeEventListener('message', handler);
				resolve({ success: false, service });
			}
		}

		window.addEventListener('message', handler);
	});
};
