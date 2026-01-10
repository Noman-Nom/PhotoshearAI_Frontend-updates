
import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 block">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-start",
              leftIcon && "ps-10",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm font-medium text-red-500 text-start">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
