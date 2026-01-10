# Authentication and Access (Backend-Oriented, FastAPI)

## Global Conventions (Applies to All Features)

### Auth & Session
- Auth uses JWT (access token). Tokens are required on protected routes via `Authorization: Bearer <token>`.
- **Assumption**: Refresh token strategy is TBD (not in frontend).

### Workspace Access via Subdomain
- Public and client/guest URLs use `slug.fotoshareai.com` where `slug` maps to a workspace `url`/slug.
- Resolve `slug` to `workspace_id` early (middleware) and attach to request context.
- Reject unknown slugs with `404` and block inactive workspaces with `403`.
- Suggested header propagation for internal services: `X-Workspace-Id`, `X-Workspace-Slug`.

### Error Schema
All API errors should follow a shared envelope:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": { "field": "optional extra data" }
  }
}
```

### Pagination
List endpoints support pagination:
- Query: `page`, `page_size`, optional `sort`, `order`, and `q` for search.
- Response:
```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0
}
```

### Cache Strategy (Redis)
- Cache read-heavy responses with short TTLs; invalidate on writes.
- Suggested cache keys:
  - `dashboard:<workspace_id>`
  - `analytics:<workspace_id>:<range>`
  - `calendar:<workspace_id>:<month>`
  - `events:list:<workspace_id>:<filters_hash>`
  - `workspaces:list:<user_id>`
  - `roles:list`
  - `branding:list:<workspace_id>`
- TTL guidance:
  - Dashboard/Analytics: 5–15 min
  - Calendar: 10–30 min
  - Lists (events/workspaces/roles/branding): 5–10 min
- Invalidation triggers:
  - Event create/update/delete → invalidate `events:*`, `calendar:*`, `dashboard:*`, `analytics:*`
  - Workspace updates → invalidate `workspaces:*`, `calendar:*`, `dashboard:*`
  - Role/member updates → invalidate `roles:*`, `workspaces:*`
  - Branding changes → invalidate `branding:*`

### Audit Logging
Record mutations in an audit log:
- Track actor, action, resource type/id, timestamp, and diff.
- Examples: workspace delete, role change, member removal, billing changes.

### Media Pipeline (S3 + Queue)
- Upload media directly to S3-compatible storage (local or cloud).
- After upload, emit `{ upload_id, url, workspace_id, event_id, type }` to a message queue for AI processing.
- AI processing backend is separate and out of scope for this service.

### Permissions (RBAC)
- Enforce permission checks at the API layer using role permission IDs.
- Map endpoint → permission list; deny by default.

### Billing (Stripe)
- Use Stripe for subscriptions, payment methods, and invoices.
- Maintain local subscription state mirrored from Stripe webhooks.

### Guest/Client Access
- Guest/Client access is public-facing and gated by face scan verification.
- Face scan backend is separate and out of scope for this service.

> Scope: Backend design for login, registration, email OTP verification, password reset, and invitation acceptance.
> Source of truth: frontend usage in `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## Feature Sequence (from `app/` directory)
Order as present in `/app`:
1. accept-invitation
2. analytics
3. branding
4. calendar
5. client-access
6. client-gallery
7. create-event
8. dashboard
9. email-simulation
10. event-details
11. forgot-password
12. guest-access
13. guest-gallery
14. login
15. media-view
16. my-events
17. settings
18. share-event
19. signup
20. studio-calendar
21. team
22. verify-otp
23. workspaces

## 1. Backend Feature Overview

### Purpose
- Authenticate users and persist sessions.
- Register new users with email OTP verification.
- Allow users to reset passwords using email OTP.
- Accept workspace invitations and bootstrap invited accounts.

### Entry Points (frontend routes)
- `/login` → Login
- `/signup` → Registration
- `/verify-otp` → Registration verification
- `/forgot-password` → Password reset
- `/accept-invitation?recipient=...&accessLevel=...&org=...` → Invitation acceptance

### Preconditions / Assumptions
- Frontend currently stores auth state in localStorage and uses simulated emails.
- **Assumption**: Backend will replace localStorage simulation with real persistence and email delivery.
- **Unknown**: Token/session mechanism (JWT vs cookie sessions).

## 2. Backend Architecture (FastAPI)

### Suggested modules
- `auth/routers.py` (login, signup, verify, reset)
- `auth/schemas.py` (Pydantic models)
- `auth/services.py` (OTP, email, user creation)
- `auth/deps.py` (current user, session checks)
- `auth/models.py` (SQLAlchemy/ORM user models)
- `invitations/routers.py` (invitation lookup and acceptance)
- `invitations/schemas.py` (invitation models)

### Storage components
- Primary DB: Users, pending registrations, invitation records, password reset records.
- Redis: OTPs, resend cooldowns, pending session state.

## 3. User Flow & State Transitions (Backend Perspective)

### Login
- Input: email + password.
- If user exists and verified → success + session/token.
- If user exists but pending verification → return explicit error (`VERIFICATION_REQUIRED`).

### Signup
- Input: user profile + password.
- If email is new → create pending registration, generate OTP, send email.
- If email already registered or pending → error.

### Verify OTP (Signup)
- Input: OTP (and possibly email or pending token).
- On success → create user, mark verified, issue session/token.

### Forgot Password
1. **Request OTP**: email → generate OTP, send email.
2. **Verify OTP**: OTP (and email or reset token) → mark reset session valid.
3. **Reset Password**: new password → update user password.

### Accept Invitation
1. Invitation link contains query params `recipient`, `accessLevel`, `org`.
2. User sets a password (min length 6 in UI) and submits.
3. Frontend calls `register()` with `isInvitation: true` to skip OTP email.
4. Invitation record is moved from pending to active member.

**Assumption**: Backend will provide a secure invitation token in place of raw query params.

## 4. API Contracts (Inferred / Proposed)

> Frontend does not call HTTP endpoints. The following endpoints are **proposed** to support the UI behavior.

### 4.1 POST `/auth/login`
**Purpose**: Authenticate user.

**Request (JSON)**
```json
{
  "email": "user@example.com",
  "password": "Secret123"
}
```

**Success Response (200)**
```json
{
  "user": {
    "id": "u_123",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "companyName": "Acme Studio",
    "companyUrl": "acme"
  },
  "token": "<jwt-or-session-token>"
}
```

**Error Responses**
- `401` invalid credentials.
- `403` verification required.

### 4.2 POST `/auth/signup`
**Purpose**: Register a new user and send OTP.

**Request (JSON)**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "companyName": "Acme Studio",
  "url": "acme",
  "country": "US",
  "phone": "15550123",
  "email": "user@example.com",
  "password": "Secret123",
  "isInvitation": false
}
```

**Success Response (201)**
```json
{
  "status": "PENDING_VERIFICATION",
  "email": "user@example.com"
}
```

**Errors**
- `409` user already exists or pending.

### 4.3 POST `/auth/verify-otp`
**Purpose**: Verify registration OTP.

**Request (JSON)**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200)**
```json
{
  "user": { "id": "u_123", "email": "user@example.com", "firstName": "Jane", "lastName": "Doe" },
  "token": "<jwt-or-session-token>"
}
```

**Notes**
- Frontend currently sends only the OTP (email is stored in localStorage).
- **Assumption**: frontend will include `email` or backend tracks it via a pending session.

### 4.4 POST `/auth/resend-otp`
**Purpose**: Resend signup OTP.

**Request (JSON)**
```json
{ "email": "user@example.com" }
```

**Success Response (200)**
```json
{ "status": "OTP_RESENT" }
```

### 4.5 POST `/auth/forgot-password`
**Purpose**: Send password reset OTP.

**Request (JSON)**
```json
{ "email": "user@example.com" }
```

**Response (200)**
```json
{ "status": "RESET_OTP_SENT" }
```

### 4.6 POST `/auth/verify-reset-otp`
**Purpose**: Verify reset OTP.

**Request (JSON)**
```json
{ "email": "user@example.com", "otp": "654321" }
```

**Response (200)**
```json
{ "status": "RESET_VERIFIED" }
```

### 4.7 POST `/auth/reset-password`
**Purpose**: Update password.

**Request (JSON)**
```json
{ "email": "user@example.com", "newPassword": "NewSecret123" }
```

**Response (200)**
```json
{ "status": "PASSWORD_UPDATED" }
```

### 4.8 GET `/invitations/{token}`
**Purpose**: Resolve invitation details for display.

**Response (200)**
```json
{
  "recipient": "invitee@example.com",
  "org": "Photmo Inc.",
  "accessLevel": "Full Access",
  "role": "Studio Member"
}
```

**Assumption**: Replace frontend query param approach with tokenized invitations.

### 4.9 POST `/invitations/accept`
**Purpose**: Accept invitation and create account.

**Request (JSON)**
```json
{
  "token": "inv_abc123",
  "password": "Secret123"
}
```

**Response (200)**
```json
{
  "status": "INVITATION_ACCEPTED",
  "user": { "id": "u_123", "email": "invitee@example.com" },
  "token": "<jwt-or-session-token>"
}
```

## 5. Data Models (Backend-Oriented)

### User (Pydantic)
```py
class User(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    company_name: str | None = None
    company_url: str | None = None
    phone: str | None = None
```

### PendingSignup (Assumption)
```py
class PendingSignup(BaseModel):
    email: EmailStr
    password_hash: str
    first_name: str
    last_name: str
    company_name: str
    company_url: str
    country: str
    phone: str
    otp: str
    expires_at: datetime
```

### PasswordReset (Assumption)
```py
class PasswordReset(BaseModel):
    email: EmailStr
    otp: str
    expires_at: datetime
```

### Invitation (Assumption)
Derived from frontend pending member shape.
```py
class Invitation(BaseModel):
    id: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    access_level: Literal["Specific Event", "Full Access"]
    allowed_event_ids: list[str] = []
    allowed_workspace_ids: list[str] = []
    org: str
```

## 6. Validation & Constraints

Derived from frontend validation:
- Email must match `EMAIL_REGEX`.
- Signup password: min 8 chars, 1 uppercase, 1 digit.
- Signup phone: digits only, 7–15 length.
- Signup company URL: lowercase letters, numbers, hyphens only.
- Invitation password: min 6 chars in UI (no uppercase/number rules).

**Assumption**: Backend will either align invitation password rules with signup or document the difference.

## 7. Storage & Caching

### Redis (Expected)
| Key Pattern | Type | Purpose | TTL |
| --- | --- | --- | --- |
| `auth:otp:signup:<email>` | string | Store signup OTP | 10 minutes (matches frontend text). |
| `auth:otp:reset:<email>` | string | Store reset OTP | 10 minutes (assumed). |
| `auth:pending:<email>` | hash | Store pending signup payload | 10 minutes or until verified. |
| `auth:rate:otp:<email>` | string | Resend cooldown | 60 seconds (matches frontend cooldown). |
| `invite:token:<token>` | hash | Invitation data | Until accepted or expired. |

### Database
- `users` table for registered users.
- `pending_signups` table (optional; Redis-only is also viable).
- `password_resets` table (optional; Redis-only is also viable).
- `invitations` table for pending team invites.

## 8. Error Handling

Expected error cases from frontend:
- Invalid credentials.
- User already exists or pending.
- Invalid verification code.
- No pending registration.
- Reset session expired.
- User record missing (reset flow).
- Invitation expired or invalid token.

**Assumption**: backend uses structured error codes for UI mapping.

## 9. Security Considerations

- Store passwords as salted hashes (e.g., bcrypt/argon2).
- Do not return password or OTP values in responses.
- Rate-limit OTP requests and login attempts.
- Use tokenized invitation links instead of raw query params.

## 10. Known Unknowns & Assumptions

### Unknowns
- Email delivery provider and templates.
- Whether OTP verification is email-scoped or session-scoped.

### Assumptions
- Backend will implement OTP expiry and resend cooldown aligned with frontend UX.
- Backend will expose invitation endpoints to replace query param approach.
- Backend will enforce password rules consistent with frontend validation.
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

## 11. Known Unknowns & Assumptions

### Unknowns
- Database schema and tenancy strategy.
- Whether roles are global or per-organization only.
- How events are persisted and linked to workspaces.

### Assumptions
- Backend will align permissions with UI catalog.
- Backend will compute workspace stats (events count, storage, members) server-side.
- Backend will provide guest registry endpoints if Guest Data is retained.
# Settings (Backend-Oriented, FastAPI)

> Scope: Backend design for account settings, security, and billing management.\n> Source of truth: `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## 1. Feature Overview

### Purpose
- Update user profile (name, company, phone).
- Change email with OTP verification.
- Update password or reset via OTP inside settings.
- Toggle MFA on/off.
- Manage payment methods, subscription plans, and billing history.

### Entry Points (frontend routes)
- `/settings` (tabs: profile, security, payment, plans, billing)
- `/settings?origin=hub` (platform hub layout)

### Preconditions & Assumptions
- Payment/billing tabs are only shown for owners in the UI.
- **Assumption**: Backend replaces localStorage usage for payment methods and simulated OTP emails.

## 2. Core Data Models (Pydantic)

### UserProfile
```py
class UserProfile(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    company_name: str | None = None
    phone: str | None = None
    mfa_enabled: bool | None = None
    mfa_method: Literal["Email", "Authenticator", "SMS"] | None = None
```

### PaymentMethod
```py
class BillingAddress(BaseModel):
    street: str
    city: str
    zip: str
    country: str

class PaymentMethod(BaseModel):
    id: str
    brand: Literal["Visa", "Mastercard", "Amex", "Discover", "Generic"]
    last4: str
    expiry_date: str
    cardholder_name: str
    is_default: bool | None = None
    billing_address: BillingAddress
```

### SubscriptionPlan
```py
class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: str
    interval: Literal["monthly", "yearly"]
    features: list[str]
    is_current: bool | None = None
    is_popular: bool | None = None
```

### BillingHistoryItem
```py
class BillingHistoryItem(BaseModel):
    id: str
    date: str
    amount: str
    currency: str
    method: str
    status: Literal["Paid", "Failed", "Refunded"]
```

## 3. Backend Endpoints (Proposed)

### Profile
**GET `/users/me`**\n- Return current user profile.

**PUT `/users/me`**\n- Update profile fields (first name, last name, company, phone).

**POST `/users/me/email-change`**\n- Request email change, send OTP to new email.

**POST `/users/me/email-verify`**\n- Verify email change OTP and update email.

### Password & Security
**POST `/users/me/password`**\n- Update password (requires current password).

**POST `/users/me/password/otp`**\n- Send OTP for password reset from settings.

**POST `/users/me/password/verify-otp`**\n- Verify OTP and allow reset.

**POST `/users/me/password/reset`**\n- Set new password after OTP verification.

**POST `/users/me/mfa`**\n- Enable or disable MFA.
\n### Billing & Plans
**GET `/billing/payment-methods`**\n- List payment methods.

**POST `/billing/payment-methods`**\n- Add a payment method.

**DELETE `/billing/payment-methods/{payment_id}`**\n- Remove a payment method.

**GET `/billing/plans`**\n- List available plans.

**GET `/billing/history`**\n- List billing history.

## 4. Business Rules & Constraints (From UI)

- Email change requires OTP verification (6 digits; UI accepts `000000` bypass).
- Password update requires current password and matching confirmation.
- MFA toggle triggers a confirmation step (UI modal).
- Payment methods require cardholder name, number, expiry, CVV, address (basic validation in UI).
- Owners only see payment/plans/billing tabs.

## 5. Validation & Constraints

- Email format must match `EMAIL_REGEX`.
- Card number: min length 13, CVV min length 3, expiry `MM/YY`.
- Password change: new and confirm must match.

## 6. Storage & Caching (Frontend Signals)

- Payment methods are stored in localStorage key `photmo_payment_methods_v1` in UI.
- Backend should persist payment methods and billing history in DB.

## 7. Redis Expectations (Assumed)

- OTP keys for email change and password reset:\n  - `settings:otp:email:<userId>`\n  - `settings:otp:password:<userId>`\n- TTL: 5–10 minutes.

## 8. Error Handling

- `400` invalid input (email format, card fields, password mismatch).
- `401` invalid OTP or current password.
- `403` billing routes restricted to owners.

## 9. Security Considerations

- Never store full card numbers; tokenize via payment provider.
- Rate-limit OTP requests.
- Require re-auth or MFA before sensitive changes (email/password).

## 10. Known Unknowns & Assumptions

### Unknowns
- Payment provider integration and tokenization flow.
- Whether MFA supports authenticator or SMS beyond email.

### Assumptions
- Backend will send OTP via email provider for email/password changes.
- Billing history is sourced from payment provider webhooks.
# Events & Galleries (Backend-Oriented, FastAPI)

> Scope: Backend design for event creation, event management, media collections, share links, and client/guest galleries.
> Source of truth: frontend usage in `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## 1. Feature Overview

### Purpose
- Create and manage events within a workspace.
- Organize media into collections and render gallery views.
- Share events with guests/clients using PIN + OTP flows.
- Enable media downloads with optional branding/watermarking.

### Entry Points (frontend routes)
- `/create-event` (create/edit event)
- `/my-events` (event list for active workspace)
- `/events/:slug` and `/events/:slug/:collectionSlug` (event detail/collection)
- `/events/:slug/:collectionSlug/view/:mediaId` (media viewer)
- `/share-event/:eventId` (share links + QR + resend email)
- `/client-access/:eventId?mode=selection|full` (client PIN + OTP)
- `/client-gallery/:eventId?mode=selection|full` (client gallery)
- `/client-gallery/:eventId/view/:mediaId` (client media view)
- `/guest-access/:eventId` and `/guest-gallery/:eventId` are used in UI but **previously removed by request**; include only if you want guest access enabled.

### Preconditions & Assumptions
- Event is scoped to `workspaceId` and should be filtered by active workspace.
- Published events are viewable by guests/clients; Draft events are blocked.
- **Assumption**: Backend replaces localStorage-based `SHARED_EVENTS` and media operations.

## 2. Core Data Models (Pydantic)

### SharedEvent
Derived from `/constants.ts`.
```py
class SharedEvent(BaseModel):
    id: str
    workspace_id: str
    title: str
    date: date
    status: Literal["Published", "Draft"]
    cover_url: str
    total_photos: int
    total_videos: int
    total_size_bytes: int
    collections: list["SharedCollection"]
    collaborators: list[str]
    description: str | None = None
    type: str | None = None
    branding: bool | None = None
    branding_id: str | None = None
    customer_name: str | None = None
    customer_email: EmailStr | None = None
```

### SharedCollection
```py
class SharedCollection(BaseModel):
    id: str
    title: str
    photo_count: int
    video_count: int
    thumbnail_url: str | None = None
    is_default: bool | None = None
    items: list["SharedMediaItem"]
```

### SharedMediaItem
```py
class SharedMediaItem(BaseModel):
    id: str
    type: Literal["photo", "video"]
    url: HttpUrl
    name: str
    size_bytes: int
    date_added: datetime | None = None
```

### MediaComment (from `media-view`)
```py
class MediaAttachment(BaseModel):
    name: str
    url: HttpUrl
    type: str
    size: int

class MediaComment(BaseModel):
    id: str
    author: str
    initials: str
    text: str
    time: str
    timestamp: int
    status: Literal["resolved", "unresolved"]
    attachments: list[MediaAttachment] = []
    replies: list["MediaComment"] = []
    reply_to: dict | None = None
```

## 3. Business Rules & Constraints (From UI)

- Event list is filtered by active workspace.
- Event status:
  - `Published` → visible in client/guest galleries.
  - `Draft` → access blocked.
- Customer email is used to validate client access (PIN step).
- PIN is hardcoded to `9522` in UI simulation.
- OTP is 6 digits; UI accepts `000000` as dev bypass.
- Collections are used for grouping and navigation; default collection redirects when slug missing.
- Collaborators are stored as avatar URLs in frontend.

## 4. Backend Endpoints (Proposed)

> Frontend currently uses localStorage. The endpoints below are **proposed** to back the UI.

### Events

**GET `/workspaces/{workspace_id}/events`**
- List events for workspace.

**POST `/workspaces/{workspace_id}/events`**
- Create event.

**GET `/events/{event_id}`**
- Event detail.

**PUT `/events/{event_id}`**
- Update event fields (title, date, description, customer email/name, branding settings).

**DELETE `/events/{event_id}`**
- Delete event.

**POST `/events/{event_id}/publish`**
- Set status to `Published`.

**POST `/events/{event_id}/unpublish`**
- Set status to `Draft`.

### Collections

**POST `/events/{event_id}/collections`**
- Create collection (title).

**PUT `/events/{event_id}/collections/{collection_id}`**
- Rename collection.

**DELETE `/events/{event_id}/collections/{collection_id}`**
- Delete collection.

**POST `/events/{event_id}/collections/{collection_id}/move`**
- Move media items between collections.

### Media

**POST `/events/{event_id}/media`**
- Upload media items to a collection.
- **Assumption**: multipart upload with metadata: `collection_id`, `type`.

**DELETE `/events/{event_id}/media/{media_id}`**
- Delete media item.

**POST `/events/{event_id}/media/bulk-delete`**
- Bulk delete by `mediaIds`.

**GET `/media/{media_id}`**
- Download media file (raw or watermarked).

### Collaborators

**POST `/events/{event_id}/collaborators`**
- Add collaborator (TeamMember -> event access).

**DELETE `/events/{event_id}/collaborators/{member_id}`**
- Remove collaborator and revoke `allowedEventIds`.

### Share & Access

**GET `/events/{event_id}/share`**
- Return share settings (guest/full/selection URLs, PIN required flags).

**PUT `/events/{event_id}/share`**
- Update share settings (PIN required toggles).

**POST `/events/{event_id}/share/resend`**
- Resend customer email with guest link.

**POST `/client/access`**
- Validate client email + PIN, send OTP.

**POST `/client/verify-otp`**
- Verify OTP and issue client session token.

**GET `/client/events/{event_id}/media`**
- Client gallery media list (full or selection).

> Guest access endpoints are intentionally omitted unless you want them reintroduced.

### Media Comments

**GET `/media/{media_id}/comments`**
- List comments.

**POST `/media/{media_id}/comments`**
- Add comment with optional attachments.

**PUT `/media/{media_id}/comments/{comment_id}`**
- Edit comment.

**DELETE `/media/{media_id}/comments/{comment_id}`**
- Remove comment.

## 4.1 Face Search (Vector DB Integration)

> This section reflects your requirement to use a vector database for face embeddings scoped to an event.

### Data Model (Vector DB)
- Embedding record fields:
  - `event_id` (string) — scope boundary for search
  - `person_id` (string) — cluster/group identifier
  - `photo_id` (string) — media item identifier
  - `embedding` (vector<float>)
  - `created_at` (timestamp)

### Core Flows
1. **Ingest media**: when a photo is uploaded, a face detection pipeline (separate from this backend) extracts face embeddings and writes to the vector DB with `event_id` and `photo_id`.
2. **Face scan search**: user uploads a face image from the frontend; backend generates embedding and queries the vector DB **within the event scope**; returns all matched `photo_id`s for that event.
3. **Filter by person**: frontend can request all photos for a specific event, grouped by `person_id`, or request a single `person_id` to return that person’s photos within the event.

### Proposed Endpoints

**POST `/events/{event_id}/faces/search`**  
Purpose: find matching images within a single event using an uploaded face scan.

Request (multipart/form-data):
- `file`: image
- optional `threshold`: float
- optional `limit`: int

Response (200):
```json
{
  "event_id": "evt_123",
  "matches": [
    { "photo_id": "m_1", "score": 0.92 },
    { "photo_id": "m_9", "score": 0.88 }
  ]
}
```

**GET `/events/{event_id}/faces/{person_id}/media`**  
Purpose: return all photos for a detected person cluster within the event.

Response (200):
```json
{
  "event_id": "evt_123",
  "person_id": "p_456",
  "photo_ids": ["m_1", "m_9", "m_12"]
}
```

**POST `/events/{event_id}/faces/assign`**  
Purpose: manually assign a photo to a person cluster (optional admin tool).

Request:
```json
{
  "photo_id": "m_12",
  "person_id": "p_456"
}
```

Response (200):
```json
{ "status": "ASSIGNED" }
```

### Assumptions / Notes
- Embedding generation and face detection are handled by a separate service; this backend only stores/query embeddings in the vector DB.
- All face search queries must be **filtered by `event_id`** to avoid cross-event leakage.
- The vector DB is not part of transactional DB; treat matches as eventually consistent.

## 5. Request/Response Examples

### Create Event
```json
POST /workspaces/ws_123/events
{
  "title": "Summer Wedding",
  "date": "2025-06-12",
  "type": "conference",
  "description": "Outdoor ceremony",
  "customerName": "Alex Smith",
  "customerEmail": "alex@example.com",
  "branding": true,
  "brandingId": "brand_1"
}
```

### Client Access (PIN + OTP)
```json
POST /client/access
{
  "eventId": "evt_456",
  "email": "alex@example.com",
  "pin": "9522"
}
```

```json
POST /client/verify-otp
{
  "eventId": "evt_456",
  "email": "alex@example.com",
  "otp": "123456"
}
```

## 6. Validation Expectations

From UI:
- Event title required.
- Customer email must match `EMAIL_REGEX` for client access.
- PIN is 4 digits; OTP is 6 digits.
- Event name slugs derived from title for routing.

**Assumption**: Backend enforces email and PIN/OTP rules; slug handling can be backend-generated.

## 7. Storage & Caching (Frontend Signals)

Frontend uses `shared_events_v2` in localStorage. Backend should persist:
- Events
- Collections
- Media items
- Collaborators
- Share settings (PIN required toggles)

## 8. Redis Expectations (Assumed)

| Key Pattern | Type | Purpose | TTL |
| --- | --- | --- | --- |
| `event:otp:client:<eventId>:<email>` | string | Client OTP | 5–10 minutes |
| `event:session:client:<token>` | hash | Client session state | 1–24 hours |
| `event:share:<eventId>` | hash | PIN required flags | Persistent |

## 9. Error Handling

- `400` invalid input (missing title, invalid email, bad PIN/OTP format).
- `401` invalid PIN/OTP.
- `403` access blocked (draft events).
- `404` event/media not found.

## 10. Security Considerations

- Use signed URLs or tokenized downloads for media.
- Gate client/guest gallery access by session tokens.
- Avoid exposing raw media URLs without authorization.

## 11. Known Unknowns & Assumptions

### Unknowns
- Media storage provider and upload strategy.
- Whether selection mode has dedicated backend state or is client-only.
- How collaborator avatars should be stored (frontend uses avatar URLs).

### Assumptions
- Backend will compute `totalPhotos`, `totalVideos`, `totalSizeBytes`.
- Backend will replace slug generation with canonical IDs or stored slugs.
- Backend will implement comment storage for media-view.
# Calendars (Backend-Oriented, FastAPI)

> Scope: Backend design for global and studio calendars based on frontend usage.
> Source of truth: `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## 1. Feature Overview

### Purpose
- Provide calendar views for events across all studios (global calendar).
- Provide calendar view scoped to the active studio (studio calendar).
- Support date selection and navigation, and event detail navigation.

### Entry Points (frontend routes)
- `/calendar` → Global calendar (all workspaces)
- `/studio-calendar` → Studio calendar (active workspace only)

### Preconditions & Assumptions
- Global calendar is accessible to admin roles in the UI (navigation entry is in the workspace hub tabs).
- Studio calendar uses the active workspace selection.

## 2. Core Data Models (Pydantic)

### CalendarEvent (Derived from SharedEvent)
```py
class CalendarEvent(BaseModel):
    id: str
    workspace_id: str
    title: str
    date: date
    status: Literal["Published", "Draft"]
    type: str | None = None
    collaborators: list[str] = []
```

### Workspace (Reference)
```py
class Workspace(BaseModel):
    id: str
    name: str
    color_theme: str | None = None
```

## 3. Backend Endpoints (Proposed)

### Global Calendar

**GET `/calendar/events`**
- Returns all events accessible to the user across workspaces.
- Supports optional workspace filter:
  - Query param: `workspace_id=...` or `workspace_id=all`.

**Response (200)**
```json
{
  "events": [
    {
      "id": "evt_123",
      "workspace_id": "ws_1",
      "title": "Summer Wedding",
      "date": "2025-06-12",
      "status": "Published",
      "type": "wedding",
      "collaborators": []
    }
  ]
}
```

### Studio Calendar

**GET `/workspaces/{workspace_id}/calendar/events`**
- Returns events for the workspace.

**Response (200)**
```json
{
  "events": [
    {
      "id": "evt_123",
      "workspace_id": "ws_1",
      "title": "Summer Wedding",
      "date": "2025-06-12",
      "status": "Published"
    }
  ]
}
```

## 4. Behavior Rules (From UI)

- Global calendar supports a studio filter dropdown.
- Calendar view derives per-day event lists by matching event date.
- Clicking an event navigates to `/events/{slug}`.
- Calendar detail panel shows events for the selected date.
- “Create Event” button routes to `/create-event`.

**Assumption**: Backend can supply `color_theme` for workspace to drive UI color coding.

## 5. Validation & Constraints

- No explicit calendar-specific validation in UI.
- Event date is required for calendar placement.

## 6. Storage & Caching (Frontend Signals)

- Calendar uses `SHARED_EVENTS` in localStorage.
- Backend should persist events and expose read-only calendar feeds.

## 7. Redis Expectations (Assumed)

- None required by UI. Calendar is read-only.
- **Assumption**: Redis may be used for caching monthly event results.

## 8. Error Handling

- `404` if workspace not found.
- `403` if user lacks access to requested workspace.
- `200` with empty list if no events scheduled.

## 9. Security Considerations

- Enforce workspace membership for studio calendar.
- Enforce organization-wide access for global calendar.

## 10. Known Unknowns & Assumptions

### Unknowns
- Whether calendar should include draft events for all roles.
- Whether event time and timezone should be modeled (UI only uses date).

### Assumptions
- Backend will include workspace color theme for calendar styling (optional).
# Branding (Backend-Oriented, FastAPI)

> Scope: Backend design for branding presets used across events and downloads.
> Source of truth: `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## 1. Feature Overview

### Purpose
- Create and manage branding presets (logos, social links, watermark settings).
- Apply branding to event downloads and gallery overlays.
- Store branding metadata for reuse across events.

### Entry Points (frontend routes)
- `/branding` (branding list + edit modal)
- `/branding/add` (standalone add page)

### Preconditions & Assumptions
- Branding presets are shared at the workspace or organization level.
- **Assumption**: Backend will replace localStorage storage `photmo_branding_items_v1`.

## 2. Core Data Models (Pydantic)

### BrandingItem
Derived from `/app/branding/page.tsx` and `/app/branding/add/page.tsx`.
```py
class BrandingItem(BaseModel):
    id: str
    name: str
    website: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    youtube: str | None = None
    email: str | None = None
    contact_number: str | None = None
    about_us: str | None = None
    domain: str | None = None
    status: Literal["Active", "Draft"]
    last_updated: date
    icon_type: Literal["main", "summer", "dark", "holiday"]
    logo: str | None = None
    watermark_position: str | None = None
    details_position: str | None = None
    logo_opacity: int | None = None
    logo_size: int | None = None
    brand_opacity: int | None = None
    brand_size: int | None = None
```

### BrandingConfig (Applied to Downloads)
Derived from `/utils/imageProcessor.ts`.
```py
class BrandingConfig(BaseModel):
    name: str | None = None
    website: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    youtube: str | None = None
    logo: str | None = None
    watermark_position: str | None = None
    details_position: str | None = None
    logo_opacity: int | None = None
    logo_size: int | None = None
    brand_opacity: int | None = None
    brand_size: int | None = None
```

## 3. Backend Endpoints (Proposed)

### Branding CRUD

**GET `/branding`**
- List branding presets.
- Optional query: `status=Active|Draft`.

**POST `/branding`**
- Create branding preset.
- Accepts logo upload or base64 logo string.

**GET `/branding/{branding_id}`**
- Retrieve branding preset.

**PUT `/branding/{branding_id}`**
- Update branding preset (name, links, positions, sizing, status).

**DELETE `/branding/{branding_id}`**
- Delete branding preset.

### Branding Assets

**POST `/branding/{branding_id}/logo`**
- Upload or replace logo asset.
- **Assumption**: multipart upload returning CDN URL.

### Event Branding Link

**PUT `/events/{event_id}`**
- Update event with `branding = true` and `branding_id`.

## 4. Request/Response Examples

### Create Branding
```json
POST /branding
{
  "name": "Photmo Studio",
  "website": "photmo.com",
  "instagram": "@photmo",
  "status": "Active",
  "logo": "data:image/png;base64,...",
  "watermark_position": "top-right",
  "details_position": "bottom-left",
  "logo_opacity": 90,
  "logo_size": 15,
  "brand_opacity": 100,
  "brand_size": 100
}
```

### Update Branding
```json
PUT /branding/brand_123
{
  "status": "Draft",
  "logo_opacity": 80,
  "brand_size": 120
}
```

## 5. Business Rules & Constraints (From UI)

- Brand name required (save blocked without it).
- Website defaults to `N/A` when empty in UI.
- Status values: `Active` or `Draft`.
- Logo is optional; when present, used for watermark overlays.
- Watermark and details positions are set on a 3x3 grid.
- Opacity fields are percentages.

## 6. Validation & Constraints

- `logo_opacity`, `brand_opacity`: 0–100.
- `logo_size`, `brand_size`: positive percentages.
- `watermark_position`, `details_position`: one of 9 grid positions.

**Assumption**: Backend validates and normalizes these fields.

## 7. Storage & Caching (Frontend Signals)

Frontend stores branding presets in localStorage under:
- `photmo_branding_items_v1`

Backend should persist branding in DB and return URLs for logos if stored externally.

## 8. Redis Expectations (Assumed)

- None required by UI.
- **Assumption**: cache branding presets for quick lookup on downloads.

## 9. Error Handling

- `400` invalid input (missing name, invalid positions or opacity).
- `404` branding item not found.
- `409` duplicate branding name (if enforced).

## 10. Security Considerations

- Validate logo uploads (size/type).
- Sanitize URLs for social links to avoid injection.

## 11. Known Unknowns & Assumptions

### Unknowns
- Whether branding is scoped to workspace or global org.
- File storage provider for logos.
- Whether `domain`, `about_us`, and `contact_number` are used in UI after creation.

### Assumptions
- Branding presets are reusable across events.
- Backend will provide a stable `branding_id` for event linkage.
# Analytics (Backend-Oriented, FastAPI)

> Scope: Backend design for studio analytics and KPI reporting.
> Source of truth: `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## 1. Feature Overview

### Purpose
- Provide analytics for the active workspace (studio).
- Display KPIs (media counts, storage usage, traffic, events).
- Display growth metrics (views, downloads) and category distributions.
- List top performing events for the studio.

### Entry Points (frontend routes)
- `/analytics`

### Preconditions & Assumptions
- Active workspace is selected.
- **Assumption**: Backend will replace localStorage-driven data used in the UI.

## 2. Data Models (Pydantic)

### StudioAnalyticsSummary
```py
class StudioAnalyticsSummary(BaseModel):
    workspace_id: str
    total_photos: int
    total_videos: int
    total_size_bytes: int
    event_count: int
```

### GrowthPoint
```py
class GrowthPoint(BaseModel):
    day: str  # e.g. Mon, Tue
    views: int
    downloads: int
```

### CategoryDistribution
```py
class CategoryDistribution(BaseModel):
    category: str
    percentage: int
```

### TopEventMetric
```py
class TopEventMetric(BaseModel):
    event_id: str
    title: str
    date: str
    status: Literal["Published", "Draft"]
    total_photos: int
    total_videos: int
    engagement_score: int
```

### AnalyticsResponse
```py
class AnalyticsResponse(BaseModel):
    summary: StudioAnalyticsSummary
    growth: list[GrowthPoint]
    categories: list[CategoryDistribution]
    top_events: list[TopEventMetric]
```

## 3. Backend Endpoints (Proposed)

**GET `/workspaces/{workspace_id}/analytics`**
- Returns analytics payload for the studio.
- Optional query: `range=7d|30d|90d` (UI uses “Last 7 Days” and “Monthly”).

**Response (200)**
```json
{
  "summary": {
    "workspace_id": "ws_123",
    "total_photos": 1200,
    "total_videos": 120,
    "total_size_bytes": 987654321,
    "event_count": 8
  },
  "growth": [
    { "day": "Mon", "views": 120, "downloads": 45 },
    { "day": "Tue", "views": 250, "downloads": 88 }
  ],
  "categories": [
    { "category": "Wedding", "percentage": 65 },
    { "category": "Commercial", "percentage": 20 }
  ],
  "top_events": [
    {
      "event_id": "evt_1",
      "title": "Summer Wedding",
      "date": "2025-06-12",
      "status": "Published",
      "total_photos": 430,
      "total_videos": 32,
      "engagement_score": 80
    }
  ]
}
```

## 4. Business Rules & Constraints (From UI)

- Analytics is scoped to the active workspace.
- KPIs are derived from events in the workspace:
  - `total_photos`, `total_videos`, `total_size_bytes` are aggregates of event totals.
  - `event_count` counts workspace events.
- Growth data is displayed for the last 7 days (UI uses mocked data).
- Category distribution is static in UI but implies event type breakdown.
- “Top Performing Nodes” table is derived from events.

## 5. Validation & Constraints

- `workspace_id` must be valid and accessible to the user.
- Range parameters should be validated (`7d`, `30d`, `90d` only).

## 6. Storage & Caching

- Frontend uses `SHARED_EVENTS` as data source.
- Backend should compute analytics from events and usage logs.

## 7. Redis Expectations (Assumed)

- Cache analytics responses per workspace and range:
  - Key: `analytics:<workspace_id>:<range>`
  - TTL: 5–15 minutes (assumed)

## 8. Error Handling

- `403` if user lacks access to workspace.
- `404` if workspace not found.
- `200` with empty aggregates if no events.

## 9. Security Considerations

- Avoid leaking guest/customer data unless explicitly required.

## 10. Known Unknowns & Assumptions

### Unknowns
- Source of views/downloads metrics (frontend uses simulated data).
- Whether “engagement score” has a defined formula.
- Whether analytics should include guest registry data.

### Assumptions
- Backend will track views and downloads and aggregate by event/date.
- Backend will expose breakdown by event `type` for category distribution.
# Dashboard (Backend-Oriented, FastAPI)

> Scope: Backend design for the dashboard overview, metrics, support tickets, and feature requests.
> Source of truth: `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## 1. Feature Overview

### Purpose
- Provide an overview of active workspace stats (events, storage, team members).
- Offer quick actions (create event, open email simulation).
- Provide a support ticket system (create ticket, view ticket, comment thread).
- Collect feature requests.

### Entry Points (frontend routes)
- `/dashboard`

### Preconditions & Assumptions
- Active workspace is selected.
- **Assumption**: Backend replaces localStorage-derived metrics and simulated ticket data.

## 2. Data Models (Pydantic)

### DashboardSummary
```py
class DashboardSummary(BaseModel):
    workspace_id: str
    active_events_count: int
    team_member_count: int
    storage_used_bytes: int
    storage_limit_bytes: int
```

### SupportTicket
```py
class SupportTicket(BaseModel):
    id: str
    subject: str
    category: str
    priority: Literal["Low", "Medium", "High"]
    status: Literal["Open", "In Progress", "Resolved"]
    date: str
    description: str | None = None
    steps_to_reproduce: str | None = None
    media_name: str | None = None
```

### TicketComment
```py
class TicketComment(BaseModel):
    id: str
    ticket_id: str
    author: str
    text: str
    date: str
    is_support: bool | None = None
```

### FeatureRequest
```py
class FeatureRequest(BaseModel):
    id: str
    title: str
    category: str
    priority: str
    email: EmailStr
    description: str
    use_case: str | None = None
```

## 3. Backend Endpoints (Proposed)

### Dashboard Summary

**GET `/workspaces/{workspace_id}/dashboard`**
- Returns dashboard metrics for the workspace.

**Response (200)**
```json
{
  "workspace_id": "ws_123",
  "active_events_count": 5,
  "team_member_count": 12,
  "storage_used_bytes": 456789012,
  "storage_limit_bytes": 1073741824
}
```

### Support Tickets

**GET `/support/tickets`**
- List tickets for the current user.

**POST `/support/tickets`**
- Create a new ticket.
- Accepts optional media attachment.

**GET `/support/tickets/{ticket_id}`**
- View ticket details + comments.

**POST `/support/tickets/{ticket_id}/comments`**
- Add a comment to a ticket.

### Feature Requests

**POST `/feature-requests`**
- Submit a feature request.

## 4. Business Rules & Constraints (From UI)

- Storage usage is computed from events in the active workspace.
- Storage limit is fixed at 1 GB in UI.
- Support ticket requires subject, category, priority.
- File attachments accept image/video and display file name + size.
- Comment thread supports user and support agent messages.
- Feature requests require title, description, email.

## 5. Validation & Constraints

- Ticket subject required.
- Feature request title + description required.
- Attachment file size: UI suggests up to 10MB.

## 6. Storage & Caching

- Dashboard stats derived from workspace events and team membership.
- Tickets and feature requests should be stored in DB.

## 7. Redis Expectations (Assumed)

- Optional caching of dashboard summary:
  - Key: `dashboard:<workspace_id>`
  - TTL: 1–5 minutes

## 8. Error Handling

- `403` if user lacks access to workspace.
- `404` if ticket not found.
- `400` for invalid ticket or feature request payloads.

## 9. Security Considerations

- Ensure users only access their own tickets and comments.
- Validate file attachments for content type and size.
- Prevent exposing support agent information in public payloads.

## 10. Known Unknowns & Assumptions

### Unknowns
- Whether tickets are per-user or per-organization.
- Support agent workflow and SLAs.
- Whether dashboard should include real-time notifications.

### Assumptions
- Backend will compute storage usage and event counts per workspace.
- Backend will support ticket comment threads.
