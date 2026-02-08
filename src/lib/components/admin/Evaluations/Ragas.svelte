<script lang="ts">
	import { getContext } from 'svelte';
	import { runBatchEvaluation } from '$lib/apis/echomind/evaluation';
	import Spinner from '$lib/components/common/Spinner.svelte';

	const i18n = getContext('i18n');

	let limit = 50;
	let minMessages = 2;
	let loading = false;
	let result: { evaluated: number; skipped: number; errors: number } | null = null;
	let errorMessage = '';

	const getLangfuseUrl = (): string => {
		const hostname = window.location.hostname;
		const parts = hostname.split('.');
		// Replace first subdomain (or bare domain) with 'langfuse'
		if (parts.length >= 2) {
			parts[0] = 'langfuse';
			return `https://${parts.join('/')}`;
		}
		return `https://langfuse.${hostname}`;
	};

	const handleSubmit = async () => {
		loading = true;
		result = null;
		errorMessage = '';

		try {
			result = await runBatchEvaluation(localStorage.token, {
				limit,
				min_messages: minMessages
			});
		} catch (err) {
			errorMessage = typeof err === 'string' ? err : 'Batch evaluation failed';
			console.error(err);
		} finally {
			loading = false;
		}
	};
</script>

<div class="flex flex-col gap-4">
	<div>
		<h2 class="text-lg font-medium">{$i18n.t('RAGAS Batch Evaluation')}</h2>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			{$i18n.t('Evaluate recent chat sessions with RAGAS metrics (faithfulness, relevancy, precision).')}
		</p>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
		<div class="flex gap-4">
			<div class="flex flex-col gap-1">
				<label for="limit" class="text-sm font-medium">{$i18n.t('Limit')}</label>
				<input
					id="limit"
					type="number"
					bind:value={limit}
					min="1"
					max="500"
					class="w-32 px-3 py-2 text-sm border rounded-lg dark:bg-gray-850 dark:border-gray-700 dark:text-white"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label for="min-messages" class="text-sm font-medium">{$i18n.t('Min Messages')}</label>
				<input
					id="min-messages"
					type="number"
					bind:value={minMessages}
					min="2"
					max="100"
					class="w-32 px-3 py-2 text-sm border rounded-lg dark:bg-gray-850 dark:border-gray-700 dark:text-white"
				/>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<button
				type="submit"
				disabled={loading}
				class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
			>
				{#if loading}
					<Spinner className="size-4" />
				{/if}
				{loading ? $i18n.t('Running...') : $i18n.t('Run Batch Evaluation')}
			</button>

			<a
				href={getLangfuseUrl()}
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
			>
				{$i18n.t('Open Langfuse Dashboard')} &rarr;
			</a>
		</div>
	</form>

	{#if errorMessage}
		<div class="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
			{errorMessage}
		</div>
	{/if}

	{#if result}
		<div class="grid grid-cols-3 gap-4">
			<div class="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
				<div class="text-2xl font-bold text-green-700 dark:text-green-400">{result.evaluated}</div>
				<div class="text-sm text-green-600 dark:text-green-500">{$i18n.t('Evaluated')}</div>
			</div>
			<div class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
				<div class="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{result.skipped}</div>
				<div class="text-sm text-yellow-600 dark:text-yellow-500">{$i18n.t('Skipped')}</div>
			</div>
			<div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
				<div class="text-2xl font-bold text-red-700 dark:text-red-400">{result.errors}</div>
				<div class="text-sm text-red-600 dark:text-red-500">{$i18n.t('Errors')}</div>
			</div>
		</div>
	{/if}
</div>
