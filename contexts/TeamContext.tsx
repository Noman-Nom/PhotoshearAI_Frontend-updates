
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TeamMember, PendingMember, Role } from '../types';
import { addSimulatedEmail } from '../constants';
import { useAuth } from './AuthContext';

interface TeamContextType {
  members: TeamMember[];
  pendingMembers: PendingMember[];
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  addMember: (member: Omit<TeamMember, 'id' | 'eventsCount' | 'avatarColor' | 'initials'>) => void;
  updateMember: (id: string, data: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
  inviteMember: (data: Omit<PendingMember, 'id' | 'sentDate' | 'status'> & { org: string; accessScope: string | string[] }) => void;
  updatePendingMember: (id: string, data: Partial<PendingMember>) => void;
  deletePendingMember: (id: string) => void;
  resendInvitation: (id: string) => void;
  acceptInvitation: (email: string, details: { firstName: string; lastName: string; phone: string; password?: string; currentWorkspaceIds?: string[] }) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const TEAM_STORAGE_KEY = 'photmo_team_members_v1';
const PENDING_STORAGE_KEY = 'photmo_pending_members_v1';
const ROLES_STORAGE_KEY = 'photmo_roles_v1';

const INITIAL_ROLES: Role[] = [
  { 
    id: 'role_owner', 
    name: 'SuperAdmin / Owner', 
    level: 'organization',
    description: 'Full system control across all studios. Access Level: Platform + Studio + Adhoc (Unrestricted)',
    permissions: [], // This will be handled in Workspaces page for display
    memberCount: 0, 
    isSystem: true 
  },
  { 
    id: 'role_account_mgr', 
    name: 'Account Manager', 
    level: 'organization',
    description: 'Manages studios, people, and operations (no ownership powers). Access Level: High-level + Studio management',
    permissions: [], 
    memberCount: 0 
  },
  { 
    id: 'role_studio_mgr', 
    name: 'Studio Manager', 
    level: 'studio',
    description: 'Runs day-to-day studio operations. Access Level: Studio-only',
    permissions: [], 
    memberCount: 0 
  },
  { 
    id: 'role_studio_member', 
    name: 'Studio Member', 
    level: 'studio',
    description: 'Executes assigned work (photographers, editors, staff). Access Level: Limited, task-based',
    permissions: [], 
    memberCount: 0 
  }
];

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(TEAM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>(() => {
    const saved = localStorage.getItem(PENDING_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem(ROLES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ROLES;
  });

  // Ensure owner is always in the list
  useEffect(() => {
    if (user && !members.some(m => m.email === user.email)) {
      const ownerMember: TeamMember = {
        id: `owner_${user.id}`,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'Owner',
        email: user.email,
        phone: '',
        eventsCount: 0,
        accessLevel: 'Full Access',
        avatarColor: 'bg-slate-900 text-white',
        initials: (user.firstName[0] + (user.lastName[0] || '')).toUpperCase(),
        isOwner: true,
        joinedDate: 'Jan 1, 2025'
      };
      setMembers(prev => [ownerMember, ...prev]);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pendingMembers));
  }, [pendingMembers]);

  useEffect(() => {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  const addMember = useCallback((data: any) => {
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

  const updateMember = useCallback((id: string, data: Partial<TeamMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id || m.isOwner));
  }, []);

  const inviteMember = useCallback((data: any) => {
    const newPending: PendingMember & { org?: string; accessScope?: string | string[] } = {
      id: `p_${Date.now()}`,
      sentDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Awaiting Response',
      ...data
    };
    setPendingMembers(prev => [newPending, ...prev]);

    addSimulatedEmail({
      to: data.email,
      subject: `You have been invited to ${data.org} Workspace`,
      body: JSON.stringify({
        type: 'INVITATION',
        recipient: data.email,
        accessLevel: data.accessScope || data.accessLevel,
        role: data.role,
        org: data.org || 'Photmo Inc.'
      })
    });
  }, []);

  const updatePendingMember = useCallback((id: string, data: Partial<PendingMember>) => {
    setPendingMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const deletePendingMember = useCallback((id: string) => {
    setPendingMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const resendInvitation = useCallback((id: string) => {
    const member = pendingMembers.find(m => m.id === id) as any;
    if (member) {
      addSimulatedEmail({
        to: member.email,
        subject: `Invitation Resent: ${member.org || 'Photmo'} Workspace`,
        body: JSON.stringify({
          type: 'INVITATION',
          recipient: member.email,
          accessLevel: member.accessScope || member.accessLevel,
          role: member.role,
          org: member.org || 'Photmo Inc.'
        })
      });
    }
  }, [pendingMembers]);

  const acceptInvitation = useCallback((email: string, details: any) => {
    const pendingIdx = pendingMembers.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
    if (pendingIdx !== -1) {
      const invite = pendingMembers[pendingIdx] as any;
      const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-orange-100 text-orange-600'];
      
      const firstName = details.firstName || invite.firstName || email.split('@')[0];
      const lastName = details.lastName || invite.lastName || '';
      
      // If invited with Full Access, use the passed currentWorkspaceIds to snapshot current studios
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

      // Dispatch Welcome Email
      addSimulatedEmail({
        to: email,
        subject: `Welcome to ${invite.org || 'Photmo'}!`,
        body: `Hello ${firstName},\n\nWelcome to the team! You have successfully joined the ${invite.org || 'Photmo'} workspace.\n\nYou can now log in to your account at any time to manage events and collaborate with your colleagues.\n\nWorkspace: ${invite.org || 'Photmo'}\nAccess Level: ${invite.accessLevel}\n\nBest regards,\nThe ${invite.org || 'Photmo'} Team`
      });
    }
  }, [pendingMembers]);

  return (
    <TeamContext.Provider value={{
      members,
      pendingMembers,
      roles,
      setRoles,
      addMember,
      updateMember,
      deleteMember,
      inviteMember,
      updatePendingMember,
      deletePendingMember,
      resendInvitation,
      acceptInvitation
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
