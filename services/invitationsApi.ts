/**
 * Invitations API Client
 * Handles team invitation management
 */

import { api } from '../utils/api';

// ============================================================================
// Type Definitions (API Response Types - snake_case)
// ============================================================================

export interface InvitationResponseAPI {
  id: string;
  org_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_id: string | null;
  role_name: string | null;
  access_level: 'Full Access' | 'Specific Event';
  status: string;
  sent_at: string;
  expires_at: string;
  workspace_ids: string[];
}

export interface InvitationCreateAPI {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role_id?: string | null;
  access_level?: 'Full Access' | 'Specific Event';
  workspace_ids?: string[];
  message?: string | null;
}

export interface PaginatedInvitationsResponseAPI {
  items: InvitationResponseAPI[];
  page: number;
  page_size: number;
  total: number;
}

export interface InvitationDetailsResponseAPI {
  recipient: string;
  org: string;
  access_level: string;
  role: string | null;
}

export interface InvitationAcceptRequestAPI {
  token: string;
  password: string;
}

export interface InvitationAcceptResponseAPI {
  status: string;
  user_id: string;
  email: string;
  token: string;
}

// ============================================================================
// API Client
// ============================================================================

export const invitationsApi = {
  /**
   * List all invitations in the organization
   * GET /api/v1/team/invitations
   */
  list: async (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedInvitationsResponseAPI> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());

    const query = queryParams.toString();
    return api.get(`/api/v1/team/invitations${query ? `?${query}` : ''}`, true);
  },

  /**
   * Create and send an invitation
   * POST /api/v1/team/invitations
   */
  create: async (data: InvitationCreateAPI): Promise<InvitationResponseAPI> => {
    return api.post('/api/v1/team/invitations', data, true);
  },

  /**
   * Resend an invitation email
   * POST /api/v1/team/invitations/{invitation_id}/resend
   */
  resend: async (invitationId: string): Promise<void> => {
    await api.post(`/api/v1/team/invitations/${invitationId}/resend`, {}, true);
  },

  /**
   * Cancel a pending invitation
   * DELETE /api/v1/team/invitations/{invitation_id}
   */
  cancel: async (invitationId: string): Promise<void> => {
    await api.delete(`/api/v1/team/invitations/${invitationId}`, true);
  },

  // Public endpoints (no auth required)
  
  /**
   * Get invitation details for the accept page
   * GET /api/v1/invitations/{token}
   */
  getDetails: async (token: string): Promise<InvitationDetailsResponseAPI> => {
    return api.get(`/api/v1/invitations/${token}`, false);
  },

  /**
   * Accept an invitation and create account
   * POST /api/v1/invitations/accept
   */
  accept: async (data: InvitationAcceptRequestAPI): Promise<InvitationAcceptResponseAPI> => {
    return api.post('/api/v1/invitations/accept', data, false);
  },
};
