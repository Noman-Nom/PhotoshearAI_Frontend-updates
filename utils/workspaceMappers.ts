import { WorkspaceResponse, WorkspaceListResponse } from '../services/workspaceApi';
import { Workspace, WorkspaceSettings } from '../constants';

/**
 * Map API WorkspaceSettings to frontend WorkspaceSettings
 */
export const mapWorkspaceSettings = (apiSettings?: {
  photo_gallery?: boolean;
  qr_sharing?: boolean;
  download_protection?: boolean;
  client_comments?: boolean;
} | null): WorkspaceSettings => {
  return {
    photoGallery: apiSettings?.photo_gallery ?? true,
    qrSharing: apiSettings?.qr_sharing ?? true,
    downloadProtection: apiSettings?.download_protection ?? false,
    clientComments: apiSettings?.client_comments ?? true
  };
};

/**
 * Map API WorkspaceResponse to frontend Workspace
 */
export const mapWorkspaceResponseToWorkspace = (apiWorkspace: WorkspaceResponse): Workspace => {
  return {
    id: apiWorkspace.id,
    name: apiWorkspace.name,
    description: apiWorkspace.description || '',
    url: apiWorkspace.slug,
    studioType: apiWorkspace.studio_type || undefined,
    timezone: apiWorkspace.timezone || undefined,
    currency: apiWorkspace.currency || undefined,
    colorTheme: apiWorkspace.color_theme || undefined,
    logo: apiWorkspace.logo_url || undefined,
    settings: apiWorkspace.settings ? mapWorkspaceSettings(apiWorkspace.settings) : undefined,
    status: apiWorkspace.status === 'active' ? 'Active' : 'Setup',
    iconType: apiWorkspace.icon_type as 'camera' | 'building' | 'heart' | 'star',
    eventsCount: apiWorkspace.events_count || 0,
    membersCount: apiWorkspace.members_count || 0,
    collaborators: [] // This will be populated from members API if needed
  };
};

/**
 * Map API WorkspaceListResponse to frontend Workspace (list item)
 */
export const mapWorkspaceListToWorkspace = (apiWorkspace: WorkspaceListResponse): Workspace => {
  return {
    id: apiWorkspace.id,
    name: apiWorkspace.name,
    description: apiWorkspace.description || '',
    url: apiWorkspace.slug,
    status: apiWorkspace.status === 'active' ? 'Active' : 'Setup',
    iconType: apiWorkspace.icon_type as 'camera' | 'building' | 'heart' | 'star',
    colorTheme: apiWorkspace.color_theme || undefined,
    logo: apiWorkspace.logo_url || undefined,
    eventsCount: apiWorkspace.events_count || 0,
    membersCount: apiWorkspace.members_count || 0,
    collaborators: []
  };
};

/**
 * Map frontend WorkspaceSettings to API format
 */
export const mapWorkspaceSettingsToApi = (settings: WorkspaceSettings) => {
  return {
    photo_gallery: settings.photoGallery,
    qr_sharing: settings.qrSharing,
    download_protection: settings.downloadProtection,
    client_comments: settings.clientComments
  };
};

/**
 * Map frontend Workspace create data to API format
 */
export const mapWorkspaceCreateToApi = (workspace: Omit<Workspace, 'id' | 'eventsCount' | 'membersCount' | 'collaborators'>) => {
  return {
    name: workspace.name,
    description: workspace.description || null,
    studio_type: workspace.studioType || null,
    timezone: workspace.timezone || null,
    currency: workspace.currency || null,
    color_theme: workspace.colorTheme || null,
    icon_type: workspace.iconType,
    slug: workspace.url || null,
    logo_url: workspace.logo || null,
    settings: workspace.settings ? mapWorkspaceSettingsToApi(workspace.settings) : null
  };
};

/**
 * Map frontend Workspace update data to API format
 */
export const mapWorkspaceUpdateToApi = (workspace: Partial<Workspace>) => {
  const update: any = {};
  
  if (workspace.name !== undefined) update.name = workspace.name;
  if (workspace.description !== undefined) update.description = workspace.description || null;
  if (workspace.url !== undefined) update.slug = workspace.url || null;
  if (workspace.studioType !== undefined) update.studio_type = workspace.studioType || null;
  if (workspace.timezone !== undefined) update.timezone = workspace.timezone || null;
  if (workspace.currency !== undefined) update.currency = workspace.currency || null;
  if (workspace.colorTheme !== undefined) update.color_theme = workspace.colorTheme || null;
  if (workspace.logo !== undefined) update.logo_url = workspace.logo || null;
  if (workspace.iconType !== undefined) update.icon_type = workspace.iconType;
  if (workspace.status !== undefined) {
    update.status = workspace.status === 'Active' ? 'active' : 'setup';
  }
  
  return update;
};
