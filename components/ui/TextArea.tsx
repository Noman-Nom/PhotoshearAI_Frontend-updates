import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium leading-none text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 min-h-[100px] resize-y",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";