import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';

export interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
}

export const ModernInput: React.FC<ModernInputProps> = ({ label, icon, className, ...props }) => {
    const { isRTL } = useTranslation();
    return (
        <div className="space-y-1.5 text-start">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
            <div className="relative group">
                <div className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors", isRTL ? "right-3.5" : "left-3.5")}>
                    {icon}
                </div>
                <input
                    {...props}
                    className={cn(
                        "w-full py-3 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-start",
                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4",
                        className
                    )}
                />
            </div>
        </div>
    );
};
