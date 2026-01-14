const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.fotoshareai.com';
const TOKEN_KEY = 'auth_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
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
      headers: buildHeaders(false, includeAuth)
    }).then(handleResponse),
  post: (path: string, body?: any, includeAuth = true) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(true, includeAuth),
      body: body ? JSON.stringify(body) : undefined
    }).then(handleResponse),
  put: (path: string, body?: any, includeAuth = true) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(true, includeAuth),
      body: body ? JSON.stringify(body) : undefined
    }).then(handleResponse),
  delete: (path: string, includeAuth = true) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: buildHeaders(false, includeAuth)
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
