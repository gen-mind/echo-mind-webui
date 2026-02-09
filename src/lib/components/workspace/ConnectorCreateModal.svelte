<script lang="ts">
	import { getContext, createEventDispatcher, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	import {
		createConnector,
		getGoogleAuthStatus,
		openGoogleOAuthPopup,
		checkGoogleOAuthConfigured
	} from '$lib/apis/echomind';
	import type {
		ConnectorType,
		ConnectorScope,
		CreateConnectorRequest,
		GoogleService,
		GoogleOAuthConfigStatus
	} from '$lib/apis/echomind';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;

	let loading = false;

	// Form fields
	let name = '';
	let connectorType: ConnectorType = 'CONNECTOR_TYPE_FILE';
	let scope: ConnectorScope = 'CONNECTOR_SCOPE_USER';
	let scopeId = '';
	let refreshFreq = 60;

	// Type-specific config
	let webUrl = '';
	let webDepth = 2;
	let teamsChannelId = '';
	let driveId = '';
	let onedrivePath = '';

	// Google OAuth state
	let isGoogleAuthorized = false;
	let googleConfigStatus: GoogleOAuthConfigStatus | null = null;
	let oauthInProgress = false;

	// List of Google Workspace connector types (DRY - used in multiple places)
	const GOOGLE_CONNECTOR_TYPES: ConnectorType[] = [
		'CONNECTOR_TYPE_GOOGLE_DRIVE',
		'CONNECTOR_TYPE_GMAIL',
		'CONNECTOR_TYPE_GOOGLE_CALENDAR',
		'CONNECTOR_TYPE_GOOGLE_CONTACTS'
	];

	const connectorTypes: { value: ConnectorType; label: string; icon: string }[] = [
		{ value: 'CONNECTOR_TYPE_FILE', label: 'File Upload', icon: '📄' },
		{ value: 'CONNECTOR_TYPE_WEB', label: 'Web Crawler', icon: '🌐' },
		{ value: 'CONNECTOR_TYPE_TEAMS', label: 'Microsoft Teams', icon: '💬' },
		{ value: 'CONNECTOR_TYPE_GOOGLE_DRIVE', label: 'Google Drive', icon: '📁' },
		{ value: 'CONNECTOR_TYPE_ONEDRIVE', label: 'OneDrive', icon: '☁️' },
		{ value: 'CONNECTOR_TYPE_GMAIL', label: 'Gmail', icon: '📧' },
		{ value: 'CONNECTOR_TYPE_GOOGLE_CALENDAR', label: 'Google Calendar', icon: '📅' },
		{ value: 'CONNECTOR_TYPE_GOOGLE_CONTACTS', label: 'Google Contacts', icon: '👤' }
	];

	const scopes: { value: ConnectorScope; label: string }[] = [
		{ value: 'CONNECTOR_SCOPE_USER', label: 'Personal' },
		{ value: 'CONNECTOR_SCOPE_GROUP', label: 'Team/Group' },
		{ value: 'CONNECTOR_SCOPE_ORG', label: 'Organization' }
	];

	onMount(async () => {
		// Check if Google OAuth is configured on backend
		try {
			googleConfigStatus = await checkGoogleOAuthConfigured();
			if (!googleConfigStatus.configured) {
				console.warn(
					'[ConnectorCreate] Google OAuth not configured:',
					googleConfigStatus.message
				);
			}
		} catch (e) {
			console.error('[ConnectorCreate] Failed to check OAuth config:', e);
			googleConfigStatus = { configured: false, message: 'Unable to check configuration' };
		}
	});

	// Reactive: Check auth status when connector type changes
	$: if (connectorType && googleConfigStatus?.configured) {
		checkGoogleAuthStatus();
	}

	/**
	 * Check if current user has authorized Google for selected service.
	 * Updates isGoogleAuthorized state.
	 */
	async function checkGoogleAuthStatus() {
		if (!GOOGLE_CONNECTOR_TYPES.includes(connectorType)) {
			isGoogleAuthorized = true; // Not a Google connector
			return;
		}

		try {
			const status = await getGoogleAuthStatus(localStorage.token);
			const service = connectorTypeToService(connectorType);
			isGoogleAuthorized = status.services?.[service] ?? false;
		} catch {
			isGoogleAuthorized = false;
		}
	}

	/**
	 * Convert ConnectorType enum to GoogleService.
	 *
	 * @param type - Connector type enum value
	 * @returns GoogleService string ('drive', 'gmail', etc.)
	 * @throws Error if type is not a valid Google connector type
	 */
	function connectorTypeToService(type: ConnectorType): GoogleService {
		const mapping: Record<string, GoogleService> = {
			CONNECTOR_TYPE_GOOGLE_DRIVE: 'drive',
			CONNECTOR_TYPE_GMAIL: 'gmail',
			CONNECTOR_TYPE_GOOGLE_CALENDAR: 'calendar',
			CONNECTOR_TYPE_GOOGLE_CONTACTS: 'contacts'
		};

		const service = mapping[type];
		if (!service) {
			throw new Error(
				`[ConnectorCreate] Invalid Google connector type: ${type}. Expected one of: ${GOOGLE_CONNECTOR_TYPES.join(', ')}`
			);
		}

		return service;
	}

	/**
	 * Handle OAuth authorization from modal.
	 * Opens popup, waits for user to complete OAuth, updates state.
	 */
	async function handleOAuthFromModal() {
		oauthInProgress = true;
		try {
			const service = connectorTypeToService(connectorType);
			const result = await openGoogleOAuthPopup(localStorage.token, service);

			if (result.success) {
				toast.success($i18n.t('Successfully connected to Google'));
				isGoogleAuthorized = true;
			} else {
				toast.error($i18n.t('Authorization was cancelled or failed'));
			}
		} catch (e) {
			const errorMessage = e?.message || String(e);

			if (errorMessage.includes('Popup was blocked')) {
				toast.error($i18n.t('Please allow popups for this site and try again'));
			} else if (errorMessage.includes('not configured') || errorMessage.includes('501')) {
				toast.error($i18n.t('Google OAuth is not configured. Contact your administrator.'), {
					duration: 10000
				});
			} else {
				toast.error(`${$i18n.t('Authorization failed')}: ${errorMessage}`);
			}
			console.error('[ConnectorCreate] OAuth error:', e);
		} finally {
			oauthInProgress = false;
		}
	}

	function resetForm() {
		name = '';
		connectorType = 'CONNECTOR_TYPE_FILE';
		scope = 'CONNECTOR_SCOPE_USER';
		scopeId = '';
		refreshFreq = 60;
		webUrl = '';
		webDepth = 2;
		teamsChannelId = '';
		driveId = '';
		onedrivePath = '';
	}

	function buildConfig(): Record<string, unknown> {
		switch (connectorType) {
			case 'CONNECTOR_TYPE_WEB':
				return {
					url: webUrl.trim(),
					depth: webDepth
				};
			case 'CONNECTOR_TYPE_TEAMS':
				return {
					channel_id: teamsChannelId.trim()
				};
			case 'CONNECTOR_TYPE_GOOGLE_DRIVE':
				return {
					drive_id: driveId.trim()
				};
			case 'CONNECTOR_TYPE_ONEDRIVE':
				return {
					path: onedrivePath.trim()
				};
			case 'CONNECTOR_TYPE_FILE':
			default:
				return {};
		}
	}

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error($i18n.t('Name is required'));
			return;
		}

		// Validate type-specific fields
		if (connectorType === 'CONNECTOR_TYPE_WEB' && !webUrl.trim()) {
			toast.error($i18n.t('URL is required for web crawler'));
			return;
		}

		// Check if Google OAuth is required but not completed
		if (GOOGLE_CONNECTOR_TYPES.includes(connectorType) && !isGoogleAuthorized) {
			toast.error($i18n.t('Please authorize with Google first using the button above'));
			return;
		}

		loading = true;
		try {
			const data: CreateConnectorRequest = {
				name: name.trim(),
				type: connectorType,
				scope: scope,
				config: buildConfig(),
				refresh_freq_minutes: refreshFreq
			};

			if (scope !== 'CONNECTOR_SCOPE_USER' && scopeId.trim()) {
				data.scope_id = scopeId.trim();
			}

			const result = await createConnector(localStorage.token, data);

			// FIX: Check if result is null (error case)
			if (!result) {
				toast.error($i18n.t('Failed to create connector. Please try again.'));
				return;
			}

			toast.success($i18n.t('Connector created successfully'));
			dispatch('created', result);
			resetForm();
			show = false;
		} catch (error) {
			const errorMessage = error?.detail || error?.message || error?.toString() || 'Unknown error';
			toast.error($i18n.t('Failed to create connector') + `: ${errorMessage}`);
			console.error('[ConnectorCreate] Error:', error);
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		resetForm();
		show = false;
	}
</script>

<Modal size="lg" bind:show>
	<div class="p-6 max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex justify-between items-center mb-6">
			<h3 class="text-lg font-medium dark:text-white">{$i18n.t('Create Connector')}</h3>
			<button
				class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
				on:click={handleClose}
			>
				<XMark className="size-5" />
			</button>
		</div>

		<!-- Form -->
		<form on:submit|preventDefault={handleSubmit}>
			<div class="space-y-4">
				<!-- Name -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Name')} <span class="text-red-500">*</span>
					</span>
					<input
						type="text"
						bind:value={name}
						placeholder={$i18n.t('e.g., Company Wiki')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
				</label>

				<!-- Connector Type -->
				<div>
					<span class="block text-sm font-medium mb-2 dark:text-gray-200">
						{$i18n.t('Connector Type')} <span class="text-red-500">*</span>
					</span>
					<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
						{#each connectorTypes as type}
							<button
								type="button"
								class="flex items-center gap-2 p-3 rounded-lg border transition {connectorType ===
								type.value
									? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
									: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}"
								on:click={() => (connectorType = type.value)}
							>
								<span class="text-xl">{type.icon}</span>
								<span class="text-sm dark:text-white">{type.label}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Type-specific config -->
				{#if connectorType === 'CONNECTOR_TYPE_WEB'}
					<div class="space-y-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
						<label class="block">
							<span class="block text-sm font-medium mb-1 dark:text-gray-200">
								{$i18n.t('Starting URL')} <span class="text-red-500">*</span>
							</span>
							<input
								type="url"
								bind:value={webUrl}
								placeholder="https://example.com/docs"
								class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</label>
						<label class="block">
							<span class="block text-sm font-medium mb-1 dark:text-gray-200">
								{$i18n.t('Crawl Depth')}
							</span>
							<input
								type="number"
								bind:value={webDepth}
								min="1"
								max="5"
								class="w-24 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<p class="mt-1 text-xs text-gray-500">
								{$i18n.t('How many levels of links to follow (1-5)')}
							</p>
						</label>
					</div>
				{:else if connectorType === 'CONNECTOR_TYPE_TEAMS'}
					<div class="p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
						<label class="block">
							<span class="block text-sm font-medium mb-1 dark:text-gray-200">
								{$i18n.t('Teams Channel ID')}
							</span>
							<input
								type="text"
								bind:value={teamsChannelId}
								placeholder={$i18n.t('Optional - leave empty for all channels')}
								class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</label>
						<p class="mt-2 text-xs text-gray-500">
							{$i18n.t('Requires Microsoft Graph API authentication configured in the backend')}
						</p>
					</div>
				{:else if connectorType === 'CONNECTOR_TYPE_GOOGLE_DRIVE' || connectorType === 'CONNECTOR_TYPE_GMAIL' || connectorType === 'CONNECTOR_TYPE_GOOGLE_CALENDAR' || connectorType === 'CONNECTOR_TYPE_GOOGLE_CONTACTS'}
					<div
						class="space-y-4 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
					>
						{#if !googleConfigStatus?.configured}
							<!-- Show error if OAuth not configured on backend -->
							<div
								class="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
							>
								<svg
									class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								<div class="text-sm">
									<p class="font-medium text-red-800 dark:text-red-200">
										{$i18n.t('Google Service Not Available')}
									</p>
									<p class="mt-1 text-red-700 dark:text-red-300">
										{$i18n.t(
											'Google integration is not configured on this server. Please contact your system administrator or support team to enable Google services.'
										)}
									</p>
								</div>
							</div>
						{:else if !isGoogleAuthorized}
							<!-- Show OAuth button if not yet authorized -->
							<div class="text-sm text-gray-700 dark:text-gray-300 mb-3">
								<p class="font-medium mb-1">{$i18n.t('Authorization Required')}</p>
								<p>
									{$i18n.t('This connector requires permission to access your Google account.')}
								</p>
							</div>
							<button
								type="button"
								class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								on:click={handleOAuthFromModal}
								disabled={oauthInProgress}
							>
								{#if oauthInProgress}
									<Spinner class="w-5 h-5" />
									{$i18n.t('Opening authorization window...')}
								{:else}
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path
											d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
										/>
									</svg>
									{$i18n.t('Connect to Google')}
								{/if}
							</button>
							<p class="text-xs text-gray-500 dark:text-gray-400 text-center">
								{$i18n.t('A popup window will open for authorization')}
							</p>
						{:else}
							<!-- Show success state if already authorized -->
							<div
								class="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
							>
								<svg
									class="w-5 h-5 text-green-600 dark:text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span class="text-sm font-medium text-green-800 dark:text-green-200">
									{$i18n.t('Connected to Google')}
								</span>
							</div>
						{/if}

						<!-- Drive ID field (only for Google Drive, only if authorized) -->
						{#if connectorType === 'CONNECTOR_TYPE_GOOGLE_DRIVE' && isGoogleAuthorized}
							<label class="block mt-4">
								<span class="block text-sm font-medium mb-1 dark:text-gray-200">
									{$i18n.t('Drive ID')}
								</span>
								<input
									type="text"
									bind:value={driveId}
									placeholder={$i18n.t('Optional - leave empty for My Drive')}
									class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</label>
						{/if}
					</div>
				{:else if connectorType === 'CONNECTOR_TYPE_ONEDRIVE'}
					<div class="p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
						<label class="block">
							<span class="block text-sm font-medium mb-1 dark:text-gray-200">
								{$i18n.t('Folder Path')}
							</span>
							<input
								type="text"
								bind:value={onedrivePath}
								placeholder={$i18n.t('e.g., /Documents/Work')}
								class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</label>
						<p class="mt-2 text-xs text-gray-500">
							{$i18n.t('Requires Microsoft Graph API authentication configured in the backend')}
						</p>
					</div>
				{:else if connectorType === 'CONNECTOR_TYPE_FILE'}
					<div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
						{$i18n.t('File connectors accept manual uploads. After creating, use the Upload button to add documents.')}
					</div>
				{/if}

				<!-- Scope -->
				<div>
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Visibility Scope')}
					</span>
					<div class="flex gap-2">
						{#each scopes as s}
							<button
								type="button"
								class="px-4 py-2 rounded-lg border transition {scope === s.value
									? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
									: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:text-white'}"
								on:click={() => (scope = s.value)}
							>
								{s.label}
							</button>
						{/each}
					</div>
					{#if scope !== 'CONNECTOR_SCOPE_USER'}
						<label class="block mt-2">
							<input
								type="text"
								bind:value={scopeId}
								placeholder={scope === 'CONNECTOR_SCOPE_GROUP'
									? $i18n.t('Team/Group ID')
									: $i18n.t('Organization ID')}
								class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</label>
					{/if}
				</div>

				<!-- Refresh Frequency -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Sync Interval (minutes)')}
					</span>
					<input
						type="number"
						bind:value={refreshFreq}
						min="15"
						max="10080"
						class="w-32 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<p class="mt-1 text-xs text-gray-500">
						{$i18n.t('How often to check for new content (15 min - 1 week)')}
					</p>
				</label>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
				<button
					type="button"
					class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
					on:click={handleClose}
				>
					{$i18n.t('Cancel')}
				</button>
				<button
					type="submit"
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
					disabled={loading}
				>
					{#if loading}
						<Spinner class="w-4 h-4" />
					{/if}
					{loading ? $i18n.t('Creating...') : $i18n.t('Create')}
				</button>
			</div>
		</form>
	</div>
</Modal>
