import { api } from '../utils/api';

// ===== API Request/Response Types (matching OpenAPI schema) =====

export interface WorkspaceSettingsBase {
  photo_gallery?: boolean;
  qr_sharing?: boolean;
  download_protection?: boolean;
  client_comments?: boolean;
}

export interface WorkspaceCreate {
  name: string;
  description?: string | null;
  studio_type?: string | null;
  timezone?: string | null;
  currency?: string | null;
  color_theme?: string | null;
  icon_type?: 'camera' | 'building' | 'heart' | 'star';
  slug?: string | null;
  logo_url?: string | null;
  settings?: WorkspaceSettingsBase | null;
}

export interface WorkspaceUpdate {
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  studio_type?: string | null;
  timezone?: string | null;
  currency?: string | null;
  color_theme?: string | null;
  logo_url?: string | null;
  icon_type?: 'camera' | 'building' | 'heart' | 'star' | null;
  status?: 'setup' | 'active' | 'inactive' | null;
}

export interface WorkspaceSettingsResponse {
  photo_gallery: boolean;
  qr_sharing: boolean;
  download_protection: boolean;
  client_comments: boolean;
}

export interface WorkspaceResponse {
  name: string;
  description?: string | null;
  studio_type?: string | null;
  timezone?: string | null;
  currency?: string | null;
  color_theme?: string | null;
  icon_type: 'camera' | 'building' | 'heart' | 'star';
  id: string;
  org_id: string;
  slug: string;
  logo_url?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  settings?: WorkspaceSettingsResponse | null;
  events_count: number;
  members_count: number;
}

export interface WorkspaceListResponse {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  icon_type: string;
  color_theme?: string | null;
  logo_url?: string | null;
  events_count: number;
  members_count: number;
}

export interface PaginatedWorkspaceResponse {
  items: WorkspaceListResponse[];
  page: number;
  page_size: number;
  total: number;
}

export interface WorkspaceMemberResponse {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id?: string | null;
  role_name?: string | null;
  joined_at: string;
}

export interface PaginatedWorkspaceMemberResponse {
  items: WorkspaceMemberResponse[];
  page: number;
  page_size: number;
  total: number;
}

export interface WorkspaceMemberAdd {
  member_id: string;
  role_id?: string | null;
}

// ===== Workspace API Methods =====

export const workspaceApi = {
  /**
   * List all accessible workspaces with pagination and search
   */
  list: async (params?: {
    page?: number;
    page_size?: number;
    q?: string;
  }): Promise<PaginatedWorkspaceResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.q) queryParams.append('q', params.q);

    const query = queryParams.toString();
    const path = `/api/v1/workspaces${query ? `?${query}` : ''}`;
    return api.get(path, true);
  },

  /**
   * Create a new workspace
   */
  create: async (data: WorkspaceCreate): Promise<WorkspaceResponse> => {
    return api.post('/api/v1/workspaces', data, true);
  },

  /**
   * Get workspace details by ID
   */
  getById: async (workspaceId: string): Promise<WorkspaceResponse> => {
    return api.get(`/api/v1/workspaces/${workspaceId}`, true);
  },

  /**
   * Update workspace
   */
  update: async (workspaceId: string, data: WorkspaceUpdate): Promise<WorkspaceResponse> => {
    return api.put(`/api/v1/workspaces/${workspaceId}`, data, true);
  },

  /**
   * Delete workspace (owners only)
   */
  delete: async (workspaceId: string): Promise<void> => {
    await api.delete(`/api/v1/workspaces/${workspaceId}`, true);
  },

  /**
   * Set workspace as active for current user
   */
  setActive: async (workspaceId: string): Promise<void> => {
    return api.post(`/api/v1/workspaces/${workspaceId}/active`, undefined, true);
  },

  /**
   * Get the current user's active workspace ID
   */
  getActive: async (): Promise<string | null> => {
    const response = await api.get('/api/v1/workspaces/me/active', true);
    return response?.active_workspace_id || null;
  },

  /**
   * List workspace members
   */
  listMembers: async (workspaceId: string, params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedWorkspaceMemberResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const query = queryParams.toString();
    const path = `/api/v1/workspaces/${workspaceId}/members${query ? `?${query}` : ''}`;
    return api.get(path, true);
  },

  /**
   * Add member to workspace
   */
  addMember: async (workspaceId: string, data: WorkspaceMemberAdd): Promise<WorkspaceMemberResponse> => {
    return api.post(`/api/v1/workspaces/${workspaceId}/members`, data, true);
  },

  /**
   * Remove member from workspace
   */
  removeMember: async (workspaceId: string, memberId: string): Promise<void> => {
    await api.delete(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, true);
  }
};
