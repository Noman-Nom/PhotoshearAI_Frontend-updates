/**
 * Data mappers for converting API responses to frontend types.
 */
import { User } from '../types';

/**
 * API user response payload (snake_case from backend).
 */
export interface ApiUserPayload {
  id: string;
  email: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  company_name?: string;
  companyName?: string;
  company_url?: string;
  companyUrl?: string;
  subdomain?: string;
  phone?: string;
  mfa_enabled?: boolean;
  mfaEnabled?: boolean;
  mfa_method?: 'Email' | 'Authenticator' | 'SMS';
  mfaMethod?: 'Email' | 'Authenticator' | 'SMS';
  status?: string;
  oauth_provider?: string;
  profile_picture?: string;
}

/**
 * Map API user response to frontend User type.
 * Handles both snake_case (API) and camelCase (legacy/mixed) payloads.
 */
export function mapUserFromApi(payload: ApiUserPayload): User {
  return {
    id: payload.id,
    email: payload.email,
    firstName: payload.first_name ?? payload.firstName ?? '',
    lastName: payload.last_name ?? payload.lastName ?? '',
    companyName: payload.company_name ?? payload.companyName,
    companyUrl: payload.company_url ?? payload.companyUrl ?? payload.subdomain,
    subdomain: payload.subdomain,
    phone: payload.phone,
    mfaEnabled: payload.mfa_enabled ?? payload.mfaEnabled,
    mfaMethod: payload.mfa_method ?? payload.mfaMethod,
    status: payload.status,
  };
}
