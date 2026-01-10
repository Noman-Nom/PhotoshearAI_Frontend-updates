
import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label className="text-sm font-medium leading-none text-slate-700 block">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-md border border-slate-200 bg-white ps-3 pe-10 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-start appearance-none",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom Chevron icon to ensure it behaves correctly in both LTR and RTL without overlapping */}
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <p className="text-sm font-medium text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
