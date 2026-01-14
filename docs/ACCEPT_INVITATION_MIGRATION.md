# Accept Invitation Page - API Migration

## Overview
The accept-invitation page has been migrated from query parameter-based local simulation to token-based API integration.

## Changes Made

### 1. URL Parameter Change
**Before:**
```
/accept-invitation?recipient=user@example.com&accessLevel=Full%20Access&org=MyOrg
```

**After:**
```
/accept-invitation?token=FZtXXH4A5jN3mThgq99w0dQtMef2TjRxSf_rViB8f3w
```

### 2. API Endpoints Used

#### Get Invitation Details (Public)
```typescript
GET /api/v1/invitations/{token}

Response:
{
  recipient: string;      // Email of invitee
  org: string;           // Organization name
  access_level: string;  // Access level (e.g., "Full Access")
  role: string | null;   // Role name if assigned
}
```

#### Accept Invitation (Public)
```typescript
POST /api/v1/invitations/accept
Body:
{
  token: string;
  password: string;
}

Response:
{
  status: string;
  user_id: string;
  email: string;
  token: string;  // Auth token for automatic login
}
```

### 3. Flow Changes

#### Old Flow
1. Parse email, org, accessLevel from URL query params
2. Show invitation details from query params
3. User sets password
4. Call AuthContext.register() to create account
5. Call TeamContext.acceptInvitation() to update local state
6. Redirect to dashboard (user must login manually)

#### New Flow
1. Parse token from URL query param
2. Fetch invitation details via `GET /api/v1/invitations/{token}`
3. Show invitation details from API
4. User sets password
5. Call `POST /api/v1/invitations/accept` with token and password
6. Receive auth token and store it automatically
7. Redirect to dashboard (user is already logged in)

### 4. New States Added

The page now includes:
- **LOADING**: Fetching invitation details from API
- **ERROR**: Token invalid, expired, or already used
- **INVITE**: Show invitation details (from API)
- **REGISTER**: Password setup form
- **SUCCESS**: Account created, redirecting

### 5. Code Changes

**Removed Dependencies:**
```typescript
// No longer needed
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
```

**Added Dependencies:**
```typescript
import { invitationsApi } from '../../services/invitationsApi';
import { setAuthToken } from '../../utils/api';
```

**State Changes:**
```typescript
// Old
const recipient = searchParams.get('recipient');
const accessLevelStr = searchParams.get('accessLevel');
const org = searchParams.get('org');

// New
const token = searchParams.get('token') || '';
const [invitationDetails, setInvitationDetails] = useState<{
  recipient: string;
  org: string;
  access_level: string;
  role: string | null;
} | null>(null);
```

## Benefits

1. **Security**: Token-based authentication instead of exposing details in URL
2. **Verification**: API validates token expiry and usage status
3. **Auto-Login**: User is automatically logged in after accepting
4. **Single Source of Truth**: Invitation details come from backend
5. **Error Handling**: Invalid/expired tokens are properly handled

## Testing Checklist

- [ ] Valid token shows invitation details correctly
- [ ] Expired token shows error message
- [ ] Already-used token shows error message
- [ ] Invalid token shows error message
- [ ] Password validation works (min 8 chars, match confirmation)
- [ ] Successful acceptance stores auth token
- [ ] User is redirected to dashboard after acceptance
- [ ] User can access dashboard without logging in again

## Error Messages

| Scenario | Error Message |
|----------|--------------|
| Missing token | "Invalid invitation link. Token is missing." |
| Invalid/expired token | "This invitation link is invalid or has expired." |
| API failure | Generic API error message |
| Password mismatch | "Passwords do not match" |
| Short password | "Password must be at least 8 characters" |

## Related Files

- `app/accept-invitation/page.tsx` - Main page component
- `services/invitationsApi.ts` - API client with getDetails() and accept()
- `utils/api.ts` - HTTP client with auth token management
