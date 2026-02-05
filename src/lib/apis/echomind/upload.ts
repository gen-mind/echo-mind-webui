import { WEBUI_API_BASE_URL } from '$lib/constants';
import type { Document } from './documents';

// Types
export interface InitiateUploadRequest {
	filename: string;
	content_type: string;
	size: number;
}

export interface InitiateUploadResponse {
	document_id: number;
	upload_url: string;
	expires_in: number;
	storage_path: string;
}

export interface CompleteUploadRequest {
	document_id: number;
}

export interface AbortUploadRequest {
	document_id: number;
}

export interface AbortUploadResponse {
	success: boolean;
}

// API Functions
export const initiateUpload = async (
	token: string,
	data: InitiateUploadRequest
): Promise<InitiateUploadResponse> => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/documents/upload/initiate`, {
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

	const res = await fetch(`${WEBUI_API_BASE_URL}/documents/upload/complete`, {
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

	const res = await fetch(`${WEBUI_API_BASE_URL}/documents/upload/abort`, {
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
		onProgress?: (progress: number) => void;
	}
): Promise<Document> => {
	// Step 1: Initiate upload
	const initResponse = await initiateUpload(token, {
		filename: file.name,
		content_type: file.type,
		size: file.size
	});

	// Step 2: Upload to pre-signed URL
	await uploadFileToPresignedUrl(initResponse.upload_url, file, options?.onProgress);

	// Step 3: Complete upload
	const document = await completeUpload(token, {
		document_id: initResponse.document_id
	});

	return document;
};
