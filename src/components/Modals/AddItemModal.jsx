import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

function AddItemModal({ isOpen, onClose, onAdd }) {
    const [selectedItems, setSelectedItems] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState([]);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (!error) setProducts(data);
    };

    useEffect(() => {
        fetchProducts();

        const channel = supabase
            .channel('products-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => { fetchProducts(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // ✅ Stock color helper
    const getStockColor = (quantity) => {
        if (quantity <= 10) return {
            name: 'text-red-600 dark:text-red-400',
            meta: 'text-red-500 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800/50',
            bg: 'bg-red-50/50 dark:bg-red-900/10'
        };
        if (quantity <= 20) return {
            name: 'text-amber-600 dark:text-amber-400',
            meta: 'text-amber-500 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800/50',
            bg: 'bg-amber-50/50 dark:bg-amber-900/10'
        };
        return {
            name: 'text-slate-700 dark:text-slate-200',
            meta: 'text-slate-500 dark:text-white/50',
            border: 'border-slate-100 dark:border-white/10',
            bg: 'bg-slate-50/50 dark:bg-[#1E1E1E]'
        };
    };

    const filteredProducts = products.filter(product =>
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

    const adjustQuantity = (productId, delta) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;
            const product = products.find(p => String(p.id) === String(productId));
            const maxQty = product?.quantity ?? 1;
            const currentQty = prev[productId].quantity;
            const newQty = Math.min(maxQty, Math.max(1, currentQty + delta));
            return { ...prev, [productId]: { ...prev[productId], quantity: newQty } };
        });
    };

    const handleQuantityInput = (productId, value) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;
            if (value === "") {
                return { ...prev, [productId]: { ...prev[productId], quantity: "" } };
            }
            const parsed = parseInt(value);
            if (isNaN(parsed)) return prev;
            const product = products.find(p => String(p.id) === String(productId));
            const maxQty = product?.quantity ?? 1;
            const capped = Math.min(maxQty, Math.max(1, parsed));
            return { ...prev, [productId]: { ...prev[productId], quantity: capped } };
        });
    };

    const handleQuantityBlur = (productId) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;
            const currentQty = prev[productId].quantity;
            const product = products.find(p => String(p.id) === String(productId));
            const maxQty = product?.quantity ?? 1;
            if (currentQty === "" || currentQty < 1) {
                return { ...prev, [productId]: { ...prev[productId], quantity: 1 } };
            }
            if (currentQty > maxQty) {
                return { ...prev, [productId]: { ...prev[productId], quantity: maxQty } };
            }
            return prev;
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        const itemsToAdd = Object.keys(selectedItems).map(id => {
            const product = products.find(p => String(p.id) === id);
            if (!product) return null;
            const qty = selectedItems[id].quantity;
            const validQty = typeof qty === 'number' && qty > 0 ? qty : 1;
            return { ...product, quantity: validQty, stock: product.quantity, total: product.price * validQty };
        }).filter(Boolean);

        if (itemsToAdd.length > 0) onAdd(itemsToAdd);

        setSelectedItems({});
        setSearchTerm("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center overflow-y-auto">
            <div
                className="max-h-screen flex flex-col bg-white dark:bg-[#111] p-3 md:p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-slate-200 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add a Product Item</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all group">
                        <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:text-white/50 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#1E1E1E] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <form onSubmit={handleFormSubmit} id="add-item-form" className="space-y-4">
                    <div className="max-h-[45vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => {
                                const stockColor = getStockColor(product.quantity);
                                const isSelected = !!selectedItems[product.id];

                                return (
                                    <div
                                        key={product.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            isSelected
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                            : `${stockColor.border} ${stockColor.bg}`
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id={product.id}
                                                checked={isSelected}
                                                onChange={() => handleCheckboxChange(product.id)}
                                                className="w-4 h-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <div>
                                                <label htmlFor={product.id} className={`block text-sm font-semibold cursor-pointer ${stockColor.name}`}>
                                                    {product.name}
                                                </label>
                                                <span className={`text-xs ${stockColor.meta}`}>
                                                    ₱{product.price.toLocaleString()} / item · {product.quantity} available
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className={`flex items-center gap-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                            <button
                                                type="button"
                                                onClick={() => adjustQuantity(product.id, -1)}
                                                className="p-1 rounded-md bg-white dark:text-white dark:bg-white/10 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <input
                                                type="text"
                                                value={selectedItems[product.id]?.quantity ?? 0}
                                                onChange={(e) => handleQuantityInput(product.id, e.target.value)}
                                                onBlur={() => handleQuantityBlur(product.id)}
                                                className="w-10 text-center bg-white dark:bg-[#1E1E1E] text-sm font-bold text-slate-700 dark:text-slate-200 outline-none border border-slate-200 dark:border-slate-600 rounded py-1 focus:ring-2 focus:ring-blue-500/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => adjustQuantity(product.id, 1)}
                                                className="p-1 rounded-md bg-white dark:text-white dark:bg-white/10 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-500 dark:text-white/50 text-sm italic">
                                    No products match "{searchTerm}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-white/70 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={Object.keys(selectedItems).length === 0}
                            form="add-item-form"
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