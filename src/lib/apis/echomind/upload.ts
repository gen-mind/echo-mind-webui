import { WEBUI_API_BASE_URL } from '$lib/constants';
import type { Document } from './documents';

// Types
export interface InitiateUploadRequest {
	file_name: string;
	file_type: string;
	file_size: number;
	connector_id?: number;
}

export interface InitiateUploadResponse {
	upload_id: string;
	upload_url: string;
	expires_at: string;
}

export interface CompleteUploadRequest {
	upload_id: string;
	title?: string;
}

export interface AbortUploadRequest {
	upload_id: string;
}

export interface AbortUploadResponse {
	message: string;
	upload_id: string;
}

// API Functions
export const initiateUpload = async (
	token: string,
	data: InitiateUploadRequest
): Promise<InitiateUploadResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/upload/initiate`, {
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

export const completeUpload = async (
	token: string,
	data: CompleteUploadRequest
): Promise<Document> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/upload/complete`, {
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

export const abortUpload = async (
	token: string,
	data: AbortUploadRequest
): Promise<AbortUploadResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/upload/abort`, {
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

/**
 * Upload a file to the pre-signed URL obtained from initiateUpload.
 * This uploads directly to MinIO/S3, not through the backend.
 */
export const uploadFileToPresignedUrl = async (
	uploadUrl: string,
	file: File,
	onProgress?: (progress: number) => void
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.upload.addEventListener('progress', (event) => {
			if (event.lengthComputable && onProgress) {
				const progress = Math.round((event.loaded / event.total) * 100);
				onProgress(progress);
			}
		});

		xhr.addEventListener('load', () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
			} else {
				reject(new Error(`Upload failed with status ${xhr.status}`));
			}
		});

		xhr.addEventListener('error', () => {
			reject(new Error('Upload failed'));
		});

		xhr.open('PUT', uploadUrl);
		xhr.setRequestHeader('Content-Type', file.type);
		xhr.send(file);
	});
};

/**
 * Complete file upload flow:
 * 1. Initiate upload to get pre-signed URL
 * 2. Upload file directly to MinIO/S3
 * 3. Complete upload to trigger processing
 */
export const uploadDocument = async (
	token: string,
	file: File,
	options?: {
		title?: string;
		connectorId?: number;
		onProgress?: (progress: number) => void;
	}
): Promise<Document> => {
	// Step 1: Initiate upload
	const initResponse = await initiateUpload(token, {
		file_name: file.name,
		file_type: file.type,
		file_size: file.size,
		connector_id: options?.connectorId
	});

	// Step 2: Upload to pre-signed URL
	await uploadFileToPresignedUrl(initResponse.upload_url, file, options?.onProgress);

	// Step 3: Complete upload
	const document = await completeUpload(token, {
		upload_id: initResponse.upload_id,
		title: options?.title
	});

	return document;
};
