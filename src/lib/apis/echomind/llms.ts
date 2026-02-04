import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with proto-generated llm_model.py
export type LLMProvider =
	| 'LLM_PROVIDER_UNSPECIFIED'
	| 'LLM_PROVIDER_OPENAI_COMPATIBLE'
	| 'LLM_PROVIDER_ANTHROPIC'
	| 'LLM_PROVIDER_ANTHROPIC_TOKEN';

export interface LLM {
	id: number;
	name: string;
	provider: LLMProvider;
	model_id: string;
	endpoint: string;
	has_api_key: boolean;
	max_tokens: number;
	temperature: number;
	is_default: boolean;
	is_active: boolean;
	creation_date: string | null;
	last_update: string | null;
}

export interface PaginationResponse {
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
}

export interface ListLLMsParams {
	page?: number;
	page_size?: number;
	is_active?: boolean;
}

export interface ListLLMsResponse {
	llms: LLM[];
	pagination?: PaginationResponse;
}

export interface CreateLLMRequest {
	name: string;
	provider: LLMProvider;
	model_id: string;
	endpoint?: string;
	api_key?: string;
	max_tokens?: number;
	temperature?: number;
	is_default?: boolean;
	is_active?: boolean;
}

export interface UpdateLLMRequest {
	name?: string;
	provider?: LLMProvider;
	model_id?: string;
	endpoint?: string;
	api_key?: string;
	max_tokens?: number;
	temperature?: number;
	is_default?: boolean;
	is_active?: boolean;
}

export interface TestLLMResponse {
	success: boolean;
	message: string;
	latency_ms: number;
}

// API Functions
export const getLLMs = async (token: string, params?: ListLLMsParams): Promise<ListLLMsResponse> => {
	let error = null;

	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.append('page', params.page.toString());
	if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
	if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

	const res = await fetch(`${WEBUI_API_BASE_URL}/llms?${searchParams.toString()}`, {
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

export const getLLMById = async (token: string, llmId: number): Promise<LLM> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/llms/${llmId}`, {
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

export const createLLM = async (token: string, data: CreateLLMRequest): Promise<LLM> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/llms`, {
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

export const updateLLM = async (
	token: string,
	llmId: number,
	data: UpdateLLMRequest
): Promise<LLM> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/llms/${llmId}`, {
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

export const deleteLLM = async (token: string, llmId: number): Promise<void> => {
	let error = null;

	await fetch(`${WEBUI_API_BASE_URL}/llms/${llmId}`, {
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

export const testLLM = async (token: string, llmId: number): Promise<TestLLMResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/llms/${llmId}/test`, {
		method: 'POST',
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
