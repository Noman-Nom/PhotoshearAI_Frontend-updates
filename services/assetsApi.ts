import { api } from '../utils/api';

// ===== API Request/Response Types (matching OpenAPI schema) =====

export interface AssetUploadRequest {
  filename: string;
  content_type?: string;
  asset_type?: 'logo' | 'banner' | 'avatar' | 'generic';
  workspace_id?: string | null;
  event_id?: string | null;
}

export interface AssetUploadResponse {
  asset_id: string;
  upload_url: string;
  asset_url: string;
  expires_in?: number;
}

export interface AssetConfirmRequest {
  asset_id: string;
}

export interface AssetConfirmResponse {
  asset_id: string;
  asset_url: string;
  status: string;
}

export interface AssetViewResponse {
  asset_id: string;
  asset_url: string;
  asset_type?: string | null;
  filename?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  created_at?: string | null;
}

export interface AssetDeleteResponse {
  asset_id: string;
  status: string;
}

export interface AssetUpdateRequest {
  filename: string;
  content_type?: string;
}

export interface AssetUpdateResponse {
  asset_id: string;
  upload_url: string;
  asset_url: string;
}

// ===== Assets API Methods =====

export const assetsApi = {
  /**
   * Upload an asset (logo, banner, avatar, etc.)
   * This is a 2-step process:
   * 1. Get presigned URL and asset_url
   * 2. Upload file to S3 (PUT request has no response)
   */
  upload: async (
    request: AssetUploadRequest,
    file: File
  ): Promise<{ asset_id: string; asset_url: string }> => {
    // Step 1: Get presigned URL and asset_url
    const createResp = await api.post('/api/v1/assets/upload', request, true);
    if (!createResp?.upload_url || !createResp?.asset_id || !createResp?.asset_url) {
      throw new Error('Invalid upload response from server');
    }

    // Step 2: Upload file to S3 (no response expected)
    await fetch(createResp.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': request.content_type || file.type || 'application/octet-stream',
      },
      body: file,
    });

    // Return asset_url from initial response
    return {
      asset_id: createResp.asset_id,
      asset_url: createResp.asset_url
    };
  },

  /**
   * Get presigned upload URL only (for manual upload flow)
   */
  getUploadUrl: async (
    request: AssetUploadRequest
  ): Promise<AssetUploadResponse> => {
    return api.post('/api/v1/assets/upload', request, true);
  },

  /**
   * Confirm asset upload after manual S3 upload
   */
  confirm: async (
    request: AssetConfirmRequest
  ): Promise<AssetConfirmResponse> => {
    return api.post('/api/v1/assets/confirm', request, true);
  },

  /**
   * View asset details
   */
  view: async (assetId: string): Promise<AssetViewResponse> => {
    return api.get(`/api/v1/assets/${assetId}`, true);
  },

  /**
   * Delete an asset
   */
  delete: async (assetId: string): Promise<AssetDeleteResponse> => {
    return api.delete(`/api/v1/assets/${assetId}`, true);
  },

  /**
   * Update an existing asset (replaces file content)
   * Returns presigned URL for uploading new file
   */
  update: async (
    assetId: string,
    request: AssetUpdateRequest,
    file: File
  ): Promise<{ asset_id: string; asset_url: string }> => {
    // Step 1: Get presigned URL and asset_url for update
    const updateResp = await api.put(
      `/api/v1/assets/${assetId}`,
      request,
      true
    );

    if (!updateResp?.upload_url || !updateResp?.asset_url) {
      throw new Error('Invalid update response from server');
    }

    // Step 2: Upload new file to S3 (no response expected)
    await fetch(updateResp.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': request.content_type || file.type || 'application/octet-stream',
      },
      body: file,
    });

    // Return asset_url from update response
    return {
      asset_id: assetId,
      asset_url: updateResp.asset_url
    };
  },
};

/**
 * Helper function to get file type from filename
 */
export const getContentType = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop();
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return contentTypes[ext || ''] || 'application/octet-stream';
};

/**
 * Helper function to validate file size (max 10MB for images)
 */
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Helper function to validate file type
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some((type) => file.type.startsWith(type));
};
