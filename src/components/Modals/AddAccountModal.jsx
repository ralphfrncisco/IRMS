import React, { useState, useMemo } from 'react';

import { X } from 'lucide-react';

function AddAccountModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="flex flex-col h-auto md:max-h-[80vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200" 
                onClick={e => e.stopPropagation()}
            >
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create an Account</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto space-y-6 md:pr-2">
                    {/* Form content goes here */}
                    <div className="h-40 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <p className="text-slate-400 text-sm">Form Fields Placeholder</p>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold">
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddAccountModal;