<script lang="ts">
	import { getContext, createEventDispatcher, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	import {
		updateTeam,
		getTeamById,
		getUsers,
		addTeamMember,
		removeTeamMember,
		updateTeamMemberRole
	} from '$lib/apis/echomind';
	import type {
		Team,
		UpdateTeamRequest,
		User,
		TeamMemberWithUser,
		TeamMemberRole
	} from '$lib/apis/echomind';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;
	export let item: Team | null = null;

	let loading = false;
	let usersLoading = true;
	let membersLoading = true;
	let users: User[] = [];
	let members: TeamMemberWithUser[] = [];

	// Form fields
	let name = '';
	let description = '';
	let leaderId: number | null = null;

	// Add member
	let selectedUserId: number | null = null;
	let selectedRole: TeamMemberRole = 'TEAM_MEMBER_ROLE_MEMBER';
	let addingMember = false;

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

	async function loadMembers() {
		if (!item) return;
		membersLoading = true;
		try {
			const res = await getTeamById(localStorage.token, item.id);
			members = res.members || [];
		} catch (e) {
			toast.error(`Failed to load members: ${e}`);
		}
		membersLoading = false;
	}

	// Populate form when item changes
	$: if (item && show) {
		name = item.name;
		description = item.description || '';
		leaderId = item.leader_id || null;
		loadMembers();
	}

	// Filter out users who are already members
	$: availableUsers = users.filter((u) => !members.some((m) => m.user_id === u.id));

	async function handleAddMember() {
		if (!item || !selectedUserId) return;

		addingMember = true;
		try {
			await addTeamMember(localStorage.token, item.id, {
				user_id: selectedUserId,
				role: selectedRole
			});
			toast.success($i18n.t('Member added successfully'));
			selectedUserId = null;
			selectedRole = 'TEAM_MEMBER_ROLE_MEMBER';
			await loadMembers();
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to add member'));
		}
		addingMember = false;
	}

	async function handleRemoveMember(userId: number) {
		if (!item) return;

		try {
			await removeTeamMember(localStorage.token, item.id, userId);
			toast.success($i18n.t('Member removed'));
			await loadMembers();
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to remove member'));
		}
	}

	async function handleRoleChange(userId: number, newRole: TeamMemberRole) {
		if (!item) return;

		try {
			await updateTeamMemberRole(localStorage.token, item.id, userId, { role: newRole });
			toast.success($i18n.t('Role updated'));
			await loadMembers();
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to update role'));
		}
	}

	async function handleSubmit() {
		if (!item) return;

		if (!name.trim()) {
			toast.error($i18n.t('Name is required'));
			return;
		}

		loading = true;
		try {
			const data: UpdateTeamRequest = {
				name: name.trim(),
				description: description.trim() || undefined,
				leader_id: leaderId || undefined
			};

			const result = await updateTeam(localStorage.token, item.id, data);
			toast.success($i18n.t('Team updated successfully'));
			dispatch('updated', result);
			show = false;
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to update team'));
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		show = false;
	}
</script>

<Modal size="lg" bind:show>
	<div class="p-6 max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex justify-between items-center mb-6">
			<h3 class="text-lg font-medium dark:text-white">{$i18n.t('Edit Team')}</h3>
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
					{/if}
				</div>

				<!-- Members Section -->
				<div class="pt-4 border-t border-gray-200 dark:border-gray-700">
					<h4 class="text-sm font-medium mb-3 dark:text-gray-200">{$i18n.t('Team Members')}</h4>

					<!-- Add Member -->
					<div class="flex gap-2 mb-4">
						<select
							bind:value={selectedUserId}
							class="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={availableUsers.length === 0}
						>
							<option value={null}>
								{availableUsers.length === 0
									? $i18n.t('All users are already members')
									: $i18n.t('Select a user to add...')}
							</option>
							{#each availableUsers as user}
								<option value={user.id}>
									{user.first_name} {user.last_name} ({user.email})
								</option>
							{/each}
						</select>

						<select
							bind:value={selectedRole}
							class="w-32 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="TEAM_MEMBER_ROLE_MEMBER">Member</option>
							<option value="TEAM_MEMBER_ROLE_LEAD">Lead</option>
						</select>

						<button
							type="button"
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
							disabled={!selectedUserId || addingMember}
							on:click={handleAddMember}
						>
							{#if addingMember}
								<Spinner class="w-4 h-4" />
							{/if}
							{$i18n.t('Add')}
						</button>
					</div>

					<!-- Members List -->
					{#if membersLoading}
						<div class="flex justify-center py-4">
							<Spinner />
						</div>
					{:else if members.length === 0}
						<div class="text-center py-4 text-gray-500 text-sm">
							{$i18n.t('No members in this team')}
						</div>
					{:else}
						<div class="space-y-2 max-h-48 overflow-y-auto">
							{#each members as member}
								<div
									class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-850"
								>
									<div>
										<div class="font-medium dark:text-white">
											{member.first_name} {member.last_name}
										</div>
										<div class="text-sm text-gray-500">{member.email}</div>
									</div>
									<div class="flex items-center gap-2">
										<select
											value={member.role}
											class="px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
											on:change={(e) =>
												handleRoleChange(member.user_id, e.currentTarget.value)}
										>
											<option value="TEAM_MEMBER_ROLE_MEMBER">Member</option>
											<option value="TEAM_MEMBER_ROLE_LEAD">Lead</option>
										</select>
										<button
											type="button"
											class="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
											on:click={() => handleRemoveMember(member.user_id)}
										>
											<XMark className="size-4" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
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
					disabled={loading}
				>
					{#if loading}
						<Spinner class="w-4 h-4" />
					{/if}
					{loading ? $i18n.t('Saving...') : $i18n.t('Save')}
				</button>
			</div>
		</form>
	</div>
</Modal>
