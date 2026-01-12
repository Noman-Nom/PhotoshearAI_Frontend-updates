import { User } from '../types';

export const mapUserFromApi = (payload: any): User => ({
  id: payload.id,
  email: payload.email,
  firstName: payload.first_name ?? payload.firstName ?? '',
  lastName: payload.last_name ?? payload.lastName ?? '',
  companyName: payload.company_name ?? payload.companyName,
  companyUrl: payload.company_url ?? payload.companyUrl ?? payload.subdomain,
  subdomain: payload.subdomain ?? undefined,
  phone: payload.phone ?? undefined,
  mfaEnabled: payload.mfa_enabled ?? payload.mfaEnabled,
  mfaMethod: payload.mfa_method ?? payload.mfaMethod,
  status: payload.status ?? undefined
});
