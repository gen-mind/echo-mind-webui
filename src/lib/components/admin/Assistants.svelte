<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import { toast } from 'svelte-sonner';
	import { onMount, getContext } from 'svelte';
	const i18n = getContext('i18n');

	import { WEBUI_NAME, user } from '$lib/stores';
	import { getAssistants, deleteAssistant } from '$lib/apis/echomind';
	import type { Assistant } from '$lib/apis/echomind';

	import DeleteConfirmDialog from '../common/ConfirmDialog.svelte';
	import Badge from '../common/Badge.svelte';
	import Plus from '../icons/Plus.svelte';
	import Spinner from '../common/Spinner.svelte';
	import Tooltip from '../common/Tooltip.svelte';

	let loaded = false;
	let showDeleteConfirm = false;
	let showCreateModal = false;

	let selectedItem: Assistant | null = null;
	let items: Assistant[] = [];
	let itemsLoading = false;

	const init = async () => {
		itemsLoading = true;
		try {
			const res = await getAssistants(localStorage.token);
			if (res) {
				items = res.assistants || [];
			}
		} catch (e) {
			toast.error(`Failed to load assistants: ${e}`);
		}
		itemsLoading = false;
	};

	const deleteHandler = async (item: Assistant) => {
		try {
			await deleteAssistant(localStorage.token, item.id);
			toast.success('Assistant deleted successfully');
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
	<title>Assistants • {$WEBUI_NAME}</title>
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
			<div class="text-lg font-medium">Assistants</div>
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
				on:click={() => (showCreateModal = true)}
			>
				<Plus class="w-4 h-4" />
				Create Assistant
			</button>
		</div>

		<p class="text-sm text-gray-500 mt-1">
			Configure AI assistants with custom personalities and prompts.
		</p>

		<!-- Assistants List -->
		<div class="mt-4">
			{#if itemsLoading}
				<div class="flex justify-center py-8">
					<Spinner />
				</div>
			{:else if items.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p>No assistants configured</p>
					<p class="text-sm mt-2">Create an assistant to customize chat interactions</p>
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each items as item}
						<div
							class="flex flex-col p-4 rounded-lg bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition border border-gray-200 dark:border-gray-700"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<span class="font-medium">{item.name}</span>
										{#if item.is_default}
											<Badge color="blue">Default</Badge>
										{/if}
										{#if !item.is_visible}
											<Badge color="gray">Hidden</Badge>
										{/if}
									</div>
									{#if item.description}
										<div class="text-sm text-gray-500 mt-1 line-clamp-2">
											{item.description}
										</div>
									{/if}
								</div>
							</div>

							<div class="mt-4 space-y-2 text-sm">
								{#if item.system_prompt}
									<div class="text-gray-500">
										<span class="font-medium">System Prompt:</span>
										<span class="line-clamp-2">{item.system_prompt}</span>
									</div>
								{/if}

								{#if item.starter_messages && item.starter_messages.length > 0}
									<div class="text-gray-500">
										<span class="font-medium">Starter Messages:</span>
										<span>{item.starter_messages.length}</span>
									</div>
								{/if}
							</div>

							{#if item.creation_date}
								<div class="text-xs text-gray-400 mt-2">
									Created {dayjs(item.creation_date).fromNow()}
								</div>
							{/if}

							<div class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
								<Tooltip content="Edit">
									<button class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
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
