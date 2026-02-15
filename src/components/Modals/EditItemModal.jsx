import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

function EditItemModal({ isOpen, onClose, item, onSave }) {
    const [editedQuantity, setEditedQuantity] = useState(1);

    useEffect(() => {
        if (isOpen && item) {
            setEditedQuantity(item.quantity);
        }
    }, [isOpen, item]);

    const handleSave = () => {
        if (editedQuantity < 1) {
            alert("Quantity must be at least 1");
            return;
        }

        onSave({
            ...item,
            quantity: editedQuantity,
            total: item.price * editedQuantity
        });

        onClose();
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center">
            <div 
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Item Quantity</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Product Info */}
                <div className="mb-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{item.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Unit Price: ₱{item.price.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Quantity Controls */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Quantity
                    </label>
                    <div className="flex items-center justify-center gap-4">
                        <button 
                            type="button"
                            onClick={() => setEditedQuantity(Math.max(1, editedQuantity - 1))}
                            className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors"
                        >
                            <Minus className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </button>
                        
                        <input 
                            type="number" 
                            value={editedQuantity}
                            onChange={(e) => setEditedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 text-center text-2xl font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 no-spinners"
                            min="1"
                        />
                        
                        <button 
                            type="button"
                            onClick={() => setEditedQuantity(editedQuantity + 1)}
                            className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors"
                        >
                            <Plus className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </button>
                    </div>
                </div>

                {/* Total Display */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total:</span>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            ₱{(item.price * editedQuantity).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditItemModal;