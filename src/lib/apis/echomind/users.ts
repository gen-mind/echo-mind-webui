import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with proto-generated user_model.py
export interface UserPreferences {
	default_assistant_id: number;
	theme: string;
	custom: Record<string, string> | null;
}

export interface User {
	id: number;
	user_name: string;
	email: string;
	first_name: string;
	last_name: string;
	roles: string[];
	groups: string[];
	preferences: UserPreferences | null;
	is_active: boolean;
	creation_date: string | null;
	last_update: string | null;
	last_login: string | null;
}

export interface PaginationResponse {
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
}

export interface ListUsersParams {
	page?: number;
	page_size?: number;
	is_active?: boolean;
}

export interface ListUsersResponse {
	users: User[];
	pagination?: PaginationResponse;
}

export interface UpdateUserRequest {
	first_name?: string;
	last_name?: string;
	preferences?: UserPreferences;
}

// API Functions
export const getCurrentUser = async (token: string): Promise<User> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/users/me`, {
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

export const updateCurrentUser = async (
	token: string,
	data: UpdateUserRequest
): Promise<User> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/users/me`, {
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

export const getUsers = async (
	token: string,
	params?: ListUsersParams
): Promise<ListUsersResponse> => {
	let error = null;

	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.append('page', params.page.toString());
	if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
	if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

	const res = await fetch(`${WEBUI_API_BASE_URL}/users?${searchParams.toString()}`, {
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

export const getUserById = async (token: string, userId: number): Promise<User> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/users/${userId}`, {
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
