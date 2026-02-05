<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	import { createEmbeddingModel } from '$lib/apis/echomind';
	import type { CreateEmbeddingModelRequest } from '$lib/apis/echomind';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;

	let loading = false;

	// Form fields
	let modelId = '';
	let modelName = '';
	let modelDimension = 384;
	let endpoint = '';

	// Common embedding models with their dimensions
	const presets = [
		{ id: 'all-MiniLM-L6-v2', name: 'MiniLM L6 v2', dimension: 384 },
		{ id: 'all-mpnet-base-v2', name: 'MPNet Base v2', dimension: 768 },
		{ id: 'text-embedding-ada-002', name: 'OpenAI Ada 002', dimension: 1536 },
		{ id: 'text-embedding-3-small', name: 'OpenAI Embedding 3 Small', dimension: 1536 },
		{ id: 'text-embedding-3-large', name: 'OpenAI Embedding 3 Large', dimension: 3072 },
		{ id: 'e5-large-v2', name: 'E5 Large v2', dimension: 1024 },
		{ id: 'bge-large-en-v1.5', name: 'BGE Large EN v1.5', dimension: 1024 }
	];

	function resetForm() {
		modelId = '';
		modelName = '';
		modelDimension = 384;
		endpoint = '';
	}

	function applyPreset(preset: (typeof presets)[0]) {
		modelId = preset.id;
		modelName = preset.name;
		modelDimension = preset.dimension;
	}

	async function handleSubmit() {
		if (!modelId.trim()) {
			toast.error($i18n.t('Model ID is required'));
			return;
		}
		if (!modelName.trim()) {
			toast.error($i18n.t('Model name is required'));
			return;
		}
		if (modelDimension < 1) {
			toast.error($i18n.t('Model dimension must be positive'));
			return;
		}

		loading = true;
		try {
			const data: CreateEmbeddingModelRequest = {
				model_id: modelId.trim(),
				model_name: modelName.trim(),
				model_dimension: modelDimension
			};

			if (endpoint.trim()) {
				data.endpoint = endpoint.trim();
			}

			const result = await createEmbeddingModel(localStorage.token, data);
			toast.success($i18n.t('Embedding model created successfully'));
			dispatch('created', result);
			resetForm();
			show = false;
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to create embedding model'));
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		resetForm();
		show = false;
	}
</script>

<Modal size="md" bind:show>
	<div class="p-6">
		<!-- Header -->
		<div class="flex justify-between items-center mb-6">
			<h3 class="text-lg font-medium dark:text-white">{$i18n.t('Add Embedding Model')}</h3>
			<button
				class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
				on:click={handleClose}
			>
				<XMark className="size-5" />
			</button>
		</div>

		<!-- Presets -->
		<div class="mb-6">
			<span class="block text-sm font-medium mb-2 dark:text-gray-200">
				{$i18n.t('Quick Select')}
			</span>
			<div class="flex flex-wrap gap-2">
				{#each presets as preset}
					<button
						type="button"
						class="px-3 py-1.5 text-sm rounded-lg border transition {modelId === preset.id
							? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
							: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:text-white'}"
						on:click={() => applyPreset(preset)}
					>
						{preset.name}
					</button>
				{/each}
			</div>
		</div>

		<!-- Form -->
		<form on:submit|preventDefault={handleSubmit}>
			<div class="space-y-4">
				<!-- Model ID -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Model ID')} <span class="text-red-500">*</span>
					</span>
					<input
						type="text"
						bind:value={modelId}
						placeholder={$i18n.t('e.g., all-MiniLM-L6-v2')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
						required
					/>
					<p class="mt-1 text-xs text-gray-500">
						{$i18n.t('The model identifier used by the embedding service')}
					</p>
				</label>

				<!-- Model Name -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Display Name')} <span class="text-red-500">*</span>
					</span>
					<input
						type="text"
						bind:value={modelName}
						placeholder={$i18n.t('e.g., MiniLM L6 v2')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
				</label>

				<!-- Model Dimension -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Vector Dimension')} <span class="text-red-500">*</span>
					</span>
					<input
						type="number"
						bind:value={modelDimension}
						min="1"
						max="8192"
						class="w-32 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
					<p class="mt-1 text-xs text-gray-500">
						{$i18n.t('The dimensionality of the embedding vectors (e.g., 384, 768, 1536)')}
					</p>
				</label>

				<!-- Endpoint -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Custom Endpoint')}
					</span>
					<input
						type="url"
						bind:value={endpoint}
						placeholder={$i18n.t('Optional - leave empty for default')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<p class="mt-1 text-xs text-gray-500">
						{$i18n.t('Override the default embedding service endpoint')}
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
