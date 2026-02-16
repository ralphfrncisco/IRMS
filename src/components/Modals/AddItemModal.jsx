import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

function AddItemModal({ isOpen, onClose, onAdd }) {
    const [selectedItems, setSelectedItems] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState([]);

    // READ
    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (!error) setProducts(data);
    };

    useEffect(() => {
        fetchProducts();

        // REALTIME SUBSCRIPTION
        const channel = supabase
            .channel('products-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => {
                    fetchProducts();
                }
            )
            .subscribe();

        // CLEANUP
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Filter products based on search term
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

    // UPDATED: Handle both button clicks and direct input
    const updateQuantity = (productId, newValue) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;

            let finalQuantity;

            // If newValue is a number (direct input)
            if (typeof newValue === 'number' && !isNaN(newValue)) {
                finalQuantity = Math.max(1, newValue);
            } 
            // If it's a delta (from buttons: +1 or -1)
            else if (typeof newValue === 'string') {
                const parsed = parseInt(newValue);
                finalQuantity = isNaN(parsed) ? 1 : Math.max(1, parsed);
            }
            // Default fallback
            else {
                finalQuantity = 1;
            }

            return {
                ...prev,
                [productId]: { ...prev[productId], quantity: finalQuantity }
            };
        });
    };

    // NEW: Handle button increment/decrement
    const adjustQuantity = (productId, delta) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;
            const currentQty = prev[productId].quantity;
            const newQty = Math.max(1, currentQty + delta);
            return {
                ...prev,
                [productId]: { ...prev[productId], quantity: newQty }
            };
        });
    };

    // NEW: Handle direct text input
    const handleQuantityInput = (productId, value) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;
            
            // Allow empty input for user to clear and type
            if (value === '') {
                return {
                    ...prev,
                    [productId]: { ...prev[productId], quantity: '' }
                };
            }

            const parsed = parseInt(value);
            if (isNaN(parsed)) return prev;

            return {
                ...prev,
                [productId]: { ...prev[productId], quantity: parsed }
            };
        });
    };

    // NEW: Handle input blur (when user leaves the field)
    const handleQuantityBlur = (productId) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;
            
            const currentQty = prev[productId].quantity;
            
            // If empty or invalid, reset to 1
            if (currentQty === '' || currentQty < 1) {
                return {
                    ...prev,
                    [productId]: { ...prev[productId], quantity: 1 }
                };
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
            
            // Ensure quantity is valid number
            const validQty = typeof qty === 'number' && qty > 0 ? qty : 1;

            return {
                ...product,
                quantity: validQty,
                total: product.price * validQty
            };
        }).filter(Boolean);

        if (itemsToAdd.length > 0) {
            onAdd(itemsToAdd);
        }

        setSelectedItems({}); 
        setSearchTerm(""); 
        onClose();
    };

    if (!isOpen) return null;

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

                <form onSubmit={handleFormSubmit} id="add-item-form" className="space-y-4">
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
                                                ₱{product.price.toLocaleString()} / item, Stock: {product.quantity}
                                            </span>
                                        </div>
                                    </div>

                                    {/* UPDATED: Quantity Controls with Editable Input */}
                                    <div className={`flex items-center gap-2 transition-opacity ${selectedItems[product.id] ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        <button 
                                            type="button"
                                            onClick={() => adjustQuantity(product.id, -1)}
                                            className="p-1 rounded-md bg-white dark:text-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <input 
                                            type="text" 
                                            value={selectedItems[product.id]?.quantity ?? 0}
                                            onChange={(e) => handleQuantityInput(product.id, e.target.value)}
                                            onBlur={() => handleQuantityBlur(product.id)}
                                            className="w-10 text-center bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none border border-slate-200 dark:border-slate-600 rounded py-1 focus:ring-2 focus:ring-blue-500/50"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => adjustQuantity(product.id, 1)}
                                            className="p-1 rounded-md bg-white dark:text-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
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