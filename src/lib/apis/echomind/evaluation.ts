import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with api/routes/evaluation.py
export interface BatchEvalRequest {
	limit?: number;
	min_messages?: number;
}

export interface BatchEvalResponse {
	evaluated: number;
	skipped: number;
	errors: number;
}

// API Functions
export const runBatchEvaluation = async (
	token: string,
	params?: BatchEvalRequest
): Promise<BatchEvalResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/evaluate/batch`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify(params ?? {})
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
