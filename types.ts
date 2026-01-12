
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  companyUrl?: string;
  subdomain?: string;
  phone?: string;
  mfaEnabled?: boolean;
  mfaMethod?: 'Email' | 'Authenticator' | 'SMS';
  status?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Country {
  code: string;
  name: string;
  dialCode: string;
}

export enum AuthStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface Role {
  id: string;
  name: string;
  level: 'organization' | 'studio';
  description?: string;
  permissions: string[];
  memberCount: number;
  isSystem?: boolean;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  eventsCount: number;
  accessLevel: 'Specific Event' | 'Full Access';
  allowedEventIds?: string[];
  allowedWorkspaceIds?: string[];
  avatarColor: string;
  initials: string;
  isOwner?: boolean;
  joinedDate?: string;
}

export interface PendingMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  location?: string;
  sentDate: string;
  accessLevel: 'Specific Event' | 'Full Access';
  allowedEventIds?: string[];
  allowedWorkspaceIds?: string[];
  status: 'Awaiting Response' | 'Invitation Expired';
  isOwner?: boolean;
}

export interface GuestRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  workspaceId: string;
  workspaceName: string;
  eventId: string;
  eventName: string;
  accessDate: string;
  downloadCount: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  isCurrent?: boolean;
  isPopular?: boolean;
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  amount: string;
  currency: string;
  method: string;
  status: 'Paid' | 'Failed' | 'Refunded';
}

export interface BillingAddress {
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface PaymentMethod {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Generic';
  last4: string;
  expiryDate: string;
  cardholderName: string;
  isDefault?: boolean;
  billingAddress: BillingAddress;
}
