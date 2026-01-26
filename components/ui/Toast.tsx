import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertOctagon size={20} className="text-red-500" />,
    warning: <AlertTriangle size={20} className="text-amber-500" />,
    info: <Info size={20} className="text-blue-500" />
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    return (
        <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-4 flex items-start gap-3 min-w-[300px] max-w-[400px] animate-in slide-in-from-right-full fade-in duration-300 pointer-events-auto">
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-medium text-slate-700 break-words leading-tight">{message}</p>
            <button onClick={() => onClose(id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};
