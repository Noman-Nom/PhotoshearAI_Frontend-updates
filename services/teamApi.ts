/**
 * Team Members API Client
 * Handles team member management operations
 */

import { api } from '../utils/api';

// ============================================================================
// Type Definitions (API Response Types - snake_case)
// ============================================================================

export interface TeamMemberListResponseAPI {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string | null;
  access_level: 'Full Access' | 'Specific Event';
  is_owner: boolean;
  joined_at: string;
  initials: string;
  avatar_color: string;
  workspace_ids: string[];
}

export interface TeamMemberResponseAPI {
  id: string;
  org_id: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role_id: string | null;
  role_name: string | null;
  access_level: 'Full Access' | 'Specific Event';
  is_owner: boolean;
  joined_at: string;
  initials: string;
  avatar_color: string;
  events_count: number;
  workspace_ids: string[];
}

export interface TeamMemberUpdateAPI {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role_id?: string | null;
  access_level?: 'Full Access' | 'Specific Event' | null;
  workspace_ids?: string[] | null;
}

export interface PaginatedTeamMembersResponseAPI {
  items: TeamMemberListResponseAPI[];
  page: number;
  page_size: number;
  total: number;
}

// ============================================================================
// API Client
// ============================================================================

export const teamApi = {
  /**
   * List all team members in the organization
   * GET /api/v1/team/members
   */
  list: async (params?: {
    page?: number;
    pageSize?: number;
    q?: string;
  }): Promise<PaginatedTeamMembersResponseAPI> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());
    if (params?.q) queryParams.append('q', params.q);

    const query = queryParams.toString();
    return api.get(`/api/v1/team/members${query ? `?${query}` : ''}`, true);
  },

  /**
   * Get a team member by ID
   * GET /api/v1/team/members/{member_id}
   */
  get: async (memberId: string): Promise<TeamMemberResponseAPI> => {
    return api.get(`/api/v1/team/members/${memberId}`, true);
  },

  /**
   * Update a team member
   * PUT /api/v1/team/members/{member_id}
   */
  update: async (
    memberId: string,
    data: TeamMemberUpdateAPI
  ): Promise<TeamMemberResponseAPI> => {
    return api.put(`/api/v1/team/members/${memberId}`, data, true);
  },

  /**
   * Delete a team member
   * DELETE /api/v1/team/members/{member_id}
   * Cannot delete organization owners
   */
  delete: async (memberId: string): Promise<void> => {
    await api.delete(`/api/v1/team/members/${memberId}`, true);
  },

  /**
   * Get current user's permissions
   * GET /api/v1/team/me/permissions
   */
  getMyPermissions: async (): Promise<{ is_owner: boolean; permissions: string[] }> => {
    return api.get('/api/v1/team/me/permissions', true);
  },
};
