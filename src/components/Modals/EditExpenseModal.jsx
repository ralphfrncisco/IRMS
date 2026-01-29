import React, { useState, useEffect } from 'react';
import { X, Calendar, Image as ImageIcon, PhilippinePeso, Package, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

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
        date: '',
        remarks: '',
    });

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) return "0.00";
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    // Helper to get Supabase URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path; 
        const { data } = supabase.storage.from('receipts').getPublicUrl(path);
        return data?.publicUrl || null;
    };

    useEffect(() => {
        const fetchDetails = async () => {
            if (!isOpen || !expenseData?.expense_id) return;
            
            try {
                setLoading(true);
                // 1. Fetch Main Expense Details (if not fully provided by props)
                const { data: expense, error: expError } = await supabase
                    .from('ExpensesTable')
                    .select('*')
                    .eq('expense_id', expenseData.expense_id)
                    .single();

                if (expError) throw expError;

                // 2. Fetch Allocation Items
                const { data: items, error: itemsError } = await supabase
                    .from('ExpenseItems')
                    .select('*')
                    .eq('expense_id', expenseData.expense_id);

                if (itemsError) throw itemsError;

                // Update State
                setFormValues({
                    id: `EXP-${expense.expense_id.toString().padStart(4, '0')}`,
                    expenseType: expense.expense_type || '',
                    supplier: expense.supplier_name || '',
                    amount: formatCurrency(expense.amount),
                    date: expense.date || '',
                    remarks: expense.remarks || '',
                });

                setStockItems(items || []);
                setReceiptFileName(expense.receipt_image || 'No image recorded');
                setReceiptPreview(getImageUrl(expense.receipt_image));

            } catch (err) {
                console.error("Error loading expense details:", err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen, expenseData]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleViewFullImage = () => {
        if (receiptPreview) {
            const newTab = window.open();
            newTab.document.body.innerHTML = `
                <body style="margin:0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
                    <img src="${receiptPreview}" style="max-width: 100%; max-height: 100vh; object-fit: contain; box-shadow: 0 20px 50px rgba(0,0,0,0.5);" />
                </body>
            `;
            newTab.document.title = `Receipt - ${formValues.id}`;
        }
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        }).format(date).toUpperCase();
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        // Add your Supabase Update logic here similar to EditPurchaseModal
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex py-4 items-center justify-center">
            <div 
                className="flex flex-col h-auto md:max-h-[95vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-2 border border-slate-200 dark:border-slate-800 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Expense Details</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Record for Transaction {formValues.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                {loading ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 text-sm">Fetching records...</p>
                    </div>
                ) : (
                    <form id="expense-edit-form" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-8 pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Fields */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Type</label>
                                    <input
                                        type="text"
                                        name="expenseType"
                                        value={formValues.expenseType}
                                        onChange={handleInputChange}
                                        className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>
                                {formValues.expenseType === 'Stock Expense' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                                        <input
                                            type="text"
                                            name="supplier"
                                            value={formValues.supplier}
                                            onChange={handleInputChange}
                                            placeholder="Enter supplier name"
                                            className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                        <div className="relative">
                                            <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                name="amount"
                                                value={formValues.amount}
                                                onChange={handleInputChange}
                                                className="w-full text-slate-700 dark:text-slate-200 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                        <div className="relative h-10 w-full">
                                            <div className="absolute inset-0 flex items-center justify-between px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200">
                                                <span className="truncate mr-2">{formValues.date ? formatDateDisplay(formValues.date) : "Select Date"}</span>
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <input type="date" name="date" value={formValues.date} onChange={handleInputChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                                    <textarea
                                        name="remarks"
                                        rows="3"
                                        value={formValues.remarks}
                                        onChange={handleInputChange}
                                        className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Right Column: Receipt Image */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Transaction Receipt</label>
                                <div className="relative aspect-[16/10] w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center overflow-hidden group">
                                    {receiptPreview ? (
                                        <>
                                            <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    type="button" 
                                                    onClick={handleViewFullImage}
                                                    className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    View Full Size
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                                            <p className="text-xs text-slate-500">No image uploaded</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 truncate italic">Filename: {receiptFileName}</p>
                            </div>
                        </div>

                        {/* DYNAMIC PRODUCT ALLOCATION TABLE */}
                        {stockItems.length > 0 && (
                            <div className="pt-4">
                                <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                                    <Package className="w-5 h-5" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest">Expense Allocation Breakdown</h3>
                                </div>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">Product Description</th>
                                                <th className="px-4 py-3 text-center">Unit Price</th>
                                                <th className="px-4 py-3 text-center">Quantity</th>
                                                <th className="px-4 py-3 text-right">Sub-total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                            {stockItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{item.product_name}</td>
                                                    <td className="px-4 py-3 text-center">₱ {formatCurrency(item.amount)}</td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                                        ₱ {formatCurrency(item.amount * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </form>
                )}

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer">Close</button>
                    <button type="submit" form="expense-edit-form" className="px-6 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all cursor-pointer">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

export default EditExpenseModal;