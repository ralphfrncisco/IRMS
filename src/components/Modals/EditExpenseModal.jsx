import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, PhilippinePeso, Package, Loader2, Calendar, Hash } from 'lucide-react';
import { supabase } from "../../lib/supabase";
import { formatDateTimeShort } from '../../utils/dateTimeFormatter';

function EditExpenseModal({ isOpen, onClose, expenseData }) {
    const [loading, setLoading] = useState(false);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [receiptFileName, setReceiptFileName] = useState('No file chosen');
    const [stockItems, setStockItems] = useState([]);
    const [formValues, setFormValues] = useState({
        id: '',
        expenseType: '',
        supplier: '',
        amount: '',
        created_at: '',
        remarks: '',
        status: 'Paid',
    });

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) return "0.00";
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    const getImageUrl = async (path) => {
        if (!path) return null;
        if (path.startsWith('http') && path.includes('token=')) return path;
        const filePath = path.startsWith('http') ? path.split('/receipts/').pop() : path;
        const { data, error } = await supabase.storage
            .from('receipts')
            .createSignedUrl(filePath, 3600);
        return error ? null : data.signedUrl;
    };

    useEffect(() => {
        const fetchDetails = async () => {
            if (!isOpen || !expenseData?.expense_id) return;
            try {
                setLoading(true);
                const { data: expense, error: expError } = await supabase
                    .from('ExpensesTable')
                    .select('*')
                    .eq('expense_id', expenseData.expense_id)
                    .single();
                if (expError) throw expError;

                const { data: items, error: itemsError } = await supabase
                    .from('ExpenseItems')
                    .select('*')
                    .eq('expense_id', expenseData.expense_id);
                if (itemsError) throw itemsError;

                setFormValues({
                    id: `EXP-${expense.expense_id.toString().padStart(4, '0')}`,
                    expenseType: expense.expense_type || '',
                    supplier: expense.supplier_name || '',
                    amount: formatCurrency(expense.amount),
                    created_at: expense.created_at || '',
                    remarks: expense.remarks || '',
                    status: expense.status || (expense.expense_type === 'Stock Expense' ? 'Just Ordered' : 'Paid'),
                });

                setStockItems(items || []);
                setReceiptFileName(expense.receipt_image || 'No image recorded');
                setReceiptPreview(await getImageUrl(expense.receipt_image));
            } catch (err) {
                console.error("Error loading expense details:", err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [isOpen, expenseData]);

    if (!isOpen) return null;

    const isStockExpense = formValues.expenseType === 'Stock Expense';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleViewFullImage = () => {
        if (receiptPreview) {
            const newTab = window.open();
            newTab.document.body.innerHTML = `<body style="margin:0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh;"><img src="${receiptPreview}" style="max-width: 100%; max-height: 100vh; object-fit: contain;" /></body>`;
            newTab.document.title = `Receipt - ${formValues.id}`;
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const parseCurrency = (val) => parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;

            const { error: updateError } = await supabase
                .from('ExpensesTable')
                .update({
                    expense_type: formValues.expenseType,
                    supplier_name: isStockExpense ? formValues.supplier : null,
                    amount: parseCurrency(formValues.amount),
                    remarks: formValues.remarks,
                    status: formValues.status   // ✅ Save status
                })
                .eq('expense_id', expenseData.expense_id);

            if (updateError) throw updateError;

            await supabase.from('ExpenseItems').delete().eq('expense_id', expenseData.expense_id);

            if (stockItems.length > 0) {
                const { error: insertError } = await supabase.from('ExpenseItems').insert(
                    stockItems.map(item => ({
                        expense_id: expenseData.expense_id,
                        product_name: item.product_name,
                        amount: item.amount,
                        quantity: item.quantity
                    }))
                );
                if (insertError) throw insertError;
            }

            onClose();
        } catch (err) {
            console.error("Error updating expense:", err.message);
            alert("Failed to update expense: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center overflow-y-auto p-2 overflow-x-hidden">
            <div className="flex flex-col h-full max-h-[80vh] md:h-auto md:max-h-full bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-4xl mx-2 border border-slate-200 dark:border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Expense Details</h2>
                        <p className="text-xs text-slate-500 dark:text-white/50">Record for Transaction {formValues.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-white/50 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                {loading ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 text-sm">Fetching records...</p>
                    </div>
                ) : (
                    <form id="expense-edit-form" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-8 mt-[-0.70rem]">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#1E1E1E] rounded-lg border border-slate-200 dark:border-white/5">
                                        <Hash className="w-3.5 h-3.5 text-slate-400 dark:text-white/50 flex-shrink-0" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-wide">
                                            {formValues.id}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 dark:bg-black/50 rounded-lg">
                                        <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-white/90">
                                            {formatDateTimeShort(expenseData.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-1">Expense Type</label>
                                    <input type="text" name="expenseType" value={formValues.expenseType} onChange={handleInputChange}
                                        className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-white/5 dark:bg-[#1E1E1E] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                </div>

                                {isStockExpense && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-1">Supplier</label>
                                        <input type="text" name="supplier" value={formValues.supplier} onChange={handleInputChange}
                                            placeholder="Enter supplier name"
                                            className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-white/5 dark:bg-[#1E1E1E] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-1">Amount</label>
                                    <div className="relative">
                                        <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/50" />
                                        <input type="text" name="amount" value={formValues.amount} onChange={handleInputChange}
                                            className="w-full text-slate-700 dark:text-slate-200 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-white/5 dark:bg-[#1E1E1E] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-1">Remarks</label>
                                    <textarea name="remarks" rows="3" value={formValues.remarks} onChange={handleInputChange}
                                        className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-white/5 dark:bg-[#1E1E1E] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none" />
                                </div>
                            </div>

                            {/* Right Column: Receipt Image & Status */}
                            <div className="space-y-5">
                                {/* ✅ Status toggle — Stock Expense only */}
                                {isStockExpense ? (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-3">Delivery Status</label>
                                        <div className="flex gap-3">
                                            {['Just Ordered', 'Received'].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => setFormValues(prev => ({ ...prev, status: option }))}
                                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all ${
                                                        formValues.status === option
                                                            ? option === 'Received'
                                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500'
                                                                : 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500'
                                                            : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[#1E1E1E] text-slate-500 dark:text-white/50 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {option === 'Received' ? '✓ ' : '⏳ '}{option}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2">
                                            Update to <span className="font-semibold">Received</span> once the stock arrives.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-2">Status</label>
                                        <span className="inline-flex items-center text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                            ✓ Paid
                                        </span>
                                    </div>
                                )}
                                <div className = "space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-white/70">Transaction Receipt</label>
                                    <div className="relative aspect-[16/10] w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-white/5 bg-slate-50 dark:bg-[#1E1E1E] flex items-center justify-center overflow-hidden group">
                                        {receiptPreview ? (
                                            <>
                                                <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button type="button" onClick={handleViewFullImage}
                                                        className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-100 transition-all active:scale-95 cursor-pointer">
                                                        View Full Size
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-10 h-10 mx-auto text-slate-400 dark:text-white/50 mb-2 opacity-50" />
                                                <p className="text-xs text-slate-500 dark:text-white/50">No image uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-white/50 truncate italic">Filename: {receiptFileName}</p>
                                </div>
                            </div>

                            
                        </div>

                        {/* Expense Allocation Table */}
                        {stockItems.length > 0 && (
                            <div className="pt-4">
                                <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                                    <Package className="w-5 h-5" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest">Expense Allocation Breakdown</h3>
                                </div>
                                <div className="border border-slate-200 dark:border-white/5 rounded-xl overflow-x-auto shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-[#1E1E1E] text-slate-500 dark:text-white/50 font-bold uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">Product Description</th>
                                                <th className="px-4 py-3 text-center">Unit Price</th>
                                                <th className="px-4 py-3 text-center">Quantity</th>
                                                <th className="px-4 py-3 text-center">Sub-total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-white/70">
                                            {stockItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{item.product_name}</td>
                                                    <td className="px-4 py-3 text-center">₱ {formatCurrency(item.amount)}</td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">₱ {formatCurrency(item.amount * item.quantity)}</td>
                                                </tr>
                                            ))}
                                            {/* Grand Total Row */}
                                            <tr className="bg-blue-50/50 dark:bg-white/2 font-bold border-t-1 border-slate-200 dark:border-white/5">
                                                <td colSpan="3" className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500 dark:text-white/70">Grand Total</td>
                                                <td className="px-4 py-3 text-center text-base text-blue-600 dark:text-blue-400">
                                                    ₱ {formatCurrency(stockItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0))}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </form>
                )}

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-white/10 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-white/70 bg-slate-100 dark:bg-[#1E1E1E] hover:bg-slate-200 transition-colors cursor-pointer">Close</button>
                    <button type="submit" form="expense-edit-form" className="px-6 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all cursor-pointer">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

export default EditExpenseModal;