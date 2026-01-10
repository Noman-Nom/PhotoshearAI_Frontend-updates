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
- User is authenticated.
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

- Ensure analytics only exposes data for authorized workspaces.
- Avoid leaking guest/customer data unless explicitly required.

## 10. Known Unknowns & Assumptions

### Unknowns
- Source of views/downloads metrics (frontend uses simulated data).
- Whether “engagement score” has a defined formula.
- Whether analytics should include guest registry data.

### Assumptions
- Backend will track views and downloads and aggregate by event/date.
- Backend will expose breakdown by event `type` for category distribution.
