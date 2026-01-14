
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TeamMember, PendingMember, Role } from '../types';
import { useAuth } from './AuthContext';
import { teamApi } from '../services/teamApi';
import { rolesApi, permissionsApi } from '../services/rolesApi';
import { invitationsApi } from '../services/invitationsApi';
import {
  mapTeamMemberListToFrontend,
  mapTeamMemberDetailToFrontend,
  mapTeamMemberUpdateToAPI,
  mapRoleToFrontend,
  mapRoleCreateToAPI,
  mapRoleUpdateToAPI,
  mapInvitationToFrontend,
  mapInvitationCreateToAPI,
} from '../utils/teamMappers';

interface TeamContextType {
  members: TeamMember[];
  pendingMembers: PendingMember[];
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
  addMember: (member: Omit<TeamMember, 'id' | 'eventsCount' | 'avatarColor' | 'initials'>) => void;
  updateMember: (id: string, data: Partial<TeamMember> & { roleId?: string; workspaceIds?: string[] }) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  inviteMember: (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    accessLevel?: 'Full Access' | 'Specific Event';
    workspaceIds?: string[];
    message?: string;
  }) => Promise<void>;
  updatePendingMember: (id: string, data: Partial<PendingMember>) => void;
  deletePendingMember: (id: string) => Promise<void>;
  resendInvitation: (id: string) => Promise<void>;
  acceptInvitation: (email: string, details: { firstName: string; lastName: string; phone: string; password?: string; currentWorkspaceIds?: string[] }) => void;
  createRole: (role: { name: string; level?: 'organization' | 'studio'; description?: string; permissions: string[] }) => Promise<void>;
  updateRole: (id: string, data: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

// Keep localStorage keys for backward compatibility (deprecated)
const TEAM_STORAGE_KEY = 'photmo_team_members_v1';
const PENDING_STORAGE_KEY = 'photmo_pending_members_v1';
const ROLES_STORAGE_KEY = 'photmo_roles_v1';

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members from API
  const fetchMembers = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('[TeamContext] Fetching team members from API...');
      const response = await teamApi.list({ page: 1, pageSize: 100 });
      console.log('[TeamContext] Received team members:', response);
      const mappedMembers = response.items.map(mapTeamMemberListToFrontend);
      setMembers(mappedMembers);
    } catch (err: any) {
      console.error('[TeamContext] Error fetching team members:', err);
      setError(err.message || 'Failed to fetch team members');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('[TeamContext] Fetching roles from API...');
      const response = await rolesApi.list({ page: 1, pageSize: 100 });
      console.log('[TeamContext] Received roles:', response);
      const mappedRoles = response.items.map(mapRoleToFrontend);
      setRoles(mappedRoles);
      
      // If no roles returned, provide default studio roles for UI functionality
      if (mappedRoles.length === 0) {
        console.warn('[TeamContext] No roles from API, using default studio roles');
        setRoles([
          { 
            id: 'default_studio_member', 
            name: 'Studio Member', 
            level: 'studio',
            description: 'Basic studio team member',
            permissions: [], 
            memberCount: 0,
            isSystem: false
          },
          { 
            id: 'default_studio_manager', 
            name: 'Studio Manager', 
            level: 'studio',
            description: 'Manages studio operations',
            permissions: [], 
            memberCount: 0,
            isSystem: false
          }
        ]);
      }
    } catch (err: any) {
      console.error('[TeamContext] Error fetching roles:', err);
      setError(err.message || 'Failed to fetch roles');
      // Provide default roles on error to keep UI functional
      setRoles([
        { 
          id: 'default_studio_member', 
          name: 'Studio Member', 
          level: 'studio',
          description: 'Basic studio team member',
          permissions: [], 
          memberCount: 0,
          isSystem: false
        },
        { 
          id: 'default_studio_manager', 
          name: 'Studio Manager', 
          level: 'studio',
          description: 'Manages studio operations',
          permissions: [], 
          memberCount: 0,
          isSystem: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch invitations from API
  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('[TeamContext] Fetching invitations from API...');
      // Only fetch pending invitations (exclude accepted/expired)
      const response = await invitationsApi.list({ status: 'pending', page: 1, pageSize: 100 });
      console.log('[TeamContext] Received invitations:', response);
      const mappedInvitations = response.items.map(mapInvitationToFrontend);
      setPendingMembers(mappedInvitations);
    } catch (err: any) {
      console.error('[TeamContext] Error fetching invitations:', err);
      setError(err.message || 'Failed to fetch invitations');
      setPendingMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial data fetch and clear old localStorage data
  useEffect(() => {
    // Clear deprecated localStorage keys on mount
    localStorage.removeItem(TEAM_STORAGE_KEY);
    localStorage.removeItem(PENDING_STORAGE_KEY);
    localStorage.removeItem(ROLES_STORAGE_KEY);
    
    if (user) {
      console.log('[TeamContext] User authenticated, fetching data from API...');
      fetchMembers();
      fetchRoles();
      fetchInvitations();
    }
  }, [user, fetchMembers, fetchRoles, fetchInvitations]);

  // Add member (local only - deprecated, use inviteMember instead)
  const addMember = useCallback((data: any) => {
    console.warn('addMember is deprecated. Team members are now managed through API invitations.');
    const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-orange-100 text-orange-600'];
    const newMember: TeamMember = {
      id: `m_${Date.now()}`,
      eventsCount: 0,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      initials: ((data.firstName?.[0] || '') + (data.lastName?.[0] || '')).toUpperCase(),
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ...data
    };
    setMembers(prev => [newMember, ...prev]);
  }, []);

  // Update member via API
  const updateMember = useCallback(async (id: string, data: Partial<TeamMember> & { roleId?: string; workspaceIds?: string[] }) => {
    try {
      setError(null);
      const apiData = mapTeamMemberUpdateToAPI(data);
      const updatedMember = await teamApi.update(id, apiData);
      const mappedMember = mapTeamMemberDetailToFrontend(updatedMember);
      setMembers(prev => prev.map(m => m.id === id ? mappedMember : m));
    } catch (err: any) {
      console.error('Error updating member:', err);
      setError(err.message || 'Failed to update member');
      throw err;
    }
  }, []);

  // Delete member via API
  const deleteMember = useCallback(async (id: string) => {
    try {
      setError(null);
      await teamApi.delete(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error('Error deleting member:', err);
      setError(err.message || 'Failed to delete member');
      throw err;
    }
  }, []);

  // Invite member via API
  const inviteMember = useCallback(async (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    accessLevel?: 'Full Access' | 'Specific Event';
    workspaceIds?: string[];
    message?: string;
  }) => {
    try {
      setError(null);
      const apiData = mapInvitationCreateToAPI(data);
      const invitation = await invitationsApi.create(apiData);
      const mappedInvitation = mapInvitationToFrontend(invitation);
      setPendingMembers(prev => [mappedInvitation, ...prev]);
    } catch (err: any) {
      console.error('Error inviting member:', err);
      setError(err.message || 'Failed to invite member');
      throw err;
    }
  }, []);

  // Update pending member (local only - deprecated)
  const updatePendingMember = useCallback((id: string, data: Partial<PendingMember>) => {
    console.warn('updatePendingMember is deprecated. Use resendInvitation or cancel via API.');
    setPendingMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  // Delete pending member (cancel invitation) via API
  const deletePendingMember = useCallback(async (id: string) => {
    try {
      setError(null);
      await invitationsApi.cancel(id);
      setPendingMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error('Error canceling invitation:', err);
      setError(err.message || 'Failed to cancel invitation');
      throw err;
    }
  }, []);

  // Resend invitation via API
  const resendInvitation = useCallback(async (id: string) => {
    try {
      setError(null);
      await invitationsApi.resend(id);
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      setError(err.message || 'Failed to resend invitation');
      throw err;
    }
  }, []);

  // Accept invitation (local only - actual acceptance happens via signup flow)
  const acceptInvitation = useCallback((email: string, details: any) => {
    console.warn('acceptInvitation is for local simulation only. Actual acceptance via /api/v1/invitations/accept.');
    const pendingIdx = pendingMembers.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
    if (pendingIdx !== -1) {
      const invite = pendingMembers[pendingIdx] as any;
      const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-orange-100 text-orange-600'];
      
      const firstName = details.firstName || invite.firstName || email.split('@')[0];
      const lastName = details.lastName || invite.lastName || '';
      
      const finalWorkspaceIds = invite.accessLevel === 'Full Access' && details.currentWorkspaceIds
        ? details.currentWorkspaceIds
        : (invite.allowedWorkspaceIds || []);

      const newMember: TeamMember = {
        id: `u_${Date.now()}`,
        firstName,
        lastName,
        role: invite.role || 'Studio Member',
        email,
        phone: details.phone || invite.phone || '',
        eventsCount: 0,
        accessLevel: invite.accessLevel,
        allowedEventIds: invite.allowedEventIds || [],
        allowedWorkspaceIds: finalWorkspaceIds, 
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        initials: (firstName[0] + (lastName[0] || '')).toUpperCase(),
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      setMembers(prev => [...prev, newMember]);
      setPendingMembers(prev => prev.filter(p => p.email.toLowerCase() !== email.toLowerCase()));
    }
  }, [pendingMembers]);

  // Create role via API
  const createRole = useCallback(async (role: {
    name: string;
    level?: 'organization' | 'studio';
    description?: string;
    permissions: string[];
  }) => {
    try {
      setError(null);
      const apiData = mapRoleCreateToAPI(role);
      const newRole = await rolesApi.create(apiData);
      const mappedRole = mapRoleToFrontend(newRole);
      setRoles(prev => [...prev, mappedRole]);
    } catch (err: any) {
      console.error('Error creating role:', err);
      setError(err.message || 'Failed to create role');
      throw err;
    }
  }, []);

  // Update role via API
  const updateRole = useCallback(async (id: string, data: Partial<Role>) => {
    try {
      setError(null);
      const apiData = mapRoleUpdateToAPI(data);
      const updatedRole = await rolesApi.update(id, apiData);
      const mappedRole = mapRoleToFrontend(updatedRole);
      setRoles(prev => prev.map(r => r.id === id ? mappedRole : r));
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role');
      throw err;
    }
  }, []);

  // Delete role via API
  const deleteRole = useCallback(async (id: string) => {
    try {
      setError(null);
      await rolesApi.delete(id);
      setRoles(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Error deleting role:', err);
      setError(err.message || 'Failed to delete role');
      throw err;
    }
  }, []);

  return (
    <TeamContext.Provider value={{
      members,
      pendingMembers,
      roles,
      isLoading,
      error,
      fetchMembers,
      fetchRoles,
      fetchInvitations,
      addMember,
      updateMember,
      deleteMember,
      inviteMember,
      updatePendingMember,
      deletePendingMember,
      resendInvitation,
      acceptInvitation,
      createRole,
      updateRole,
      deleteRole,
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
