<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import Badge from '$lib/components/common/Badge.svelte';

	import { updateConnector, getConnectorStatus } from '$lib/apis/echomind';
	import type {
		Connector,
		ConnectorScope,
		ConnectorStatus,
		UpdateConnectorRequest
	} from '$lib/apis/echomind';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;
	export let item: Connector | null = null;

	let loading = false;
	let statusLoading = false;

	// Form fields
	let name = '';
	let scope: ConnectorScope = 'CONNECTOR_SCOPE_USER';
	let scopeId = '';
	let refreshFreq = 60;
	let config: Record<string, unknown> = {};

	// Status info
	let statusInfo: {
		status: ConnectorStatus;
		status_message: string;
		last_sync_at: string | null;
		docs_analyzed: number;
		docs_pending: number;
	} | null = null;

	const scopes: { value: ConnectorScope; label: string }[] = [
		{ value: 'CONNECTOR_SCOPE_USER', label: 'Personal' },
		{ value: 'CONNECTOR_SCOPE_GROUP', label: 'Team/Group' },
		{ value: 'CONNECTOR_SCOPE_ORG', label: 'Organization' }
	];

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

	const typeLabels: Record<string, string> = {
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

	// Populate form when item changes
	$: if (item && show) {
		name = item.name;
		scope = item.scope;
		scopeId = item.scope_id || '';
		refreshFreq = item.refresh_freq_minutes;
		config = item.config ? { ...item.config } : {};
		loadStatus();
	}

	async function loadStatus() {
		if (!item) return;
		statusLoading = true;
		try {
			statusInfo = await getConnectorStatus(localStorage.token, item.id);
		} catch {
			// Status endpoint might not exist for all connectors
			statusInfo = null;
		}
		statusLoading = false;
	}

	async function handleSubmit() {
		if (!item) return;

		if (!name.trim()) {
			toast.error($i18n.t('Name is required'));
			return;
		}

		loading = true;
		try {
			const data: UpdateConnectorRequest = {
				name: name.trim(),
				scope: scope,
				refresh_freq_minutes: refreshFreq,
				config: config
			};

			if (scope !== 'CONNECTOR_SCOPE_USER' && scopeId.trim()) {
				data.scope_id = scopeId.trim();
			}

			const result = await updateConnector(localStorage.token, item.id, data);
			toast.success($i18n.t('Connector updated successfully'));
			dispatch('updated', result);
			show = false;
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to update connector'));
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		show = false;
	}

	function getConfigValue(key: string): string {
		return (config[key] as string) || '';
	}

	function setConfigValue(key: string, value: string) {
		config = { ...config, [key]: value };
	}
</script>

<Modal size="lg" bind:show>
	<div class="p-6 max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex justify-between items-center mb-6">
			<h3 class="text-lg font-medium dark:text-white">{$i18n.t('Edit Connector')}</h3>
			<button
				class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
				on:click={handleClose}
			>
				<XMark className="size-5" />
			</button>
		</div>

		{#if item}
			<!-- Status Card -->
			<div class="mb-6 p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center gap-2">
						<span class="font-medium dark:text-white">{typeLabels[item.type]}</span>
						<Badge color={statusColors[item.status]}>
							{statusLabels[item.status]}
						</Badge>
					</div>
					<button
						class="text-sm text-blue-600 hover:text-blue-700"
						on:click={loadStatus}
						disabled={statusLoading}
					>
						{#if statusLoading}
							<Spinner class="w-4 h-4" />
						{:else}
							{$i18n.t('Refresh Status')}
						{/if}
					</button>
				</div>

				{#if statusInfo}
					<div class="grid grid-cols-2 gap-2 text-sm">
						<div>
							<span class="text-gray-500">{$i18n.t('Documents Analyzed')}:</span>
							<span class="font-medium ml-1 dark:text-white">{statusInfo.docs_analyzed}</span>
						</div>
						<div>
							<span class="text-gray-500">{$i18n.t('Documents Pending')}:</span>
							<span class="font-medium ml-1 dark:text-white">{statusInfo.docs_pending}</span>
						</div>
						{#if statusInfo.last_sync_at}
							<div class="col-span-2">
								<span class="text-gray-500">{$i18n.t('Last Sync')}:</span>
								<span class="font-medium ml-1 dark:text-white">
									{new Date(statusInfo.last_sync_at).toLocaleString()}
								</span>
							</div>
						{/if}
						{#if statusInfo.status_message}
							<div class="col-span-2">
								<span class="text-gray-500">{$i18n.t('Message')}:</span>
								<span
									class="ml-1 {statusInfo.status === 'CONNECTOR_STATUS_ERROR'
										? 'text-red-500'
										: 'dark:text-white'}"
								>
									{statusInfo.status_message}
								</span>
							</div>
						{/if}
					</div>
				{/if}
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

					<!-- Type-specific config -->
					{#if item.type === 'CONNECTOR_TYPE_WEB'}
						<div class="space-y-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
							<label class="block">
								<span class="block text-sm font-medium mb-1 dark:text-gray-200">
									{$i18n.t('Starting URL')}
								</span>
								<input
									type="url"
									value={getConfigValue('url')}
									on:input={(e) => setConfigValue('url', e.currentTarget.value)}
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
									value={config.depth || 2}
									on:input={(e) => setConfigValue('depth', e.currentTarget.value)}
									min="1"
									max="5"
									class="w-24 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</label>
						</div>
					{:else if item.type === 'CONNECTOR_TYPE_TEAMS'}
						<div class="p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
							<label class="block">
								<span class="block text-sm font-medium mb-1 dark:text-gray-200">
									{$i18n.t('Teams Channel ID')}
								</span>
								<input
									type="text"
									value={getConfigValue('channel_id')}
									on:input={(e) => setConfigValue('channel_id', e.currentTarget.value)}
									placeholder={$i18n.t('Optional - leave empty for all channels')}
									class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</label>
						</div>
					{:else if item.type === 'CONNECTOR_TYPE_GOOGLE_DRIVE'}
						<div class="p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
							<label class="block">
								<span class="block text-sm font-medium mb-1 dark:text-gray-200">
									{$i18n.t('Drive ID')}
								</span>
								<input
									type="text"
									value={getConfigValue('drive_id')}
									on:input={(e) => setConfigValue('drive_id', e.currentTarget.value)}
									placeholder={$i18n.t('Optional - leave empty for My Drive')}
									class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</label>
						</div>
					{:else if item.type === 'CONNECTOR_TYPE_ONEDRIVE'}
						<div class="p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
							<label class="block">
								<span class="block text-sm font-medium mb-1 dark:text-gray-200">
									{$i18n.t('Folder Path')}
								</span>
								<input
									type="text"
									value={getConfigValue('path')}
									on:input={(e) => setConfigValue('path', e.currentTarget.value)}
									placeholder={$i18n.t('e.g., /Documents/Work')}
									class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</label>
						</div>
					{:else if item.type === 'CONNECTOR_TYPE_GMAIL' || item.type === 'CONNECTOR_TYPE_GOOGLE_CALENDAR' || item.type === 'CONNECTOR_TYPE_GOOGLE_CONTACTS'}
						<div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
							{$i18n.t('This connector syncs data via Google OAuth. Manage authorization in the Google Workspace section.')}
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
				<div
					class="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
				>
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
						{loading ? $i18n.t('Saving...') : $i18n.t('Save')}
					</button>
				</div>
			</form>
		{/if}
	</div>
</Modal>
