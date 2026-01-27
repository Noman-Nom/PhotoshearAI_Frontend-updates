import { api } from '../utils/api';

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
};
