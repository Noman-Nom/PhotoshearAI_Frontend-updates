# Workspaces & Team (Backend-Oriented, FastAPI)

> Scope: Backend design for workspace management, roles/permissions, and team membership at global and studio levels.
> Source of truth: frontend usage in `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## 1. Feature Overview

### Purpose
- Manage workspaces (studios) and workspace settings.
- Control access to workspaces via roles, permissions, and member assignments.
- Invite and manage team members globally and at studio level.

### Entry Points (frontend routes)
- `/workspaces` (workspace hub with tabs: Workspaces, Roles, All Members, Guest Data)
- `/workspaces/create` (create/edit workspace)
- `/team` (studio-level team management)

### Preconditions & Assumptions
- Users are authenticated (auth handled elsewhere).
- Workspace access is determined by user role and membership lists.
- **Assumption**: Backend enforces permissions and visibility; frontend currently simulates access in localStorage.

## 2. Core Data Models (Pydantic)

### Workspace
Derived from `/constants.ts`.
```py
class WorkspaceSettings(BaseModel):
    photo_gallery: bool
    qr_sharing: bool
    download_protection: bool
    client_comments: bool

class Workspace(BaseModel):
    id: str
    name: str
    description: str
    url: str | None = None
    studio_type: str | None = None
    timezone: str | None = None
    currency: str | None = None
    color_theme: str | None = None
    logo: str | None = None
    settings: WorkspaceSettings | None = None
    status: Literal["Active", "Setup"]
    icon_type: Literal["camera", "building", "heart", "star"]
    events_count: int
    members_count: int
    collaborators: list[str]
```

### Role
Derived from `/types.ts` and `PERMISSIONS_LIST` in `/app/workspaces/page.tsx`.
```py
class Role(BaseModel):
    id: str
    name: str
    level: Literal["organization", "studio"]
    description: str | None = None
    permissions: list[str]
    member_count: int
    is_system: bool | None = None
```

### TeamMember
Derived from `/types.ts`.
```py
class TeamMember(BaseModel):
    id: str
    first_name: str
    last_name: str
    role: str
    email: EmailStr
    phone: str
    events_count: int
    access_level: Literal["Specific Event", "Full Access"]
    allowed_event_ids: list[str] = []
    allowed_workspace_ids: list[str] = []
    avatar_color: str
    initials: str
    is_owner: bool | None = None
    joined_date: str | None = None
```

### PendingMember (Invitation)
Derived from `/types.ts`.
```py
class PendingMember(BaseModel):
    id: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    role: str | None = None
    location: str | None = None
    sent_date: str
    access_level: Literal["Specific Event", "Full Access"]
    allowed_event_ids: list[str] = []
    allowed_workspace_ids: list[str] = []
    status: Literal["Awaiting Response", "Invitation Expired"]
    is_owner: bool | None = None
```

## 3. Permission Model (From UI)

Permissions are grouped as:
- **Platform Administration**: workspace CRUD, role management, global members, guest data, billing, audit logs.
- **Studio Operations**: event CRUD, studio member CRUD, branding, studio settings.
- **Media & Collaboration**: sharing, media management, comments, analytics.

**System roles** (protected):
- `role_owner` (SuperAdmin / Owner)
- `role_account_mgr` (Account Manager)
- `role_studio_mgr` (Studio Manager)
- `role_studio_member` (Studio Member)

Default permissions are inferred from `rolesWithUserCounts` logic:
- Owner → all permissions.
- Account Manager → all permissions except `ws_delete`, `role_delete`, `branding_remove` (assumed from filter).
- Studio Manager → event + studio + media related permissions.
- Studio Member → `event_share`, `media_manage`, `media_usage`.

## 4. Backend Endpoints (Proposed)

### Workspaces

**GET `/workspaces`**
- List workspaces accessible to the current user.
- **Access rule**: Owner/SuperAdmin/Account Manager see all; others filtered by `allowed_workspace_ids`.

**POST `/workspaces`**
- Create workspace.
- Request body: `Workspace` (minus `id`, counts, collaborators).
- Validate unique workspace name (UI enforces uniqueness).

**GET `/workspaces/{workspace_id}`**
- Workspace detail.

**PUT `/workspaces/{workspace_id}`**
- Update workspace (name, url, settings, branding info, etc.).

**DELETE `/workspaces/{workspace_id}`**
- Remove workspace (UI confirms deletion).

**POST `/workspaces/{workspace_id}/members`**
- Add member to workspace (grant access).
- Request body: `{ memberId, role? }`.

**DELETE `/workspaces/{workspace_id}/members/{member_id}`**
- Remove member from workspace.
- **UI rule**: Do not remove owners.

**POST `/workspaces/{workspace_id}/active`**
- Set active workspace for current user.
- Stores preference (frontend uses `active_workspace_id`).

### Team (Global)

**GET `/team/members`**
- List global members.

**POST `/team/members`**
- Create member (internal use; usually via invitation).

**PUT `/team/members/{member_id}`**
- Update member details (role, allowed workspace/event IDs).

**DELETE `/team/members/{member_id}`**
- Remove member globally (revokes access to all studios).

### Team (Studio)

**GET `/workspaces/{workspace_id}/team`**
- Studio-specific members (includes owner + members with workspace or event access).

**GET `/workspaces/{workspace_id}/pending-invitations`**
- Pending invites filtered by `allowed_workspace_ids`.

**POST `/workspaces/{workspace_id}/team/add-existing`**
- Add existing global member to a studio with a studio role.

**DELETE `/workspaces/{workspace_id}/team/{member_id}`**
- Remove member from that studio.
- **UI rule**: also remove event access for events in that studio.

### Invitations

**POST `/team/invitations`**
- Create invitation.
- Request body: `{ email, firstName, lastName, role, accessLevel, allowedWorkspaceIds, allowedEventIds, org, accessScope, message? }`.

**POST `/team/invitations/{invitation_id}/resend`**
- Resend invitation.

**DELETE `/team/invitations/{invitation_id}`**
- Cancel invitation.

### Roles & Permissions

**GET `/roles`**
- List roles.

**POST `/roles`**
- Create role.
- **UI rules**: name must be unique; reserved names blocked (`owner`, `super admin`, `superadmin`, `administrator`, `root`).

**PUT `/roles/{role_id}`**
- Update role (name, description, level, permissions).
- **UI rule**: system roles cannot be edited.

**DELETE `/roles/{role_id}`**
- Delete role only if no members are assigned.

**GET `/permissions`**
- Return the permission catalog used by UI.

### Guest Registry (Optional, from Workspaces “Guest Data” tab)

**GET `/guest-registry`**
- Returns guest records across studios.
- Filter by workspace and search terms.

**GET `/guest-registry/export`**
- Export CSV (button in UI).

## 5. Business Rules & Constraints (From UI)

- Workspace name must be unique (create/edit).
- Owner roles cannot be removed from workspaces or deleted.
- Non-admin users only see workspaces in `allowed_workspace_ids`.
- “Studio Manager” can manage members in a studio.
- Roles:
  - System roles are protected from edit/delete.
  - Role deletion blocked if any user assigned.
- Invitation logic:
  - “All studios” maps to `Full Access` and all workspace IDs.
  - Selected studio IDs map to `Specific Event` access (UI labeling).
- Removing a member from a studio also removes their event access in that studio.

## 6. Validation Expectations

From UI behavior:
- Workspace name required and unique.
- Workspace URL slug is derived from name but editable.
- Invitation email must match `EMAIL_REGEX`.
- Invite form requires full name, email, role.

**Assumption**: Backend enforces these rules consistently.

## 7. Storage & Caching (Frontend Signals)

Frontend uses localStorage keys (to be replaced by backend persistence):
- `photmo_workspaces_v1` (workspaces)
- `active_workspace_id` (user preference)
- `photmo_team_members_v1` (global members)
- `photmo_pending_members_v1` (pending invitations)
- `photmo_roles_v1` (roles)

## 8. Redis Expectations (Assumed)

| Key Pattern | Type | Purpose | TTL |
| --- | --- | --- | --- |
| `invite:token:<token>` | hash | Invitation data for accept flow | Until accepted/expired |
| `invite:rate:<email>` | string | Resend cooldown | 60 seconds (assumed) |
| `workspace:active:<userId>` | string | Active workspace selection | Long-lived |

## 9. Error Handling & Status Codes

Expected errors:
- `400` validation errors (missing name, invalid email, duplicate role name).
- `403` insufficient permissions (non-admin attempting admin actions).
- `404` workspace/member/role not found.
- `409` duplicate workspace name or role name.

## 10. Security Considerations

- Enforce role-based access on all workspace/team endpoints.
- Prevent removal of owners and system roles.
- Invitation links should be tokenized (not raw query params).
- Audit actions (workspace delete, role changes, member removal).

## 11. Known Unknowns & Assumptions

### Unknowns
- Database schema and tenancy strategy.
- Whether roles are global or per-organization only.
- How events are persisted and linked to workspaces.

### Assumptions
- Backend will align permissions with UI catalog.
- Backend will compute workspace stats (events count, storage, members) server-side.
- Backend will provide guest registry endpoints if Guest Data is retained.
