
import React from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';

interface LanguageSwitcherProps {
  className?: string;
  direction?: 'up' | 'down';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className, 
  direction = 'down' 
}) => {
  const { language, setLanguage, isRTL } = useTranslation();

  const langs = [
    { code: 'en', label: 'English', flag: '🇺🇸', sub: 'US' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰', sub: 'PK' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺', sub: 'RU' },
  ];

  return (
    <div className={cn("relative group", className)}>
      <button className="flex items-center justify-between w-full px-3 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm group-hover:border-slate-300">
        <div className="flex items-center gap-2">
          <Languages size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
            {langs.find(l => l.code === language)?.label}
          </span>
        </div>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform group-hover:rotate-180", direction === 'up' && "rotate-180 group-hover:rotate-0")} />
      </button>
      
      <div className={cn(
        "absolute right-0 w-full min-w-[140px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all scale-95 group-hover:scale-100",
        direction === 'up' ? "bottom-full mb-3 origin-bottom-right" : "top-full mt-2 origin-top-right"
      )}>
        {langs.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code as any)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-bold transition-colors text-start",
              language === l.code ? "text-blue-600 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="uppercase">{l.label}</span>
            </div>
            <span className="text-[9px] opacity-40 font-mono">{l.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
