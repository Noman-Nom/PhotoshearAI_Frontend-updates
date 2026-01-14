import { useState, useCallback } from 'react';
import { workspaceApi, WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, WorkspaceListResponse } from '../services/workspaceApi';
import { ApiError } from '../utils/api';

export interface UseWorkspacesResult {
  workspaces: WorkspaceListResponse[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  
  // Actions
  fetchWorkspaces: (params?: { page?: number; page_size?: number; q?: string }) => Promise<void>;
  createWorkspace: (data: WorkspaceCreate) => Promise<WorkspaceResponse>;
  updateWorkspace: (id: string, data: WorkspaceUpdate) => Promise<WorkspaceResponse>;
  deleteWorkspace: (id: string) => Promise<void>;
  setActiveWorkspace: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

export const useWorkspaces = (): UseWorkspacesResult => {
  const [workspaces, setWorkspaces] = useState<WorkspaceListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchWorkspaces = useCallback(async (params?: { page?: number; page_size?: number; q?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await workspaceApi.list(params);
      setWorkspaces(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.page_size);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch workspaces';
      setError(message);
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkspace = useCallback(async (data: WorkspaceCreate): Promise<WorkspaceResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const newWorkspace = await workspaceApi.create(data);
      // Refresh the list to include the new workspace
      await fetchWorkspaces({ page: 1, page_size: pageSize });
      return newWorkspace;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create workspace';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaces, pageSize]);

  const updateWorkspace = useCallback(async (id: string, data: WorkspaceUpdate): Promise<WorkspaceResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedWorkspace = await workspaceApi.update(id, data);
      // Update local state optimistically
      setWorkspaces(prev => 
        prev.map(ws => ws.id === id ? { ...ws, ...data, id: ws.id } : ws)
      );
      return updatedWorkspace;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update workspace';
      setError(message);
      // Refresh to get server state
      await fetchWorkspaces({ page, page_size: pageSize });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, fetchWorkspaces]);

  const deleteWorkspace = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await workspaceApi.delete(id);
      // Remove from local state
      setWorkspaces(prev => prev.filter(ws => ws.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete workspace';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setActiveWorkspace = useCallback(async (id: string): Promise<void> => {
    setError(null);
    
    try {
      await workspaceApi.setActive(id);
      // Store active workspace ID locally for quick access
      localStorage.setItem('active_workspace_id', id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to set active workspace';
      setError(message);
      throw err;
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    return fetchWorkspaces({ page, page_size: pageSize });
  }, [fetchWorkspaces, page, pageSize]);

  return {
    workspaces,
    loading,
    error,
    total,
    page,
    pageSize,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setActiveWorkspace,
    refreshWorkspaces
  };
};
