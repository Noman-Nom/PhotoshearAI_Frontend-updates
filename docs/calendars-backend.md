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
- User is authenticated.
- Global calendar is accessible to admin roles in the UI (navigation entry is in the workspace hub tabs).
- Studio calendar uses the active workspace selection.
- **Assumption**: Backend will provide event data filtered by user permissions.

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

- `404` if workspace not found or user not authorized.
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
- Backend will return only events the user is authorized to see.
- Backend will include workspace color theme for calendar styling (optional).
