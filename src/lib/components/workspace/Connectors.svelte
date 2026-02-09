<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { t } from 'i18next';

	import { WEBUI_NAME } from '$lib/stores';
	import {
		getConnectors,
		deleteConnector,
		triggerConnectorSync,
		getGoogleAuthStatus,
		openGoogleOAuthPopup,
		revokeGoogleAuth,
		createConnector
	} from '$lib/apis/echomind';
	import type {
		Connector,
		ConnectorType,
		ConnectorStatus,
		GoogleService,
		GoogleAuthStatus
	} from '$lib/apis/echomind';

	import DeleteConfirmDialog from '../common/ConfirmDialog.svelte';
	import Badge from '../common/Badge.svelte';
	import Plus from '../icons/Plus.svelte';
	import Spinner from '../common/Spinner.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import ConnectorCreateModal from './ConnectorCreateModal.svelte';
	import ConnectorEditModal from './ConnectorEditModal.svelte';

	let loaded = false;
	let showDeleteConfirm = false;
	let showCreateModal = false;
	let showEditModal = false;

	let selectedItem: Connector | null = null;
	let editItem: Connector | null = null;
	let syncingConnectors: Set<number> = new Set();

	let items: Connector[] = [];
	let itemsLoading = false;

	// Google Workspace state
	let googleStatus: GoogleAuthStatus | null = null;
	let googleLoading = false;
	let connectingService: GoogleService | null = null;

	const googleServices: { service: GoogleService; label: string; icon: string; connectorType: ConnectorType }[] = [
		{ service: 'drive', label: 'Google Drive', icon: '📁', connectorType: 'CONNECTOR_TYPE_GOOGLE_DRIVE' },
		{ service: 'gmail', label: 'Gmail', icon: '📧', connectorType: 'CONNECTOR_TYPE_GMAIL' },
		{ service: 'calendar', label: 'Calendar', icon: '📅', connectorType: 'CONNECTOR_TYPE_GOOGLE_CALENDAR' },
		{ service: 'contacts', label: 'Contacts', icon: '👤', connectorType: 'CONNECTOR_TYPE_GOOGLE_CONTACTS' }
	];

	const typeLabels: Record<ConnectorType, string> = {
		CONNECTOR_TYPE_UNSPECIFIED: 'Unknown',
		CONNECTOR_TYPE_TEAMS: 'Microsoft Teams',
		CONNECTOR_TYPE_GOOGLE_DRIVE: 'Google Drive',
		CONNECTOR_TYPE_ONEDRIVE: 'OneDrive',
		CONNECTOR_TYPE_WEB: 'Web Crawler',
		CONNECTOR_TYPE_FILE: 'File Upload',
		CONNECTOR_TYPE_GMAIL: 'Gmail',
		CONNECTOR_TYPE_GOOGLE_CALENDAR: 'Google Calendar',
		CONNECTOR_TYPE_GOOGLE_CONTACTS: 'Google Contacts'
	};

	const typeIcons: Record<ConnectorType, string> = {
		CONNECTOR_TYPE_UNSPECIFIED: '❓',
		CONNECTOR_TYPE_TEAMS: '💬',
		CONNECTOR_TYPE_GOOGLE_DRIVE: '📁',
		CONNECTOR_TYPE_ONEDRIVE: '☁️',
		CONNECTOR_TYPE_WEB: '🌐',
		CONNECTOR_TYPE_FILE: '📄',
		CONNECTOR_TYPE_GMAIL: '📧',
		CONNECTOR_TYPE_GOOGLE_CALENDAR: '📅',
		CONNECTOR_TYPE_GOOGLE_CONTACTS: '👤'
	};

	const statusColors: Record<ConnectorStatus, string> = {
		CONNECTOR_STATUS_UNSPECIFIED: 'gray',
		CONNECTOR_STATUS_PENDING: 'yellow',
		CONNECTOR_STATUS_SYNCING: 'blue',
		CONNECTOR_STATUS_ACTIVE: 'green',
		CONNECTOR_STATUS_ERROR: 'red',
		CONNECTOR_STATUS_DISABLED: 'gray'
	};

	const statusLabels: Record<ConnectorStatus, string> = {
		CONNECTOR_STATUS_UNSPECIFIED: 'Unknown',
		CONNECTOR_STATUS_PENDING: 'Pending',
		CONNECTOR_STATUS_SYNCING: 'Syncing',
		CONNECTOR_STATUS_ACTIVE: 'Active',
		CONNECTOR_STATUS_ERROR: 'Error',
		CONNECTOR_STATUS_DISABLED: 'Disabled'
	};

	const init = async () => {
		itemsLoading = true;
		try {
			const res = await getConnectors(localStorage.token, { page: 1, page_size: 100 });
			if (res) {
				items = res.connectors || [];
			}
		} catch (e) {
			toast.error(`Failed to load connectors: ${e}`);
		}
		itemsLoading = false;
	};

	const loadGoogleStatus = async () => {
		googleLoading = true;
		try {
			googleStatus = await getGoogleAuthStatus(localStorage.token);
		} catch {
			// Google OAuth not configured or not available — hide section
			googleStatus = null;
		}
		googleLoading = false;
	};

	/**
	 * Handle Google service connection from workspace cards.
	 * Opens OAuth popup, waits for authorization, auto-creates connector.
	 *
	 * @param service - Google service to connect ('drive', 'gmail', etc.)
	 * @param connectorType - Corresponding connector type enum
	 */
	const handleGoogleConnect = async (service: GoogleService, connectorType: ConnectorType) => {
		connectingService = service;
		try {
			const result = await openGoogleOAuthPopup(localStorage.token, service);

			if (result.success) {
				toast.success(`${service} connected successfully`);

				// Check if connector already exists for this type
				const existing = items.find((c) => c.type === connectorType);
				if (!existing) {
					// Auto-create connector
					const label = googleServices.find((s) => s.service === service)?.label ?? service;
					try {
						const newConnector = await createConnector(localStorage.token, {
							name: label,
							type: connectorType,
							scope: 'CONNECTOR_SCOPE_USER',
							config: {},
							refresh_freq_minutes: 60
						});

						if (!newConnector) {
							// createConnector returned null (error)
							console.error('[Connectors] createConnector returned null');
							toast.warning(
								t(
									'Authorization successful, but failed to create connector. You can create it manually.'
								),
								{ duration: 6000 }
							);
						}
					} catch (createError) {
						console.error('[Connectors] Failed to auto-create connector:', createError);
						toast.warning(
							t(
								'Authorization successful, but failed to create connector. You can create it manually.'
							),
							{ duration: 6000 }
						);
					}
				}

				await Promise.all([loadGoogleStatus(), init()]);
			} else {
				// User cancelled or closed popup
				toast.info(t('Authorization was cancelled. You can try again anytime.'));
			}
		} catch (e) {
			// Enhanced error handling with specific messages
			const errorMessage = e?.message || e?.detail || String(e);

			if (errorMessage.includes('not configured') || errorMessage.includes('501')) {
				toast.error(
					t(
						'Google integration is not configured on this server. Please contact your system administrator or support team to enable Google services.'
					),
					{ duration: 10000 }
				);
				console.error(
					'[ADMIN ACTION REQUIRED] Google OAuth not configured. Required environment variables:\n' +
						'  GOOGLE_CLIENT_ID=your-app-id.apps.googleusercontent.com\n' +
						'  GOOGLE_CLIENT_SECRET=GOCSPX-your-secret\n' +
						'  GOOGLE_REDIRECT_URI=https://demo.echomind.ch/api/v1/google/auth/callback\n' +
						'Setup guide: https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred'
				);
			} else if (errorMessage.includes('Popup was blocked')) {
				toast.error(
					t('Popup was blocked by your browser. Please allow popups for this site and try again.'),
					{ duration: 6000 }
				);
			} else if (errorMessage.includes('timed out')) {
				toast.error(t('Authorization timed out. Please try again.'));
			} else if (errorMessage.includes('401') || errorMessage.includes('403')) {
				toast.error(t('Authentication failed. Please sign in again.'));
			} else {
				toast.error(`${t('Failed to connect')} ${service}: ${errorMessage}`);
				console.error(`[Connectors] Google OAuth error for ${service}:`, e);
			}
		} finally {
			connectingService = null;
		}
	};

	const handleGoogleDisconnect = async () => {
		try {
			await revokeGoogleAuth(localStorage.token);
			toast.success('Google account disconnected');
			await loadGoogleStatus();
		} catch (e) {
			toast.error(`Failed to disconnect: ${e}`);
		}
	};

	const handleSync = async (connector: Connector) => {
		syncingConnectors.add(connector.id);
		syncingConnectors = syncingConnectors;

		try {
			const res = await triggerConnectorSync(localStorage.token, connector.id);
			if (res.success) {
				toast.success('Sync triggered successfully');
			} else {
				toast.error(res.message || 'Sync failed');
			}
		} catch (e) {
			toast.error(`Sync failed: ${e}`);
		}

		syncingConnectors.delete(connector.id);
		syncingConnectors = syncingConnectors;

		// Refresh the list
		await init();
	};

	const deleteHandler = async (item: Connector) => {
		try {
			await deleteConnector(localStorage.token, item.id);
			toast.success('Connector deleted successfully');
			await init();
		} catch (e) {
			toast.error(`Failed to delete: ${e}`);
		}
	};

	onMount(async () => {
		await Promise.all([init(), loadGoogleStatus()]);
		loaded = true;
	});
</script>

<svelte:head>
	<title>Connectors • {$WEBUI_NAME}</title>
</svelte:head>

{#if loaded}
	<DeleteConfirmDialog
		bind:show={showDeleteConfirm}
		on:confirm={() => {
			if (selectedItem) deleteHandler(selectedItem);
		}}
	/>

	<ConnectorCreateModal
		bind:show={showCreateModal}
		on:created={() => init()}
	/>

	<ConnectorEditModal
		bind:show={showEditModal}
		item={editItem}
		on:updated={() => init()}
	/>

	<div class="flex flex-col gap-1 px-1 mt-1.5 mb-3">
		<!-- Google Workspace Section -->
		{#if googleStatus !== null}
			<div class="mb-6">
				<div class="flex justify-between items-center mb-3">
					<div class="text-lg font-medium">Google Workspace</div>
					{#if googleStatus.connected}
						<button
							class="text-sm text-red-500 hover:text-red-600 transition"
							on:click={handleGoogleDisconnect}
						>
							Disconnect All
						</button>
					{/if}
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					{#each googleServices as { service, label, icon, connectorType }}
						{@const isConnected = googleStatus?.services?.[service] ?? false}
						{@const isConnecting = connectingService === service}
						<button
							class="flex flex-col items-center gap-2 p-4 rounded-lg border transition
								{isConnected
									? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
									: 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10'}"
							disabled={isConnecting}
							on:click={() => {
								if (!isConnected) {
									handleGoogleConnect(service, connectorType);
								}
							}}
						>
							<span class="text-3xl">{icon}</span>
							<span class="text-sm font-medium dark:text-white">{label}</span>
							{#if isConnecting}
								<Spinner class="w-4 h-4" />
							{:else if isConnected}
								<Badge color="green">Connected</Badge>
							{:else}
								<span class="text-xs text-gray-500">Click to connect</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Connectors Section -->
		<div class="flex justify-between items-center">
			<div class="text-lg font-medium">Connectors</div>
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
				on:click={() => (showCreateModal = true)}
			>
				<Plus class="w-4 h-4" />
				Add Connector
			</button>
		</div>

		<!-- Connectors List -->
		<div class="mt-4">
			{#if itemsLoading}
				<div class="flex justify-center py-8">
					<Spinner />
				</div>
			{:else if items.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p>No connectors configured</p>
					<p class="text-sm mt-2">Add a connector to start ingesting documents</p>
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each items as item}
						<div
							class="flex flex-col p-4 rounded-lg bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition border border-gray-200 dark:border-gray-700"
						>
							<div class="flex items-start justify-between">
								<div class="flex items-center gap-2">
									<span class="text-2xl">{typeIcons[item.type]}</span>
									<div>
										<div class="font-medium">{item.name}</div>
										<div class="text-sm text-gray-500">{typeLabels[item.type]}</div>
									</div>
								</div>
								<Badge color={statusColors[item.status]}>
									{statusLabels[item.status]}
								</Badge>
							</div>

							<div class="mt-4 space-y-1 text-sm text-gray-500">
								<div class="flex justify-between">
									<span>Documents:</span>
									<span class="font-medium">{item.docs_analyzed}</span>
								</div>
								<div class="flex justify-between">
									<span>Sync interval:</span>
									<span>{item.refresh_freq_minutes} min</span>
								</div>
								{#if item.last_sync_at}
									<div class="flex justify-between">
										<span>Last sync:</span>
										<span>{dayjs(item.last_sync_at).fromNow()}</span>
									</div>
								{/if}
							</div>

							{#if item.status_message}
								<div class="mt-2 text-xs text-red-500 truncate" title={item.status_message}>
									{item.status_message}
								</div>
							{/if}

							<div class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
								<Tooltip content="Sync Now">
									<button
										class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
										disabled={syncingConnectors.has(item.id) ||
											item.status === 'CONNECTOR_STATUS_SYNCING'}
										on:click={() => handleSync(item)}
									>
										{#if syncingConnectors.has(item.id)}
											<Spinner class="w-4 h-4" />
										{:else}
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
												/>
											</svg>
										{/if}
									</button>
								</Tooltip>

								<Tooltip content="Edit">
									<button
										class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
										aria-label="Edit connector"
										on:click={() => {
											editItem = item;
											showEditModal = true;
										}}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</button>
								</Tooltip>

								<Tooltip content="Delete">
									<button
										class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600"
										aria-label="Delete connector"
										on:click={() => {
											selectedItem = item;
											showDeleteConfirm = true;
										}}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</Tooltip>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}