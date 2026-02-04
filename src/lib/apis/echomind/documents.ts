import { WEBUI_API_BASE_URL } from '$lib/constants';

// Types - aligned with proto-generated document_model.py
export type DocumentStatus =
	| 'DOCUMENT_STATUS_UNSPECIFIED'
	| 'DOCUMENT_STATUS_PENDING'
	| 'DOCUMENT_STATUS_PROCESSING'
	| 'DOCUMENT_STATUS_COMPLETED'
	| 'DOCUMENT_STATUS_FAILED';

export interface Document {
	id: number;
	parent_id: number;
	connector_id: number;
	source_id: string;
	url: string;
	original_url: string;
	title: string;
	content_type: string;
	status: DocumentStatus;
	status_message: string;
	chunk_count: number;
	creation_date: string | null;
	last_update: string | null;
}

export interface ListDocumentsParams {
	page?: number;
	limit?: number;
	connector_id?: number;
	doc_status?: string;
}

export interface PaginationResponse {
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
}

export interface ListDocumentsResponse {
	documents: Document[];
	pagination?: PaginationResponse;
}

export interface DocumentSearchParams {
	query: string;
	connector_id?: number;
	limit?: number;
	min_score?: number;
}

export interface DocumentSearchResult {
	document: Document;
	chunk_id: string;
	chunk_content: string;
	score: number;
}

export interface DocumentSearchResponse {
	results: DocumentSearchResult[];
}

// API Functions
export const getDocuments = async (
	token: string,
	params?: ListDocumentsParams
): Promise<ListDocumentsResponse> => {
	let error = null;

	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.append('page', params.page.toString());
	if (params?.limit) searchParams.append('limit', params.limit.toString());
	if (params?.connector_id) searchParams.append('connector_id', params.connector_id.toString());
	if (params?.doc_status) searchParams.append('doc_status', params.doc_status);

	const res = await fetch(`${WEBUI_API_BASE_URL}/documents?${searchParams.toString()}`, {
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

export const getDocumentById = async (token: string, documentId: number): Promise<Document> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/documents/${documentId}`, {
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

export const deleteDocument = async (token: string, documentId: number): Promise<void> => {
	let error = null;

	await fetch(`${WEBUI_API_BASE_URL}/documents/${documentId}`, {
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

export const searchDocuments = async (
	token: string,
	params: DocumentSearchParams
): Promise<DocumentSearchResponse> => {
	let error = null;

	const searchParams = new URLSearchParams();
	searchParams.append('query', params.query);
	if (params.connector_id) searchParams.append('connector_id', params.connector_id.toString());
	if (params.limit) searchParams.append('limit', params.limit.toString());
	if (params.min_score) searchParams.append('min_score', params.min_score.toString());

	const res = await fetch(`${WEBUI_API_BASE_URL}/documents/search?${searchParams.toString()}`, {
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
