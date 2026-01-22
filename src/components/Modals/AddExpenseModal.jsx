import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Plus, Trash2, PhilippinePeso, Calendar, Upload, Image as ImageIcon } from 'lucide-react';

// The specific categories you requested
const expenseCategories = ["Stock Expense", "Electrical Bill", "Water Bill", "Miscellaneous"];

function AddExpenseModal({isOpen, onClose}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    
    // REUSABLE FORMATTER: You can copy this to any modal
    const formatInputCurrency = (value) => {
        if (!value) return '';
        const cleanValue = value.replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts.length > 1) {
            return `${parts[0]}.${parts[1].substring(0, 2)}`;
        }
        return parts[0];
    };

    const [formValues, setFormValues] = useState({
        amount: '',
        expenseType: '',
        remarks: '',
        transactionDate: '',
        receiptImage: null
    });

    useEffect(() => {
        if (isOpen) {
            setFormValues({ amount: '', expenseType: '', remarks: '', transactionDate: '', receiptImage: null });
            setImagePreview(null);
        }
    }, [isOpen]);

    const filteredCategories = useMemo(() => {
        return expenseCategories.filter(type =>
            type.toLowerCase().includes((formValues.expenseType || '').toLowerCase())
        );
    }, [formValues.expenseType]);

    const handleImageChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            setFormValues(prev => ({ ...prev, receiptImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
        else if (e.type === "dragleave") setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageChange(e.dataTransfer.files[0]);
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
        setFormValues(prev => ({ ...prev, transactionDate: today }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // INTEGRATED LOGIC: Formats the amount as you type
        if (name === 'amount') {
            const formattedValue = formatInputCurrency(value);
            setFormValues(prev => ({ ...prev, [name]: formattedValue }));
            return;
        }
        
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (e) => {
        const value = e.target.value;
        setFormValues(prev => ({ ...prev, expenseType: value }));
        setIsDropdownOpen(true);
    };

    const selectType = (type) => {
        setFormValues(prev => ({ ...prev, expenseType: type }));
        setIsDropdownOpen(false);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // NOTE: When saving to database, remember to use: 
        // parseFloat(formValues.amount.replace(/,/g, ''))
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex py-2 items-center justify-center overflow-y-auto">
            <div 
                className="flex flex-col h-full md:h-auto md:max-h-[90vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-xl mx-2 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add Expense</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form id="expenseForm" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto space-y-6 md:pr-2 no-scrollbar">
                    <div className="w-full">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Receipt Image</label>
                        <div 
                            onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden
                                ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400'}
                                ${imagePreview ? 'h-48' : 'h-32'}`}
                        >
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])} />
                            {imagePreview ? (
                                <div className="relative w-full h-full group">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-slate-50 dark:bg-slate-800" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <p className="text-white text-sm font-medium">Click to change image</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 space-y-2">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                                        <Upload className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs opacity-60 text-slate-700 dark:text-slate-200">PNG, JPG or WebP (Max 5MB)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative w-full">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                        <div className="relative">
                            <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <input
                                type="text"
                                name="amount"
                                value={formValues.amount}
                                onChange={handleInputChange}
                                placeholder = "0.00"
                                autoComplete="off"
                                className="w-full text-slate-700 dark:text-slate-200 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="relative w-full">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Type of Expense</label>
                        <input 
                            type="text" name="expenseType" value={formValues.expenseType} onChange={handleTypeChange}
                            onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            placeholder='Select or type expense type' autoComplete="off"
                            className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-11 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                        />
                        {isDropdownOpen && filteredCategories.length > 0 && (
                            <ul className="absolute z-30 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                {filteredCategories.map((type, index) => (
                                    <li key={index} onClick={() => selectType(type)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                                        {type}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className= "relative w-full">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Date</label>
                        <div className="relative h-11 w-full group">
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

                    <div className="w-full pb-4">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                        <textarea name="remarks" value={formValues.remarks} onChange={handleInputChange} rows="3" placeholder="Add notes..." className="w-full text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none" />
                    </div>
                </form>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                    <button type="submit" form="expenseForm" disabled={!formValues.amount || !formValues.expenseType} className="px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">Save Expense</button>
                </div>
            </div>
        </div>
    );
}

export default AddExpenseModal;