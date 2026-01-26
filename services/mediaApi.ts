import { api } from '../utils/api';

export interface MediaItemResponse {
    id: string;
    collection_id: string;
    media_type: 'photo' | 'video';
    filename: string;
    original_filename?: string;
    url: string;
    thumbnail_url?: string;
    size_bytes: number;
    mime_type?: string;
    width?: number;
    height?: number;
    duration_seconds?: number;
    processing_status: string;
    view_count: number;
    download_count: number;
    sort_order: number;
    created_at: string;
}

export interface MediaListResponse {
    items: MediaItemResponse[];
    total: number;
    page: number;
    page_size: number;
}

export interface MediaUploadRequest {
    collection_id: string;
    filename: string;
    content_type: string;
    size_bytes: number;
}

export interface MediaUploadResponse {
    media_id: string;
    upload_url: string;
    media_url: string;
}

export const mediaApi = {
    /**
     * Request presigned upload URL
     */
    async requestUpload(eventId: string, data: MediaUploadRequest): Promise<MediaUploadResponse> {
        return api.post(`/api/v1/events/${eventId}/media/upload`, data, true);
    },

    /**
     * List media items in a collection
     */
    async list(
        collectionId: string,
        params?: { page?: number; pageSize?: number }
    ): Promise<MediaListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());

        const query = queryParams.toString();
        return api.get(`/api/v1/collections/${collectionId}/media${query ? `?${query}` : ''}`, true);
    },

    /**
     * Get a single media item
     */
    async getById(mediaId: string): Promise<MediaItemResponse> {
        return api.get(`/api/v1/media/${mediaId}`, true);
    },

    /**
     * Delete a media item
     */
    async delete(mediaId: string): Promise<void> {
        return api.delete(`/api/v1/media/${mediaId}`, true);
    },

    /**
     * Bulk delete media items
     */
    async bulkDelete(eventId: string, mediaItemIds: string[]): Promise<{ deleted_count: number }> {
        return api.post(`/api/v1/events/${eventId}/media/bulk-delete`, { media_item_ids: mediaItemIds }, true);
    },
};
