import { api } from '../utils/api';

export interface AttachmentResponse {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface CommentResponse {
    id: string;
    media_id: string;
    author_id: string;
    author_name: string;
    author_initials: string;
    text: string;
    status: 'resolved' | 'unresolved';
    parent_id?: string;
    reply_to_author?: string;
    reply_to_text?: string;
    attachments: AttachmentResponse[];
    replies: CommentResponse[];
    created_at: string;
    updated_at: string;
}

export interface CommentCreateInput {
    text: string;
    parent_id?: string;
    status?: 'resolved' | 'unresolved';
}

export interface CommentUpdateInput {
    text?: string;
    status?: 'resolved' | 'unresolved';
}

export const commentsApi = {
    /**
     * List comments for a media item
     */
    async list(mediaId: string): Promise<CommentResponse[]> {
        return api.get(`/api/v1/media/${mediaId}/comments`, true);
    },

    /**
     * Create a new comment
     */
    async create(mediaId: string, data: CommentCreateInput): Promise<CommentResponse> {
        return api.post(`/api/v1/media/${mediaId}/comments`, data, true);
    },

    /**
     * Update a comment
     */
    async update(mediaId: string, commentId: string, data: CommentUpdateInput): Promise<CommentResponse> {
        return api.put(`/api/v1/media/${mediaId}/comments/${commentId}`, data, true);
    },

    /**
     * Delete a comment
     */
    async delete(mediaId: string, commentId: string): Promise<void> {
        return api.delete(`/api/v1/media/${mediaId}/comments/${commentId}`, true);
    },

    /**
     * Toggle comment resolved status
     */
    async toggleResolved(mediaId: string, commentId: string, resolved: boolean): Promise<CommentResponse> {
        return api.put(`/api/v1/media/${mediaId}/comments/${commentId}`, { status: resolved ? 'resolved' : 'unresolved' }, true);
    },
};
