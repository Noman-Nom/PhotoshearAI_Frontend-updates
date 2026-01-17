
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Workspace } from '../constants';
import { useAuth } from './AuthContext';
import { workspaceApi, WorkspaceMemberResponse } from '../services/workspaceApi';
import { mapWorkspaceListToWorkspace, mapWorkspaceCreateToApi, mapWorkspaceUpdateToApi } from '../utils/workspaceMappers';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  isMutating: boolean; // True when any mutation is in progress
  mutatingIds: Set<string>; // IDs of workspaces currently being mutated
  error: string | null;
  setActiveWorkspaceById: (id: string) => Promise<void>;
  createWorkspace: (data: Omit<Workspace, 'id' | 'eventsCount' | 'membersCount' | 'collaborators'>) => Promise<void>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  addWorkspaceMember: (workspaceId: string, memberId: string, roleId?: string) => Promise<void>;
  removeWorkspaceMember: (workspaceId: string, memberId: string) => Promise<void>;
  getWorkspaceMembers: (workspaceId: string) => Promise<WorkspaceMemberResponse[]>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem('active_workspace_id');
  });

  // Helper to add/remove mutating IDs
  const startMutating = useCallback((id: string) => {
    setIsMutating(true);
    setMutatingIds(prev => new Set(prev).add(id));
  }, []);

  const stopMutating = useCallback((id: string) => {
    setMutatingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      if (next.size === 0) setIsMutating(false);
      return next;
    });
  }, []);

  // Fetch workspaces from API
  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all workspaces (API handles permission filtering server-side)
      const response = await workspaceApi.list({ page: 1, page_size: 100 });
      const mappedWorkspaces = response.items.map(mapWorkspaceListToWorkspace);
      setAllWorkspaces(mappedWorkspaces);

      // Set initial active workspace if none is set
      if (!activeWorkspaceId && mappedWorkspaces.length > 0) {
        setActiveWorkspaceId(mappedWorkspaces[0].id);
        localStorage.setItem('active_workspace_id', mappedWorkspaces[0].id);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch workspaces';
      setError(message);
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeWorkspaceId]);

  // Load workspaces on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    } else {
      setAllWorkspaces([]);
      setActiveWorkspaceId(null);
      localStorage.removeItem('active_workspace_id');
    }
  }, [user, fetchWorkspaces]);

  // Backend handles filtering, so we use allWorkspaces directly
  const filteredWorkspaces = useMemo(() => {
    return allWorkspaces;
  }, [allWorkspaces]);

  const activeWorkspace = useMemo(() => {
    if (!filteredWorkspaces.length) return null;
    return filteredWorkspaces.find(w => w?.id === activeWorkspaceId) || filteredWorkspaces[0] || null;
  }, [filteredWorkspaces, activeWorkspaceId]);

  useEffect(() => {
    // Sync activeWorkspaceId if it's no longer in the filtered list
    if (activeWorkspaceId && !filteredWorkspaces.some(w => w?.id === activeWorkspaceId)) {
      const nextId = filteredWorkspaces.length > 0 ? filteredWorkspaces[0].id : null;
      setActiveWorkspaceId(nextId);
      if (nextId) localStorage.setItem('active_workspace_id', nextId);
      else localStorage.removeItem('active_workspace_id');
    }
  }, [filteredWorkspaces, activeWorkspaceId]);

  const setActiveWorkspaceById = useCallback(async (id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('active_workspace_id', id);

    try {
      await workspaceApi.setActive(id);
    } catch (err: any) {
      console.error('Error setting active workspace:', err);
      // Keep local state even if API call fails (offline support)
    }
  }, []);

  const createWorkspace = useCallback(async (data: Omit<Workspace, 'id' | 'eventsCount' | 'membersCount' | 'collaborators'>) => {
    setLoading(true);
    setError(null);

    try {
      const apiData = mapWorkspaceCreateToApi(data);
      await workspaceApi.create(apiData);

      // Refresh workspaces to get the new one
      await fetchWorkspaces();
    } catch (err: any) {
      const message = err?.message || 'Failed to create workspace';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaces]);

  const updateWorkspace = useCallback(async (id: string, data: Partial<Workspace>) => {
    startMutating(id);
    setError(null);

    // Optimistic update - store previous state for rollback
    const previousWorkspaces = allWorkspaces;
    setAllWorkspaces(prev =>
      prev.map(w => w?.id === id ? { ...w, ...data } : w)
    );

    try {
      const apiData = mapWorkspaceUpdateToApi(data);
      await workspaceApi.update(id, apiData);
    } catch (err: any) {
      const message = err?.message || 'Failed to update workspace';
      setError(message);
      // Rollback optimistic update
      setAllWorkspaces(previousWorkspaces);
      throw err;
    } finally {
      stopMutating(id);
    }
  }, [allWorkspaces, startMutating, stopMutating]);

  const deleteWorkspace = useCallback(async (id: string) => {
    startMutating(id);
    setError(null);

    // Optimistic update - store previous state for rollback
    const previousWorkspaces = allWorkspaces;
    setAllWorkspaces(prev => prev.filter(w => w?.id !== id));

    try {
      await workspaceApi.delete(id);

      // Clear active workspace if it was deleted
      if (activeWorkspaceId === id) {
        const remaining = previousWorkspaces.filter(w => w.id !== id);
        const nextId = remaining.length > 0 ? remaining[0].id : null;
        setActiveWorkspaceId(nextId);
        if (nextId) localStorage.setItem('active_workspace_id', nextId);
        else localStorage.removeItem('active_workspace_id');
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to delete workspace';
      setError(message);
      // Rollback optimistic update
      setAllWorkspaces(previousWorkspaces);
      throw err;
    } finally {
      stopMutating(id);
    }
  }, [activeWorkspaceId, allWorkspaces, startMutating, stopMutating]);

  const refreshWorkspaces = useCallback(async () => {
    return fetchWorkspaces();
  }, [fetchWorkspaces]);

  const addWorkspaceMember = useCallback(async (workspaceId: string, memberId: string, roleId?: string) => {
    try {
      await workspaceApi.addMember(workspaceId, { member_id: memberId, role_id: roleId || null });
      // Refresh workspaces to update member counts
      await fetchWorkspaces();
    } catch (err: any) {
      const message = err?.message || 'Failed to add member to workspace';
      setError(message);
      throw err;
    }
  }, [fetchWorkspaces]);

  const removeWorkspaceMember = useCallback(async (workspaceId: string, memberId: string) => {
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      // Refresh workspaces to update member counts
      await fetchWorkspaces();
    } catch (err: any) {
      const message = err?.message || 'Failed to remove member from workspace';
      setError(message);
      throw err;
    }
  }, [fetchWorkspaces]);

  const getWorkspaceMembers = useCallback(async (workspaceId: string): Promise<WorkspaceMemberResponse[]> => {
    try {
      const response = await workspaceApi.listMembers(workspaceId, { page: 1, page_size: 100 });
      return response.items;
    } catch (err) {
      console.error('Error fetching workspace members:', err);
      return [];
    }
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      workspaces: filteredWorkspaces,
      activeWorkspace,
      loading,
      isMutating,
      mutatingIds,
      error,
      setActiveWorkspaceById,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      refreshWorkspaces,
      addWorkspaceMember,
      removeWorkspaceMember,
      getWorkspaceMembers
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
