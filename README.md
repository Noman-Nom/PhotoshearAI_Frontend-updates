<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FotoShareAI Frontend

Frontend UI for the FotoShareAI application.

## Features

### Authentication & Access
- Login, signup, OTP verification, password reset.
- Invitation acceptance flow for team/workspace access.

### Workspaces & Team
- Workspace hub with role-based visibility.
- Team management, roles, invitations, and studio access control.

### Events & Galleries
- Create and manage events with collections/media.
- Share events (guest/client links, QR, PIN).
- Client gallery, selection mode, and media view.
- Guest access/gallery flows (simulation in UI).

### Calendars
- Global calendar view across workspaces.
- Studio calendar view scoped to active workspace.

### Branding
- Branding presets with logo/watermark settings.
- Apply branding to galleries and downloads.

### Analytics
- Studio performance dashboards and KPIs.

### Dashboard
- Overview metrics, quick actions, guides, and support tickets.

### Utilities / Internal
- Email simulation inbox for OTPs and notifications.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`
3. Open the app at the URL printed by Vite (usually `http://localhost:5173`).

## Build

1. Build the production bundle:
   `npm run build`
2. Preview the build locally:
   `npm run preview`
