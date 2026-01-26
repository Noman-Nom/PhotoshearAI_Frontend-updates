import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface BillingHistoryItem {
    id: string;
    date: string;
    amount: string;
    currency: string;
    method: string;
    status: 'Paid' | 'Failed' | 'Pending';
}

interface BillingHistoryTabProps {
    billingHistory: BillingHistoryItem[];
    isBillingLoading: boolean;
}

export const BillingHistoryTab: React.FC<BillingHistoryTabProps> = ({
    billingHistory,
    isBillingLoading
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 text-start">
            <div className="border-b border-slate-200 pb-6 mb-10">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ledger & Billing</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Audit logs and financial records</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Date</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Amount</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Method</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-mono">
                            {isBillingLoading && !billingHistory.length ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-12 text-center text-slate-400">Loading billing history...</td>
                                </tr>
                            ) : billingHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-12 text-center text-slate-400">No billing history yet</td>
                                </tr>
                            ) : (
                                billingHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6"><div className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{new Date(item.date).toLocaleDateString()}</div><div className="text-[10px] text-slate-400 mt-1 uppercase opacity-60">{item.id}</div></td>
                                        <td className="px-10 py-6"><div className="text-[12px] font-black text-slate-900 uppercase">{item.amount} {item.currency}</div></td>
                                        <td className="px-10 py-6"><div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{item.method}</div></td>
                                        <td className="px-10 py-6"><span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm", item.status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : item.status === 'Failed' ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100")}>{item.status}</span></td>
                                        <td className="px-10 py-6 text-right"><button className="p-3 text-slate-300 hover:text-slate-900 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-slate-100"><Download size={20} /></button></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
