import React, { createContext, useContext, useState, useCallback } from 'react';
import { PaymentMethod, SubscriptionPlan, BillingHistoryItem } from '../types';
import {
  billingApi,
  PaymentMethodListAPI,
  SubscriptionPlanListAPI,
  SubscriptionResponseAPI,
  BillingHistoryListAPI,
} from '../services/billingApi';
import {
  mapPaymentMethodFromApi,
  mapSubscriptionPlanFromApi,
  mapBillingHistoryItemFromApi,
} from '../utils/billingMappers';

interface BillingContextType {
  // Data state
  paymentMethods: PaymentMethod[];
  plans: SubscriptionPlan[];
  subscription: {
    planId: string;
    planName: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  billingHistory: BillingHistoryItem[];
  billingHistoryTotal: number;
  billingHistoryPage: number;
  billingHistoryPageSize: number;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Fetch functions
  fetchPaymentMethods: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchBillingHistory: (page?: number, pageSize?: number) => Promise<void>;
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
  }) => Promise<PaymentMethod>;
  deletePaymentMethod: (id: string) => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
}

const BillingContext = createContext<BillingContextType | null>(null);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<BillingContextType['subscription']>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [billingHistoryTotal, setBillingHistoryTotal] = useState(0);
  const [billingHistoryPage, setBillingHistoryPage] = useState(1);
  const [billingHistoryPageSize, setBillingHistoryPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await billingApi.listPaymentMethods()) as PaymentMethodListAPI;
      setPaymentMethods(data.items.map(mapPaymentMethodFromApi));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment methods');
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await billingApi.listPlans()) as SubscriptionPlanListAPI;
      setPlans(data.items.map(mapSubscriptionPlanFromApi));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plans');
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await billingApi.getSubscription()) as SubscriptionResponseAPI | null;
      if (data) {
        setSubscription({
          planId: data.plan_id,
          planName: data.plan_name,
          status: data.status,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end,
        });
      } else {
        setSubscription(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBillingHistory = useCallback(async (page = 1, pageSize = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await billingApi.listBillingHistory(page, pageSize)) as BillingHistoryListAPI;
      setBillingHistory(data.items.map(mapBillingHistoryItemFromApi));
      setBillingHistoryTotal(data.total);
      setBillingHistoryPage(data.page);
      setBillingHistoryPageSize(data.page_size);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch billing history');
      setBillingHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPaymentMethod = useCallback(
    async (data: Parameters<typeof billingApi.addPaymentMethod>[0]) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await billingApi.addPaymentMethod(data);
        const newMethod = mapPaymentMethodFromApi(response);
        setPaymentMethods((prev) => [...prev, newMethod]);
        return newMethod;
      } catch (err: any) {
        setError(err.message || 'Failed to add payment method');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deletePaymentMethod = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await billingApi.deletePaymentMethod(id);
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete payment method');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSubscription = useCallback(async (planId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await billingApi.updateSubscription(planId);
      // Refetch subscription after update
      await fetchSubscription();
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscription]);

  return (
    <BillingContext.Provider
      value={{
        paymentMethods,
        plans,
        subscription,
        billingHistory,
        billingHistoryTotal,
        billingHistoryPage,
        billingHistoryPageSize,
        isLoading,
        error,
        fetchPaymentMethods,
        fetchPlans,
        fetchSubscription,
        fetchBillingHistory,
        addPaymentMethod,
        deletePaymentMethod,
        updateSubscription,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = (): BillingContextType => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within BillingProvider');
  }
  return context;
};
