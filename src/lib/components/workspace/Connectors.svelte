<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	import { WEBUI_NAME } from '$lib/stores';
	import {
		getConnectors,
		deleteConnector,
		triggerConnectorSync
	} from '$lib/apis/echomind';
	import type { Connector, ConnectorType, ConnectorStatus } from '$lib/apis/echomind';

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

	const typeLabels: Record<ConnectorType, string> = {
		CONNECTOR_TYPE_UNSPECIFIED: 'Unknown',
		CONNECTOR_TYPE_TEAMS: 'Microsoft Teams',
		CONNECTOR_TYPE_GOOGLE_DRIVE: 'Google Drive',
		CONNECTOR_TYPE_ONEDRIVE: 'OneDrive',
		CONNECTOR_TYPE_WEB: 'Web Crawler',
		CONNECTOR_TYPE_FILE: 'File Upload'
	};

	const typeIcons: Record<ConnectorType, string> = {
		CONNECTOR_TYPE_UNSPECIFIED: '❓',
		CONNECTOR_TYPE_TEAMS: '💬',
		CONNECTOR_TYPE_GOOGLE_DRIVE: '📁',
		CONNECTOR_TYPE_ONEDRIVE: '☁️',
		CONNECTOR_TYPE_WEB: '🌐',
		CONNECTOR_TYPE_FILE: '📄'
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
		await init();
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
