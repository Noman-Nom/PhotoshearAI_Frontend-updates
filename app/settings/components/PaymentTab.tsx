import React from 'react';
import { CreditCard, Plus, Trash2, LockKeyhole } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';

export interface PaymentMethod {
    id: string;
    brand: 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Unknown';
    last4: string;
    expiryDate: string;
    cardholderName: string;
    isDefault: boolean;
}

interface PaymentTabProps {
    paymentMethods: PaymentMethod[];
    isBillingLoading: boolean;
    onAddCard: () => void;
    onDeleteCard: (id: string) => void;
}

export const PaymentTab: React.FC<PaymentTabProps> = ({
    paymentMethods,
    isBillingLoading,
    onAddCard,
    onDeleteCard
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 text-start">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Payment Details</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Manage your authorized credit and debit cards</p>
                </div>
                <Button
                    onClick={onAddCard}
                    className="bg-[#0F172A] hover:bg-slate-800 text-white h-12 px-8 text-xs uppercase tracking-widest font-black rounded-xl shadow-lg transition-all"
                >
                    <Plus size={18} className="mr-2" /> Add Card
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paymentMethods.length === 0 ? (
                    <Card className="col-span-full py-20 text-center border-dashed border-2 border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <CreditCard size={32} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No payment methods added</p>
                    </Card>
                ) : (
                    paymentMethods.map(pm => (
                        <Card key={pm.id} className="p-6 bg-white border-slate-100 rounded-3xl group relative overflow-hidden shadow-sm hover:shadow-xl transition-all border-none">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                                    pm.brand === 'Visa' ? "bg-blue-50 text-blue-600" :
                                        pm.brand === 'Mastercard' ? "bg-orange-50 text-orange-600" :
                                            "bg-slate-50 text-slate-600"
                                )}>
                                    <CreditCard size={24} />
                                </div>
                                <div className="flex gap-2">
                                    {pm.isDefault && (
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-lg border border-blue-100 tracking-widest">Default</span>
                                    )}
                                    <button
                                        onClick={() => onDeleteCard(pm.id)}
                                        disabled={isBillingLoading}
                                        className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <div className="text-xl font-black text-slate-900 tracking-[0.25em] mb-1 font-mono">
                                    •••• •••• •••• {pm.last4}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-start">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cardholder</p>
                                        <p className="text-[11px] font-bold text-slate-900 uppercase truncate max-w-[200px]">{pm.cardholderName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Expiry</p>
                                        <p className="text-[11px] font-bold text-slate-900">{pm.expiryDate}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        </Card>
                    ))
                )}
            </div>

            <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                <LockKeyhole size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                <div className="text-start">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Enterprise Security Standards</h4>
                    <p className="text-xs text-blue-700/80 font-medium leading-relaxed mt-1 uppercase tracking-tight">
                        Card data is encrypted at the storage level. We adhere to strict PCI-DSS guidelines to ensure your financial credentials remain vault-protected and restricted to account owners.
                    </p>
                </div>
            </div>
        </div>
    );
};
