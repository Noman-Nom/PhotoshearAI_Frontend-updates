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
- User is authenticated.
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
