import React from 'react';
import { cn } from '../../utils/cn';

type InlineToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  className?: string;
};

const stylesByType = {
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  error: 'bg-red-50 text-red-900 border-red-200',
  info: 'bg-slate-50 text-slate-900 border-slate-200'
};

export const InlineToast: React.FC<InlineToastProps> = ({ message, type = 'info', onClose, className }) => {
  if (!message) return null;
  return (
    <div className={cn('w-full border rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-between gap-4', stylesByType[type], className)}>
      <span className="truncate">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-xs font-black uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity">
          Close
        </button>
      )}
    </div>
  );
};

export default InlineToast;
