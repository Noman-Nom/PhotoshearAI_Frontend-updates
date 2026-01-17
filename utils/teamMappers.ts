/**
 * Team Data Mappers
 * Transform between API types (snake_case) and Frontend types (camelCase)
 */

import type {
  TeamMemberListResponseAPI,
  TeamMemberResponseAPI,
  TeamMemberUpdateAPI,
} from '../services/teamApi';
import type {
  RoleResponseAPI,
  RoleCreateAPI,
  RoleUpdateAPI,
} from '../services/rolesApi';
import type {
  InvitationResponseAPI,
  InvitationCreateAPI,
} from '../services/invitationsApi';
import type { TeamMember, PendingMember, Role } from '../types';

// ============================================================================
// Team Members Mappers
// ============================================================================

/**
 * Map API team member list response to frontend TeamMember type
 */
export function mapTeamMemberListToFrontend(
  apiMember: TeamMemberListResponseAPI
): TeamMember {
  return {
    id: apiMember.id,
    firstName: apiMember.first_name,
    lastName: apiMember.last_name,
    role: apiMember.role_name || 'Studio Member',
    email: apiMember.email,
    phone: '',
    eventsCount: 0,
    accessLevel: apiMember.access_level,
    avatarColor: apiMember.avatar_color,
    initials: apiMember.initials,
    isOwner: apiMember.is_owner,
    joinedDate: new Date(apiMember.joined_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    allowedWorkspaceIds: apiMember.workspace_ids || [],
  };
}

/**
 * Map API team member detail response to frontend TeamMember type
 */
export function mapTeamMemberDetailToFrontend(
  apiMember: TeamMemberResponseAPI
): TeamMember {
  return {
    id: apiMember.id,
    firstName: apiMember.first_name,
    lastName: apiMember.last_name,
    role: apiMember.role_name || 'Studio Member',
    email: apiMember.email,
    phone: apiMember.phone || '',
    eventsCount: apiMember.events_count,
    accessLevel: apiMember.access_level,
    avatarColor: apiMember.avatar_color,
    initials: apiMember.initials,
    isOwner: apiMember.is_owner,
    joinedDate: new Date(apiMember.joined_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    allowedWorkspaceIds: apiMember.workspace_ids || [],
  };
}

/**
 * Map frontend TeamMember update to API format
 */
export function mapTeamMemberUpdateToAPI(
  update: Partial<TeamMember> & { roleId?: string; workspaceIds?: string[] }
): TeamMemberUpdateAPI {
  const apiUpdate: TeamMemberUpdateAPI = {};

  if (update.firstName !== undefined) {
    apiUpdate.first_name = update.firstName || null;
  }
  if (update.lastName !== undefined) {
    apiUpdate.last_name = update.lastName || null;
  }
  if (update.phone !== undefined) {
    apiUpdate.phone = update.phone || null;
  }
  if (update.roleId !== undefined) {
    apiUpdate.role_id = update.roleId || null;
  }
  if (update.accessLevel !== undefined) {
    apiUpdate.access_level = update.accessLevel;
  }
  if (update.workspaceIds !== undefined) {
    apiUpdate.workspace_ids = update.workspaceIds || null;
  }

  return apiUpdate;
}

// ============================================================================
// Roles Mappers
// ============================================================================

/**
 * Map API role response to frontend Role type
 */
export function mapRoleToFrontend(apiRole: RoleResponseAPI): Role {
  return {
    id: apiRole.id,
    name: apiRole.name,
    level: apiRole.level,
    description: apiRole.description || undefined,
    permissions: apiRole.permission_ids,
    memberCount: apiRole.member_count,
    isSystem: apiRole.is_system,
  };
}

/**
 * Map frontend Role create to API format
 */
export function mapRoleCreateToAPI(role: {
  name: string;
  level?: 'organization' | 'studio';
  description?: string;
  permissions: string[];
}): RoleCreateAPI {
  return {
    name: role.name,
    level: role.level || 'studio',
    description: role.description || null,
    permission_ids: role.permissions,
  };
}

/**
 * Map frontend Role update to API format
 */
export function mapRoleUpdateToAPI(
  update: Partial<Role>
): RoleUpdateAPI {
  const apiUpdate: RoleUpdateAPI = {};

  if (update.name !== undefined) {
    apiUpdate.name = update.name || null;
  }
  if (update.level !== undefined) {
    apiUpdate.level = update.level || null;
  }
  if (update.description !== undefined) {
    apiUpdate.description = update.description || null;
  }
  if (update.permissions !== undefined) {
    apiUpdate.permission_ids = update.permissions;
  }

  return apiUpdate;
}

// ============================================================================
// Invitations Mappers
// ============================================================================

/**
 * Map API invitation response to frontend PendingMember type
 */
export function mapInvitationToFrontend(
  apiInvitation: InvitationResponseAPI
): PendingMember {
  return {
    id: apiInvitation.id,
    email: apiInvitation.email,
    firstName: apiInvitation.first_name || undefined,
    lastName: apiInvitation.last_name || undefined,
    role: apiInvitation.role_name || undefined,
    sentDate: new Date(apiInvitation.sent_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    accessLevel: apiInvitation.access_level,
    allowedWorkspaceIds: apiInvitation.workspace_ids,
    status: apiInvitation.status === 'pending' ? 'Awaiting Response' : 'Invitation Expired',
  };
}

/**
 * Map frontend invitation create to API format
 */
export function mapInvitationCreateToAPI(invitation: {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  accessLevel?: 'Full Access' | 'Specific Event';
  workspaceIds?: string[];
  message?: string;
}): InvitationCreateAPI {
  return {
    email: invitation.email,
    first_name: invitation.firstName || null,
    last_name: invitation.lastName || null,
    role_id: invitation.roleId || null,
    access_level: invitation.accessLevel || 'Full Access',
    workspace_ids: invitation.workspaceIds || [],
    message: invitation.message || null,
  };
}
