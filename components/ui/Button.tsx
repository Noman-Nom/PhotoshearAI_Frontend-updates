import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  isLoading,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white active:scale-95";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 shadow-sm hover:shadow-md",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-500 shadow-sm hover:shadow",
    ghost: "hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-500",
  };

  const sizes = "h-10 py-2 px-4";

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};