import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onBack?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  contentClassName,
  onBack
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div 
        className={cn(
          "relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white z-20">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 -ml-2 rounded-full hover:bg-slate-100"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className={cn("p-6 overflow-y-auto flex-1 custom-scrollbar", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
};