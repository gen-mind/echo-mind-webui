<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	import { WEBUI_NAME } from '$lib/stores';
	import {
		getProjectorStats,
		generateProjectorVisualization,
		type ProjectorStatsResponse
	} from '$lib/apis/echomind';

	import Spinner from '../common/Spinner.svelte';

	let loaded = false;
	let statsLoading = false;
	let vizGenerating = false;
	let selectedScope: 'user' | 'team' | 'org' | null = null;
	let searchQuery = '';
	let selectedTeamId: number | null = null;

	let stats: ProjectorStatsResponse | null = null;

	const loadStats = async () => {
		statsLoading = true;
		try {
			const res = await getProjectorStats(localStorage.token);
			if (res) {
				stats = res;
			}
		} catch (e) {
			toast.error(`Failed to load statistics: ${e}`);
		}
		statsLoading = false;
	};

	const visualize = async (scope: 'user' | 'team' | 'org', teamId?: number) => {
		vizGenerating = true;
		selectedScope = scope;

		try {
			const payload: any = {
				scope,
				limit: 10000
			};

			if (searchQuery.trim()) {
				payload.search_query = searchQuery.trim();
			}

			if (scope === 'team' && teamId) {
				payload.team_id = teamId;
			}

			const res = await generateProjectorVisualization(localStorage.token, payload);

			if (res) {
				// Open TensorBoard in new tab
				window.open(res.tensorboard_url, '_blank');

				toast.success(
					`Visualization generated: ${res.num_points.toLocaleString()} vectors (${res.vector_dimension}D)`
				);
			}
		} catch (e) {
			toast.error(`Error: ${e}`);
		} finally {
			vizGenerating = false;
			selectedScope = null;
		}
	};

	onMount(async () => {
		await loadStats();
		loaded = true;
	});
</script>

<svelte:head>
	<title>Vector Visualization • {$WEBUI_NAME}</title>
</svelte:head>

{#if loaded}
	<div class="flex flex-col gap-1 px-1 mt-1.5 mb-3">
		<div class="flex justify-between items-center">
			<div class="text-lg font-medium">Vector Visualization</div>
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
				on:click={loadStats}
				disabled={statsLoading}
			>
				{#if statsLoading}
					<Spinner className="w-4 h-4" />
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
				Refresh Stats
			</button>
		</div>

		<p class="text-sm text-gray-500 mt-1">
			Visualize your organization's vector embeddings in 3D using TensorBoard Projector.
		</p>

		<!-- Search Box -->
		<div class="mt-4">
			<label class="block text-sm font-medium mb-2"> Search Query (optional) </label>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Filter vectors by keyword..."
				class="w-full px-4 py-2 border rounded-lg dark:bg-gray-850 dark:border-gray-700"
				disabled={vizGenerating}
			/>
			<p class="text-xs text-gray-500 mt-1">
				If filled: visualize 10k vectors matching search. If empty: visualize 10k vectors from whole
				collection.
			</p>
		</div>

		<!-- Stats & Visualization Buttons -->
		<div class="mt-6">
			{#if statsLoading}
				<div class="flex justify-center py-8">
					<Spinner />
				</div>
			{:else if stats}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<!-- User Vectors -->
					<div
						class="flex flex-col p-6 rounded-lg bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700"
					>
						<div class="flex items-center gap-2 mb-2">
							<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
							<h3 class="text-lg font-semibold">My Vectors</h3>
						</div>
						<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
							{stats.user_collection}
						</p>
						<p class="text-3xl font-bold text-blue-600 mb-4">
							{stats.user_vectors.toLocaleString()}
						</p>
						<button
							class="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
							on:click={() => visualize('user')}
							disabled={vizGenerating || stats.user_vectors === 0}
						>
							{#if vizGenerating && selectedScope === 'user'}
								<Spinner className="w-4 h-4" />
								Generating...
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
								Visualize
							{/if}
						</button>
					</div>

					<!-- Team Vectors -->
					{#if stats.teams && stats.teams.length > 0}
						{#each stats.teams as team}
							<div
								class="flex flex-col p-6 rounded-lg bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700"
							>
								<div class="flex items-center gap-2 mb-2">
									<svg
										class="w-5 h-5 text-green-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									<h3 class="text-lg font-semibold">{team.team_name}</h3>
								</div>
								<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
									{team.collection_name}
								</p>
								<p class="text-3xl font-bold text-green-600 mb-4">
									{team.vector_count.toLocaleString()}
								</p>
								<button
									class="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
									on:click={() => visualize('team', team.team_id)}
									disabled={vizGenerating || team.vector_count === 0}
								>
									{#if vizGenerating && selectedScope === 'team' && selectedTeamId === team.team_id}
										<Spinner className="w-4 h-4" />
										Generating...
									{:else}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
										Visualize
									{/if}
								</button>
							</div>
						{/each}
					{/if}

					<!-- Org Vectors -->
					<div
						class="flex flex-col p-6 rounded-lg bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700"
					>
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="w-5 h-5 text-purple-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
								/>
							</svg>
							<h3 class="text-lg font-semibold">Organization</h3>
						</div>
						<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
							{stats.org_collection}
						</p>
						<p class="text-3xl font-bold text-purple-600 mb-4">
							{stats.org_vectors.toLocaleString()}
						</p>
						<button
							class="w-full px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
							on:click={() => visualize('org')}
							disabled={vizGenerating || stats.org_vectors === 0}
						>
							{#if vizGenerating && selectedScope === 'org'}
								<Spinner className="w-4 h-4" />
								Generating...
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
								Visualize
							{/if}
						</button>
					</div>
				</div>

				<!-- Help Text -->
				<div class="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
					<div class="flex gap-2">
						<svg
							class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<div class="text-sm text-blue-800 dark:text-blue-200">
							<p class="font-medium mb-1">How to use:</p>
							<ul class="list-disc list-inside space-y-1">
								<li>Click "Visualize" to generate a 3D visualization in TensorBoard</li>
								<li>Processing takes 30-60 seconds for 10,000 vectors</li>
								<li>TensorBoard will open in a new tab when ready</li>
								<li>Use T-SNE, UMAP, or PCA to explore vector clusters</li>
								<li>Optional: Enter keywords to filter vectors before visualization</li>
							</ul>
						</div>
					</div>
				</div>
			{:else}
				<div class="text-center py-8 text-gray-500">
					<p>No statistics available</p>
					<p class="text-sm mt-2">Try refreshing or check your vector collections</p>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex justify-center py-8">
		<Spinner />
	</div>
{/if}
