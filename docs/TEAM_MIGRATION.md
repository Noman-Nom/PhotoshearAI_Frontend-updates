# Team Management API Integration

## Overview
Team management has been migrated from localStorage to API-backed state management. This includes team members, roles, permissions, and invitations.

## Architecture

### API Clients
- **`services/teamApi.ts`** - Team member CRUD operations
- **`services/rolesApi.ts`** - Role & permissions management  
- **`services/invitationsApi.ts`** - Team invitation management
- **`utils/teamMappers.ts`** - Type transformations (snake_case ↔ camelCase)

### Key Changes

#### TeamContext Migration
- **From**: localStorage-based state management
- **To**: API-backed with real-time data fetching
- **New Features**:
  - `fetchMembers()` - Load team members from API
  - `fetchRoles()` - Load roles and permissions
  - `fetchInvitations()` - Load pending invitations
  - `isLoading` - Loading state indicator
  - `error` - Error message state
  - `createRole()`, `updateRole()`, `deleteRole()` - Role management

### API Endpoints Integrated

#### Team Members (`/api/v1/team/members`)
- **GET** - List all members (pagination, search support)
- **GET** `/{member_id}` - Get member details
- **PUT** `/{member_id}` - Update member (role, access level, etc.)
- **DELETE** `/{member_id}` - Delete member (cannot delete owners)

#### Roles (`/api/v1/roles`)
- **GET** - List all roles
- **POST** - Create custom role
- **PUT** `/{role_id}` - Update role
- **DELETE** `/{role_id}` - Delete role

#### Permissions
- **GET** `/api/v1/permissions` - List all available permissions by category

### Invitations (`/api/v1/team/invitations`)
- **GET** - List all invitations (with status filter)
- **POST** - Create and send invitation
- **POST** `/{invitation_id}/resend` - Resend invitation email
- **DELETE** `/{invitation_id}` - Cancel pending invitation

### Public Invitation Endpoints
- **GET** `/api/v1/invitations/{token}` - Get invitation details (no auth)
- **POST** `/api/v1/invitations/accept` - Accept invitation (no auth)

## Implementation Details

### API Clients Created
1. **teamApi.ts** - Team member CRUD operations
2. **rolesApi.ts** - Role management and permissions
3. **invitationsApi.ts** - Invitation lifecycle management

### Data Mappers
Created `teamMappers.ts` for bidirectional transformations:
- API format (snake_case) ↔ Frontend types (camelCase)
- Handles date formatting, null/undefined conversions
- Type-safe mappings with TypeScript

### TeamContext Migration
**Before:** LocalStorage-based state management
**After:** API-backed with React hooks

**Key Changes:**
- Added `isLoading` and `error` states
- Added `fetchMembers()`, `fetchRoles()`, `fetchInvitations()` methods
- All mutations now async: `updateMember()`, `deleteMember()`, `inviteMember()`, etc.
- Added role management: `createRole()`, `updateRole()`, `deleteRole()`
- Deprecated localStorage functions with console warnings
- Automatic data fetching on mount when user is authenticated

**New Context API:**
```typescript
{
  members: TeamMember[];
  pendingMembers: PendingMember[];
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
  updateMember: (id, data) => Promise<void>;
  deleteMember: (id) => Promise<void>;
  inviteMember: (data) => Promise<void>;
  // ... other methods
}
```

**Key Changes:**
- ✅ All operations now use API calls (team, roles, invitations)
- ✅ Async/await pattern for API operations
- ✅ Error handling with try/catch
- ✅ Loading states tracked via `isLoading` and `error` in context
- ✅ Deprecated localStorage functions with console.warn()
- ✅ Updated team page UI to handle async operations
- ✅ Added user feedback for errors (alerts)

**Status:** Team Management API integration complete!