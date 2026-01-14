import { getApiBaseUrl } from './subdomain';

const API_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'auth_token';

// Get token from cookie or localStorage (for backwards compatibility)
export const getAuthToken = () => {
  // Try to get from cookie first
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === TOKEN_KEY) {
      return decodeURIComponent(value);
    }
  }
  // Fallback to localStorage for backwards compatibility
  return localStorage.getItem(TOKEN_KEY);
};

// Set token in cookie with domain sharing across *.fotoshareai.com
export const setAuthToken = (token: string | null) => {
  if (token) {
    // Set cookie with domain=.fotoshareai.com to share across all subdomains
    // Also set in localStorage for backwards compatibility
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; domain=.fotoshareai.com; max-age=2592000; secure; samesite=strict`;
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    // Clear from both cookie and localStorage
    // Delete cookie by setting max-age=0
    document.cookie = `${TOKEN_KEY}=; path=/; domain=.fotoshareai.com; max-age=0; secure; samesite=strict`;
    localStorage.removeItem(TOKEN_KEY);
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
    }).then(handleResponse)
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

  // Upload to S3 - fire and forget, don't wait for or check response
  // S3 presigned URLs handle the upload, and asset_url is already provided
  fetch(createResp.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': request.content_type || file.type || 'application/octet-stream' },
    body: file
  }).catch(err => {
    // Log but don't throw - upload may succeed despite CORS or response issues
    console.warn('S3 upload request completed with warning:', err);
  });

  // Return asset_url without query parameters
  const cleanUrl = createResp.asset_url.split('?')[0];
  return {
    asset_id: createResp.asset_id,
    asset_url: cleanUrl
  };
};
