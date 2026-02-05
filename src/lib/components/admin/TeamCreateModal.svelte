<script lang="ts">
	import { getContext, createEventDispatcher, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	import { createTeam, getUsers } from '$lib/apis/echomind';
	import type { CreateTeamRequest, User } from '$lib/apis/echomind';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;

	let loading = false;
	let usersLoading = true;
	let users: User[] = [];

	// Form fields
	let name = '';
	let description = '';
	let leaderId: number | null = null;

	onMount(async () => {
		await loadUsers();
	});

	async function loadUsers() {
		usersLoading = true;
		try {
			const res = await getUsers(localStorage.token, { is_active: true });
			users = res.users || [];
		} catch (e) {
			toast.error(`Failed to load users: ${e}`);
		}
		usersLoading = false;
	}

	function resetForm() {
		name = '';
		description = '';
		leaderId = null;
	}

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error($i18n.t('Name is required'));
			return;
		}

		loading = true;
		try {
			const data: CreateTeamRequest = {
				name: name.trim()
			};

			if (description.trim()) {
				data.description = description.trim();
			}
			if (leaderId) {
				data.leader_id = leaderId;
			}

			const result = await createTeam(localStorage.token, data);
			toast.success($i18n.t('Team created successfully'));
			dispatch('created', result);
			resetForm();
			show = false;
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to create team'));
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
			<h3 class="text-lg font-medium dark:text-white">{$i18n.t('Create Team')}</h3>
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
						placeholder={$i18n.t('e.g., Engineering Team')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
				</label>

				<!-- Description -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Description')}
					</span>
					<textarea
						bind:value={description}
						placeholder={$i18n.t('Brief description of this team')}
						rows="3"
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					></textarea>
				</label>

				<!-- Leader -->
				<div>
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Team Leader')}
					</span>
					{#if usersLoading}
						<div class="flex items-center gap-2 text-gray-500">
							<Spinner class="w-4 h-4" />
							<span>{$i18n.t('Loading users...')}</span>
						</div>
					{:else}
						<label class="block">
							<select
								bind:value={leaderId}
								class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value={null}>{$i18n.t('No leader assigned')}</option>
								{#each users as user}
									<option value={user.id}>
										{user.first_name} {user.last_name} ({user.email})
									</option>
								{/each}
							</select>
						</label>
						<p class="mt-1 text-xs text-gray-500">
							{$i18n.t('The leader will be automatically added as a team member')}
						</p>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 mt-6">
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
