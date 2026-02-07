import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with proto-generated connector_model.py
export type ConnectorType =
	| 'CONNECTOR_TYPE_UNSPECIFIED'
	| 'CONNECTOR_TYPE_TEAMS'
	| 'CONNECTOR_TYPE_GOOGLE_DRIVE'
	| 'CONNECTOR_TYPE_ONEDRIVE'
	| 'CONNECTOR_TYPE_WEB'
	| 'CONNECTOR_TYPE_FILE'
	| 'CONNECTOR_TYPE_GMAIL'
	| 'CONNECTOR_TYPE_GOOGLE_CALENDAR'
	| 'CONNECTOR_TYPE_GOOGLE_CONTACTS';

export type ConnectorStatus =
	| 'CONNECTOR_STATUS_UNSPECIFIED'
	| 'CONNECTOR_STATUS_PENDING'
	| 'CONNECTOR_STATUS_SYNCING'
	| 'CONNECTOR_STATUS_ACTIVE'
	| 'CONNECTOR_STATUS_ERROR'
	| 'CONNECTOR_STATUS_DISABLED';

export type ConnectorScope =
	| 'CONNECTOR_SCOPE_UNSPECIFIED'
	| 'CONNECTOR_SCOPE_USER'
	| 'CONNECTOR_SCOPE_GROUP'
	| 'CONNECTOR_SCOPE_ORG';

export interface Connector {
	id: number;
	name: string;
	type: ConnectorType;
	config: Record<string, unknown> | null;
	state: Record<string, unknown> | null;
	refresh_freq_minutes: number;
	user_id: number;
	scope: ConnectorScope;
	scope_id: string;
	status: ConnectorStatus;
	status_message: string;
	last_sync_at: string | null;
	docs_analyzed: number;
	creation_date: string | null;
	last_update: string | null;
}

export interface PaginationResponse {
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
}

export interface ListConnectorsParams {
	page?: number;
	page_size?: number;
	type?: ConnectorType;
	status?: ConnectorStatus;
}

export interface ListConnectorsResponse {
	connectors: Connector[];
	pagination?: PaginationResponse;
}

export interface CreateConnectorRequest {
	name: string;
	type: ConnectorType;
	config?: Record<string, unknown>;
	refresh_freq_minutes?: number;
	scope: ConnectorScope;
	scope_id?: string;
}

export interface UpdateConnectorRequest {
	name?: string;
	config?: Record<string, unknown>;
	refresh_freq_minutes?: number;
	scope?: ConnectorScope;
	scope_id?: string;
}

export interface TriggerSyncResponse {
	success: boolean;
	message: string;
}

export interface GetConnectorStatusResponse {
	status: ConnectorStatus;
	status_message: string;
	last_sync_at: string | null;
	docs_analyzed: number;
	docs_pending: number;
}

// API Functions
export const getConnectors = async (
	token: string,
	params?: ListConnectorsParams
): Promise<ListConnectorsResponse> => {
	let error = null;

	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.append('page', params.page.toString());
	if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
	if (params?.type) searchParams.append('type', params.type);
	if (params?.status) searchParams.append('status', params.status);

	const res = await fetch(`${WEBUI_API_BASE_URL}/connectors?${searchParams.toString()}`, {
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

export const getConnectorById = async (token: string, connectorId: number): Promise<Connector> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/connectors/${connectorId}`, {
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

export const createConnector = async (
	token: string,
	data: CreateConnectorRequest
): Promise<Connector> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/connectors`, {
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

export const updateConnector = async (
	token: string,
	connectorId: number,
	data: UpdateConnectorRequest
): Promise<Connector> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/connectors/${connectorId}`, {
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

export const deleteConnector = async (token: string, connectorId: number): Promise<void> => {
	let error = null;

	await fetch(`${WEBUI_API_BASE_URL}/connectors/${connectorId}`, {
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

export const triggerConnectorSync = async (
	token: string,
	connectorId: number
): Promise<TriggerSyncResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/connectors/${connectorId}/sync`, {
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

export const getConnectorStatus = async (
	token: string,
	connectorId: number
): Promise<GetConnectorStatusResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/connectors/${connectorId}/status`, {
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
