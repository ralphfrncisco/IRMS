import React, { useState } from 'react';
import { X, PhilippinePeso, Calendar } from 'lucide-react';
import { supabase } from "../../lib/supabase";

function AddSalaryModal({ isOpen, onClose }) {
    const [isSaving, setIsSaving] = useState(false);

    const [formValues, setFormValues] = useState({
        employeeName: '',
        amount: '',
        transactionDate: '',
    });

    const formatInputCurrency = (value) => {
        if (!value || value === '0') return '';
        const cleanValue = value.replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts.length > 1) {
            return `${parts[0]}.${parts[1].substring(0, 2)}`;
        }
        return parts[0];
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            const formattedValue = formatInputCurrency(value);
            setFormValues(prev => ({ ...prev, [name]: formattedValue }));
            return;
        }
        setFormValues(prev => ({ ...prev, [name]: value }));
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
        setFormValues(prev => ({ ...prev, transactionDate: today }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // HELPER FUNCTION: Parse formatted currency to number
            const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;

            // INSERT RECORD
            const { data, error } = await supabase
                .from('salary')
                .insert([{
                    employee_name: formValues.employeeName,
                    amount: parseNum(formValues.amount), 
                    date: formValues.transactionDate,
                }])
                .select(); // Adding select() helps confirm if the data actually landed

            if (error) {
                throw error;
            }

            
            setFormValues({
                employeeName: '',
                amount: '',
                transactionDate: '',
            });
            
            onClose();
            
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex py-2 items-center justify-center overflow-y-auto">
            <div 
                className="flex flex-col h-auto md:max-h-[80vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-md mx-2 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add Salary Expense</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} id = "saveSalaryForm" className="flex-grow overflow-y-auto space-y-9 md:pr-2">
                    <div className="grid grid-cols-1 gap-6 max-w-85 md:max-w-full">
                        <div className="relative w-full">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee's Name</label>
                            <input type="text" name="employeeName" value={formValues.employeeName} onChange={handleInputChange} className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div className="relative w-full">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                            <div className="relative">
                                <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <input type="text" name="amount" value={formValues.amount} onChange={handleInputChange} placeholder="0.00" autoComplete="off" className="w-full text-slate-700 dark:text-slate-200 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Date</label>
                            <div className="relative h-10 w-full group">
                                <div className="absolute inset-0 flex items-center justify-between px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 overflow-hidden">
                                    <span className={`truncate mr-2 ${formValues.transactionDate ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
                                        {formValues.transactionDate ? formatDateDisplay(formValues.transactionDate) : "Select Date"}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setToday(); }} className="relative z-20 px-2 py-1 text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm whitespace-nowrap">Today</button>
                                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    </div>
                                </div>
                                <input type="date" name="transactionDate" value={formValues.transactionDate} onChange={handleInputChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0 pr-5 md:pr-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={
                                !formValues.employeeName || 
                                !formValues.amount || 
                                !formValues.transactionDate ||
                                isSaving
                            }
                        className="px-4 py-2 text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md active:scale-95">
                            {isSaving ? "Saving..." : "Save Entry"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddSalaryModal;