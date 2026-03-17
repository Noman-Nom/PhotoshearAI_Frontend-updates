import React, { forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 block">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 text-slate-400 pointer-events-none">
            <Lock size={18} />
          </div>
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-start pl-10 pr-10 shadow-sm hover:shadow-md hover:border-slate-300',
              error && 'border-red-400 focus:ring-red-500 focus:ring-2',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-slate-400 hover:text-slate-600 transition-colors duration-200"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
        {error && <p className="text-sm font-medium text-red-500 text-start mt-1.5">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
