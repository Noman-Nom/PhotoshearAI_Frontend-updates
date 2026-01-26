/**
 * Position helper utilities for watermark/logo placement.
 * Used by branding and event creation for consistent positioning.
 */

export type GridPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export const GRID_POSITIONS: GridPosition[] = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right'
];

/**
 * Returns Tailwind classes for absolute positioning within a container.
 */
export const getAbsolutePosition = (pos: GridPosition): string => {
    switch (pos) {
        case 'top-left': return 'top-0 left-0';
        case 'top-center': return 'top-0 left-1/2 -translate-x-1/2';
        case 'top-right': return 'top-0 right-0';
        case 'center-left': return 'top-1/2 left-0 -translate-y-1/2';
        case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
        case 'center-right': return 'top-1/2 right-0 -translate-y-1/2';
        case 'bottom-left': return 'bottom-0 left-0';
        case 'bottom-center': return 'bottom-0 left-1/2 -translate-x-1/2';
        case 'bottom-right': return 'bottom-0 right-0';
        default: return 'bottom-0 right-0';
    }
};

/**
 * Returns Tailwind classes for text alignment based on position.
 */
export const getTextAlignment = (pos: GridPosition): string => {
    if (pos.includes('left')) return 'text-left items-start';
    if (pos.includes('right')) return 'text-right items-end';
    return 'text-center items-center';
};

/**
 * Returns Tailwind classes for gradient overlay based on position.
 * Creates a fade effect from the positioned edge.
 */
export const getGradientClass = (pos: GridPosition): string => {
    if (pos.startsWith('top')) return 'bg-gradient-to-b from-black/80 via-black/20 to-transparent';
    if (pos.startsWith('bottom')) return 'bg-gradient-to-t from-black/80 via-black/20 to-transparent';
    return 'bg-black/40';
};

/**
 * Converts position to human-readable label.
 */
export const getPositionLabel = (pos: GridPosition): string => {
    return pos.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};
