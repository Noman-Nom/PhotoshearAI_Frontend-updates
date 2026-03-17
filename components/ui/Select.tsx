
import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

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
          <label className="text-sm font-semibold leading-none text-slate-700 block">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-lg border border-slate-200 bg-white ps-3 pe-10 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-start appearance-none shadow-sm hover:shadow-md hover:border-slate-300",
              error && "border-red-400 focus:ring-red-500 focus:ring-2",
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
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-slate-400">
            <ChevronDown size={18} strokeWidth={2} />
          </div>
        </div>
        {error && <p className="text-sm font-medium text-red-500 text-start mt-1.5">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
