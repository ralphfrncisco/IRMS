import React, { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

function AddRetailProductModal({ isOpen, onClose, onAdd }) {
    const [items, setItems] = useState([{ id: Date.now(), name: '', price: '' }]);

    const handleAddItem = () => {
        setItems([...items, { id: Date.now() + Math.random(), name: '', price: '' }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleInputChange = (id, field, value) => {
        setItems(items.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Filter out empty rows before passing back
        const validItems = items.filter(item => item.name.trim() !== '' && item.price !== '');
        if (validItems.length > 0) {
            onAdd(validItems);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center overflow-y-auto">
            <div 
                className="max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 p-3 md:p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Product Items</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
                    <div className="space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="relative grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                {items.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product Name</label>
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleInputChange(item.id, 'name', e.target.value)}
                                        placeholder="e.g. Grower"
                                        className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg mt-1 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Price</label>
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => handleInputChange(item.id, 'price', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg mt-1 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center my-6">
                        <button
                            type="button"
                            onClick={handleAddItem} 
                            className="flex items-center space-x-2 py-2 px-4 text-slate-600 dark:text-white rounded-lg cursor-pointer transition-all border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/30 group"
                        >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold">Add Another Row</span>
                        </button>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 sticky bottom-0 bg-white dark:bg-slate-900">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md active:scale-95"
                        >
                            Save All Items
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddRetailProductModal;