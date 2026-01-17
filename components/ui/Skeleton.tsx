import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Skeleton loading component for smooth loading states
 * Use to show placeholder content while data is loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}) => {
    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-xl',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        shimmer: 'skeleton-shimmer',
        none: '',
    };

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={cn(
                'bg-slate-200',
                variantClasses[variant],
                animationClasses[animation],
                className
            )}
            style={style}
        />
    );
};

/**
 * Skeleton for a member/user card row
 */
export const SkeletonMemberRow: React.FC = () => (
    <tr className="animate-in fade-in duration-500">
        <td className="px-8 py-5">
            <div className="flex items-center gap-4">
                <Skeleton variant="rounded" className="w-12 h-12" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                </div>
            </div>
        </td>
        <td className="px-8 py-5">
            <Skeleton className="h-6 w-24 rounded-lg" />
        </td>
        <td className="px-8 py-5">
            <Skeleton className="h-4 w-20 rounded" />
        </td>
        <td className="px-8 py-5">
            <Skeleton className="h-4 w-40 rounded" />
        </td>
        <td className="px-8 py-5">
            <Skeleton className="h-8 w-16 rounded-lg ml-auto" />
        </td>
    </tr>
);

/**
 * Skeleton for a workspace card
 */
export const SkeletonWorkspaceCard: React.FC = () => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse">
        <div className="flex items-start gap-4">
            <Skeleton variant="rounded" className="w-14 h-14 flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <div className="flex gap-4 mt-4">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                </div>
            </div>
        </div>
    </div>
);

/**
 * Skeleton for a role card
 */
export const SkeletonRoleCard: React.FC = () => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton variant="circular" className="w-8 h-8" />
        </div>
        <Skeleton className="h-3 w-full rounded mb-2" />
        <Skeleton className="h-3 w-2/3 rounded" />
        <div className="mt-4 pt-4 border-t border-slate-50">
            <Skeleton className="h-4 w-24 rounded" />
        </div>
    </div>
);

/**
 * Skeleton for event cards
 */
export const SkeletonEventCard: React.FC = () => (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <Skeleton className="w-full h-40" />
        <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4 rounded" />
            <div className="flex gap-4">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
            </div>
        </div>
    </div>
);

Skeleton.displayName = 'Skeleton';
