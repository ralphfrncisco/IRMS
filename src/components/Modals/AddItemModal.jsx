import React, { useState } from 'react';
import { X, Plus, Minus, Search } from 'lucide-react';

const HOG_PRODUCTS = [
    { id: 'HP-001', name: 'Pre-Starter Pellets', price: 1450.00 },
    { id: 'HP-002', name: 'Starter Pellets', price: 1380.00 },
    { id: 'HP-003', name: 'Grower Pellets', price: 1250.00 },
    { id: 'HP-004', name: 'Finisher Pellets', price: 1180.00 },
    { id: 'HP-005', name: 'Brood Sow Pellets', price: 1220.00 },

    { id: 'AB-001', name: 'Amoxicillin Soluble Powder', price: 850.00 },
    { id: 'AB-002', name: 'Oxytetracycline Injection', price: 1200.00 },

    { id: 'VC-001', name: 'Swine Fever Vaccine', price: 2400.00 },
        { id: 'PA-001', name: 'Ivermectin 1% Injection', price: 750.00 },
        { id: 'NS-001', name: 'Iron Dextran Injection', price: 890.00 },
        { id: 'HM-001', name: 'Oxytocin Injection', price: 480.00 }
];

function AddItemModal({ isOpen, onClose, onAdd }) {
    const [selectedItems, setSelectedItems] = useState({});
    const [searchTerm, setSearchTerm] = useState("");

    if (!isOpen) return null;

    // Filter products based on search term
    const filteredProducts = HOG_PRODUCTS.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCheckboxChange = (productId) => {
        setSelectedItems(prev => {
            const newState = { ...prev };
            if (newState[productId]) {
                delete newState[productId];
            } else {
                newState[productId] = { quantity: 1 };
            }
            return newState;
        });
    };

    const updateQuantity = (productId, delta) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;
            const newQty = Math.max(1, prev[productId].quantity + delta);
            return {
                ...prev,
                [productId]: { ...prev[productId], quantity: newQty }
            };
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const itemsToAdd = Object.keys(selectedItems).map(id => {
            const product = HOG_PRODUCTS.find(p => p.id === id);
            const qty = selectedItems[id].quantity;
            return {
                ...product,
                quantity: qty,
                total: product.price * qty
            };
        });

        onAdd(itemsToAdd);
        setSelectedItems({}); 
        setSearchTerm(""); // Reset search for next use
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center overflow-y-auto">
            <div 
                className="max-h-screen flex flex-col bg-white dark:bg-slate-900 p-3 md:p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add a Product Item</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Scrollable List Area */}
                    <div className="max-h-[45vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <div 
                                    key={product.id}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        selectedItems[product.id] 
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox"
                                            id={product.id}
                                            checked={!!selectedItems[product.id]}
                                            onChange={() => handleCheckboxChange(product.id)}
                                            className="w-4 h-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div>
                                            <label htmlFor={product.id} className="block text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                                                {product.name}
                                            </label>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                ₱{product.price.toLocaleString()} / bag
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className={`flex items-center gap-2 transition-opacity ${selectedItems[product.id] ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        <button 
                                            type="button"
                                            onClick={() => updateQuantity(product.id, -1)}
                                            className="p-1 rounded-md bg-white dark:text-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors shadow-sm"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <input 
                                            type="text" 
                                            value={selectedItems[product.id]?.quantity || 0}
                                            readOnly
                                            className="w-8 text-center bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none border-none"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => updateQuantity(product.id, 1)}
                                            className="p-1 rounded-md bg-white dark:text-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors shadow-sm"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                                    No products match "{searchTerm}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={Object.keys(selectedItems).length === 0}
                            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors shadow-md"
                        >
                            Add to List
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddItemModal;