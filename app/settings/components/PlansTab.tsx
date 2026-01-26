import React from 'react';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';
import { Check } from 'lucide-react';

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: string;
    interval: 'monthly' | 'yearly';
    features: string[];
    isCurrent?: boolean;
    isPopular?: boolean;
}

interface PlansTabProps {
    plans: SubscriptionPlan[];
    planName: string;
    isBillingLoading: boolean;
    onUpgrade: (planId: string) => void;
}

export const PlansTab: React.FC<PlansTabProps> = ({
    plans,
    planName,
    isBillingLoading,
    onUpgrade
}) => {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 text-start">
            <div className="border-b border-slate-200 pb-6 mb-10">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Enterprise Infrastructure</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Current Tier: <strong>{planName}</strong></p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {isBillingLoading && !plans.length ? (
                    <div className="col-span-full text-center py-12">
                        <p className="text-slate-400 font-bold">Loading plans...</p>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <p className="text-slate-400 font-bold">No plans available</p>
                    </div>
                ) : (
                    plans.map((plan) => (
                        <Card key={plan.id} className={cn(
                            "p-10 bg-white border-2 transition-all relative flex flex-col rounded-[2.5rem]",
                            plan.isCurrent ? "border-slate-900 ring-8 ring-slate-900/5 shadow-2xl" : "border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl",
                            plan.isPopular && !plan.isCurrent && "border-blue-500"
                        )}>
                            {plan.isPopular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">POPULAR</div>
                            )}
                            <div className="mb-8">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">/{plan.interval === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-5 mb-10">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-sm"><Check size={14} strokeWidth={4} /></div>
                                        <span className="text-[13px] font-bold text-slate-600 leading-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                disabled={plan.isCurrent || isBillingLoading}
                                onClick={() => !plan.isCurrent && onUpgrade(plan.id)}
                                className={cn("w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all", plan.isCurrent ? "bg-slate-100 text-slate-400 cursor-default shadow-inner" : "bg-[#0F172A] text-white hover:bg-slate-800 shadow-xl active:scale-95 disabled:opacity-50")}
                            >
                                {plan.isCurrent ? 'Active Hub' : 'Upgrade'}
                            </button>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
