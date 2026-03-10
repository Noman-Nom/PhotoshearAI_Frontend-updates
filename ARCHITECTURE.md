# FotoShareAI Frontend – Architecture Documentation

A deep-dive into how the application is structured, how data flows between layers, and the design decisions behind each major module.

---

## Table of Contents

1. [Application Entry Point](#1-application-entry-point)
2. [Routing Strategy](#2-routing-strategy)
3. [State Management](#3-state-management)
4. [API Layer](#4-api-layer)
5. [Authentication & Session Handling](#5-authentication--session-handling)
6. [Multi-Tenant Subdomain Architecture](#6-multi-tenant-subdomain-architecture)
7. [Component Design System](#7-component-design-system)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Image Processing Pipeline](#9-image-processing-pipeline)
10. [File Upload Flow](#10-file-upload-flow)
11. [Form Handling & Validation](#11-form-handling--validation)
12. [Permission & Role System](#12-permission--role-system)
13. [Data Mapping Layer](#13-data-mapping-layer)
14. [Build & Deployment Pipeline](#14-build--deployment-pipeline)
15. [Data Model Overview](#15-data-model-overview)

---

## 1. Application Entry Point

```
index.html
  └── loads index.tsx
        └── ReactDOM.createRoot('#root').render(<App />)
              └── App.tsx
                    ├── 9× Context Providers (global state)
                    └── HashRouter
                          └── AppRoutes
                                ├── PublicRoute (auth pages)
                                ├── Publicly accessible pages (guest/client galleries)
                                └── ProtectedRoute (authenticated app)
```

`index.html` includes:
- Google Fonts (Inter)
- TailwindCSS CDN (utility classes)
- The `<div id="root">` mount point

`index.tsx` uses React 19's `createRoot` API and wraps the app in `React.StrictMode`.

`App.tsx` is responsible for:
- Composing all context providers in the correct dependency order
- Defining the route tree via React Router
- Rendering the global `SessionExpiredModal`

---

## 2. Routing Strategy

### HashRouter

The application uses `HashRouter` from React Router DOM. This means all routes are prefixed with `#` in the URL (e.g. `http://app.fotoshareai.com/#/dashboard`). This approach:
- Requires no server-side route handling
- Works with any static file server (Nginx, S3, CDN)
- Simplifies multi-subdomain deployment

### Route Categories

| Category | Example Routes | Guard |
|----------|---------------|-------|
| **Public auth** | `/login`, `/signup`, `/verify-otp`, `/forgot-password` | `PublicRoute` – redirects authenticated users away |
| **Invitation** | `/accept-invitation` | None – accessible by everyone |
| **Guest access** | `/guest-access/:eventId`, `/guest-gallery/:eventId` | None – publicly accessible |
| **Client access** | `/client-access/:eventId`, `/client-gallery/:eventId` | None – pin-authenticated within page |
| **Protected app** | `/dashboard`, `/my-events`, `/team`, `/settings`, etc. | `ProtectedRoute` – requires authentication |

### Route Guards

**`PublicRoute`**
```tsx
const PublicRoute = () => {
  const { isAuthenticated, needsProfileCompletion } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={needsProfileCompletion ? "/complete-profile" : "/workspaces"} />;
  }
  return <Outlet />;
};
```

**`ProtectedRoute`**
```tsx
const ProtectedRoute = () => {
  const { isAuthenticated, needsProfileCompletion } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" />;
  }
  return <Outlet />;
};
```

---

## 3. State Management

All global state is managed through React Context. There is no Redux, Zustand, or other external state library. Each context follows the same pattern:

```
Context File
  ├── Interface definition (context shape)
  ├── createContext() with undefined default
  ├── Provider component (holds state, calls APIs)
  └── useXxx() hook (throws if used outside provider)
```

### Context Dependency Order

The providers are nested from outermost to innermost in `App.tsx`. Dependencies flow inward:

```
ToastProvider           ← no dependencies
  AuthProvider          ← uses ToastContext
    LanguageProvider    ← no dependencies
      TeamProvider      ← uses AuthContext
        PermissionsProvider  ← uses AuthContext + TeamContext
          WorkspaceProvider  ← uses AuthContext
            BillingProvider  ← uses AuthContext + WorkspaceContext
              BrandingProvider ← uses AuthContext + WorkspaceContext
                EventsProvider ← uses AuthContext + WorkspaceContext
```

### Context Responsibilities

| Context | State Held | Key Actions |
|---------|-----------|-------------|
| `AuthContext` | `user`, `isAuthenticated`, `isLoading`, `needsProfileCompletion` | `login()`, `logout()`, `updateUser()` |
| `WorkspaceContext` | `workspaces[]`, `activeWorkspace`, `isLoading` | `switchWorkspace()`, `refreshWorkspaces()` |
| `TeamContext` | `members[]`, `pendingMembers[]`, `roles[]` | `inviteMember()`, `removeMember()`, `refreshTeam()` |
| `EventsContext` | `events[]`, `isLoading` | `refreshEvents()`, `createEvent()` |
| `BrandingContext` | `presets[]`, `activeBranding` | `applyBranding()`, `refreshPresets()` |
| `BillingContext` | `plans[]`, `currentPlan`, `paymentMethods[]`, `invoices[]` | `upgradePlan()`, `refreshBilling()` |
| `PermissionsContext` | `permissions[]`, `userRole` | `hasPermission(action)` |
| `LanguageContext` | `language`, translations map | `t(key)`, `setLanguage()` |
| `ToastContext` | toast queue | `showToast(message, type)` |

---

## 4. API Layer

### Structure

```
services/xxxApi.ts
  └── calls api.get/post/put/delete from utils/api.ts
        └── Native fetch()
              ├── Adds Authorization: Bearer <token> header
              ├── Handles Content-Type: application/json
              └── Handles errors via handleResponse()
```

### `utils/api.ts` – Core HTTP Client

The `api` object exposes five methods:

| Method | HTTP Verb | Use case |
|--------|----------|---------|
| `api.get(path)` | GET | Fetch resources |
| `api.post(path, body)` | POST | Create / trigger actions |
| `api.put(path, body)` | PUT | Full update |
| `api.delete(path)` | DELETE | Remove resources |
| `api.postBlob(path, body)` | POST | Binary response (downloads) |

All methods:
- Accept an `includeAuth` boolean (default `true`)
- Pass `credentials: 'include'` for cookie-based CORS
- Return parsed JSON (or `null` for 204 No Content)
- Throw `ApiError` on non-2xx responses

### `ApiError` Class

```typescript
class ApiError extends Error {
  status: number;   // HTTP status code
  details: any;     // Parsed response body
}
```

### S3 Direct Upload Functions

Two higher-level functions handle the two-step upload flow (get presigned URL → upload to S3):

- **`uploadAsset(request, file)`** – For logos, banners, avatars, generic assets
- **`uploadEventMedia(eventId, collectionId, file)`** – For event photo/video uploads

Both functions:
1. Call the backend to get a presigned S3 upload URL
2. PUT the file directly to S3
3. Return the clean asset URL (without query parameters)

---

## 5. Authentication & Session Handling

### Token Storage

Auth tokens are stored in an HTTP cookie named `auth_token`:
- **Domain**: `.fotoshareai.com` in production → shared across all subdomains
- **Domain**: none in localhost → only accessible on current origin
- **Expiry**: 30 days (`max-age=2592000`)
- **Security**: `Secure` flag on HTTPS, `SameSite=Lax`

```typescript
// Reading
export const getAuthToken = (): string | null => { /* reads document.cookie */ }

// Writing / clearing
export const setAuthToken = (token: string | null) => { /* sets/clears document.cookie */ }
```

### Session Expiry

When any API call returns `401 Unauthorized`:
1. `setAuthToken(null)` clears the token cookie
2. `dispatchSessionExpired()` fires a custom DOM event `fotoshare:session_expired`
3. `SessionExpiredModal` (rendered at the App root) listens for this event and shows a modal
4. The user is prompted to log in again

Rate limiting prevents the event from firing more than once per 2 seconds to avoid toast spam.

### Auth Flow

```
User visits /login
  → submits credentials
  → authApi.login() → POST /api/v1/auth/login
  → receives { token, user, subdomain }
  → setAuthToken(token)
  → AuthContext.login(user, token, subdomain)
  → isAuthenticated = true
  → Navigate to /workspaces
```

### Google OAuth Flow

```
User clicks "Continue with Google"
  → Google Sign-In popup / redirect
  → receives id_token from Google
  → authApi.googleOAuth(id_token) → POST /api/v1/auth/google
  → receives { token, user, subdomain }
  → same as password login from here
```

---

## 6. Multi-Tenant Subdomain Architecture

Each workspace/studio can have its own subdomain (e.g. `mystudio.fotoshareai.com`). The `utils/subdomain.ts` utility:

1. Reads `window.location.hostname`
2. Extracts the subdomain (e.g. `mystudio`)
3. Builds the correct API base URL: `https://api.fotoshareai.com`

The auth cookie is shared across `*.fotoshareai.com` so users stay logged in when switching between their studio subdomains.

---

## 7. Component Design System

### Component Hierarchy

```
Page Component (app/xxx/page.tsx)
  ├── Layout wrapper (AuthLayout or inline)
  ├── Shared components (Sidebar, CalendarView, etc.)
  └── UI primitives (Button, Input, Modal, etc.)
```

### UI Primitives (`components/ui/`)

All primitives accept standard HTML props via TypeScript intersection types and forward them to the underlying element. They use Tailwind utility classes and `cn()` for conditional styling.

Example pattern:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
```

### `cn()` Utility

All components use the `cn()` helper from `utils/cn.ts` which combines `clsx` (conditional classes) and `tailwind-merge` (resolves conflicting Tailwind classes):

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

---

## 8. Internationalization (i18n)

### Architecture

Translations are stored in `utils/translations.ts` as a deeply nested object keyed by language code. The `LanguageContext` provides a `t(key)` function that performs dot-notation lookups with a fallback to English.

```typescript
// Usage in components
const { t } = useLanguage();
return <h1>{t('dashboard.title')}</h1>;
```

### Supported Languages

The translation file includes strings for multiple languages. The `LanguageSwitcher` component lets users change the active language at runtime, which is persisted in `localStorage`.

---

## 9. Image Processing Pipeline

`utils/imageProcessor.ts` provides client-side image manipulation using the HTML5 Canvas API:

1. **Resize** – Scale images down to a maximum dimension while preserving aspect ratio.
2. **Watermark application** – Draw a logo/text watermark at a calculated position on the canvas.
3. **Export** – Convert the canvas back to a `Blob` for download.

The `PositionSelector` component (`components/shared/PositionSelector.tsx`) renders a 3×3 grid UI that maps to CSS anchor positions calculated by `utils/positionHelpers.ts`.

---

## 10. File Upload Flow

### Two-Step Presigned URL Upload

```
1. Component calls uploadAsset() or uploadEventMedia()
       │
       ▼
2. POST /api/v1/assets/upload (or /events/:id/media/upload)
   Request: { filename, content_type, size_bytes, ... }
   Response: { upload_url, asset_id, asset_url }
       │
       ▼
3. PUT <upload_url>  (direct to AWS S3)
   Body: raw file bytes
   Headers: Content-Type: <mime_type>
       │
       ▼
4. Return { asset_id, asset_url } (URL without query params)
```

### `useFileUpload` Hook

The `hooks/useFileUpload.ts` hook wraps this flow with:
- File type validation
- File size validation
- Upload progress state (`progress: number`)
- Error state
- Abort capability

---

## 11. Form Handling & Validation

All forms use **React Hook Form** with **Zod** schema validation via `@hookform/resolvers/zod`:

```typescript
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

Reusable Zod schemas are defined in `utils/validators.ts` and imported by page components.

---

## 12. Permission & Role System

### Role Levels

Roles operate at two levels:
- **`organization`** – applies across all workspaces (owner, admin)
- **`studio`** – applies within a specific workspace

Each role has a `permissions: string[]` array containing permission keys (e.g. `'events.create'`, `'team.invite'`).

### `PermissionsContext`

```typescript
const { hasPermission } = usePermissions();

// In components:
if (hasPermission('branding.manage')) {
  // show branding settings
}
```

The context fetches the current user's effective permissions from the API and provides the `hasPermission(action)` helper.

---

## 13. Data Mapping Layer

Raw API responses use snake_case and backend-specific shapes. Mapper utilities transform these into camelCase frontend types:

```
API Response (snake_case)
  │
  ▼
Mapper function (utils/*Mappers.ts)
  │
  ▼
Frontend Type (types.ts)
```

| Mapper File | Input | Output Types |
|-------------|-------|-------------|
| `mappers.ts` | Generic API objects | Various |
| `teamMappers.ts` | Team API responses | `TeamMember`, `PendingMember` |
| `billingMappers.ts` | Billing API responses | `SubscriptionPlan`, `BillingHistoryItem`, `PaymentMethod` |
| `workspaceMappers.ts` | Workspace API responses | `Workspace` |

---

## 14. Build & Deployment Pipeline

### Development

```bash
npm run dev   # Vite dev server on port 3000, HMR enabled
```

> **Note on dependency loading**: TailwindCSS is loaded from `cdn.tailwindcss.com` via a `<script>` tag in `index.html`. Most runtime npm packages (React, React Router, Zod, etc.) are also loaded at runtime via an ESM import map pointing to `esm.sh`. The `npm install` / Vite build pipeline still bundles everything for production via the `node_modules` copies — the import map in `index.html` is used in the browser dev preview served by `index.html` directly.

Vite is configured in `vite.config.ts`:
- Port: `3000`, host: `0.0.0.0` (accessible externally)
- Path alias: `@` → project root
- React plugin for JSX transform

### Production Build

```bash
npm run build  # outputs to /dist
```

Vite bundles all TypeScript/TSX → JavaScript, applies tree-shaking, and generates hashed filenames for cache busting.

### Docker Multi-Stage Build

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY scripts/nginx-app.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Docker Compose maps port `8080` on the host to `80` in the container.

### Nginx Configuration

`scripts/nginx-app.conf` configures:
- Static file serving from `/usr/share/nginx/html`
- `try_files $uri $uri/ /index.html` for SPA fallback
- Gzip compression for JS/CSS/HTML
- Long-lived cache headers for hashed assets

---

## 15. Data Model Overview

Core TypeScript interfaces defined in `types.ts`:

```
User
  ├── id, email, firstName, lastName
  ├── companyName, companyUrl, subdomain, phone
  └── mfaEnabled, mfaMethod, status, isOwner

Workspace
  ├── id, name, description, url, studioType
  ├── timezone, currency, colorTheme, logo
  ├── settings (WorkspaceSettings)
  ├── status: 'Active' | 'Setup'
  ├── iconType: 'camera' | 'building' | 'heart' | 'star'
  └── eventsCount, membersCount, collaborators[]

Role
  ├── id, name, level: 'organization' | 'studio'
  ├── description, permissions[]
  └── memberCount, isSystem

TeamMember
  ├── id, firstName, lastName, email, phone
  ├── role, accessLevel: 'Specific Event' | 'Full Access'
  ├── allowedEventIds[], allowedWorkspaceIds[]
  ├── avatarColor, initials, isOwner
  └── joinedDate, eventsCount

PendingMember
  ├── id, email, firstName, lastName, phone
  ├── role, location, sentDate
  ├── accessLevel, allowedEventIds[], allowedWorkspaceIds[]
  └── status: 'Awaiting Response' | 'Invitation Expired'

SubscriptionPlan
  ├── id, name, price, interval, features[]
  └── storageLimit, maxEvents, maxTeamMembers, isCurrent, isPopular

PaymentMethod
  ├── id, brand, last4, expiryDate, cardholderName
  ├── isDefault
  └── billingAddress (BillingAddress)

GuestRecord
  ├── id, name, email, phone
  ├── workspaceId, workspaceName
  ├── eventId, eventName
  └── accessDate, downloadCount
```

The `AuthStatus` enum tracks async operation state across the application:
```typescript
enum AuthStatus { IDLE, LOADING, SUCCESS, ERROR }
```
