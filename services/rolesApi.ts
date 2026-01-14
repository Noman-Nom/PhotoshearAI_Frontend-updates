/**
 * Roles API Client
 * Handles role and permissions management
 */

import { api } from '../utils/api';

// ============================================================================
// Type Definitions (API Response Types - snake_case)
// ============================================================================

export interface RoleResponseAPI {
  id: string;
  org_id: string | null;
  name: string;
  level: 'organization' | 'studio';
  description: string | null;
  is_system: boolean;
  created_at: string;
  permission_ids: string[];
  member_count: number;
}

export interface RoleCreateAPI {
  name: string;
  level?: 'organization' | 'studio';
  description?: string | null;
  permission_ids: string[];
}

export interface RoleUpdateAPI {
  name?: string | null;
  level?: 'organization' | 'studio' | null;
  description?: string | null;
  permission_ids?: string[] | null;
}

export interface PaginatedRolesResponseAPI {
  items: RoleResponseAPI[];
  page: number;
  page_size: number;
  total: number;
}

export interface PermissionResponseAPI {
  id: string;
  label: string;
  description: string | null;
  category: string;
}

export interface PermissionCategoryAPI {
  category: string;
  permissions: PermissionResponseAPI[];
}

// ============================================================================
// API Client
// ============================================================================

export const rolesApi = {
  /**
   * List all roles
   * GET /api/v1/roles
   */
  list: async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedRolesResponseAPI> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());

    const query = queryParams.toString();
    return api.get(`/api/v1/roles${query ? `?${query}` : ''}`, true);
  },

  /**
   * Create a new role
   * POST /api/v1/roles
   */
  create: async (data: RoleCreateAPI): Promise<RoleResponseAPI> => {
    return api.post('/api/v1/roles', data, true);
  },

  /**
   * Update a role
   * PUT /api/v1/roles/{role_id}
   * System roles cannot be modified
   */
  update: async (
    roleId: string,
    data: RoleUpdateAPI
  ): Promise<RoleResponseAPI> => {
    return api.put(`/api/v1/roles/${roleId}`, data, true);
  },

  /**
   * Delete a role
   * DELETE /api/v1/roles/{role_id}
   * System roles and roles with assigned members cannot be deleted
   */
  delete: async (roleId: string): Promise<void> => {
    await api.delete(`/api/v1/roles/${roleId}`, true);
  },
};

export const permissionsApi = {
  /**
   * List all available permissions grouped by category
   * GET /api/v1/permissions
   */
  list: async (): Promise<PermissionCategoryAPI[]> => {
    return api.get('/api/v1/permissions', true);
  },
};
