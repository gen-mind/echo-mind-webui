<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	import { WEBUI_NAME } from '$lib/stores';
	import { getLLMs, deleteLLM, testLLM } from '$lib/apis/echomind';
	import type { LLM, LLMProvider } from '$lib/apis/echomind';

	import DeleteConfirmDialog from '../common/ConfirmDialog.svelte';
	import Badge from '../common/Badge.svelte';
	import Plus from '../icons/Plus.svelte';
	import Spinner from '../common/Spinner.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import LLMCreateModal from './LLMCreateModal.svelte';
	import LLMEditModal from './LLMEditModal.svelte';

	let loaded = false;
	let showDeleteConfirm = false;
	let showCreateModal = false;
	let showEditModal = false;

	let selectedItem: LLM | null = null;
	let editingItem: LLM | null = null;
	let testingLLMs: Set<number> = new Set();

	let items: LLM[] = [];
	let itemsLoading = false;

	const providerLabels: Record<LLMProvider, string> = {
		LLM_PROVIDER_UNSPECIFIED: 'Unknown',
		LLM_PROVIDER_OPENAI_COMPATIBLE: 'OpenAI Compatible',
		LLM_PROVIDER_ANTHROPIC: 'Anthropic',
		LLM_PROVIDER_ANTHROPIC_TOKEN: 'Anthropic (Token)'
	};

	const providerColors: Record<LLMProvider, string> = {
		LLM_PROVIDER_UNSPECIFIED: 'gray',
		LLM_PROVIDER_OPENAI_COMPATIBLE: 'green',
		LLM_PROVIDER_ANTHROPIC: 'orange',
		LLM_PROVIDER_ANTHROPIC_TOKEN: 'orange'
	};

	const init = async () => {
		itemsLoading = true;
		try {
			const res = await getLLMs(localStorage.token);
			if (res) {
				items = res.llms || [];
			}
		} catch (e) {
			toast.error(`Failed to load LLMs: ${e}`);
		}
		itemsLoading = false;
	};

	const handleTest = async (llm: LLM) => {
		testingLLMs.add(llm.id);
		testingLLMs = testingLLMs;

		try {
			const res = await testLLM(localStorage.token, llm.id);
			if (res.success) {
				toast.success(`Connection successful (${res.latency_ms}ms)`);
			} else {
				toast.error(res.message || 'Connection test failed');
			}
		} catch (e) {
			toast.error(`Test failed: ${e}`);
		}

		testingLLMs.delete(llm.id);
		testingLLMs = testingLLMs;
	};

	const deleteHandler = async (item: LLM) => {
		try {
			await deleteLLM(localStorage.token, item.id);
			toast.success('LLM deleted successfully');
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
	<title>LLM Configuration • {$WEBUI_NAME}</title>
</svelte:head>

{#if loaded}
	<DeleteConfirmDialog
		bind:show={showDeleteConfirm}
		on:confirm={() => {
			if (selectedItem) deleteHandler(selectedItem);
		}}
	/>

	<div class="flex flex-col gap-1 px-1 mt-1.5 mb-3">
		<div class="flex justify-between items-center">
			<div class="text-lg font-medium">LLM Configuration</div>
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
				on:click={() => (showCreateModal = true)}
			>
				<Plus class="w-4 h-4" />
				Add LLM
			</button>
		</div>

		<!-- LLMs List -->
		<div class="mt-4">
			{#if itemsLoading}
				<div class="flex justify-center py-8">
					<Spinner />
				</div>
			{:else if items.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p>No LLMs configured</p>
					<p class="text-sm mt-2">Add an LLM provider to get started</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each items as item}
						<div
							class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
						>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="font-medium">{item.name}</span>
									{#if item.is_default}
										<Badge color="blue">Default</Badge>
									{/if}
									{#if !item.is_active}
										<Badge color="gray">Inactive</Badge>
									{/if}
								</div>
								<div class="text-sm text-gray-500 mt-1">
									<span>{item.model_id}</span>
									{#if item.endpoint}
										<span class="mx-2">•</span>
										<span class="truncate">{item.endpoint}</span>
									{/if}
								</div>
								<div class="flex items-center gap-2 mt-1">
									<Badge color={providerColors[item.provider]}>
										{providerLabels[item.provider]}
									</Badge>
									{#if item.has_api_key}
										<span class="text-xs text-green-600">🔑 API Key Set</span>
									{/if}
								</div>
							</div>

							<div class="flex items-center gap-2">
								<Tooltip content="Test Connection">
									<button
										class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
										disabled={testingLLMs.has(item.id)}
										on:click={() => handleTest(item)}
									>
										{#if testingLLMs.has(item.id)}
											<Spinner class="w-4 h-4" />
										{:else}
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
										{/if}
									</button>
								</Tooltip>

								<Tooltip content="Edit">
									<button
										class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
										aria-label="Edit LLM"
										on:click={() => {
											editingItem = item;
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
										aria-label="Delete LLM"
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

	<!-- Create Modal -->
	{#if showCreateModal}
		<LLMCreateModal
			bind:show={showCreateModal}
			on:created={() => {
				init();
			}}
		/>
	{/if}

	<!-- Edit Modal -->
	{#if showEditModal && editingItem}
		<LLMEditModal
			bind:show={showEditModal}
			item={editingItem}
			on:updated={() => {
				init();
			}}
		/>
	{/if}
{/if}