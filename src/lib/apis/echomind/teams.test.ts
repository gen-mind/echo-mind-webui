import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getTeams,
	getMyTeams,
	getTeamById,
	createTeam,
	updateTeam,
	deleteTeam,
	addTeamMember,
	removeTeamMember,
	updateTeamMemberRole
} from './teams';
import type {
	Team,
	TeamMemberWithUser,
	CreateTeamRequest,
	UpdateTeamRequest,
	AddTeamMemberRequest
} from './teams';

// Mock WEBUI_API_BASE_URL
vi.mock('$lib/constants', () => ({
	WEBUI_API_BASE_URL: 'http://localhost:8000/api/v1'
}));

const mockTeam: Team = {
	id: 1,
	name: 'Engineering Team',
	description: 'Backend and frontend developers',
	leader_id: 1,
	created_by: 1,
	member_count: 5,
	creation_date: '2024-01-01T00:00:00Z',
	last_update: '2024-01-01T00:00:00Z'
};

const mockMember: TeamMemberWithUser = {
	user_id: 2,
	user_name: 'johndoe',
	email: 'john@example.com',
	first_name: 'John',
	last_name: 'Doe',
	role: 'TEAM_MEMBER_ROLE_MEMBER',
	added_at: '2024-01-01T00:00:00Z'
};

describe('Teams API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getTeams', () => {
		it('should fetch teams successfully', async () => {
			const mockResponse = { teams: [mockTeam] };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getTeams('test-token');

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams?',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					})
				})
			);
			expect(result.teams).toHaveLength(1);
			expect(result.teams[0].name).toBe('Engineering Team');
		});

		it('should include member count when requested', async () => {
			const mockResponse = { teams: [mockTeam] };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			await getTeams('test-token', { include_member_count: true });

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('include_member_count=true'),
				expect.any(Object)
			);
		});

		it('should throw error on API failure', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Unauthorized' })
			});

			await expect(getTeams('invalid-token')).rejects.toBe('Unauthorized');
		});
	});

	describe('getMyTeams', () => {
		it('should fetch current user teams successfully', async () => {
			const mockResponse = { teams: [mockTeam] };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getMyTeams('test-token');

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams/me',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						authorization: 'Bearer test-token'
					})
				})
			);
			expect(result.teams).toHaveLength(1);
		});

		it('should return empty array when user has no teams', async () => {
			const mockResponse = { teams: [] };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getMyTeams('test-token');

			expect(result.teams).toHaveLength(0);
		});

		it('should throw error on failure', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Unauthorized' })
			});

			await expect(getMyTeams('invalid-token')).rejects.toBe('Unauthorized');
		});
	});

	describe('getTeamById', () => {
		it('should fetch team with members', async () => {
			const mockResponse = { team: mockTeam, members: [mockMember] };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await getTeamById('test-token', 1);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams/1',
				expect.objectContaining({ method: 'GET' })
			);
			expect(result.team.id).toBe(1);
			expect(result.members).toHaveLength(1);
			expect(result.members[0].user_name).toBe('johndoe');
		});

		it('should throw error when team not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Team not found' })
			});

			await expect(getTeamById('test-token', 999)).rejects.toBe('Team not found');
		});
	});

	describe('createTeam', () => {
		it('should create team with required fields', async () => {
			const createRequest: CreateTeamRequest = {
				name: 'New Team'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockTeam, name: 'New Team', id: 2 })
			});

			const result = await createTeam('test-token', createRequest);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(createRequest)
				})
			);
			expect(result.name).toBe('New Team');
		});

		it('should create team with description and leader', async () => {
			const createRequest: CreateTeamRequest = {
				name: 'Full Team',
				description: 'A team with all fields',
				leader_id: 5
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockTeam, ...createRequest, id: 3 })
			});

			const result = await createTeam('test-token', createRequest);

			expect(result.description).toBe('A team with all fields');
			expect(result.leader_id).toBe(5);
		});

		it('should throw error on duplicate name', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Team with this name already exists' })
			});

			await expect(createTeam('test-token', { name: 'Existing Team' })).rejects.toBe(
				'Team with this name already exists'
			);
		});
	});

	describe('updateTeam', () => {
		it('should update team name', async () => {
			const updateRequest: UpdateTeamRequest = {
				name: 'Updated Team Name'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockTeam, name: 'Updated Team Name' })
			});

			const result = await updateTeam('test-token', 1, updateRequest);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams/1',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(updateRequest)
				})
			);
			expect(result.name).toBe('Updated Team Name');
		});

		it('should update team leader', async () => {
			const updateRequest: UpdateTeamRequest = {
				leader_id: 10
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockTeam, leader_id: 10 })
			});

			const result = await updateTeam('test-token', 1, updateRequest);

			expect(result.leader_id).toBe(10);
		});
	});

	describe('deleteTeam', () => {
		it('should delete team successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await deleteTeam('test-token', 1);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams/1',
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('should throw error when team has active resources', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Cannot delete team with active connectors' })
			});

			await expect(deleteTeam('test-token', 1)).rejects.toBe(
				'Cannot delete team with active connectors'
			);
		});
	});

	describe('addTeamMember', () => {
		it('should add member with default role', async () => {
			const addRequest: AddTeamMemberRequest = {
				user_id: 5
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({ ...mockMember, user_id: 5, role: 'TEAM_MEMBER_ROLE_MEMBER' })
			});

			const result = await addTeamMember('test-token', 1, addRequest);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams/1/members',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(addRequest)
				})
			);
			expect(result.user_id).toBe(5);
			expect(result.role).toBe('TEAM_MEMBER_ROLE_MEMBER');
		});

		it('should add member with lead role', async () => {
			const addRequest: AddTeamMemberRequest = {
				user_id: 6,
				role: 'TEAM_MEMBER_ROLE_LEAD'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockMember, user_id: 6, role: 'TEAM_MEMBER_ROLE_LEAD' })
			});

			const result = await addTeamMember('test-token', 1, addRequest);

			expect(result.role).toBe('TEAM_MEMBER_ROLE_LEAD');
		});

		it('should throw error when user already member', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'User is already a member of this team' })
			});

			await expect(addTeamMember('test-token', 1, { user_id: 2 })).rejects.toBe(
				'User is already a member of this team'
			);
		});
	});

	describe('removeTeamMember', () => {
		it('should remove member successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await removeTeamMember('test-token', 1, 2);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams/1/members/2',
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('should throw error when member not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ detail: 'Member not found in team' })
			});

			await expect(removeTeamMember('test-token', 1, 999)).rejects.toBe('Member not found in team');
		});
	});

	describe('updateTeamMemberRole', () => {
		it('should update member role to lead', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockMember, role: 'TEAM_MEMBER_ROLE_LEAD' })
			});

			const result = await updateTeamMemberRole('test-token', 1, 2, {
				role: 'TEAM_MEMBER_ROLE_LEAD'
			});

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8000/api/v1/teams/1/members/2/role',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ role: 'TEAM_MEMBER_ROLE_LEAD' })
				})
			);
			expect(result.role).toBe('TEAM_MEMBER_ROLE_LEAD');
		});

		it('should update member role to member', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ...mockMember, role: 'TEAM_MEMBER_ROLE_MEMBER' })
			});

			const result = await updateTeamMemberRole('test-token', 1, 2, {
				role: 'TEAM_MEMBER_ROLE_MEMBER'
			});

			expect(result.role).toBe('TEAM_MEMBER_ROLE_MEMBER');
		});
	});
});
