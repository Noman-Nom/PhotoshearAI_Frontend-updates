import { GuestRecord } from '../types';

export const DUMMY_USER = {
    id: 'danish_1',
    email: 'Danish@yopmail.com',
    firstName: 'Danish',
    lastName: 'Mukhtar',
    companyName: 'Photmo Inc.',
    companyUrl: 'photmo'
};

// --- Shared Data Types ---
export interface SharedMediaItem {
    id: string;
    type: 'photo' | 'video';
    url: string;
    thumbnailUrl?: string;
    name: string;
    sizeBytes: number;
    dateAdded?: string;
    processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SharedCollection {
    id: string;
    title: string;
    photoCount: number;
    videoCount: number;
    thumbnailUrl?: string;
    isDefault?: boolean;
    items: SharedMediaItem[];
}

export interface SharedEvent {
    id: string;
    workspaceId: string;
    title: string;
    date: string;
    status: 'Published' | 'Draft';
    coverUrl: string;
    totalPhotos: number;
    totalVideos: number;
    totalSizeBytes: number;
    collections: SharedCollection[];
    collaborators: string[];
    description?: string;
    type?: string;
    branding?: boolean;
    brandingId?: string;
    customerName?: string;
    customerEmail?: string;
}

// Events localStorage (will be migrated to API in Phase 2)
const EVENT_STORAGE_KEY = 'shared_events_v2';
// DEPRECATED: This local storage registry is replaced by backend client access APIs.
// Kept for offline demo purposes only.
const GUEST_REGISTRY_KEY = 'photmo_guest_registry_v1';

const loadEvents = (): SharedEvent[] => {
    try {
        const stored = localStorage.getItem(EVENT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const SHARED_EVENTS: SharedEvent[] = loadEvents();

export const saveEventsToStorage = () => {
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(SHARED_EVENTS));
};

// --- Guest Data Collection Registry ---

export const loadGuestRegistry = (): GuestRecord[] => {
    try {
        const stored = localStorage.getItem(GUEST_REGISTRY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const saveGuestToRegistry = (record: GuestRecord) => {
    const registry = loadGuestRegistry();
    // Prevent duplicate entries for same session if logic is re-run
    if (!registry.some(r => r.id === record.id)) {
        registry.unshift(record);
        localStorage.setItem(GUEST_REGISTRY_KEY, JSON.stringify(registry));
    }
};

export const incrementGuestDownloadCount = (recordId: string) => {
    const registry = loadGuestRegistry();
    const updated = registry.map(r =>
        r.id === recordId ? { ...r, downloadCount: r.downloadCount + 1 } : r
    );
    localStorage.setItem(GUEST_REGISTRY_KEY, JSON.stringify(updated));
};

// --- Email Simulation Logic ---
export interface SimulatedEmail {
    id: string;
    to: string;
    subject: string;
    body: string;
    date: string;
    status: 'Sent' | 'Delivered';
}

const EMAIL_STORAGE_KEY = 'simulated_emails_v1';

const loadEmails = (): SimulatedEmail[] => {
    try {
        const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const SIMULATED_EMAILS: SimulatedEmail[] = loadEmails();

export const saveEmailsToStorage = () => {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(SIMULATED_EMAILS));
};

export const addSimulatedEmail = (email: Omit<SimulatedEmail, 'id' | 'date' | 'status'>) => {
    const newEmail: SimulatedEmail = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        status: 'Sent',
        ...email
    };
    SIMULATED_EMAILS.unshift(newEmail);
    saveEmailsToStorage();
};
