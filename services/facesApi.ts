import { api } from '../utils/api';
import { getApiBaseUrl } from '../utils/subdomain';

export interface PersonResponse {
    id: string;
    event_id: string;
    name?: string;
    face_count: number;
    media_count: number;
    thumbnail_url?: string;
    created_at: string;
    updated_at: string;
}

export interface PersonListResponse {
    items: PersonResponse[];
    total: number;
    page: number;
    page_size: number;
}

export interface PersonPhotosResponse {
    items: any[]; // We'll map this to SharedMediaItem
    total: number;
    page: number;
    page_size: number;
}

// Face Search Types
export interface FaceSearchUploadResponse {
    job_id: string;
    upload_url: string;
}

export interface FaceSearchMatch {
    media_id: string;
    thumbnail_url: string;
    original_url: string;
    confidence: number;
}

export interface FaceSearchJobResponse {
    job_id: string;
    status: 'pending' | 'processing' | 'processed' | 'failed';
    result?: {
        matches: FaceSearchMatch[];
    };
    error?: string;
}

export const facesApi = {
    /**
     * List all detected persons in an event
     */
    async listPersons(
        eventId: string,
        params?: { page?: number; pageSize?: number }
    ): Promise<PersonListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());

        const query = queryParams.toString();
        return api.get(`/api/v1/events/${eventId}/persons${query ? `?${query}` : ''}`, true);
    },

    /**
     * Get all photos containing a specific person
     */
    async getPersonPhotos(
        eventId: string,
        personId: string,
        params?: { page?: number; pageSize?: number }
    ): Promise<PersonPhotosResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());

        const query = queryParams.toString();
        return api.get(`/api/v1/events/${eventId}/persons/${personId}/photos${query ? `?${query}` : ''}`, true);
    },

    /**
     * Update person name/label
     */
    async updatePerson(eventId: string, personId: string, name: string): Promise<PersonResponse> {
        return api.put(`/api/v1/events/${eventId}/persons/${personId}`, { name }, true);
    },

    // ============ Face Search Methods ============

    /**
     * Create a face search job for guest access
     * Returns presigned URL to upload face image
     */
    async createSearch(eventId: string, clientToken?: string): Promise<FaceSearchUploadResponse> {
        const API_BASE_URL = getApiBaseUrl();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (clientToken) {
            headers['X-Client-Token'] = clientToken;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/faces/search?event_id=${eventId}`, {
            method: 'POST',
            headers,
            credentials: 'include',
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to create face search');
        }
        return res.json();
    },

    /**
     * Upload face image to presigned URL
     */
    async uploadImage(presignedUrl: string, imageBlob: Blob): Promise<void> {
        const res = await fetch(presignedUrl, {
            method: 'PUT',
            body: imageBlob,
            headers: {
                'Content-Type': 'image/jpeg',
            },
        });
        if (!res.ok) {
            throw new Error('Failed to upload face image');
        }
    },

    /**
     * Start face search after image upload
     */
    async startSearch(jobId: string, clientToken?: string): Promise<{ status: string }> {
        const API_BASE_URL = getApiBaseUrl();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (clientToken) {
            headers['X-Client-Token'] = clientToken;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/faces/search/${jobId}/start`, {
            method: 'POST',
            headers,
            credentials: 'include',
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to start face search');
        }
        return res.json();
    },

    /**
     * Poll job status and get results
     */
    async getJobStatus(jobId: string, clientToken?: string): Promise<FaceSearchJobResponse> {
        const API_BASE_URL = getApiBaseUrl();
        const headers: Record<string, string> = {};
        if (clientToken) {
            headers['X-Client-Token'] = clientToken;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`, {
            method: 'GET',
            headers,
            credentials: 'include',
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to get job status');
        }
        return res.json();
    },
};
