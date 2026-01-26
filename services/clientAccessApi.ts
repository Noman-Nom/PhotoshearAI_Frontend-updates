/**
 * Client Access API Service
 * 
 * Handles client/customer access to event galleries via PIN/OTP flow.
 */

import { getApiBaseUrl } from '../utils/subdomain';

const API_BASE_URL = getApiBaseUrl();
const API_PREFIX = '/api/v1';

// ============ Types ============

export interface ClientAccessRequest {
    event_id: string;
    email: string;
    pin?: string;
}

export interface ClientAccessResponse {
    success: boolean;
    message: string;
    requires_otp: boolean;
}

export interface ClientOtpVerifyRequest {
    event_id: string;
    email: string;
    otp: string;
}

export interface ClientSessionResponse {
    success: boolean;
    token: string;
    event_id: string;
    event_title: string;
    customer_name: string;
    expires_at: string;
}

export interface ClientGalleryItem {
    id: string;
    url: string;
    thumbnail_url: string;
    type: 'photo' | 'video';
    name: string;
    size_bytes: number;
    collection_id: string;
    collection_title: string;
}

export interface ClientGalleryResponse {
    event_id: string;
    event_title: string;
    customer_name: string;
    branding_enabled: boolean;
    branding_id?: string;
    collections: {
        id: string;
        title: string;
        items: ClientGalleryItem[];
    }[];
    total_items: number;
}

// ============ Helper Functions ============

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    return response.json();
}

// ============ Client Access API ============

export const clientAccessApi = {
    /**
     * Request client access - sends OTP to email
     */
    async requestAccess(eventId: string, email: string, pin?: string): Promise<ClientAccessResponse> {
        const data: ClientAccessRequest = {
            event_id: eventId,
            email,
            pin,
        };
        return apiRequest<ClientAccessResponse>('/client/access', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Verify OTP and get session token
     */
    async verifyOtp(eventId: string, email: string, otp: string): Promise<ClientSessionResponse> {
        const data: ClientOtpVerifyRequest = {
            event_id: eventId,
            email,
            otp,
        };
        return apiRequest<ClientSessionResponse>('/client/verify-otp', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get client gallery using session token
     */
    async getGallery(token: string): Promise<ClientGalleryResponse> {
        return apiRequest<ClientGalleryResponse>(`/client/gallery?token=${encodeURIComponent(token)}`);
    },
};

export default clientAccessApi;
