<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	import { WEBUI_NAME } from '$lib/stores';
	import { getTeams, deleteTeam, getTeamById } from '$lib/apis/echomind';
	import type { Team, TeamMemberWithUser, TeamMemberRole } from '$lib/apis/echomind';

	import DeleteConfirmDialog from '../common/ConfirmDialog.svelte';
	import Badge from '../common/Badge.svelte';
	import Plus from '../icons/Plus.svelte';
	import Spinner from '../common/Spinner.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import TeamCreateModal from './TeamCreateModal.svelte';
	import TeamEditModal from './TeamEditModal.svelte';

	let loaded = false;
	let showDeleteConfirm = false;
	let showCreateModal = false;
	let showEditModal = false;
	let showMembersModal = false;

	let selectedItem: Team | null = null;
	let editingItem: Team | null = null;
	let selectedTeamMembers: TeamMemberWithUser[] = [];
	let loadingMembers = false;

	let items: Team[] = [];
	let itemsLoading = false;

	const roleLabels: Record<TeamMemberRole, string> = {
		TEAM_MEMBER_ROLE_UNSPECIFIED: 'Member',
		TEAM_MEMBER_ROLE_MEMBER: 'Member',
		TEAM_MEMBER_ROLE_LEAD: 'Lead'
	};

	const roleColors: Record<TeamMemberRole, string> = {
		TEAM_MEMBER_ROLE_UNSPECIFIED: 'gray',
		TEAM_MEMBER_ROLE_MEMBER: 'gray',
		TEAM_MEMBER_ROLE_LEAD: 'blue'
	};

	const init = async () => {
		itemsLoading = true;
		try {
			const res = await getTeams(localStorage.token, { include_member_count: true });
			if (res) {
				items = res.teams || [];
			}
		} catch (e) {
			toast.error(`Failed to load teams: ${e}`);
		}
		itemsLoading = false;
	};

	const viewMembers = async (team: Team) => {
		selectedItem = team;
		loadingMembers = true;
		showMembersModal = true;

		try {
			const res = await getTeamById(localStorage.token, team.id);
			if (res) {
				selectedTeamMembers = res.members || [];
			}
		} catch (e) {
			toast.error(`Failed to load members: ${e}`);
		}

		loadingMembers = false;
	};

	const deleteHandler = async (item: Team) => {
		try {
			await deleteTeam(localStorage.token, item.id);
			toast.success('Team deleted successfully');
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
	<title>Teams • {$WEBUI_NAME}</title>
</svelte:head>

{#if loaded}
	<DeleteConfirmDialog
		bind:show={showDeleteConfirm}
		on:confirm={() => {
			if (selectedItem) deleteHandler(selectedItem);
		}}
	/>

	<!-- Members Modal -->
	{#if showMembersModal && selectedItem}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
				<div class="flex items-center justify-between p-4 border-b dark:border-gray-700">
					<h3 class="text-lg font-medium">{selectedItem.name} - Members</h3>
					<button
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
						aria-label="Close modal"
						on:click={() => (showMembersModal = false)}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="p-4 overflow-y-auto max-h-[60vh]">
					{#if loadingMembers}
						<div class="flex justify-center py-8">
							<Spinner />
						</div>
					{:else if selectedTeamMembers.length === 0}
						<div class="text-center py-8 text-gray-500">No members in this team</div>
					{:else}
						<div class="space-y-2">
							{#each selectedTeamMembers as member}
								<div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-850">
									<div>
										<div class="font-medium">{member.user_name}</div>
										<div class="text-sm text-gray-500">{member.email}</div>
									</div>
									<Badge color={roleColors[member.role]}>
										{roleLabels[member.role]}
									</Badge>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="flex flex-col gap-1 px-1 mt-1.5 mb-3">
		<div class="flex justify-between items-center">
			<div class="text-lg font-medium">Teams</div>
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
				on:click={() => (showCreateModal = true)}
			>
				<Plus class="w-4 h-4" />
				Create Team
			</button>
		</div>

		<p class="text-sm text-gray-500 mt-1">
			Manage teams to organize users and share connectors/documents.
		</p>

		<!-- Teams List -->
		<div class="mt-4">
			{#if itemsLoading}
				<div class="flex justify-center py-8">
					<Spinner />
				</div>
			{:else if items.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p>No teams created</p>
					<p class="text-sm mt-2">Create a team to collaborate with others</p>
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each items as item}
						<div
							class="flex flex-col p-4 rounded-lg bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition border border-gray-200 dark:border-gray-700"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="font-medium text-lg">{item.name}</div>
									{#if item.description}
										<div class="text-sm text-gray-500 mt-1 line-clamp-2">
											{item.description}
										</div>
									{/if}
								</div>
							</div>

							<div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
								<div class="flex items-center gap-1">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
										/>
									</svg>
									<span>{item.member_count} members</span>
								</div>
							</div>

							{#if item.creation_date}
								<div class="text-xs text-gray-400 mt-2">
									Created {dayjs(item.creation_date).fromNow()}
								</div>
							{/if}

							<div class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
								<Tooltip content="View Members">
									<button
										class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
										aria-label="View team members"
										on:click={() => viewMembers(item)}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
											/>
										</svg>
									</button>
								</Tooltip>

								<Tooltip content="Edit">
									<button
										class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
										aria-label="Edit team"
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
										aria-label="Delete team"
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
		<TeamCreateModal
			bind:show={showCreateModal}
			on:created={() => {
				init();
			}}
		/>
	{/if}

	<!-- Edit Modal -->
	{#if showEditModal && editingItem}
		<TeamEditModal
			bind:show={showEditModal}
			item={editingItem}
			on:updated={() => {
				init();
			}}
		/>
	{/if}
{/if}
