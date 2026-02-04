import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with proto-generated assistant_model.py
export interface Assistant {
	id: number;
	name: string;
	description: string;
	llm_id: number;
	system_prompt: string;
	task_prompt: string;
	starter_messages: string[];
	is_default: boolean;
	is_visible: boolean;
	display_priority: number;
	created_by: number;
	creation_date: string | null;
	last_update: string | null;
}

export interface PaginationResponse {
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
}

export interface ListAssistantsParams {
	page?: number;
	page_size?: number;
	is_visible?: boolean;
}

export interface ListAssistantsResponse {
	assistants: Assistant[];
	pagination?: PaginationResponse;
}

export interface CreateAssistantRequest {
	name: string;
	description?: string;
	llm_id: number;
	system_prompt: string;
	task_prompt?: string;
	starter_messages?: string[];
	is_default?: boolean;
	is_visible?: boolean;
	display_priority?: number;
}

export interface UpdateAssistantRequest {
	name?: string;
	description?: string;
	llm_id?: number;
	system_prompt?: string;
	task_prompt?: string;
	starter_messages?: string[];
	is_default?: boolean;
	is_visible?: boolean;
	display_priority?: number;
}

// API Functions
export const getAssistants = async (
	token: string,
	params?: ListAssistantsParams
): Promise<ListAssistantsResponse> => {
	let error = null;

	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.append('page', params.page.toString());
	if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
	if (params?.is_visible !== undefined) searchParams.append('is_visible', params.is_visible.toString());

	const res = await fetch(`${WEBUI_API_BASE_URL}/assistants?${searchParams.toString()}`, {
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

export const getAssistantById = async (token: string, assistantId: number): Promise<Assistant> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/assistants/${assistantId}`, {
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

export const createAssistant = async (
	token: string,
	data: CreateAssistantRequest
): Promise<Assistant> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/assistants`, {
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

export const updateAssistant = async (
	token: string,
	assistantId: number,
	data: UpdateAssistantRequest
): Promise<Assistant> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/assistants/${assistantId}`, {
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

export const deleteAssistant = async (token: string, assistantId: number): Promise<void> => {
	let error = null;

	await fetch(`${WEBUI_API_BASE_URL}/assistants/${assistantId}`, {
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
