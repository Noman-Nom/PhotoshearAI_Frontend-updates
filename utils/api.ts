import { getApiBaseUrl } from './subdomain';

const API_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'auth_token';

// Session expiry event name - used to notify components of auth failures
export const SESSION_EXPIRED_EVENT = 'fotoshare:session_expired';

/**
 * Dispatch session expired event for global handling
 */
// Rate limit session expired events to prevent toast spam
let lastSessionExpired = 0;
const SESSION_EXPIRED_COOLDOWN = 2000; // 2 seconds

/**
 * Dispatch session expired event for global handling
 * Rate-limited to avoid spamming user with toasts
 */
export const dispatchSessionExpired = () => {
  const now = Date.now();
  if (now - lastSessionExpired > SESSION_EXPIRED_COOLDOWN) {
    lastSessionExpired = now;
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
      detail: { timestamp: now }
    }));
  }
};

/**
 * Get the root domain for cookie sharing
 * Returns .fotoshareai.com for production, empty for localhost
 */
const getCookieDomain = (): string => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return ''; // No domain for localhost
  }
  return '.fotoshareai.com';
};

/**
 * Get auth token from cookie (shared across all *.fotoshareai.com subdomains)
 */
export const getAuthToken = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === TOKEN_KEY && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

/**
 * Set auth token in cookie with cross-subdomain sharing
 * Uses domain=.fotoshareai.com to share across all subdomains
 */
export const setAuthToken = (token: string | null) => {
  const domain = getCookieDomain();
  const secure = window.location.protocol === 'https:' ? '; secure' : '';

  if (token) {
    // Set cookie with 30 days expiry, shared across all subdomains
    const cookieValue = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/${domain ? `; domain=${domain}` : ''}; max-age=2592000${secure}; samesite=lax`;
    document.cookie = cookieValue;
  } else {
    // Clear cookie by setting max-age=0 for all possible domains
    // Clear with domain
    if (domain) {
      document.cookie = `${TOKEN_KEY}=; path=/; domain=${domain}; max-age=0${secure}; samesite=lax`;
    }
    // Clear without domain (for current subdomain only)
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0${secure}; samesite=lax`;
    // Also clear from current hostname explicitly
    document.cookie = `${TOKEN_KEY}=; path=/; domain=${window.location.hostname}; max-age=0${secure}; samesite=lax`;
  }
};
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export class ApiError extends Error {
  status: number;
  details: any;
  constructor(message: string, status: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const buildHeaders = (isJson: boolean, includeAuth: boolean) => {
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (includeAuth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }

  // Handle 401 Unauthorized - session expired or invalid token
  if (res.status === 401) {
    // Clear token and dispatch session expired event
    setAuthToken(null);
    dispatchSessionExpired();
  }

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  const message = payload?.error?.message || payload?.detail || res.statusText || 'Request failed';
  throw new ApiError(message, res.status, payload);
};

export const api = {
  get: (path: string, includeAuth = true) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: buildHeaders(false, includeAuth),
      credentials: 'include'
    }).then(handleResponse),
  post: (path: string, body?: any, includeAuth = true) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(true, includeAuth),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    }).then(handleResponse),
  put: (path: string, body?: any, includeAuth = true) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(true, includeAuth),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    }).then(handleResponse),
  delete: (path: string, includeAuth = true) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: buildHeaders(false, includeAuth),
      credentials: 'include'
    }).then(handleResponse),
  postBlob: (path: string, body?: any, includeAuth = true) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(true, includeAuth),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    }).then(async res => {
      if (!res.ok) return handleResponse(res);
      return res.blob();
    })
};


export const uploadAsset = async (request: {
  filename: string;
  content_type?: string;
  asset_type?: 'logo' | 'banner' | 'avatar' | 'generic';
  workspace_id?: string | null;
  event_id?: string | null;
}, file: File) => {
  const createResp = await api.post('/api/v1/assets/upload', request, true);
  if (!createResp?.upload_url || !createResp?.asset_id || !createResp?.asset_url) {
    throw new ApiError('Invalid upload response', 500, createResp);
  }

  // Upload to S3 - wait for and check response
  try {
    const uploadRes = await fetch(createResp.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': request.content_type || file.type || 'application/octet-stream' },
      body: file
    });

    if (!uploadRes.ok) {
      console.error('S3 Upload Failed:', uploadRes.status, uploadRes.statusText);
      throw new ApiError('Failed to upload file to storage', uploadRes.status);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.warn('Storage upload encountered a network/CORS error, but the transfer may have completed:', err);
    // If it's a network error (like CORS), we might still want to proceed if the user says "it works but shows failed"
    // However, usually we should throw. To be safe with S3 CORS, we log it.
    throw new ApiError('Network error during storage upload. Please check your connection.', 0);
  }

  // Return asset_url without query parameters
  const cleanUrl = createResp.asset_url.split('?')[0];
  return {
    asset_id: createResp.asset_id,
    asset_url: cleanUrl
  };
};

export const uploadEventMedia = async (
  eventId: string,
  collectionId: string,
  file: File
) => {
  const request = {
    collection_id: collectionId,
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size
  };

  const createResp = await api.post(`/api/v1/events/${eventId}/media/upload`, request, true);

  if (!createResp?.upload_url || !createResp?.media_id) {
    throw new ApiError('Invalid upload response', 500, createResp);
  }

  // Upload to S3
  try {
    const uploadRes = await fetch(createResp.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': request.content_type },
      body: file
    });

    if (!uploadRes.ok) {
      console.error('S3 Media Upload Failed:', uploadRes.status, uploadRes.statusText);
      throw new ApiError('Failed to upload media to storage', uploadRes.status);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.warn('Media storage upload error (possibly CORS):', err);
    throw new ApiError('Network error during media upload.', 0);
  }

  // Clean URL similar to assets
  const cleanUrl = createResp.media_url?.split('?')[0] || createResp.media_url;

  return {
    ...createResp,
    media_url: cleanUrl
  };
};
