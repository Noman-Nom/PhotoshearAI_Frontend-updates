# Authentication and Access (Backend-Oriented, FastAPI)

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
- Token strategy (JWT, session cookies, refresh tokens).
- Email delivery provider and templates.
- Whether OTP verification is email-scoped or session-scoped.

### Assumptions
- Backend will implement OTP expiry and resend cooldown aligned with frontend UX.
- Backend will expose invitation endpoints to replace query param approach.
- Backend will enforce password rules consistent with frontend validation.
