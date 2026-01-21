import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Image as ImageIcon, PhilippinePeso } from 'lucide-react';

// --- ASSET IMPORTS ---
import testImage from '../../assets/test.jpg';
import pigImage from '../../assets/pig.png';
import noImage from '../../assets/no_image.jpg';

function EditExpenseModal({ isOpen, onClose, expenseData }) {
    // 1. STATE HOOKS
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [receiptFileName, setReceiptFileName] = useState('No file chosen');
    const [formValues, setFormValues] = useState({
        id: '',
        expenseType: '',
        amount: '',
        date: '',
        remarks: '',
    });

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) return "";
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${formatter.format(value)}`;
    };

    // 2. EFFECT HOOKS - Population Logic
    useEffect(() => {
        if (isOpen && expenseData) {
            setFormValues({
                id: expenseData.id || '',
                expenseType: expenseData.expenseType || '',
                amount: formatCurrency(expenseData.amount),
                date: expenseData.date || '',
                remarks: expenseData.remarks || '',
            });

            
            if (expenseData.id === 'EXD-1002') {
                setReceiptPreview(testImage);
                setReceiptFileName('electricity_bill_jan.jpg');
            } else if (expenseData.id === 'EXD-1003') {
                setReceiptPreview(pigImage);
                setReceiptFileName('feed_stock_receipt.png');
            } else {
                setReceiptPreview(noImage);
                setReceiptFileName('no_image_available.jpg');
            }
        }
    }, [isOpen, expenseData]);

    // 3. EARLY RETURN
    if (!isOpen) return null;

    // 4. HANDLERS
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleViewFullImage = () => {
        if (receiptPreview) {
            const newTab = window.open();
            newTab.document.body.innerHTML = `
                <body style="margin:0; background: #0f172a; display: flex; align-items: center; justify-content: center;">
                    <img src="${receiptPreview}" style="max-width: 100%; max-height: 100vh; object-fit: contain;" />
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

    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setFormValues(prev => ({ ...prev, date: today }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        console.log("Updated Expense Data:", formValues);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex py-4 items-center justify-center">
            <div 
                className="flex flex-col h-full md:max-h-[65vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-2 border border-slate-200 dark:border-slate-800 overflow-hidden" 
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

                {/* Body */}
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                    <div className="relative">
                                        <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
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
                                    rows="4"
                                    value={formValues.remarks}
                                    onChange={handleInputChange}
                                    className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                ></textarea>
                            </div>
                        </div>

                        {/* Right Column: Receipt Image */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Transaction Receipt</label>
                            <div className="relative aspect-[4/3] w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center overflow-hidden group">
                                {receiptPreview ? (
                                    <>
                                        <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                type="button" 
                                                onClick={handleViewFullImage}
                                                className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-100 transition-all active:scale-95"
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
                </form>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">Close</button>
                    <button type="submit" form="expense-edit-form" className="px-6 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

export default EditExpenseModal;