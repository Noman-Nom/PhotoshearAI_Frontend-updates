/**
 * Branding Context
 * 
 * Provides centralized state management for brand identity items.
 * Replaces direct localStorage access across components.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { brandingApi, BrandingItem, BrandingCreateRequest, BrandingUpdateRequest } from '../services/brandingApi';
import { useAuth } from './AuthContext';

interface BrandingContextType {
    /** All branding items */
    items: BrandingItem[];
    /** Active branding items only (for selection dropdowns) */
    activeItems: BrandingItem[];
    /** Loading state */
    isLoading: boolean;
    /** Whether a mutation is in progress */
    isMutating: boolean;
    /** Error message if any */
    error: string | null;
    /** Fetch/refresh branding items */
    fetchItems: () => Promise<void>;
    /** Get a single item by ID */
    getItemById: (id: string) => BrandingItem | undefined;
    /** Create a new branding item */
    createItem: (data: BrandingCreateRequest) => Promise<BrandingItem>;
    /** Update an existing branding item */
    updateItem: (id: string, data: BrandingUpdateRequest) => Promise<void>;
    /** Delete a branding item */
    deleteItem: (id: string) => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<BrandingItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch items on mount and when user changes
    const fetchItems = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await brandingApi.list({ page: 1, page_size: 100 });
            setItems(response.items);
        } catch (err: any) {
            const message = err?.message || 'Failed to fetch branding items';
            setError(message);
            console.error('[BrandingContext] Error fetching items:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchItems();
        } else {
            setItems([]);
        }
    }, [user, fetchItems]);

    // Active items only (for dropdowns/selection)
    const activeItems = useMemo(() => {
        return items.filter(item => item.status === 'Active');
    }, [items]);

    // Get item by ID
    const getItemById = useCallback((id: string): BrandingItem | undefined => {
        return items.find(item => item.id === id);
    }, [items]);

    // Create new item
    const createItem = useCallback(async (data: BrandingCreateRequest): Promise<BrandingItem> => {
        setIsMutating(true);
        setError(null);

        try {
            const newItem = await brandingApi.create(data);
            setItems(prev => [newItem, ...prev]);
            return newItem;
        } catch (err: any) {
            const message = err?.message || 'Failed to create branding item';
            setError(message);
            throw err;
        } finally {
            setIsMutating(false);
        }
    }, []);

    // Update existing item with optimistic update
    const updateItem = useCallback(async (id: string, data: BrandingUpdateRequest): Promise<void> => {
        setIsMutating(true);
        setError(null);

        // Store previous state for rollback
        const previousItems = items;

        // Optimistic update
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...data } : item
        ));

        try {
            const updatedItem = await brandingApi.update(id, data);
            // Update with actual server response
            setItems(prev => prev.map(item =>
                item.id === id ? updatedItem : item
            ));
        } catch (err: any) {
            // Rollback on error
            setItems(previousItems);
            const message = err?.message || 'Failed to update branding item';
            setError(message);
            throw err;
        } finally {
            setIsMutating(false);
        }
    }, [items]);

    // Delete item with optimistic update
    const deleteItem = useCallback(async (id: string): Promise<void> => {
        setIsMutating(true);
        setError(null);

        // Store previous state for rollback
        const previousItems = items;

        // Optimistic update
        setItems(prev => prev.filter(item => item.id !== id));

        try {
            await brandingApi.delete(id);
        } catch (err: any) {
            // Rollback on error
            setItems(previousItems);
            const message = err?.message || 'Failed to delete branding item';
            setError(message);
            throw err;
        } finally {
            setIsMutating(false);
        }
    }, [items]);

    return (
        <BrandingContext.Provider value={{
            items,
            activeItems,
            isLoading,
            isMutating,
            error,
            fetchItems,
            getItemById,
            createItem,
            updateItem,
            deleteItem,
        }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = (): BrandingContextType => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
