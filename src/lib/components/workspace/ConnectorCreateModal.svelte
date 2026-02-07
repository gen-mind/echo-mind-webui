<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	import { createConnector } from '$lib/apis/echomind';
	import type { ConnectorType, ConnectorScope, CreateConnectorRequest } from '$lib/apis/echomind';

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
			toast.success($i18n.t('Connector created successfully'));
			dispatch('created', result);
			resetForm();
			show = false;
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to create connector'));
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
				{:else if connectorType === 'CONNECTOR_TYPE_GOOGLE_DRIVE'}
					<div class="p-4 bg-gray-50 dark:bg-gray-850 rounded-lg">
						<label class="block">
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
						<p class="mt-2 text-xs text-gray-500">
							{$i18n.t('Requires Google Drive API authentication configured in the backend')}
						</p>
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
				{:else if connectorType === 'CONNECTOR_TYPE_GMAIL' || connectorType === 'CONNECTOR_TYPE_GOOGLE_CALENDAR' || connectorType === 'CONNECTOR_TYPE_GOOGLE_CONTACTS'}
					<div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
						{$i18n.t('Requires Google OAuth. Use the Google Workspace section above to connect first.')}
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
