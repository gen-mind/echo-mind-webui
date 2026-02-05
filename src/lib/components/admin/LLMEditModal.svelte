<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	import { updateLLM, testLLM } from '$lib/apis/echomind';
	import type { LLM, LLMProvider, UpdateLLMRequest } from '$lib/apis/echomind';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;
	export let item: LLM | null = null;

	let loading = false;
	let testing = false;
	let testResult: { success: boolean; message: string; latency_ms?: number } | null = null;

	// Form fields
	let name = '';
	let provider: LLMProvider = 'LLM_PROVIDER_OPENAI_COMPATIBLE';
	let modelId = '';
	let endpoint = '';
	let apiKey = '';
	let changeApiKey = false;
	let maxTokens: number | null = null;
	let temperature: number = 0.7;
	let isDefault = false;
	let isActive = true;

	const providers: { value: LLMProvider; label: string }[] = [
		{ value: 'LLM_PROVIDER_OPENAI_COMPATIBLE', label: 'OpenAI Compatible' },
		{ value: 'LLM_PROVIDER_ANTHROPIC', label: 'Anthropic' },
		{ value: 'LLM_PROVIDER_ANTHROPIC_TOKEN', label: 'Anthropic (Token-based)' }
	];

	$: showEndpoint = provider === 'LLM_PROVIDER_OPENAI_COMPATIBLE';

	// Populate form when item changes
	$: if (item && show) {
		name = item.name;
		provider = item.provider;
		modelId = item.model_id;
		endpoint = item.endpoint || '';
		maxTokens = item.max_tokens || null;
		temperature = item.temperature ?? 0.7;
		isDefault = item.is_default;
		isActive = item.is_active;
		apiKey = '';
		changeApiKey = false;
		testResult = null;
	}

	async function handleTest() {
		if (!item) return;

		testing = true;
		testResult = null;

		try {
			const result = await testLLM(localStorage.token, item.id);
			testResult = result;
			if (result.success) {
				toast.success($i18n.t('Connection successful') + ` (${result.latency_ms}ms)`);
			} else {
				toast.error(result.message || $i18n.t('Connection test failed'));
			}
		} catch (error) {
			testResult = { success: false, message: error?.toString() || 'Test failed' };
			toast.error(error?.toString() || $i18n.t('Connection test failed'));
		} finally {
			testing = false;
		}
	}

	async function handleSubmit() {
		if (!item) return;

		if (!name.trim()) {
			toast.error($i18n.t('Name is required'));
			return;
		}
		if (!modelId.trim()) {
			toast.error($i18n.t('Model ID is required'));
			return;
		}
		if (changeApiKey && !apiKey.trim()) {
			toast.error($i18n.t('API Key is required when changing it'));
			return;
		}
		if (showEndpoint && !endpoint.trim()) {
			toast.error($i18n.t('Endpoint is required for OpenAI Compatible providers'));
			return;
		}

		loading = true;
		try {
			const data: UpdateLLMRequest = {
				name: name.trim(),
				provider,
				model_id: modelId.trim(),
				is_default: isDefault,
				is_active: isActive
			};

			if (showEndpoint) {
				data.endpoint = endpoint.trim();
			}
			if (changeApiKey && apiKey.trim()) {
				data.api_key = apiKey.trim();
			}
			if (maxTokens !== null && maxTokens > 0) {
				data.max_tokens = maxTokens;
			}
			if (temperature !== null) {
				data.temperature = temperature;
			}

			const result = await updateLLM(localStorage.token, item.id, data);
			toast.success($i18n.t('LLM updated successfully'));
			dispatch('updated', result);
			show = false;
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to update LLM'));
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		show = false;
	}
</script>

<Modal size="md" bind:show>
	<div class="p-6">
		<!-- Header -->
		<div class="flex justify-between items-center mb-6">
			<h3 class="text-lg font-medium dark:text-white">{$i18n.t('Edit LLM')}</h3>
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
						placeholder={$i18n.t('e.g., GPT-4 Production')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
				</label>

				<!-- Provider -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Provider')} <span class="text-red-500">*</span>
					</span>
					<select
						bind:value={provider}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						{#each providers as p}
							<option value={p.value}>{p.label}</option>
						{/each}
					</select>
				</label>

				<!-- Model ID -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Model ID')} <span class="text-red-500">*</span>
					</span>
					<input
						type="text"
						bind:value={modelId}
						placeholder={provider.includes('ANTHROPIC')
							? 'e.g., claude-3-opus-20240229'
							: 'e.g., gpt-4-turbo-preview'}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
				</label>

				<!-- Endpoint (only for OpenAI Compatible) -->
				{#if showEndpoint}
					<label class="block">
						<span class="block text-sm font-medium mb-1 dark:text-gray-200">
							{$i18n.t('Endpoint')} <span class="text-red-500">*</span>
						</span>
						<input
							type="url"
							bind:value={endpoint}
							placeholder="https://api.openai.com/v1"
							class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
						<p class="mt-1 text-xs text-gray-500">
							{$i18n.t('The base URL for the API (e.g., https://api.openai.com/v1)')}
						</p>
					</label>
				{/if}

				<!-- API Key -->
				<div>
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('API Key')}
					</span>
					{#if !changeApiKey}
						<div class="flex items-center gap-2">
							<span class="text-sm text-gray-500 dark:text-gray-400">
								{item?.has_api_key ? '••••••••••••••••' : $i18n.t('No API key set')}
							</span>
							<button
								type="button"
								class="text-sm text-blue-600 hover:text-blue-700"
								on:click={() => (changeApiKey = true)}
							>
								{$i18n.t('Change')}
							</button>
						</div>
					{:else}
						<label class="block space-y-2">
							<input
								type="password"
								bind:value={apiKey}
								placeholder="sk-..."
								class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</label>
						<button
							type="button"
							class="text-sm text-gray-500 hover:text-gray-700 mt-2"
							on:click={() => {
								changeApiKey = false;
								apiKey = '';
							}}
						>
							{$i18n.t('Cancel change')}
						</button>
					{/if}
				</div>

				<!-- Max Tokens -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Max Tokens')}
					</span>
					<input
						type="number"
						bind:value={maxTokens}
						placeholder={$i18n.t('Leave empty for model default')}
						min="1"
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</label>

				<!-- Temperature -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Temperature')}: {temperature}
					</span>
					<input
						type="range"
						bind:value={temperature}
						min="0"
						max="2"
						step="0.1"
						class="w-full"
					/>
					<div class="flex justify-between text-xs text-gray-500">
						<span>{$i18n.t('Precise')}</span>
						<span>{$i18n.t('Creative')}</span>
					</div>
				</label>

				<!-- Checkboxes -->
				<div class="flex gap-6">
					<label class="flex items-center gap-2 dark:text-gray-200">
						<input
							type="checkbox"
							bind:checked={isDefault}
							class="rounded border-gray-300 dark:border-gray-600"
						/>
						<span class="text-sm">{$i18n.t('Set as default')}</span>
					</label>

					<label class="flex items-center gap-2 dark:text-gray-200">
						<input
							type="checkbox"
							bind:checked={isActive}
							class="rounded border-gray-300 dark:border-gray-600"
						/>
						<span class="text-sm">{$i18n.t('Active')}</span>
					</label>
				</div>

				<!-- Test Connection -->
				{#if testResult}
					<div
						class="p-3 rounded-lg {testResult.success
							? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
							: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}"
					>
						{#if testResult.success}
							<span>✓ {$i18n.t('Connection successful')}</span>
							{#if testResult.latency_ms}
								<span class="text-sm ml-2">({testResult.latency_ms}ms)</span>
							{/if}
						{:else}
							<span>✗ {testResult.message}</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex justify-between mt-6">
				<button
					type="button"
					class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-2"
					disabled={testing}
					on:click={handleTest}
				>
					{#if testing}
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
					{testing ? $i18n.t('Testing...') : $i18n.t('Test Connection')}
				</button>

				<div class="flex gap-2">
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
			</div>
		</form>
	</div>
</Modal>
