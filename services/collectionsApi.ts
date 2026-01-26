import { api } from '../utils/api';

export interface CollectionResponse {
    id: string;
    event_id: string;
    title: string;
    slug: string;
    description?: string;
    is_default: boolean;
    sort_order: number;
    thumbnail_url?: string;
    photo_count: number;
    video_count: number;
    created_at: string;
}

export interface CollectionCreateInput {
    title: string;
    description?: string;
    is_default?: boolean;
}

export interface CollectionUpdateInput {
    title?: string;
    description?: string;
    sort_order?: number;
}

export const collectionsApi = {
    /**
     * List collections for an event
     */
    async list(eventId: string): Promise<CollectionResponse[]> {
        return api.get(`/api/v1/events/${eventId}/collections`, true);
    },

    /**
     * Create a new collection
     */
    async create(eventId: string, data: CollectionCreateInput): Promise<CollectionResponse> {
        return api.post(`/api/v1/events/${eventId}/collections`, data, true);
    },

    /**
     * Update a collection
     */
    async update(eventId: string, collectionId: string, data: CollectionUpdateInput): Promise<CollectionResponse> {
        return api.put(`/api/v1/events/${eventId}/collections/${collectionId}`, data, true);
    },

    /**
     * Delete a collection
     */
    async delete(eventId: string, collectionId: string): Promise<void> {
        return api.delete(`/api/v1/events/${eventId}/collections/${collectionId}`, true);
    },

    /**
     * Move media items to another collection
     */
    async moveItems(
        eventId: string,
        sourceCollectionId: string,
        targetCollectionId: string,
        mediaItemIds: string[]
    ): Promise<void> {
        return api.post(`/api/v1/events/${eventId}/collections/${sourceCollectionId}/move`, {
            target_collection_id: targetCollectionId,
            media_item_ids: mediaItemIds,
        }, true);
    },
};
