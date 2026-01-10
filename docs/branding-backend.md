# Branding (Backend-Oriented, FastAPI)

> Scope: Backend design for branding presets used across events and downloads.
> Source of truth: `/mnt/sdb1/Monis/fotoshareai/fotoshareai_frontend`.
> All backend behaviors are inferred; items marked **Assumption** or **Unknown** are not confirmed by frontend.

## 1. Feature Overview

### Purpose
- Create and manage branding presets (logos, social links, watermark settings).
- Apply branding to event downloads and gallery overlays.
- Store branding metadata for reuse across events.

### Entry Points (frontend routes)
- `/branding` (branding list + edit modal)
- `/branding/add` (standalone add page)

### Preconditions & Assumptions
- User is authenticated.
- Branding presets are shared at the workspace or organization level.
- **Assumption**: Backend will replace localStorage storage `photmo_branding_items_v1`.

## 2. Core Data Models (Pydantic)

### BrandingItem
Derived from `/app/branding/page.tsx` and `/app/branding/add/page.tsx`.
```py
class BrandingItem(BaseModel):
    id: str
    name: str
    website: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    youtube: str | None = None
    email: str | None = None
    contact_number: str | None = None
    about_us: str | None = None
    domain: str | None = None
    status: Literal["Active", "Draft"]
    last_updated: date
    icon_type: Literal["main", "summer", "dark", "holiday"]
    logo: str | None = None
    watermark_position: str | None = None
    details_position: str | None = None
    logo_opacity: int | None = None
    logo_size: int | None = None
    brand_opacity: int | None = None
    brand_size: int | None = None
```

### BrandingConfig (Applied to Downloads)
Derived from `/utils/imageProcessor.ts`.
```py
class BrandingConfig(BaseModel):
    name: str | None = None
    website: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    youtube: str | None = None
    logo: str | None = None
    watermark_position: str | None = None
    details_position: str | None = None
    logo_opacity: int | None = None
    logo_size: int | None = None
    brand_opacity: int | None = None
    brand_size: int | None = None
```

## 3. Backend Endpoints (Proposed)

### Branding CRUD

**GET `/branding`**
- List branding presets.
- Optional query: `status=Active|Draft`.

**POST `/branding`**
- Create branding preset.
- Accepts logo upload or base64 logo string.

**GET `/branding/{branding_id}`**
- Retrieve branding preset.

**PUT `/branding/{branding_id}`**
- Update branding preset (name, links, positions, sizing, status).

**DELETE `/branding/{branding_id}`**
- Delete branding preset.

### Branding Assets

**POST `/branding/{branding_id}/logo`**
- Upload or replace logo asset.
- **Assumption**: multipart upload returning CDN URL.

### Event Branding Link

**PUT `/events/{event_id}`**
- Update event with `branding = true` and `branding_id`.

## 4. Request/Response Examples

### Create Branding
```json
POST /branding
{
  "name": "Photmo Studio",
  "website": "photmo.com",
  "instagram": "@photmo",
  "status": "Active",
  "logo": "data:image/png;base64,...",
  "watermark_position": "top-right",
  "details_position": "bottom-left",
  "logo_opacity": 90,
  "logo_size": 15,
  "brand_opacity": 100,
  "brand_size": 100
}
```

### Update Branding
```json
PUT /branding/brand_123
{
  "status": "Draft",
  "logo_opacity": 80,
  "brand_size": 120
}
```

## 5. Business Rules & Constraints (From UI)

- Brand name required (save blocked without it).
- Website defaults to `N/A` when empty in UI.
- Status values: `Active` or `Draft`.
- Logo is optional; when present, used for watermark overlays.
- Watermark and details positions are set on a 3x3 grid.
- Opacity fields are percentages.

## 6. Validation & Constraints

- `logo_opacity`, `brand_opacity`: 0–100.
- `logo_size`, `brand_size`: positive percentages.
- `watermark_position`, `details_position`: one of 9 grid positions.

**Assumption**: Backend validates and normalizes these fields.

## 7. Storage & Caching (Frontend Signals)

Frontend stores branding presets in localStorage under:
- `photmo_branding_items_v1`

Backend should persist branding in DB and return URLs for logos if stored externally.

## 8. Redis Expectations (Assumed)

- None required by UI.
- **Assumption**: cache branding presets for quick lookup on downloads.

## 9. Error Handling

- `400` invalid input (missing name, invalid positions or opacity).
- `404` branding item not found.
- `409` duplicate branding name (if enforced).

## 10. Security Considerations

- Validate logo uploads (size/type).
- Prevent unauthorized updates (workspace/organization ownership).
- Sanitize URLs for social links to avoid injection.

## 11. Known Unknowns & Assumptions

### Unknowns
- Whether branding is scoped to workspace or global org.
- File storage provider for logos.
- Whether `domain`, `about_us`, and `contact_number` are used in UI after creation.

### Assumptions
- Branding presets are reusable across events.
- Backend will provide a stable `branding_id` for event linkage.
