import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with projector API responses
export interface ProjectorStatsTeam {
	team_id: number;
	team_name: string;
	collection_name: string;
	vector_count: number;
}

export interface ProjectorStatsResponse {
	user_collection: string;
	user_vectors: number;
	teams: ProjectorStatsTeam[];
	org_collection: string;
	org_vectors: number;
}

export interface GenerateProjectorRequest {
	scope: 'user' | 'team' | 'org';
	search_query?: string | null;
	team_id?: number;
	org_id?: number;
	limit?: number;
}

export interface GenerateProjectorResponse {
	viz_id: string;
	collection_name: string;
	status: string;
	num_points: number;
	vector_dimension: number;
	tensorboard_url: string;
	message: string;
}

// API Functions
export const getProjectorStats = async (token: string): Promise<ProjectorStatsResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/projector/stats`, {
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
			error = err.detail || err.message || 'Failed to load statistics';
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const generateProjectorVisualization = async (
	token: string,
	data: GenerateProjectorRequest
): Promise<GenerateProjectorResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/projector/generate`, {
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
			error = err.detail || err.message || 'Failed to generate visualization';
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};
