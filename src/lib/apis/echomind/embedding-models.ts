import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with proto-generated embedding_model_model.py
export interface EmbeddingModel {
	id: number;
	model_id: string;
	model_name: string;
	model_dimension: number;
	endpoint: string;
	is_active: boolean;
	creation_date: string | null;
	last_update: string | null;
}

export interface ListEmbeddingModelsResponse {
	models: EmbeddingModel[];
}

export interface CreateEmbeddingModelRequest {
	model_id: string;
	model_name: string;
	model_dimension: number;
	endpoint?: string;
}

export interface ActivateEmbeddingModelResponse {
	success: boolean;
	message: string;
	requires_reindex: boolean;
	documents_affected: number;
}

// API Functions
export const getEmbeddingModels = async (token: string): Promise<ListEmbeddingModelsResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/embedding-models`, {
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

export const getActiveEmbeddingModel = async (token: string): Promise<EmbeddingModel> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/embedding-models/active`, {
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

export const createEmbeddingModel = async (
	token: string,
	data: CreateEmbeddingModelRequest
): Promise<EmbeddingModel> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/embedding-models`, {
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

export const activateEmbeddingModel = async (
	token: string,
	modelId: number
): Promise<ActivateEmbeddingModelResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/embedding-models/${modelId}/activate`, {
		method: 'PUT',
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
