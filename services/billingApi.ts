import { api } from '../utils/api';
import { PaymentMethod, BillingHistoryItem, SubscriptionPlan } from '../types';

/**
 * Billing API service for managing subscriptions, payment methods, and billing history
 */

// Payment Methods
export const billingApi = {
  // Payment Methods
  listPaymentMethods: () => 
    api.get('/api/v1/billing/payment-methods'),

  addPaymentMethod: (data: {
    card_number: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
    cardholder_name: string;
    billing_address: {
      street: string;
      city: string;
      zip: string;
      country: string;
    };
    is_default: boolean;
  }) =>
    api.post('/api/v1/billing/payment-methods', data),

  deletePaymentMethod: (paymentMethodId: string) =>
    api.delete(`/api/v1/billing/payment-methods/${paymentMethodId}`),

  // Plans
  listPlans: () =>
    api.get('/api/v1/billing/plans'),

  // Subscriptions
  getSubscription: () =>
    api.get('/api/v1/billing/subscription'),

  updateSubscription: (planId: string) =>
    api.post('/api/v1/billing/subscription', { plan_id: planId }),

  // Billing History
  listBillingHistory: (page: number = 1, pageSize: number = 20) =>
    api.get(`/api/v1/billing/history?page=${page}&page_size=${pageSize}`),
};

/**
 * Type definitions for API responses (as returned from backend)
 */
export interface PaymentMethodListAPI {
  items: PaymentMethodResponseAPI[];
  total: number;
}

export interface PaymentMethodResponseAPI {
  id: string;
  brand: string;
  last4: string;
  expiry_date: string;
  cardholder_name: string;
  is_default: boolean;
  billing_address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}

export interface SubscriptionPlanListAPI {
  items: SubscriptionPlanAPI[];
}

export interface SubscriptionPlanAPI {
  id: string;
  name: string;
  price: string;
  interval: string;
  features: string[];
  storage_limit_bytes: number;
  max_events: number | null;
  max_team_members: number | null;
  is_current: boolean;
  is_popular: boolean;
}

export interface SubscriptionResponseAPI {
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface BillingHistoryListAPI {
  items: BillingHistoryItemAPI[];
  total: number;
  page: number;
  page_size: number;
}

export interface BillingHistoryItemAPI {
  id: string;
  date: string;
  amount: string;
  currency: string;
  method: string;
  status: 'Paid' | 'Failed' | 'Refunded';
  description: string | null;
  invoice_url: string | null;
}
