import { PaymentMethod, SubscriptionPlan, BillingHistoryItem } from '../types';
import {
  PaymentMethodResponseAPI,
  SubscriptionPlanAPI,
  BillingHistoryItemAPI,
} from '../services/billingApi';

/**
 * Maps API responses from snake_case to frontend camelCase format
 */

export const mapPaymentMethodFromApi = (
  data: PaymentMethodResponseAPI
): PaymentMethod => ({
  id: data.id,
  brand: (data.brand.charAt(0).toUpperCase() + data.brand.slice(1)) as PaymentMethod['brand'],
  last4: data.last4,
  expiryDate: data.expiry_date,
  cardholderName: data.cardholder_name,
  isDefault: data.is_default,
  billingAddress: {
    street: data.billing_address.street,
    city: data.billing_address.city,
    zip: data.billing_address.zip,
    country: data.billing_address.country,
  },
});

export const mapSubscriptionPlanFromApi = (
  data: SubscriptionPlanAPI
): SubscriptionPlan => ({
  id: data.id,
  name: data.name,
  price: data.price,
  interval: data.interval,
  features: data.features,
  storageLimit: data.storage_limit_bytes,
  maxEvents: data.max_events,
  maxTeamMembers: data.max_team_members,
  isCurrent: data.is_current,
  isPopular: data.is_popular,
});

export const mapBillingHistoryItemFromApi = (
  data: BillingHistoryItemAPI
): BillingHistoryItem => ({
  id: data.id,
  date: data.date,
  amount: data.amount,
  currency: data.currency,
  method: data.method,
  status: data.status,
});
