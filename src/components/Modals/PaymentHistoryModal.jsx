import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

function PaymentHistoryModal({ isOpen, onClose, orderData }) {
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [customerName, setCustomerName] = useState('');

    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return `₱${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    useEffect(() => {
        const fetchPaymentHistory = async () => {
            if (!orderData?.order_id || !isOpen) return;

            try {
                setLoading(true);

                // Fetch payment history for this order
                const { data: payments, error: paymentsError } = await supabase
                    .from('paymentHistory')
                    .select('*')
                    .eq('order_id', orderData.order_id)
                    .order('payment_date', { ascending: true });

                if (paymentsError) throw paymentsError;

                // Fetch customer name from SalesTable
                const { data: sale, error: saleError } = await supabase
                    .from('SalesTable')
                    .select('customer')
                    .eq('order_id', orderData.order_id)
                    .single();

                if (saleError) throw saleError;

                setPaymentHistory(payments || []);
                setCustomerName(sale?.customer || 'Unknown Customer');
            } catch (err) {
                console.error("Error fetching payment history:", err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentHistory();
    }, [isOpen, orderData]);

    // Calculate total payments
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + Number(payment.payment_amount), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center overflow-y-auto">
            <div 
                className="max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 p-3 md:p-6 rounded-2xl shadow-2xl w-full max-w-xl mx-4 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Payment History</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Order #{orderData?.order_id?.toString().padStart(4, '0')} • {customerName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">Loading payment history...</p>
                    </div>
                ) : paymentHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">💰</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No Payment History</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">No payments have been recorded for this order yet.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-y-auto flex-grow mb-4">
                            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                        <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                            <th className="p-3 text-center">#</th>
                                            <th className="p-3 text-center">Payment Date</th>
                                            <th className="p-3 text-center">Amount Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {paymentHistory.map((payment, index) => (
                                            <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {index + 1}
                                                </td>
                                                <td className="p-3 text-center text-sm text-slate-700 dark:text-slate-300">
                                                    {formatDisplayDate(payment.payment_date)}
                                                </td>
                                                <td className="p-3 text-center text-sm font-semibold text-green-600 dark:text-green-400">
                                                    {formatCurrency(payment.payment_amount)}
                                                </td>
                                            </tr>
                                        ))}

                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 font-bold">
                                            <td colSpan="2" className="p-3 text-right text-xs uppercase tracking-wider text-slate-500">
                                                Total Paid:
                                            </td>
                                            <td className="p-3 text-center text-sm text-green-600 dark:text-green-400">
                                                {formatCurrency(totalPaid)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="pt-4 flex justify-end">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentHistoryModal;