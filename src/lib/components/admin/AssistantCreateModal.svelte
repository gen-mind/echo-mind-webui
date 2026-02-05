<script lang="ts">
	import { getContext, createEventDispatcher, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	import { createAssistant, getLLMs } from '$lib/apis/echomind';
	import type { CreateAssistantRequest, LLM } from '$lib/apis/echomind';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;

	let loading = false;
	let llmsLoading = true;
	let llms: LLM[] = [];

	// Form fields
	let name = '';
	let description = '';
	let llmId: number | null = null;
	let systemPrompt = '';
	let taskPrompt = '';
	let starterMessages: string[] = [];
	let newStarterMessage = '';
	let isDefault = false;
	let isVisible = true;
	let displayPriority = 0;

	onMount(async () => {
		await loadLLMs();
	});

	async function loadLLMs() {
		llmsLoading = true;
		try {
			const res = await getLLMs(localStorage.token, { is_active: true });
			llms = res.llms || [];
			// Pre-select default LLM
			const defaultLLM = llms.find((l) => l.is_default);
			if (defaultLLM) {
				llmId = defaultLLM.id;
			} else if (llms.length > 0) {
				llmId = llms[0].id;
			}
		} catch (e) {
			toast.error(`Failed to load LLMs: ${e}`);
		}
		llmsLoading = false;
	}

	function resetForm() {
		name = '';
		description = '';
		llmId = llms.find((l) => l.is_default)?.id || llms[0]?.id || null;
		systemPrompt = '';
		taskPrompt = '';
		starterMessages = [];
		newStarterMessage = '';
		isDefault = false;
		isVisible = true;
		displayPriority = 0;
	}

	function addStarterMessage() {
		if (newStarterMessage.trim()) {
			starterMessages = [...starterMessages, newStarterMessage.trim()];
			newStarterMessage = '';
		}
	}

	function removeStarterMessage(index: number) {
		starterMessages = starterMessages.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error($i18n.t('Name is required'));
			return;
		}
		if (!llmId) {
			toast.error($i18n.t('Please select an LLM'));
			return;
		}
		if (!systemPrompt.trim()) {
			toast.error($i18n.t('System prompt is required'));
			return;
		}

		loading = true;
		try {
			const data: CreateAssistantRequest = {
				name: name.trim(),
				llm_id: llmId,
				system_prompt: systemPrompt.trim(),
				is_default: isDefault,
				is_visible: isVisible,
				display_priority: displayPriority
			};

			if (description.trim()) {
				data.description = description.trim();
			}
			if (taskPrompt.trim()) {
				data.task_prompt = taskPrompt.trim();
			}
			if (starterMessages.length > 0) {
				data.starter_messages = starterMessages;
			}

			const result = await createAssistant(localStorage.token, data);
			toast.success($i18n.t('Assistant created successfully'));
			dispatch('created', result);
			resetForm();
			show = false;
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to create assistant'));
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
			<h3 class="text-lg font-medium dark:text-white">{$i18n.t('Create Assistant')}</h3>
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
						placeholder={$i18n.t('e.g., Research Assistant')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
				</label>

				<!-- Description -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Description')}
					</span>
					<input
						type="text"
						bind:value={description}
						placeholder={$i18n.t('Brief description of this assistant')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</label>

				<!-- LLM Selection -->
				<div>
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('LLM Model')} <span class="text-red-500">*</span>
					</span>
					{#if llmsLoading}
						<div class="flex items-center gap-2 text-gray-500">
							<Spinner class="w-4 h-4" />
							<span>{$i18n.t('Loading LLMs...')}</span>
						</div>
					{:else if llms.length === 0}
						<div class="text-red-500 text-sm">
							{$i18n.t('No LLMs configured. Please add an LLM first.')}
						</div>
					{:else}
						<label class="block">
							<select
								bind:value={llmId}
								class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							>
								{#each llms as llm}
									<option value={llm.id}>
										{llm.name} ({llm.model_id})
										{llm.is_default ? '- Default' : ''}
									</option>
								{/each}
							</select>
						</label>
					{/if}
				</div>

				<!-- System Prompt -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('System Prompt')} <span class="text-red-500">*</span>
					</span>
					<textarea
						bind:value={systemPrompt}
						placeholder={$i18n.t('You are a helpful assistant that...')}
						rows="6"
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
						required
					></textarea>
					<p class="mt-1 text-xs text-gray-500">
						{$i18n.t('Define the personality and behavior of this assistant')}
					</p>
				</label>

				<!-- Task Prompt -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Task Prompt')}
					</span>
					<textarea
						bind:value={taskPrompt}
						placeholder={$i18n.t('Additional instructions for specific tasks (optional)')}
						rows="3"
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
					></textarea>
				</label>

				<!-- Starter Messages -->
				<div>
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Starter Messages')}
					</span>
					<p class="text-xs text-gray-500 mb-2">
						{$i18n.t('Suggested prompts shown to users when starting a new chat')}
					</p>

					{#if starterMessages.length > 0}
						<div class="space-y-2 mb-2">
							{#each starterMessages as msg, i}
								<div class="flex items-center gap-2">
									<span
										class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm dark:text-white"
									>
										{msg}
									</span>
									<button
										type="button"
										class="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
										on:click={() => removeStarterMessage(i)}
									>
										<XMark className="size-4" />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<label class="flex gap-2">
						<input
							type="text"
							bind:value={newStarterMessage}
							placeholder={$i18n.t('e.g., Help me write an email')}
							class="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							on:keydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									addStarterMessage();
								}
							}}
						/>
						<button
							type="button"
							class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
							on:click={addStarterMessage}
						>
							{$i18n.t('Add')}
						</button>
					</label>
				</div>

				<!-- Display Priority -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Display Priority')}
					</span>
					<input
						type="number"
						bind:value={displayPriority}
						min="0"
						class="w-24 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<p class="mt-1 text-xs text-gray-500">
						{$i18n.t('Higher values appear first in the list')}
					</p>
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
							bind:checked={isVisible}
							class="rounded border-gray-300 dark:border-gray-600"
						/>
						<span class="text-sm">{$i18n.t('Visible to users')}</span>
					</label>
				</div>
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
					disabled={loading || llms.length === 0}
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
