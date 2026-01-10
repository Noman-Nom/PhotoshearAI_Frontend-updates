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
- User is authenticated and has access to the active workspace.
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

- Enforce event access by workspace membership for internal routes.
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
