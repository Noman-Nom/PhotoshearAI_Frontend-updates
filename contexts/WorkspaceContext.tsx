
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Workspace, loadWorkspaces, saveWorkspacesToStorage } from '../constants';
import { useAuth } from './AuthContext';
import { useTeam } from './TeamContext';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspaceById: (id: string) => void;
  createWorkspace: (data: Omit<Workspace, 'id' | 'eventsCount' | 'membersCount' | 'collaborators'>) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { members } = useTeam();
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>(() => {
    const loaded = loadWorkspaces();
    // Defensive check to filter out any null/undefined entries from storage
    return Array.isArray(loaded) ? loaded.filter(Boolean) : [];
  });
  
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem('active_workspace_id');
  });

  // Filter workspaces based on user role and allowed ids
  const filteredWorkspaces = useMemo(() => {
    if (!user || !user.email) return [];
    
    const userEmailLower = user.email.toLowerCase();
    
    // Find the member profile for the current user
    const currentUserProfile = members.find(m => m?.email?.toLowerCase() === userEmailLower);
    
    // Admin Roles: Owners and Account Managers see everything
    const userRole = currentUserProfile?.role || '';
    const isAdmin = currentUserProfile?.isOwner || 
                    ['Owner', 'SuperAdmin / Owner', 'Account Manager'].includes(userRole);

    if (isAdmin) {
      return allWorkspaces;
    }

    // Membership is now strictly based on ID inclusion to allow snapshot and removability behavior
    const allowedIds = currentUserProfile?.allowedWorkspaceIds || [];
    return allWorkspaces.filter(ws => ws && ws.id && allowedIds.includes(ws.id));
  }, [allWorkspaces, user, members]);

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

  const setActiveWorkspaceById = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('active_workspace_id', id);
  }, []);

  const createWorkspace = useCallback((data: any) => {
    const newId = `w_${Date.now()}`;
    const newWs: Workspace = {
      id: newId,
      eventsCount: 0,
      membersCount: 1,
      collaborators: [],
      ...data
    };
    const updated = [newWs, ...allWorkspaces];
    setAllWorkspaces(updated);
    saveWorkspacesToStorage(updated);
    
    if (!activeWorkspaceId) {
      setActiveWorkspaceById(newId);
    }
  }, [allWorkspaces, activeWorkspaceId, setActiveWorkspaceById]);

  const updateWorkspace = useCallback((id: string, data: Partial<Workspace>) => {
    const updated = allWorkspaces.map(w => w?.id === id ? { ...w, ...data } : w);
    setAllWorkspaces(updated);
    saveWorkspacesToStorage(updated);
  }, [allWorkspaces]);

  const deleteWorkspace = useCallback((id: string) => {
    const updated = allWorkspaces.filter(w => w?.id !== id);
    setAllWorkspaces(updated);
    saveWorkspacesToStorage(updated);
  }, [allWorkspaces]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces: filteredWorkspaces,
      activeWorkspace,
      setActiveWorkspaceById,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace
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
