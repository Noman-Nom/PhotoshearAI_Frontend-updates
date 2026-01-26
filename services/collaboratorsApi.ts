import { api } from '../utils/api';

export interface CollaboratorResponse {
    id: string;
    event_id: string;
    team_member_id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
}

export const collaboratorsApi = {
    /**
     * List collaborators for an event
     */
    async list(eventId: string): Promise<CollaboratorResponse[]> {
        return api.get(`/api/v1/events/${eventId}/collaborators`, true);
    },

    /**
     * Add a collaborator to an event
     */
    async add(eventId: string, teamMemberId: string): Promise<CollaboratorResponse> {
        return api.post(`/api/v1/events/${eventId}/collaborators`, { team_member_id: teamMemberId }, true);
    },

    /**
     * Remove a collaborator from an event
     */
    async remove(eventId: string, memberId: string): Promise<void> {
        return api.delete(`/api/v1/events/${eventId}/collaborators/${memberId}`, true);
    },
};
