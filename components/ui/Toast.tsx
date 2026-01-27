import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Flame } from 'lucide-react';
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
    success: <CheckCircle2 size={18} className="text-emerald-500" />,
    error: <AlertCircle size={18} className="text-rose-500" />,
    warning: <Flame size={18} className="text-orange-500" />,
    info: <Info size={18} className="text-blue-500" />
};

const barColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500'
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 4000, onClose }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startTime = Date.now();
        const endTime = startTime + duration;

        const updateProgress = () => {
            const now = Date.now();
            const remaining = Math.max(0, endTime - now);
            const nextProgress = (remaining / duration) * 100;

            setProgress(nextProgress);

            if (nextProgress > 0) {
                requestAnimationFrame(updateProgress);
            } else {
                onClose(id);
            }
        };

        const animationId = requestAnimationFrame(updateProgress);
        return () => cancelAnimationFrame(animationId);
    }, [id, duration, onClose]);

    return (
        <div
            className={cn(
                "group relative bg-white border-2 border-slate-900 px-4 py-4 flex items-start gap-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] min-w-[320px] max-w-[450px]",
                "animate-in slide-in-from-right-10 fade-in duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
                "pointer-events-auto overflow-hidden"
            )}
        >
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>

            <div className="flex-1 space-y-1">
                <p className="text-[13px] font-bold text-slate-900 leading-snug uppercase tracking-tight">
                    {type === 'success' ? 'Confirmed' : type === 'error' ? 'Attention' : 'Notice'}
                </p>
                <p className="text-sm font-medium text-slate-600 break-words leading-relaxed">{message}</p>
            </div>

            <button
                onClick={() => onClose(id)}
                className="text-slate-400 hover:text-slate-900 transition-colors p-1"
            >
                <X size={16} strokeWidth={3} />
            </button>

            {/* Progress Bar (Brutalist style) */}
            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-slate-100">
                <div
                    className={cn("h-full transition-all ease-linear", barColors[type])}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};
