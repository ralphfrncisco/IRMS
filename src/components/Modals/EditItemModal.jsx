import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

function EditItemModal({ isOpen, onClose, item, onSave }) {
    const [editedQuantity, setEditedQuantity] = useState(1);

    // ✅ item.quantity is the stock level from the database
    const maxQty = item?.stock ?? item?.quantity ?? 1; // ✅ stock from DB, not selected qty

    useEffect(() => {
        if (isOpen && item) {
            setEditedQuantity(item.quantity); // item.quantity = selected qty
        }
    }, [isOpen, item]);

    // ✅ Stock level label + color
    const getStockLabel = () => {
        if (maxQty <= 10) return { text: `${maxQty} available — Low Stock`, color: 'text-red-500 dark:text-red-400' };
        if (maxQty <= 20) return { text: `${maxQty} available — Limited Stock`, color: 'text-amber-500 dark:text-amber-400' };
        return { text: `${maxQty} available`, color: 'text-slate-500 dark:text-blue-500' };
    };

    const stockLabel = getStockLabel();

    const handleDecrement = () => setEditedQuantity(prev => Math.max(1, prev - 1));
    const handleIncrement = () => setEditedQuantity(prev => Math.min(maxQty, prev + 1)); // ✅ capped at stock

    const handleInputChange = (e) => {
        const val = parseInt(e.target.value) || 1;
        setEditedQuantity(Math.min(maxQty, Math.max(1, val))); // ✅ capped at stock
    };

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
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center">
            <div
                className="bg-white dark:bg-[#111] p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-200 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Item Quantity</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all">
                        <X className="w-5 h-5 text-slate-500 dark:text-white/50" />
                    </button>
                </div>

                {/* Product Info */}
                <div className="mb-6">
                    <div className="p-4 bg-slate-50 dark:bg-[#1E1E1E] rounded-lg">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{item.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-white/50">
                            Unit Price: ₱{item.price.toLocaleString()}
                        </p>
                        {/* ✅ Stock availability label */}
                        <p className={`text-xs font-medium mt-1 ${stockLabel.color}`}>
                            {stockLabel.text}
                        </p>
                    </div>
                </div>

                {/* Quantity Controls */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-white/70">
                            Quantity
                        </label>
                        {/* ✅ Selected vs max counter */}
                        <span className="text-xs text-slate-400 dark:text-white/60">
                            {editedQuantity} / {maxQty} units
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={handleDecrement}
                            disabled={editedQuantity <= 1}
                            className="p-3 rounded-lg bg-slate-100 dark:bg-[#1E1E1E] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Minus className="w-5 h-5 text-slate-700 dark:text-white/70" />
                        </button>

                        <input
                            type="number"
                            value={editedQuantity}
                            onChange={handleInputChange}
                            className="w-24 text-center text-2xl font-bold text-slate-800 dark:text-white bg-white dark:bg-[#1E1E1E] border-2 border-slate-300 dark:border-white/20 rounded-lg py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 no-spinners"
                            min="1"
                            max={maxQty}
                        />

                        <button
                            type="button"
                            onClick={handleIncrement}
                            disabled={editedQuantity >= maxQty}
                            className="p-3 rounded-lg bg-slate-100 dark:bg-[#1E1E1E] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5 text-slate-700 dark:text-white/70" />
                        </button>
                    </div>
                </div>

                {/* Total Display */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-white/50">Total:</span>
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
                        className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-white/70 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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