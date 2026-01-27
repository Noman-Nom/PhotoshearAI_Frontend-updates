/**
 * Events Context
 * 
 * Provides centralized event management state and operations.
 * Migrates from localStorage SHARED_EVENTS to backend API persistence.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { eventsApi, EventResponse, EventCreateInput, EventUpdateInput, EventListResponse } from '../services/eventsApi';
import { useWorkspace } from './WorkspaceContext';
import { useToast } from './ToastContext';

// ============ Types ============

interface EventsContextValue {
    // State
    events: EventResponse[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    pageSize: number;

    // Actions
    fetchEvents: (params?: { page?: number; status?: string; search?: string }) => Promise<void>;
    getEventById: (eventId: string) => Promise<EventResponse | null>;
    createEvent: (data: EventCreateInput) => Promise<EventResponse>;
    updateEvent: (eventId: string, data: EventUpdateInput) => Promise<EventResponse>;
    deleteEvent: (eventId: string) => Promise<void>;
    publishEvent: (eventId: string) => Promise<EventResponse>;
    unpublishEvent: (eventId: string) => Promise<EventResponse>;

    // Helpers
    refreshEvents: () => Promise<void>;
    clearError: () => void;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

// ============ Provider ============

interface EventsProviderProps {
    children: ReactNode;
}

export const EventsProvider: React.FC<EventsProviderProps> = ({ children }) => {
    const { activeWorkspace } = useWorkspace();
    const { success, error: toastError } = useToast();

    // State
    const [events, setEvents] = useState<EventResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);

    // Fetch events from API
    const fetchEvents = useCallback(async (params?: { page?: number; status?: string; search?: string }) => {
        if (!activeWorkspace?.id) {
            setEvents([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await eventsApi.list(activeWorkspace.id, {
                page: params?.page || 1,
                pageSize,
                status: params?.status,
                search: params?.search,
            });

            setEvents(response.items);
            setTotalCount(response.total);
            setCurrentPage(response.page);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch events';
            setError(message);
            console.error('EventsContext.fetchEvents error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace?.id, pageSize]);

    // Get single event by ID
    const getEventById = useCallback(async (eventId: string): Promise<EventResponse | null> => {
        try {
            return await eventsApi.getById(eventId);
        } catch (err) {
            console.error('EventsContext.getEventById error:', err);
            return null;
        }
    }, []);

    // Create new event
    const createEvent = useCallback(async (data: EventCreateInput): Promise<EventResponse> => {
        if (!activeWorkspace?.id) {
            throw new Error('No active workspace selected');
        }

        setIsLoading(true);
        setError(null);

        try {
            const newEvent = await eventsApi.create(activeWorkspace.id, data);

            // Optimistic update: prepend to list
            setEvents(prev => [newEvent, ...prev]);
            setTotalCount(prev => prev + 1);

            success('Event created successfully');
            return newEvent;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create event';
            setError(message);
            toastError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace?.id]);

    // Update event
    const updateEvent = useCallback(async (eventId: string, data: EventUpdateInput): Promise<EventResponse> => {
        setIsLoading(true);
        setError(null);

        try {
            const updatedEvent = await eventsApi.update(eventId, data);

            // Optimistic update: replace in list
            setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));

            success('Event updated successfully');
            return updatedEvent;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update event';
            setError(message);
            toastError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Delete event
    const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            await eventsApi.delete(eventId);

            // Optimistic update: remove from list
            setEvents(prev => prev.filter(e => e.id !== eventId));
            setTotalCount(prev => Math.max(0, prev - 1));

            success('Event deleted successfully');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete event';
            setError(message);
            toastError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Publish event
    const publishEvent = useCallback(async (eventId: string): Promise<EventResponse> => {
        setError(null);

        try {
            const updatedEvent = await eventsApi.publish(eventId);

            // Optimistic update
            setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));

            success('Event published successfully');
            return updatedEvent;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to publish event';
            setError(message);
            toastError(message);
            throw err;
        }
    }, []);

    // Unpublish event
    const unpublishEvent = useCallback(async (eventId: string): Promise<EventResponse> => {
        setError(null);

        try {
            const updatedEvent = await eventsApi.unpublish(eventId);

            // Optimistic update
            setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));

            success('Event unpublished successfully');
            return updatedEvent;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unpublish event';
            setError(message);
            toastError(message);
            throw err;
        }
    }, []);

    // Refresh events (convenience wrapper)
    const refreshEvents = useCallback(async () => {
        await fetchEvents({ page: currentPage });
    }, [fetchEvents, currentPage]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Auto-fetch when workspace changes
    useEffect(() => {
        if (activeWorkspace?.id) {
            fetchEvents();
        }
    }, [activeWorkspace?.id, fetchEvents]);

    const value: EventsContextValue = {
        events,
        isLoading,
        error,
        totalCount,
        currentPage,
        pageSize,
        fetchEvents,
        getEventById,
        createEvent,
        updateEvent,
        deleteEvent,
        publishEvent,
        unpublishEvent,
        refreshEvents,
        clearError,
    };

    return (
        <EventsContext.Provider value={value}>
            {children}
        </EventsContext.Provider>
    );
};

// ============ Hook ============

export function useEvents(): EventsContextValue {
    const context = useContext(EventsContext);
    if (!context) {
        throw new Error('useEvents must be used within an EventsProvider');
    }
    return context;
}

export default EventsContext;
