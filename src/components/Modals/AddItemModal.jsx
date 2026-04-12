import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

// Category options (matching product schema)
const productTypeOptions = [
    { label: 'Hog Pellets', value: 'Hog Pellets' },
    { label: 'Medication', value: 'Medication' },
    { label: 'Equipments', value: 'Equipments' },
];

const medicationUsageOptions = [
    { label: 'Antibiotics', value: 'Antibiotics' },
    { label: 'Vaccines', value: 'Vaccines' },
    { label: 'Parasiticides', value: 'Parasiticides' },
    { label: 'Hormones', value: 'Hormones' },
];

/**
 * Unified AddItemModal for both AddPurchaseModal and AddExpenseModal
 * 
 * Props:
 *   isOpen (bool) - Modal visibility
 *   onClose (fn) - Close handler
 *   onAdd (fn) - Callback when items are added (receives array of items)
 *   showStockColor (bool) - Show stock level coloring (red ≤10 critical, amber ≤20 low, green >20 normal)
 *   source (string) - 'purchase' or 'expense' - controls quantity constraints
 * 
 * Features:
 *   - Search existing products by name or sub_category
 *   - Add & register non-existing products directly to DB (for on-the-fly entry)
 *   - Category & subcategory dropdowns (for Medication types)
 *   - Quantity controls: purchase flow respects stock; expense flow uncapped
 *   - Stock color indicators: red (critical ≤10), amber (low ≤20), green (normal >20)
 */
function AddItemModal({ isOpen, onClose, onAdd, showStockColor = false, source = 'purchase' }) {
    const [selectedItems, setSelectedItems] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState([]);

    // Manual product entry states
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [testProductName, setTestProductName] = useState("");
    const [testProductPrice, setTestProductPrice] = useState("");
    const [testProductQty, setTestProductQty] = useState(1);
    const [testCategory, setTestCategory] = useState("");
    const [testSubCategory, setTestSubCategory] = useState("");
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);

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

    // Filter products by name AND sub_category
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sub_category && product.sub_category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filter category/subcategory dropdowns
    const filteredCategories = productTypeOptions.filter(opt =>
        opt.label.toLowerCase().includes(testCategory.toLowerCase())
    );

    const filteredSubCategories = medicationUsageOptions.filter(opt =>
        opt.label.toLowerCase().includes(testSubCategory.toLowerCase())
    );

    // ✅ Stock color helper (for purchase flow)
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
            const maxQty = source === 'purchase' ? (product?.quantity ?? 1) : Infinity;
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
            const maxQty = source === 'purchase' ? (product?.quantity ?? 1) : Infinity;
            const capped = Math.min(maxQty, Math.max(1, parsed));
            return { ...prev, [productId]: { ...prev[productId], quantity: capped } };
        });
    };

    const handleQuantityBlur = (productId) => {
        setSelectedItems(prev => {
            if (!prev[productId]) return prev;
            const currentQty = prev[productId].quantity;
            const product = products.find(p => String(p.id) === String(productId));
            const maxQty = source === 'purchase' ? (product?.quantity ?? 1) : Infinity;
            if (currentQty === "" || currentQty < 1) {
                return { ...prev, [productId]: { ...prev[productId], quantity: 1 } };
            }
            if (source === 'purchase' && currentQty > maxQty) {
                return { ...prev, [productId]: { ...prev[productId], quantity: maxQty } };
            }
            return prev;
        });
    };

    // NEW: Register product directly to database
    const handleAddNewProduct = async () => {
        if (!testProductName.trim() || !testProductPrice || !testCategory) {
            alert("Please enter product name, price, and category");
            return;
        }

        if (testCategory === 'Medication' && !testSubCategory) {
            alert("Please select medication usage type");
            return;
        }

        setIsAddingProduct(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    name: testProductName.trim(),
                    price: parseFloat(testProductPrice),
                    quantity: testProductQty,
                    category: testCategory,
                    sub_category: testCategory === 'Medication' ? testSubCategory : null,
                    image: null,
                    supplier_name: null,
                    supplier_id: null
                }])
                .select()
                .single();

            if (error) throw error;

            // Add to local state so it appears immediately
            setProducts(prev => [...prev, data]);

            // Reset form
            setTestProductName("");
            setTestProductPrice("");
            setTestProductQty(1);
            setTestCategory("");
            setTestSubCategory("");
            setShowManualEntry(false);

            alert("Product registered successfully!");
        } catch (err) {
            alert("Failed to register product: " + err.message);
        } finally {
            setIsAddingProduct(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        const itemsToAdd = Object.keys(selectedItems).map(id => {
            const product = products.find(p => String(p.id) === id);
            if (!product) return null;
            const qty = selectedItems[id].quantity;
            const validQty = typeof qty === 'number' && qty > 0 ? qty : 1;
            return {
                ...product,
                quantity: validQty,
                stock: product.quantity,
                total: product.price * validQty
            };
        }).filter(Boolean);

        if (itemsToAdd.length > 0) onAdd(itemsToAdd);

        setSelectedItems({});
        setSearchTerm("");
        onClose();
    };

    const selectCategory = (value) => {
        setTestCategory(value);
        setIsCategoryDropdownOpen(false);
        if (value !== 'Medication') {
            setTestSubCategory('');
        }
    };

    const selectSubCategory = (value) => {
        setTestSubCategory(value);
        setIsSubCategoryDropdownOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center overflow-y-auto">
            <div
                className="max-h-[80vh] md:max-h-screen flex flex-col bg-white dark:bg-[#111] p-3 md:p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-slate-200 dark:border-white/10"
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
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-white/50" />
                    <input
                        type="text"
                        placeholder="Search by name or sub-category..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#1E1E1E] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/70"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-y-auto pr-2">

                    {/* Manual Entry Section */}
                    {!showManualEntry ? (
                        <div className="mb-4 p-4 bg-slate-100/20 dark:bg-[#1E1E1E]/20 border border-blue-400 dark:border-white/5 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setShowManualEntry(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                            >
                                <Plus className="w-4 h-4" />
                                Add Non-Existing Product
                            </button>
                        </div>
                    ) : (
                        <div className="mb-4 p-4 bg-slate-100/20 dark:bg-[#1E1E1E]/20 border border-blue-400 dark:border-white/5 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-500">Add a Non-existing Product</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowManualEntry(false)}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded"
                                >
                                    <X className="w-4 h-4 text-slate-500 dark:text-white/50" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {/* Product Name */}
                                <input
                                    type="text"
                                    placeholder="Product Name"
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/5 rounded-lg bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                                    value={testProductName}
                                    onChange={(e) => setTestProductName(e.target.value)}
                                />

                                {/* Category Dropdown */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Category"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/5 rounded-lg bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                                        value={testCategory}
                                        onChange={(e) => {
                                            setTestCategory(e.target.value);
                                            setIsCategoryDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsCategoryDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                                        autoComplete="off"
                                    />
                                    {isCategoryDropdownOpen && filteredCategories.length > 0 && (
                                        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/5 rounded-xl shadow-xl max-h-40 overflow-y-auto py-2">
                                            {filteredCategories.map((option) => (
                                                <li
                                                    key={option.value}
                                                    onClick={() => selectCategory(option.value)}
                                                    className="px-4 py-2 text-sm text-slate-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                                                >
                                                    {option.label}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Sub-Category (only if Medication) */}
                                {testCategory === 'Medication' && (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Sub-Category"
                                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/5 rounded-lg bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                                            value={testSubCategory}
                                            onChange={(e) => {
                                                setTestSubCategory(e.target.value);
                                                setIsSubCategoryDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsSubCategoryDropdownOpen(true)}
                                            onBlur={() => setTimeout(() => setIsSubCategoryDropdownOpen(false), 200)}
                                            autoComplete="off"
                                        />
                                        {isSubCategoryDropdownOpen && filteredSubCategories.length > 0 && (
                                            <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/5 rounded-xl shadow-xl max-h-40 overflow-y-auto py-2">
                                                {filteredSubCategories.map((option) => (
                                                    <li
                                                        key={option.value}
                                                        onClick={() => selectSubCategory(option.value)}
                                                        className="px-4 py-2 text-sm text-slate-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                                                    >
                                                        {option.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {/* Price and Quantity */}
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-white/5 rounded-lg bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                                        value={testProductPrice}
                                        onChange={(e) => setTestProductPrice(e.target.value)}
                                        step="0.01"
                                    />
                                    <div className="flex items-center gap-2 border border-slate-200 dark:border-white/5 rounded-lg bg-white dark:bg-[#1E1E1E] px-2">
                                        <button
                                            type="button"
                                            onClick={() => setTestProductQty(Math.max(1, testProductQty - 1))}
                                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Minus className="w-3 h-3 text-slate-600 dark:text-white/70" />
                                        </button>
                                        <input
                                            type="text"
                                            value={testProductQty}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    setTestProductQty('');
                                                } else {
                                                    const parsed = parseInt(val);
                                                    if (!isNaN(parsed) && parsed >= 1) {
                                                        setTestProductQty(parsed);
                                                    }
                                                }
                                            }}
                                            onBlur={() => {
                                                if (testProductQty === '' || testProductQty < 1) {
                                                    setTestProductQty(1);
                                                }
                                            }}
                                            className="w-10 text-center bg-white dark:bg-[#1E1E1E] text-sm font-bold text-slate-700 dark:text-slate-200 outline-none border border-slate-200 dark:border-white/15 rounded py-1 focus:ring-2 focus:ring-blue-500/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setTestProductQty(testProductQty + 1)}
                                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Plus className="w-3 h-3 text-slate-600 dark:text-white/70" />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddNewProduct}
                                    disabled={isAddingProduct}
                                    className="w-full px-3 py-2 text-sm font-bold rounded-lg text-white dark:text-blue-100 bg-blue-500 dark:bg-blue-800 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAddingProduct ? "Registering..." : "Register & Continue"}
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleFormSubmit} id="add-item-form" className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Product List</h3>

                        {/* Product List */}
                        <div className="max-h-[37vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar pb-3">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => {
                                    const stockColor = getStockColor(product.quantity);
                                    const isSelected = !!selectedItems[product.id];

                                    // Blue when selected, otherwise apply stock color
                                    const borderClass = isSelected ? 'border-blue-500' : stockColor.border;
                                    const bgClass = isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : stockColor.bg;
                                    const nameColorClass = isSelected ? 'text-slate-700 dark:text-slate-200' : stockColor.name;
                                    const metaColorClass = isSelected ? 'text-slate-500 dark:text-white/50' : stockColor.meta;

                                    return (
                                        <div
                                            key={product.id}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${borderClass} ${bgClass}`}
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
                                                    <label htmlFor={product.id} className={`block text-sm font-semibold cursor-pointer ${nameColorClass}`}>
                                                        {product.name}
                                                    </label>
                                                    <span className={`text-xs ${metaColorClass}`}>
                                                        ₱{product.price.toLocaleString()} / item
                                                        {source === 'purchase' && (
                                                            <>, Stock: {product.quantity}</>
                                                        )}
                                                        {product.sub_category && (
                                                            <>, <span className="font-medium">{product.sub_category}</span></>
                                                        )}
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
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 mt-5 flex justify-end space-x-3 border-t border-slate-100 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-white/70 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
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
            </div>
        </div>
    );
}

export default AddItemModal;