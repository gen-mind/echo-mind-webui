import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with proto-generated team_model.py
export type TeamMemberRole =
	| 'TEAM_MEMBER_ROLE_UNSPECIFIED'
	| 'TEAM_MEMBER_ROLE_MEMBER'
	| 'TEAM_MEMBER_ROLE_LEAD';

export interface Team {
	id: number;
	name: string;
	description: string;
	leader_id: number;
	created_by: number;
	member_count: number;
	creation_date: string | null;
	last_update: string | null;
}

export interface TeamMember {
	team_id: number;
	user_id: number;
	role: TeamMemberRole;
	added_at: string | null;
	added_by: number;
}

export interface TeamMemberWithUser {
	user_id: number;
	user_name: string;
	email: string;
	first_name: string;
	last_name: string;
	role: TeamMemberRole;
	added_at: string | null;
}

export interface PaginationResponse {
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
}

export interface ListTeamsParams {
	page?: number;
	page_size?: number;
	include_member_count?: boolean;
}

export interface ListTeamsResponse {
	teams: Team[];
	pagination?: PaginationResponse;
}

export interface ListUserTeamsResponse {
	teams: Team[];
	pagination?: PaginationResponse;
}

export interface CreateTeamRequest {
	name: string;
	description?: string;
	leader_id?: number;
}

export interface UpdateTeamRequest {
	name?: string;
	description?: string;
	leader_id?: number;
}

export interface AddTeamMemberRequest {
	user_id: number;
	role?: TeamMemberRole;
}

export interface UpdateTeamMemberRoleRequest {
	role: TeamMemberRole;
}

export interface GetTeamResponse {
	team: Team;
	members: TeamMemberWithUser[];
}

// API Functions
export const getTeams = async (
	token: string,
	params?: ListTeamsParams
): Promise<ListTeamsResponse> => {
	let error = null;

	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.append('page', params.page.toString());
	if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
	if (params?.include_member_count) searchParams.append('include_member_count', 'true');

	const res = await fetch(`${WEBUI_API_BASE_URL}/teams?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getMyTeams = async (token: string): Promise<ListUserTeamsResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/teams/me`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const createTeam = async (token: string, data: CreateTeamRequest): Promise<Team> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/teams`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify(data)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getTeamById = async (token: string, teamId: number): Promise<GetTeamResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/teams/${teamId}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateTeam = async (
	token: string,
	teamId: number,
	data: UpdateTeamRequest
): Promise<Team> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/teams/${teamId}`, {
		method: 'PUT',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify(data)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const deleteTeam = async (token: string, teamId: number): Promise<void> => {
	let error = null;

	await fetch(`${WEBUI_API_BASE_URL}/teams/${teamId}`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}
};

export const addTeamMember = async (
	token: string,
	teamId: number,
	data: AddTeamMemberRequest
): Promise<TeamMemberWithUser> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/teams/${teamId}/members`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify(data)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const removeTeamMember = async (
	token: string,
	teamId: number,
	userId: number
): Promise<void> => {
	let error = null;

	await fetch(`${WEBUI_API_BASE_URL}/teams/${teamId}/members/${userId}`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}
};

export const updateTeamMemberRole = async (
	token: string,
	teamId: number,
	userId: number,
	data: UpdateTeamMemberRoleRequest
): Promise<TeamMemberWithUser> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/teams/${teamId}/members/${userId}/role`, {
		method: 'PUT',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify(data)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};
