<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FotoShareAI Frontend

Frontend UI for the FotoShareAI application — a multi-tenant photo-sharing platform for photographers and studios.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Key Components](#key-components)
6. [Environment Variables](#environment-variables)
7. [Run Locally](#run-locally)
8. [Build](#build)
9. [Docker Deployment](#docker-deployment)

---

## Features

### Authentication & Access
- Email/password login, signup with OTP verification, and password reset flow.
- Google OAuth integration with profile completion step.
- Invitation acceptance flow for team/workspace onboarding.
- Cross-subdomain session management using shared cookies.

### Workspaces & Team
- Workspace hub with role-based visibility.
- Create and switch between multiple workspaces.
- Team management: invite members, assign roles, manage access levels.
- Custom role definitions at organization and studio level.
- Guest data management: access logs and download tracking.

### Events & Galleries
- Create and manage events with collections and media.
- Share events via guest/client links, QR codes, and PIN protection.
- Client gallery with photo selection and download support.
- Guest access/gallery flows (view-only mode).
- Media lightbox viewer for individual photo/video viewing.

### Calendars
- Global calendar view spanning all workspaces.
- Studio calendar view scoped to the active workspace.

### Branding
- Branding presets with logo, watermark, and social link settings.
- Apply branding to galleries and client downloads.
- Client-side watermarking via HTML Canvas.

### Analytics
- Studio performance dashboards and KPI metrics (views, downloads, engagement).

### Dashboard
- Overview metrics, quick action shortcuts, and support ticket management.

### Billing & Subscription
- Subscription plan management (Free, Pro, Business).
- Payment method CRUD and billing history.
- Billing address management.

### Utilities / Internal
- Email simulation inbox for OTPs and notification previews.
- i18n language switching support.
- Toast notifications and loading skeleton placeholders.

---

## Tech Stack

| Category | Technology |
|---|---|
| UI Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 5 |
| Routing | React Router v6 (HashRouter) |
| Forms | react-hook-form + Zod |
| Styling | Tailwind CSS (CDN) + tailwind-merge + clsx |
| Icons | lucide-react |
| File Utilities | jszip (batch downloads) |
| Runtime Target | ES2022, ESNext modules |

---

## Project Structure

```
PhotoshearAI_Frontend-updates/
├── app/                          # Page-level components (one per route)
│   ├── login/page.tsx            # Email/password login
│   ├── signup/page.tsx           # Registration
│   ├── verify-otp/page.tsx       # OTP verification
│   ├── forgot-password/page.tsx  # Password reset request
│   ├── set-password/page.tsx     # OAuth password setup
│   ├── complete-profile/page.tsx # OAuth profile completion
│   ├── dashboard/page.tsx        # Overview metrics & quick actions
│   ├── workspaces/page.tsx       # Workspace hub
│   ├── workspaces/create/page.tsx
│   ├── team/page.tsx             # Team member management
│   ├── my-events/page.tsx        # Events listing
│   ├── create-event/page.tsx     # Event creation form
│   ├── event-details/page.tsx    # Event editing & media management
│   ├── share-event/page.tsx      # Sharing settings
│   ├── guest-access/page.tsx     # Guest PIN/link validation
│   ├── guest-gallery/page.tsx    # Guest read-only gallery
│   ├── client-access/page.tsx    # Client link validation
│   ├── client-gallery/page.tsx   # Client interactive gallery
│   ├── media-view/page.tsx       # Single media lightbox
│   ├── branding/page.tsx         # Branding preset list
│   ├── branding/add/page.tsx     # Create/edit branding preset
│   ├── analytics/page.tsx        # Performance dashboards
│   ├── settings/page.tsx         # User profile, billing, security
│   ├── calendar/page.tsx         # Global calendar
│   ├── studio-calendar/page.tsx  # Workspace calendar
│   └── accept-invitation/page.tsx
│
├── components/
│   ├── layouts/
│   │   └── AuthLayout.tsx        # Login/signup page wrapper
│   ├── shared/
│   │   ├── CalendarView.tsx      # Reusable calendar picker
│   │   ├── LanguageSwitcher.tsx  # i18n selector
│   │   ├── PositionSelector.tsx  # Watermark/logo position picker
│   │   └── Sidebar.tsx           # Main navigation + workspace switcher
│   └── ui/                       # Base UI component library
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx / ModernInput.tsx / PasswordInput.tsx
│       ├── Select.tsx
│       ├── TextArea.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx / InlineToast.tsx
│       ├── Switch.tsx
│       ├── Skeleton.tsx
│       ├── PageLoader.tsx
│       └── SessionExpiredModal.tsx
│
├── contexts/                     # React Context providers (global state)
│   ├── AuthContext.tsx           # Session management, login/logout, OAuth
│   ├── WorkspaceContext.tsx      # Active workspace & workspace CRUD
│   ├── TeamContext.tsx           # Members, roles, invitations
│   ├── EventsContext.tsx         # Events, collections, media
│   ├── BillingContext.tsx        # Subscription plans, payments
│   ├── BrandingContext.tsx       # Branding presets
│   ├── PermissionsContext.tsx    # RBAC evaluation helpers
│   ├── LanguageContext.tsx       # i18n language state
│   └── ToastContext.tsx          # Toast notification system
│
├── services/                     # API service modules (typed request/response)
│   ├── authApi.ts                # login, signup, verifyOtp, googleLogin, resetPassword
│   ├── workspaceApi.ts           # Workspace CRUD & settings
│   ├── eventsApi.ts              # Events CRUD, publish, share settings
│   ├── collectionsApi.ts         # Collections within events
│   ├── mediaApi.ts               # Media upload & management
│   ├── facesApi.ts               # Face detection & grouping
│   ├── commentsApi.ts            # Event comments
│   ├── teamApi.ts                # Team member operations
│   ├── rolesApi.ts               # Role definitions
│   ├── invitationsApi.ts         # Team invitations
│   ├── billingApi.ts             # Plans, invoices, payment methods
│   ├── brandingApi.ts            # Branding preset CRUD
│   ├── assetsApi.ts              # Asset management (logos, banners)
│   ├── clientAccessApi.ts        # Client access links
│   └── collaboratorsApi.ts       # Collaborator management
│
├── hooks/
│   ├── useFileUpload.ts          # File picker, drag-and-drop, preview, validation
│   └── useWorkspaces.ts          # Workspace operations hook
│
├── utils/
│   ├── api.ts                    # HTTP client (auth token injection, 401 handling)
│   ├── subdomain.ts              # Multi-tenant subdomain detection & API routing
│   ├── imageProcessor.ts         # Canvas-based watermark & logo overlay
│   ├── validators.ts             # Email, phone & form validators
│   ├── formatters.ts             # Date, currency, number formatting
│   ├── translations.ts           # i18n translation helpers
│   ├── mappers.ts                # API response → UI model transformation
│   ├── workspaceMappers.ts       # Workspace-specific mappers
│   ├── teamMappers.ts            # Team-specific mappers
│   ├── billingMappers.ts         # Billing-specific mappers
│   ├── positionHelpers.ts        # Watermark/logo position calculations
│   ├── toast.ts                  # Toast notification helpers
│   └── cn.ts                     # Tailwind class merge utility (clsx wrapper)
│
├── constants/
│   ├── countries.ts              # Country list (dial codes, names)
│   └── simulation.ts             # Email simulation mock data
│
├── types.ts                      # TypeScript interfaces (User, Workspace, Role, etc.)
├── constants.ts                  # Global constants re-exports
├── App.tsx                       # Root component: routing + context providers
├── index.tsx                     # React DOM entry point
├── index.html                    # HTML template (Tailwind CDN, fonts, import map)
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Docker Compose setup
└── docs/                         # Migration & feature documentation
    ├── WORKSPACE_MIGRATION.md
    ├── TEAM_MIGRATION.md
    ├── ACCEPT_INVITATION_MIGRATION.md
    └── all-features-backend.md
```

---

## Architecture Overview

### State Management
Global state is managed via React Context API with nine dedicated providers, composed at the root of the application in `App.tsx`:

```
ToastProvider
└── AuthProvider
    └── LanguageProvider
        └── TeamProvider
            └── PermissionsProvider
                └── WorkspaceProvider
                    └── BillingProvider
                        └── BrandingProvider
                            └── EventsProvider
                                └── Router (HashRouter)
```

### Routing
- **HashRouter** is used to support multi-tenant subdomain routing without server-side configuration.
- **Protected routes** redirect unauthenticated users to `/login`.
- **Public routes** redirect authenticated users to `/workspaces`.
- Special handling for users who need to complete their profile (OAuth flow).

### API Layer
- `utils/api.ts` is the central HTTP client built on the Fetch API.
- Authentication tokens are stored in cookies shared across all `*.fotoshareai.com` subdomains.
- `401` responses automatically clear the token and dispatch a `fotoshare:session_expired` event, which triggers a global session-expired modal.
- All service files in `services/` use this client and export typed request/response functions.

### Forms
- **react-hook-form** manages form state with minimal re-renders.
- **Zod** schemas are used for declarative validation via `@hookform/resolvers`.

### Styling
- **Tailwind CSS** is loaded from CDN to avoid a build-time PostCSS dependency.
- `tailwind-merge` and `clsx` (via `utils/cn.ts`) are used to compose conditional class names safely.

---

## Key Components

| Component | Location | Description |
|---|---|---|
| `App` | `App.tsx` | Root component; wires all context providers and routes |
| `Sidebar` | `components/shared/Sidebar.tsx` | Main navigation with workspace switcher |
| `AuthContext` | `contexts/AuthContext.tsx` | Session state, login, logout, OAuth |
| `WorkspaceContext` | `contexts/WorkspaceContext.tsx` | Active workspace selection and management |
| `PermissionsContext` | `contexts/PermissionsContext.tsx` | RBAC evaluation for UI visibility |
| `useFileUpload` | `hooks/useFileUpload.ts` | File drag-and-drop, validation, preview |
| `imageProcessor` | `utils/imageProcessor.ts` | Canvas-based watermark/logo rendering |
| `uploadAsset` | `utils/api.ts` | Two-step S3 asset upload (create → PUT) |
| `CalendarView` | `components/shared/CalendarView.tsx` | Reusable date picker / calendar |
| `SessionExpiredModal` | `components/ui/SessionExpiredModal.tsx` | Global auth timeout notification |

---

## Environment Variables

Create a `.env` file in the project root (this file is `.gitignore`d):

```env
# Required for Google Gemini image features
GEMINI_API_KEY=your_gemini_api_key

# Backend API base URL (default: https://api.fotoshareai.com)
VITE_API_BASE_URL=https://api.fotoshareai.com

# Google OAuth client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Run Locally

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The Vite dev server starts on `http://localhost:3000` with Hot Module Replacement enabled.

---

## Build

```bash
# Create an optimized production bundle in dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## Docker Deployment

### Build the image

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.fotoshareai.com \
  --build-arg VITE_GOOGLE_CLIENT_ID=<your_client_id> \
  -t photoshareai-frontend .
```

### Run with Docker Compose

```bash
# Set environment variables in a .env file or export them, then:
docker-compose up
```

The app is served by Nginx on port `8080` (mapped from container port `80`).

The Docker build uses a three-stage process:
1. **deps** – installs Node.js dependencies with `npm ci`
2. **builder** – runs `npm run build` to produce the `dist/` bundle
3. **runtime** – serves the bundle with `nginx:1.27-alpine`
