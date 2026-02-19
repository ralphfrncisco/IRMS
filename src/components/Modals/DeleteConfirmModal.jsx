import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemId, itemName, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-2xl py-10 pb-5 px-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                <button 
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                    
                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Confirm Deletion
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
                        Are you sure you want to delete this entry: <span className="font-mono font-bold text-red-600 dark:text-red-400"><br></br>(ID:{itemId}) <u>{itemName}</u></span>? 
                    </p>
                    
                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            No, Keep it.
                        </button>
                        <button 
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600/80 text-white font-semibold hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Deleting...' : 'Yes, Delete it.'}
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">This action is permanent and will not be undone.</p>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;