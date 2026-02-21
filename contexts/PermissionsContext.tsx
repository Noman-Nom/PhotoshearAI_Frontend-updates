import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { teamApi } from '../services/teamApi';

interface PermissionsContextType {
    isOwner: boolean;
    permissions: string[];
    can: (permission: string) => boolean;
    canAny: (...permissions: string[]) => boolean;
    isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isOwner, setIsOwner] = useState(false);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPermissions = useCallback(async () => {
        if (!user) {
            setIsOwner(false);
            setPermissions([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const data = await teamApi.getMyPermissions();
            setIsOwner(data.is_owner);
            setPermissions(data.permissions);
        } catch (err) {
            console.error('[PermissionsContext] Failed to load permissions:', err);
            setIsOwner(false);
            setPermissions([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const can = useCallback(
        (permission: string): boolean => {
            if (isOwner) return true;
            return permissions.includes(permission);
        },
        [isOwner, permissions]
    );

    const canAny = useCallback(
        (...perms: string[]): boolean => {
            if (isOwner) return true;
            return perms.some((p) => permissions.includes(p));
        },
        [isOwner, permissions]
    );

    const value = useMemo(
        () => ({ isOwner, permissions, can, canAny, isLoading }),
        [isOwner, permissions, can, canAny, isLoading]
    );

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};
