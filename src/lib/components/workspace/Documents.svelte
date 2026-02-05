<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	import { WEBUI_NAME } from '$lib/stores';
	import { getDocuments, deleteDocument, searchDocuments } from '$lib/apis/echomind';
	import type { Document, DocumentStatus } from '$lib/apis/echomind';

	import DeleteConfirmDialog from '../common/ConfirmDialog.svelte';
	import Badge from '../common/Badge.svelte';
	import Search from '../icons/Search.svelte';
	import Spinner from '../common/Spinner.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import Plus from '../icons/Plus.svelte';
	import DocumentUploadModal from './DocumentUploadModal.svelte';

	let loaded = false;
	let showDeleteConfirm = false;
	let showUploadModal = false;

	let selectedItem: Document | null = null;

	let page = 1;
	let query = '';
	let statusFilter = '';

	let items: Document[] = [];
	let total = 0;
	let totalPages = 0;

	let itemsLoading = false;

	const statusColors: Record<DocumentStatus, string> = {
		DOCUMENT_STATUS_UNSPECIFIED: 'gray',
		DOCUMENT_STATUS_PENDING: 'yellow',
		DOCUMENT_STATUS_PROCESSING: 'blue',
		DOCUMENT_STATUS_COMPLETED: 'green',
		DOCUMENT_STATUS_FAILED: 'red'
	};

	const statusLabels: Record<DocumentStatus, string> = {
		DOCUMENT_STATUS_UNSPECIFIED: 'Unknown',
		DOCUMENT_STATUS_PENDING: 'Pending',
		DOCUMENT_STATUS_PROCESSING: 'Processing',
		DOCUMENT_STATUS_COMPLETED: 'Completed',
		DOCUMENT_STATUS_FAILED: 'Failed'
	};

	const init = async () => {
		page = 1;
		await loadItems();
	};

	const loadItems = async () => {
		itemsLoading = true;
		try {
			const res = await getDocuments(localStorage.token, {
				page,
				limit: 20,
				doc_status: statusFilter || undefined
			});

			if (res) {
				items = res.documents || [];
				total = res.pagination?.total || 0;
				totalPages = res.pagination?.total_pages || 0;
			}
		} catch (e) {
			toast.error(`Failed to load documents: ${e}`);
		}
		itemsLoading = false;
	};

	const handleSearch = async () => {
		if (!query.trim()) {
			await init();
			return;
		}

		itemsLoading = true;
		try {
			const res = await searchDocuments(localStorage.token, {
				query: query.trim(),
				limit: 20
			});

			if (res) {
				items = res.results.map((r) => r.document);
				total = res.results.length;
				totalPages = 1;
			}
		} catch (e) {
			toast.error(`Search failed: ${e}`);
		}
		itemsLoading = false;
	};

	const deleteHandler = async (item: Document) => {
		try {
			await deleteDocument(localStorage.token, item.id);
			toast.success('Document deleted successfully');
			await init();
		} catch (e) {
			toast.error(`Failed to delete: ${e}`);
		}
	};

	const nextPage = () => {
		if (page < totalPages) {
			page += 1;
			loadItems();
		}
	};

	const prevPage = () => {
		if (page > 1) {
			page -= 1;
			loadItems();
		}
	};

	onMount(async () => {
		await init();
		loaded = true;
	});
</script>

<svelte:head>
	<title>Documents • {$WEBUI_NAME}</title>
</svelte:head>

{#if loaded}
	<DeleteConfirmDialog
		bind:show={showDeleteConfirm}
		on:confirm={() => {
			if (selectedItem) deleteHandler(selectedItem);
		}}
	/>

	<DocumentUploadModal
		bind:show={showUploadModal}
		on:uploaded={() => init()}
	/>

	<div class="flex flex-col gap-1 px-1 mt-1.5 mb-3">
		<div class="flex justify-between items-center">
			<div class="text-lg font-medium">Documents</div>
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
				on:click={() => (showUploadModal = true)}
			>
				<Plus class="w-4 h-4" />
				Upload Document
			</button>
		</div>

		<!-- Search and Filter -->
		<div class="flex gap-2 mt-2">
			<div class="flex-1 relative">
				<input
					type="text"
					placeholder="Search documents..."
					bind:value={query}
					on:keydown={(e) => e.key === 'Enter' && handleSearch()}
					class="w-full px-4 py-2 pl-10 rounded-lg bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-700"
				/>
				<Search class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
			</div>

			<select
				bind:value={statusFilter}
				on:change={init}
				class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-700"
			>
				<option value="">All Status</option>
				<option value="pending">Pending</option>
				<option value="processing">Processing</option>
				<option value="completed">Completed</option>
				<option value="failed">Failed</option>
			</select>
		</div>

		<!-- Documents List -->
		<div class="mt-4">
			{#if itemsLoading}
				<div class="flex justify-center py-8">
					<Spinner />
				</div>
			{:else if items.length === 0}
				<div class="text-center py-8 text-gray-500">No documents found</div>
			{:else}
				<div class="space-y-2">
					{#each items as item}
						<div
							class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
						>
							<div class="flex-1 min-w-0">
								<div class="font-medium truncate">{item.title || 'Untitled'}</div>
								<div class="text-sm text-gray-500 truncate">
									{item.url || item.original_url || 'No URL'}
								</div>
								<div class="flex gap-2 mt-1 text-xs text-gray-400">
									<span>{item.content_type || 'Unknown type'}</span>
									<span>•</span>
									<span>{item.chunk_count} chunks</span>
									{#if item.creation_date}
										<span>•</span>
										<span>{dayjs(item.creation_date).fromNow()}</span>
									{/if}
								</div>
							</div>

							<div class="flex items-center gap-2">
								<Badge color={statusColors[item.status]}>
									{statusLabels[item.status]}
								</Badge>

								<Tooltip content="Delete">
									<button
										class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
										aria-label="Delete document"
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

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex justify-center items-center gap-4 mt-4">
						<button
							class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-850 disabled:opacity-50"
							disabled={page <= 1}
							on:click={prevPage}
						>
							Previous
						</button>
						<span class="text-sm text-gray-500">
							Page {page} of {totalPages} ({total} total)
						</span>
						<button
							class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-850 disabled:opacity-50"
							disabled={page >= totalPages}
							on:click={nextPage}
						>
							Next
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}
