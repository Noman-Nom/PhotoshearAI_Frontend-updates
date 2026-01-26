/**
 * PositionSelector Component
 * 
 * A 3x3 grid selector for choosing watermark/logo positions.
 * Used in branding configuration and event creation.
 */
import React from 'react';
import { cn } from '../../utils/cn';
import { GridPosition, GRID_POSITIONS, getPositionLabel } from '../../utils/positionHelpers';

interface PositionSelectorProps {
    current: GridPosition;
    onChange: (position: GridPosition) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}

const sizeClasses = {
    sm: 'max-w-[140px] gap-1 p-1.5',
    md: 'max-w-[200px] gap-1.5 p-2',
    lg: 'max-w-[260px] gap-2 p-3',
};

const dotSizes = {
    sm: 'rounded-md',
    md: 'rounded-md',
    lg: 'rounded-lg',
};

export const PositionSelector: React.FC<PositionSelectorProps> = ({
    current,
    onChange,
    className,
    size = 'md',
    disabled = false,
}) => {
    return (
        <div
            className={cn(
                "aspect-square rounded-xl border border-slate-200 bg-slate-50 grid grid-cols-3 grid-rows-3 w-full",
                sizeClasses[size],
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            {GRID_POSITIONS.map((pos) => (
                <button
                    key={pos}
                    type="button"
                    onClick={() => !disabled && onChange(pos)}
                    disabled={disabled}
                    className={cn(
                        "w-full h-full transition-all duration-200 border-2",
                        dotSizes[size],
                        current === pos
                            ? "bg-blue-600 border-blue-600 shadow-sm transform scale-105"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                        disabled && "cursor-not-allowed hover:border-slate-200 hover:bg-white"
                    )}
                    title={getPositionLabel(pos)}
                    aria-label={`Position: ${getPositionLabel(pos)}`}
                    aria-pressed={current === pos}
                />
            ))}
        </div>
    );
};

export default PositionSelector;
