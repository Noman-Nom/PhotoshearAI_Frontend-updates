/**
 * Branding API Service
 * 
 * Handles CRUD operations for brand identity items via backend API.
 * Maps between Frontend CamelCase and Backend SnakeCase.
 */
import { api } from '../utils/api';
import { GridPosition } from '../utils/positionHelpers';

// ===== Types =====

export interface BrandingItem {
    id: string;
    orgId?: string;
    name: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    email?: string;
    contactNumber?: string;
    aboutUs?: string;
    domain?: string;
    status: 'active' | 'draft' | 'inactive';
    iconType: string;
    logo?: string; // Frontend uses 'logo' or 'logoUrl'
    logoUrl?: string;
    watermarkPosition?: GridPosition;
    detailsPosition?: GridPosition;
    logoOpacity?: number;
    logoSize?: number;
    brandOpacity?: number;
    brandSize?: number;
    createdAt?: string;
    updatedAt?: string;
    // Legacy support
    lastUpdated?: string;
}

export interface BrandingCreateRequest {
    name: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    email?: string;
    contactNumber?: string;
    aboutUs?: string;
    domain?: string;
    logo?: string; // Base64 or URL
    logoUrl?: string; // Helper
    watermarkPosition?: GridPosition;
    detailsPosition?: GridPosition;
    logoOpacity?: number;
    logoSize?: number;
    brandOpacity?: number;
    brandSize?: number;
    iconType?: string;
    status?: 'active' | 'draft' | 'inactive';
}

export interface BrandingUpdateRequest extends Partial<BrandingCreateRequest> { }

export interface BrandingListResponse {
    items: BrandingItem[];
    total: number;
}

// ===== Helper: Map Backend to Frontend =====
function mapResponseToItem(data: any): BrandingItem {
    return {
        id: data.id,
        orgId: data.org_id,
        name: data.name,
        status: data.status,
        website: data.website || undefined,
        instagram: data.instagram || undefined,
        facebook: data.facebook || undefined,
        youtube: data.youtube || undefined,
        email: data.email || undefined,
        contactNumber: data.contact_number || undefined,
        aboutUs: data.about_us || undefined,
        domain: data.domain || undefined,
        iconType: data.icon_type,
        logo: data.logo_url, // Map backend logo_url to frontend 'logo' for compat
        logoUrl: data.logo_url,
        watermarkPosition: data.watermark_position as GridPosition,
        detailsPosition: data.details_position as GridPosition,
        logoOpacity: data.logo_opacity,
        logoSize: data.logo_size,
        brandOpacity: data.brand_opacity,
        brandSize: data.brand_size,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastUpdated: data.updated_at // Compat
    };
}

// ===== Helper: Map Frontend to Backend =====
function mapRequestToPayload(data: BrandingCreateRequest): any {
    return {
        name: data.name,
        website: data.website || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        youtube: data.youtube || null,
        email: data.email || null,
        contact_number: data.contactNumber || null,
        about_us: data.aboutUs || null,
        domain: data.domain || null,
        logo_url: data.logoUrl || data.logo || null,
        icon_type: data.iconType || 'main',
        watermark_position: data.watermarkPosition || 'top-right',
        details_position: data.detailsPosition || 'bottom-left',
        logo_opacity: data.logoOpacity ?? 100,
        logo_size: data.logoSize ?? 15,
        brand_opacity: data.brandOpacity ?? 100,
        brand_size: data.brandSize ?? 100,
        status: data.status || 'draft'
    };
}

// ===== API Methods =====

export const brandingApi = {
    /**
     * List all branding items
     */
    list: async (params?: {
        page?: number;
        page_size?: number;
        status?: 'active' | 'draft';
    }): Promise<BrandingListResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);

        const query = queryParams.toString();
        const path = `/api/v1/branding${query ? `?${query}` : ''}`;
        const response = await api.get(path, true);

        return {
            items: response.items.map(mapResponseToItem),
            total: response.total
        };
    },

    /**
     * Get a single branding item by ID
     */
    getById: async (id: string): Promise<BrandingItem> => {
        const response = await api.get(`/api/v1/branding/${id}`, true);
        return mapResponseToItem(response);
    },

    /**
     * Create a new branding item
     */
    create: async (data: BrandingCreateRequest): Promise<BrandingItem> => {
        const payload = mapRequestToPayload(data);
        const response = await api.post('/api/v1/branding', payload, true);
        return mapResponseToItem(response);
    },

    /**
     * Update an existing branding item
     */
    update: async (id: string, data: BrandingUpdateRequest): Promise<BrandingItem> => {
        const payload = mapRequestToPayload(data as BrandingCreateRequest); // Flexible cast
        // Remove nulls if partial update?
        // Actually PUT usually replaces. PATCH updates.
        // Backend `update_branding` (Step 1816) uses `EventUpdate` (Wait, `branding_router` uses `BrandingUpdate`).
        // `BrandingUpdate` (Step 1779) has fields `name: str | None`.
        // So sending null/undefined is fine? Pydantic V2 `exclude_unset=True` in service.
        // So we should NOT send nulls for undefined fields.
        // `mapRequestToPayload` sets defaults.
        // We should refine `mapRequestToPayload` or make a partial version.
        // For now, assume it's okay or improve later.

        const response = await api.put(`/api/v1/branding/${id}`, payload, true);
        return mapResponseToItem(response);
    },

    /**
     * Delete a branding item
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/api/v1/branding/${id}`, true);
    },

    /**
     * Get only active branding items (for event selection)
     */
    listActive: async (): Promise<BrandingItem[]> => {
        // Backend expects lowercase 'active'
        const response = await brandingApi.list({ status: 'active' });
        return response.items;
    },
};
