<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FotoShareAI Frontend

A comprehensive photo-sharing and collaboration platform for photographers and studios, built with React 19, TypeScript, Vite, and TailwindCSS.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Key Modules](#key-modules)
  - [Pages (`app/`)](#pages-app)
  - [Components (`components/`)](#components-components)
  - [Context Providers (`contexts/`)](#context-providers-contexts)
  - [API Services (`services/`)](#api-services-services)
  - [Custom Hooks (`hooks/`)](#custom-hooks-hooks)
  - [Utilities (`utils/`)](#utilities-utils)
  - [Types & Constants](#types--constants)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Documentation](#documentation)

---

## Features

### Authentication & Access
- Login, signup, OTP verification, password reset, and Google OAuth.
- Multi-Factor Authentication (Email, Authenticator App, SMS).
- Invitation acceptance flow for team/workspace access.

### Workspaces & Team
- Multi-tenant workspace hub with role-based visibility.
- Team management: add/remove members, custom roles, and invitations.
- Granular studio access control per team member.

### Events & Galleries
- Create and manage events with collections and media uploads.
- Share events via guest links, client links, QR codes, or PIN.
- Client gallery with selection mode and download controls.
- Guest access/gallery flows with data capture.
- Media viewer with navigation.

### Calendars
- Global calendar view aggregated across all workspaces.
- Studio calendar scoped to the active workspace.

### Branding
- Branding presets: logo, watermark, and gallery styling.
- Apply branding to galleries and downloaded images.

### Analytics
- Studio performance dashboards and KPI tracking.
- Guest engagement and event-level analytics.

### Billing & Payments
- Subscription plan management and upgrades.
- Payment method management and billing history.
- Multi-currency support.

### Dashboard
- Overview metrics, quick actions, onboarding guides, and support tickets.

### Utilities / Internal
- Email simulation inbox for OTPs and notifications (development feature).
- Multi-language / i18n support.

---

## Technology Stack

| Category              | Technology                        |
|-----------------------|-----------------------------------|
| **UI Framework**      | React 19.2                        |
| **Language**          | TypeScript 5.8                    |
| **Build Tool**        | Vite 5.4                          |
| **Styling**           | TailwindCSS (CDN via `cdn.tailwindcss.com`) + `tailwind-merge` (npm) |
| **Routing**           | React Router DOM 6.30 (HashRouter) |
| **Forms**             | React Hook Form 7 + Zod 4         |
| **Icons**             | Lucide React                      |
| **State Management**  | React Context API (no Redux)      |
| **HTTP Client**       | Native `fetch` with custom wrapper |
| **File Handling**     | jszip (ZIP creation/extraction)   |
| **Deployment**        | Docker + Nginx                    |

---

## Project Structure

```
PhotoshearAI_Frontend-updates/
├── app/                        # Page-level components (one folder per route)
│   ├── accept-invitation/      # Team/workspace invitation acceptance
│   ├── analytics/              # Studio analytics & KPI dashboard
│   ├── branding/               # Branding presets management
│   │   └── add/                # Create new branding preset
│   ├── calendar/               # Global calendar across workspaces
│   ├── client-access/          # Client access entry (pin/link auth)
│   ├── client-gallery/         # Client-facing photo gallery
│   ├── complete-profile/       # Post-signup profile completion
│   ├── create-event/           # Event creation wizard
│   ├── dashboard/              # Main authenticated dashboard
│   ├── email-simulation/       # Dev tool: simulated email inbox
│   ├── event-details/          # Event detail & media management
│   ├── forgot-password/        # Password reset request flow
│   ├── guest-access/           # Guest entry form (name/email capture)
│   ├── guest-gallery/          # Guest-facing photo gallery
│   ├── login/                  # User login
│   ├── media-view/             # Full-screen media viewer (event/guest/client)
│   ├── my-events/              # Events list for the active workspace
│   ├── set-password/           # Set/change password
│   ├── settings/               # User profile, security & billing settings
│   ├── share-event/            # Event sharing options & link generation
│   ├── signup/                 # New user registration
│   ├── studio-calendar/        # Workspace-scoped calendar
│   ├── team/                   # Team member management
│   ├── verify-otp/             # OTP verification step
│   └── workspaces/             # Workspace hub, roles, members & guest data
│       └── create/             # Create a new workspace
│
├── components/                 # Reusable UI components
│   ├── layouts/
│   │   └── AuthLayout.tsx      # Shared layout wrapper for auth pages
│   ├── shared/
│   │   ├── CalendarView.tsx    # Shared calendar rendering component
│   │   ├── LanguageSwitcher.tsx # Language toggle UI
│   │   ├── PositionSelector.tsx # Watermark/element position picker
│   │   └── Sidebar.tsx         # Main navigation sidebar
│   └── ui/                     # Primitive UI component library
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── PasswordInput.tsx
│       ├── Select.tsx
│       ├── SessionExpiredModal.tsx
│       ├── Skeleton.tsx
│       ├── Switch.tsx
│       ├── TextArea.tsx
│       └── Toast.tsx
│
├── contexts/                   # React Context providers (global state)
│   ├── AuthContext.tsx         # Auth state: user, tokens, login/logout
│   ├── BillingContext.tsx      # Subscription plans, payment methods
│   ├── BrandingContext.tsx     # Branding presets and active branding
│   ├── EventsContext.tsx       # Events list and operations
│   ├── LanguageContext.tsx     # Active language and t() translation helper
│   ├── PermissionsContext.tsx  # User permissions and role checks
│   ├── TeamContext.tsx         # Team members, roles, invitations
│   ├── ToastContext.tsx        # Toast notification queue
│   └── WorkspaceContext.tsx    # Active workspace, workspace list
│
├── hooks/                      # Custom React hooks
│   ├── useFileUpload.ts        # File upload with progress tracking
│   └── useWorkspaces.ts        # Workspace fetch and switching helpers
│
├── services/                   # API service modules (one per domain)
│   ├── assetsApi.ts            # Asset upload/management
│   ├── authApi.ts              # Login, signup, OTP, OAuth, MFA
│   ├── billingApi.ts           # Plans, invoices, payment methods
│   ├── brandingApi.ts          # Branding preset CRUD
│   ├── clientAccessApi.ts      # Client access link generation
│   ├── collaboratorsApi.ts     # Event collaborator management
│   ├── collectionsApi.ts       # Collection CRUD within events
│   ├── commentsApi.ts          # Media comments
│   ├── eventsApi.ts            # Event CRUD and sharing
│   ├── facesApi.ts             # Face recognition endpoints
│   ├── invitationsApi.ts       # Team invitation CRUD
│   ├── mediaApi.ts             # Media upload, download, delete
│   ├── rolesApi.ts             # Role and permission management
│   ├── teamApi.ts              # Team member management
│   └── workspaceApi.ts         # Workspace CRUD and settings
│
├── utils/                      # Shared utility functions
│   ├── api.ts                  # Core fetch wrapper, token management, ApiError
│   ├── billingMappers.ts       # API → billing type mappings
│   ├── cn.ts                   # clsx + tailwind-merge helper
│   ├── formatters.ts           # Date, currency, number formatters
│   ├── imageProcessor.ts       # Client-side image manipulation
│   ├── mappers.ts              # Generic API response → UI type mappers
│   ├── positionHelpers.ts      # Watermark position calculation
│   ├── subdomain.ts            # Multi-tenant subdomain routing logic
│   ├── teamMappers.ts          # API → team type mappers
│   ├── toast.ts                # Toast helper functions
│   ├── translations.ts         # i18n string table (multi-language)
│   ├── validators.ts           # Zod schema validators
│   └── workspaceMappers.ts     # API → workspace type mappers
│
├── constants/                  # Static data
│   ├── countries.ts            # Country list with dial codes
│   └── simulation.ts           # Simulation/mock data constants
│
├── docs/                       # Backend API documentation
│   ├── all-features-backend.md
│   ├── analytics-backend.md
│   ├── authentication-frontend-derived.md
│   ├── branding-backend.md
│   ├── calendars-backend.md
│   ├── dashboard-backend.md
│   ├── events-galleries-backend.md
│   ├── workspaces-team-backend.md
│   ├── ACCEPT_INVITATION_MIGRATION.md
│   ├── TEAM_MIGRATION.md
│   └── WORKSPACE_MIGRATION.md
│
├── scripts/                    # Deployment & infrastructure scripts
│   ├── nginx-app.conf          # Nginx config for production
│   ├── run-certbot.sh          # SSL certificate provisioning
│   ├── run-docker-compose.sh   # Docker Compose helper
│   ├── setup-nginx.sh          # Nginx setup script
│   └── uninstall-nginx-ssl.sh  # SSL cleanup script
│
├── App.tsx                     # Root component: providers + router
├── index.tsx                   # React 19 entry point
├── index.html                  # HTML template (Tailwind CDN, fonts)
├── types.ts                    # Core TypeScript interfaces
├── constants.ts                # Application-wide constants
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Docker Compose configuration
├── dbdiagram.dbml              # Database schema (DBML format)
├── openapi.json                # OpenAPI 3.0 backend spec
└── metadata.json               # Project metadata
```

---

## Architecture Overview

The application is a **client-side Single Page Application (SPA)** using a HashRouter (`#/path`) so that it can be served from any static file host without server-side routing configuration.

```
Browser
  │
  ▼
index.html  ──►  index.tsx  ──►  App.tsx
                                   │
                   ┌───────────────┼───────────────────┐
                   │    Context Providers (State)       │
                   │  ToastProvider                     │
                   │    AuthProvider                    │
                   │      LanguageProvider              │
                   │        TeamProvider                │
                   │          PermissionsProvider       │
                   │            WorkspaceProvider       │
                   │              BillingProvider       │
                   │                BrandingProvider    │
                   │                  EventsProvider    │
                   └──────────────┬─────────────────────┘
                                  │
                            HashRouter
                                  │
                   ┌──────────────┴──────────────┐
                   │         AppRoutes            │
                   │  PublicRoute  ProtectedRoute │
                   │       │            │         │
                   │   Auth Pages   App Pages     │
                   └─────────────────────────────-┘
                                  │
                         Page Components
                           (app/**/page.tsx)
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
               UI Components              API Services
               (components/)              (services/)
                                               │
                                          utils/api.ts
                                    (fetch wrapper + token mgmt)
                                               │
                                      Backend REST API
                                  (https://api.fotoshareai.com)
```

### Route Protection

- **`PublicRoute`** – Redirects already-authenticated users to `/workspaces`.
- **`ProtectedRoute`** – Redirects unauthenticated users to `/login`. Also enforces profile-completion redirect when `needsProfileCompletion` is set.
- Guest and client gallery routes (`/guest-gallery/*`, `/client-gallery/*`) are publicly accessible without authentication.

### Token Management

Auth tokens are stored in an HTTP cookie (`auth_token`) shared across all `*.fotoshareai.com` subdomains (or `localhost` for development). The `utils/api.ts` module:
- Reads the token from the cookie on every request via `getAuthToken()`.
- Sets / clears the cookie via `setAuthToken()`.
- Automatically dispatches a `fotoshare:session_expired` custom event on `401` responses, which triggers the global `SessionExpiredModal`.

---

## Key Modules

### Pages (`app/`)

Each route has its own folder containing a `page.tsx` file. Pages are imported in `App.tsx` and mapped to React Router routes.

| Route | Page | Description |
|-------|------|-------------|
| `/login` | `login/page.tsx` | Email/password login + Google OAuth |
| `/signup` | `signup/page.tsx` | New account registration |
| `/verify-otp` | `verify-otp/page.tsx` | OTP email verification |
| `/forgot-password` | `forgot-password/page.tsx` | Password reset request |
| `/set-password` | `set-password/page.tsx` | Set new password |
| `/complete-profile` | `complete-profile/page.tsx` | Post-signup profile setup |
| `/accept-invitation` | `accept-invitation/page.tsx` | Team invitation acceptance |
| `/workspaces` | `workspaces/page.tsx` | Workspace hub |
| `/workspaces/create` | `workspaces/create/page.tsx` | New workspace wizard |
| `/dashboard` | `dashboard/page.tsx` | Main dashboard |
| `/analytics` | `analytics/page.tsx` | Analytics & KPIs |
| `/my-events` | `my-events/page.tsx` | Events list |
| `/create-event` | `create-event/page.tsx` | Event creation |
| `/events/:slug` | `event-details/page.tsx` | Event detail & media management (`:slug` is a URL-friendly event identifier returned by the API) |
| `/share-event/:eventId` | `share-event/page.tsx` | Sharing options |
| `/guest-access/:eventId` | `guest-access/page.tsx` | Guest data capture |
| `/guest-gallery/:eventId` | `guest-gallery/page.tsx` | Guest photo gallery |
| `/client-access/:eventId` | `client-access/page.tsx` | Client authentication |
| `/client-gallery/:eventId` | `client-gallery/page.tsx` | Client photo gallery |
| `/media-view` | `media-view/page.tsx` | Full-screen media viewer |
| `/team` | `team/page.tsx` | Team management |
| `/branding` | `branding/page.tsx` | Branding presets |
| `/branding/add` | `branding/add/page.tsx` | Create branding preset |
| `/settings` | `settings/page.tsx` | Settings & billing |
| `/calendar` | `calendar/page.tsx` | Global calendar |
| `/studio-calendar` | `studio-calendar/page.tsx` | Studio calendar |

### Components (`components/`)

**`components/ui/`** — Primitive building blocks used across all pages:
- `Button` – Variants: primary, secondary, outline, ghost, danger.
- `Input` / `PasswordInput` / `TextArea` – Form inputs.
- `Select` – Dropdown select.
- `Modal` – Accessible dialog overlay.
- `Card` – Container with consistent padding/shadow.
- `Switch` – Toggle control.
- `Toast` – Ephemeral notification message.
- `Skeleton` – Loading placeholder.
- `SessionExpiredModal` – Global modal triggered on 401 errors.

**`components/shared/`** — Feature-level shared components:
- `Sidebar` – Primary navigation with workspace switcher.
- `CalendarView` – Reusable calendar grid rendering.
- `LanguageSwitcher` – Language selector dropdown.
- `PositionSelector` – Visual 3×3 grid for watermark/logo positioning.

**`components/layouts/`**
- `AuthLayout` – Centered two-column layout used by all auth pages.

### Context Providers (`contexts/`)

All global state is managed through React Context. Providers are nested in `App.tsx`:

| Context | Purpose |
|---------|---------|
| `AuthContext` | Current user, `isAuthenticated`, `login()`, `logout()`, `needsProfileCompletion` |
| `WorkspaceContext` | Active workspace, workspace list, `switchWorkspace()` |
| `TeamContext` | Team members, pending invitations, roles |
| `EventsContext` | Events list, `refreshEvents()`, loading states |
| `BrandingContext` | Branding presets, active branding |
| `BillingContext` | Subscription plan, payment methods, billing history |
| `PermissionsContext` | `hasPermission(action)`, `userRole`, feature flags |
| `LanguageContext` | Active locale, `t(key)` translation function |
| `ToastContext` | `showToast(message, type)`, toast queue |

### API Services (`services/`)

Each file groups all API calls for one domain. All services use the `api` object from `utils/api.ts` which adds authentication headers and handles errors centrally.

| Service | Key Functions |
|---------|--------------|
| `authApi` | `login`, `signup`, `verifyOtp`, `requestPasswordReset`, `googleOAuth`, `setupMfa` |
| `workspaceApi` | `getWorkspaces`, `createWorkspace`, `updateWorkspace`, `deleteWorkspace` |
| `eventsApi` | `getEvents`, `createEvent`, `updateEvent`, `getEventBySlug`, `shareEvent` |
| `mediaApi` | `getMedia`, `deleteMedia`, `bulkDownload` |
| `teamApi` | `getTeamMembers`, `inviteMember`, `removeMember`, `updateMemberRole` |
| `brandingApi` | `getBrandingPresets`, `createPreset`, `applyBranding` |
| `billingApi` | `getPlans`, `getInvoices`, `getPaymentMethods`, `updateSubscription` |
| `collectionsApi` | `getCollections`, `createCollection`, `deleteCollection` |
| `rolesApi` | `getRoles`, `createRole`, `updateRole`, `deleteRole` |
| `invitationsApi` | `getInvitations`, `acceptInvitation`, `revokeInvitation` |
| `facesApi` | `detectFaces`, `searchByFace` |

### Custom Hooks (`hooks/`)

- **`useFileUpload`** – Handles file selection, validation, progress tracking, and upload via `uploadEventMedia` / `uploadAsset`.
- **`useWorkspaces`** – Fetches workspaces, handles loading/error state, provides `switchWorkspace` helper.

### Utilities (`utils/`)

| Utility | Description |
|---------|-------------|
| `api.ts` | `fetch` wrapper (`api.get/post/put/delete`), `ApiError` class, `setAuthToken`, `getAuthToken`, `uploadAsset`, `uploadEventMedia` |
| `subdomain.ts` | Detects current subdomain, builds workspace-specific URLs |
| `cn.ts` | `cn(...classes)` — combines `clsx` + `tailwind-merge` |
| `validators.ts` | Zod schemas for all forms (login, signup, event, branding, etc.) |
| `formatters.ts` | `formatDate`, `formatCurrency`, `formatFileSize` |
| `imageProcessor.ts` | Client-side image resizing, watermark application, canvas manipulation |
| `translations.ts` | Full i18n string table (English, Arabic, French, etc.) |
| `mappers.ts` | Converts raw API responses to typed frontend models |
| `teamMappers.ts` | Team-specific API → `TeamMember` / `PendingMember` mapping |
| `billingMappers.ts` | Billing API → `SubscriptionPlan` / `BillingHistoryItem` mapping |
| `workspaceMappers.ts` | Workspace API → `Workspace` mapping |
| `positionHelpers.ts` | Calculates CSS position values for watermark grid selector |
| `toast.ts` | Helper wrappers: `toastSuccess(msg)`, `toastError(msg)` |

### Types & Constants

- **`types.ts`** – Core TypeScript interfaces: `User`, `Workspace`, `TeamMember`, `PendingMember`, `Role`, `SubscriptionPlan`, `PaymentMethod`, `BillingHistoryItem`, `GuestRecord`, `AuthResponse`, `AuthStatus`.
- **`constants.ts`** – Application-wide constants (API endpoints, default values).
- **`constants/countries.ts`** – Country list with ISO codes and dial codes.
- **`constants/simulation.ts`** – Static data used by the email simulation feature.

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (optional for local dev)
cp .env.example .env   # then edit VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID

# 3. Start the development server
npm run dev
# App available at http://localhost:3000
```

### Build

```bash
# Production build (outputs to /dist)
npm run build

# Preview the production build locally
npm run preview
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `https://api.fotoshareai.com` | Backend REST API base URL |
| `VITE_GOOGLE_CLIENT_ID` | _(empty)_ | Google OAuth 2.0 client ID |

Set these in a `.env` file at the project root, or pass them as Docker build arguments.

---

## Docker Deployment

```bash
# Build and run with Docker Compose (serves on port 8080)
docker-compose up --build

# Or build manually with custom API URL
docker build \
  --build-arg VITE_API_BASE_URL=https://your-api.example.com \
  --build-arg VITE_GOOGLE_CLIENT_ID=your-client-id \
  -t fotoshareai-frontend .
```

The Docker image uses a multi-stage build:
1. **Build stage** – Node 18 Alpine installs dependencies and runs `vite build`.
2. **Serve stage** – Nginx Alpine serves the compiled `/dist` assets.

Nginx configuration is in `scripts/nginx-app.conf`. SSL setup scripts are provided in `scripts/`.

---

## Documentation

Detailed backend API documentation is in the `docs/` folder:

| File | Description |
|------|-------------|
| `all-features-backend.md` | Complete backend feature reference |
| `authentication-frontend-derived.md` | Auth flow and token management |
| `events-galleries-backend.md` | Events and gallery APIs |
| `workspaces-team-backend.md` | Workspace and team APIs |
| `analytics-backend.md` | Analytics endpoints |
| `branding-backend.md` | Branding API |
| `calendars-backend.md` | Calendar API |
| `dashboard-backend.md` | Dashboard API |
| `WORKSPACE_MIGRATION.md` | Workspace data migration guide |
| `TEAM_MIGRATION.md` | Team data migration guide |
| `ACCEPT_INVITATION_MIGRATION.md` | Invitation flow migration guide |

The full OpenAPI 3.0 specification is available in `openapi.json`.
