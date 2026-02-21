/**
 * Events API Service
 *
 * Handles all HTTP communication with the backend events endpoints.
 * Replaces localStorage-based SHARED_EVENTS with API persistence.
 */

import { api } from '../utils/api';
import { CollectionResponse } from './collectionsApi';
import { CollaboratorResponse } from './collaboratorsApi';

// Re-export other services for backward compatibility
export * from './collectionsApi';
export * from './mediaApi';
export * from './facesApi';
export * from './commentsApi';
export * from './collaboratorsApi';

// ============ Types ============

export interface EventResponse {
    id: string;
    workspace_id: string;
    title: string;
    slug: string;
    description?: string;
    event_date: string;
    event_type?: string;
    status: 'draft' | 'published';
    customer_name?: string;
    customer_email?: string;
    branding_enabled: boolean;
    branding_id?: string;
    cover_url?: string;
    pin_required: boolean;
    pin_code?: string;
    total_photos: number;
    total_videos: number;
    total_size_bytes: number;
    collections: CollectionResponse[];
    collaborators: CollaboratorResponse[];
    created_at: string;
    updated_at: string;
}

export interface EventListResponse {
    items: EventResponse[];
    total: number;
    page: number;
    page_size: number;
}

export interface EventCreateInput {
    title: string;
    slug?: string;
    description?: string;
    event_date: string;
    event_type?: string;
    customer_name?: string;
    customer_email?: string;
    branding_enabled?: boolean;
    branding_id?: string;
    cover_url?: string;
    pin_required?: boolean;
    pin_code?: string;
}

export interface EventUpdateInput {
    title?: string;
    description?: string;
    event_date?: string;
    event_type?: string;
    status?: 'draft' | 'published';
    customer_name?: string;
    customer_email?: string;
    branding_enabled?: boolean;
    branding_id?: string;
    cover_url?: string;
    pin_required?: boolean;
    pin_code?: string;
}

export interface EventShareSettings {
    event_id: string;
    pin_required: boolean;
    pin_code?: string;
    guest_url: string;
    full_access_url: string;
    selection_url: string;
}

export interface EventShareUpdate {
    pin_required?: boolean;
    pin_code?: string;
}

// ============ Events API ============

export const eventsApi = {
    /**
     * List events for a workspace
     */
    async list(
        workspaceId: string,
        params?: { page?: number; pageSize?: number; status?: string; search?: string }
    ): Promise<EventListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);

        const query = queryParams.toString();
        return api.get(`/api/v1/workspaces/${workspaceId}/events${query ? `?${query}` : ''}`, true);
    },

    /**
     * Get single event by ID
     */
    async getById(eventId: string): Promise<EventResponse> {
        return api.get(`/api/v1/events/${eventId}`, true);
    },

    /**
     * Create a new event
     */
    async create(workspaceId: string, data: EventCreateInput): Promise<EventResponse> {
        return api.post(`/api/v1/workspaces/${workspaceId}/events`, data, true);
    },

    /**
     * Update an event
     */
    async update(eventId: string, data: EventUpdateInput): Promise<EventResponse> {
        return api.put(`/api/v1/events/${eventId}`, data, true);
    },

    /**
     * Delete an event
     */
    async delete(eventId: string): Promise<void> {
        return api.delete(`/api/v1/events/${eventId}`, true);
    },

    /**
     * Publish an event
     */
    async publish(eventId: string): Promise<EventResponse> {
        return api.post(`/api/v1/events/${eventId}/publish`, undefined, true);
    },

    /**
     * Unpublish an event (set to draft)
     */
    async unpublish(eventId: string): Promise<EventResponse> {
        return api.post(`/api/v1/events/${eventId}/unpublish`, undefined, true);
    },

    /**
     * Get share settings for an event
     */
    async getShareSettings(eventId: string): Promise<EventShareSettings> {
        return api.get(`/api/v1/events/${eventId}/share`, true);
    },

    /**
     * Update share settings for an event
     */
    async updateShareSettings(eventId: string, data: EventShareUpdate): Promise<EventShareSettings> {
        return api.put(`/api/v1/events/${eventId}/share`, data, true);
    },
};

export default eventsApi;
