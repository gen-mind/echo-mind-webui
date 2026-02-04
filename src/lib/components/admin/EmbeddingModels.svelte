<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import { toast } from 'svelte-sonner';
	import { onMount, getContext } from 'svelte';
	const i18n = getContext('i18n');

	import { WEBUI_NAME, user } from '$lib/stores';
	import { getEmbeddingModels, activateEmbeddingModel } from '$lib/apis/echomind';
	import type { EmbeddingModel } from '$lib/apis/echomind';

	import Badge from '../common/Badge.svelte';
	import Plus from '../icons/Plus.svelte';
	import Spinner from '../common/Spinner.svelte';
	import Tooltip from '../common/Tooltip.svelte';

	let loaded = false;
	let showCreateModal = false;

	let activatingModel: number | null = null;
	let items: EmbeddingModel[] = [];
	let itemsLoading = false;

	const init = async () => {
		itemsLoading = true;
		try {
			const res = await getEmbeddingModels(localStorage.token);
			if (res) {
				items = res.models || [];
			}
		} catch (e) {
			toast.error(`Failed to load embedding models: ${e}`);
		}
		itemsLoading = false;
	};

	const handleActivate = async (model: EmbeddingModel) => {
		if (model.is_active) return;

		activatingModel = model.id;

		try {
			const res = await activateEmbeddingModel(localStorage.token, model.id);
			if (res.success) {
				let message = 'Model activated successfully';
				if (res.requires_reindex) {
					message += `. ${res.documents_affected} documents will be re-indexed.`;
				}
				toast.success(message);
				await init();
			} else {
				toast.error(res.message || 'Activation failed');
			}
		} catch (e) {
			toast.error(`Activation failed: ${e}`);
		}

		activatingModel = null;
	};

	onMount(async () => {
		await init();
		loaded = true;
	});
</script>

<svelte:head>
	<title>Embedding Models • {$WEBUI_NAME}</title>
</svelte:head>

{#if loaded}
	<div class="flex flex-col gap-1 px-1 mt-1.5 mb-3">
		<div class="flex justify-between items-center">
			<div class="text-lg font-medium">Embedding Models</div>
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
				on:click={() => (showCreateModal = true)}
			>
				<Plus class="w-4 h-4" />
				Add Model
			</button>
		</div>

		<p class="text-sm text-gray-500 mt-1">
			Configure embedding models for document vectorization. Only one model can be active at a time.
		</p>

		<!-- Models List -->
		<div class="mt-4">
			{#if itemsLoading}
				<div class="flex justify-center py-8">
					<Spinner />
				</div>
			{:else if items.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p>No embedding models configured</p>
					<p class="text-sm mt-2">Add an embedding model to enable document search</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each items as item}
						<div
							class="flex items-center justify-between p-4 rounded-lg transition {item.is_active
								? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
								: 'bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800'}"
						>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="font-medium">{item.model_name}</span>
									{#if item.is_active}
										<Badge color="green">Active</Badge>
									{/if}
								</div>
								<div class="text-sm text-gray-500 mt-1">
									<span>ID: {item.model_id}</span>
									<span class="mx-2">•</span>
									<span>{item.model_dimension} dimensions</span>
								</div>
								{#if item.endpoint}
									<div class="text-sm text-gray-400 mt-1 truncate">
										Endpoint: {item.endpoint}
									</div>
								{/if}
								{#if item.creation_date}
									<div class="text-xs text-gray-400 mt-1">
										Added {dayjs(item.creation_date).fromNow()}
									</div>
								{/if}
							</div>

							<div class="flex items-center gap-2">
								{#if !item.is_active}
									<Tooltip content="Activate this model">
										<button
											class="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition disabled:opacity-50"
											disabled={activatingModel === item.id}
											on:click={() => handleActivate(item)}
										>
											{#if activatingModel === item.id}
												<Spinner class="w-4 h-4" />
											{:else}
												Activate
											{/if}
										</button>
									</Tooltip>
								{:else}
									<span class="px-4 py-2 text-green-600 font-medium">
										✓ Active
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}