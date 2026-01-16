import React, { useState } from 'react'
import { Pencil, Trash, Search, Plus } from 'lucide-react'
import NoImage from './../../assets/no_image.jpg'

import AddProductModal from '../Modals/AddProductModal';

// Single consolidated array
const allProducts = [
    // Hog Pellets
    { id: 'HP-001', name: 'Pre-Starter Pellets', price: 1450.00, quantity: "87", image: NoImage, category: 'Hog Pellets' },
    { id: 'HP-002', name: 'Starter Pellets', price: 1380.00, quantity: "124", image: NoImage, category: 'Hog Pellets' },
    { id: 'HP-003', name: 'Grower Pellets', price: 1250.00, quantity: "42", image: NoImage, category: 'Hog Pellets' },
    { id: 'HP-004', name: 'Finisher Pellets', price: 1180.00, quantity: "96", image: NoImage, category: 'Hog Pellets' },
    { id: 'HP-005', name: 'Brood Sow Pellets', price: 1220.00, quantity: "15", image: NoImage, category: 'Hog Pellets' },
    
    // Medications
    { id: 'AB-001', name: 'Amoxicillin Soluble Powder', price: 850.00, quantity: "45", image: NoImage, category: 'Medications', subCategory: 'Antibiotics' },
    { id: 'AB-002', name: 'Oxytetracycline Injection', price: 1200.00, quantity: "32", image: NoImage, category: 'Medications', subCategory: 'Antibiotics' },
    { id: 'VC-001', name: 'Swine Fever Vaccine', price: 2400.00, quantity: "10", image: NoImage, category: 'Medications', subCategory: 'Vaccines' },
    { id: 'PA-001', name: 'Ivermectin 1% Injection', price: 750.00, quantity: "64", image: NoImage, category: 'Medications', subCategory: 'Parasiticides' },
    { id: 'NS-001', name: 'Iron Dextran Injection', price: 890.00, quantity: "75", image: NoImage, category: 'Medications', subCategory: 'Nutritional' },
    { id: 'HM-001', name: 'Oxytocin Injection', price: 480.00, quantity: "60", image: NoImage, category: 'Medications', subCategory: 'Hormones' }
];

function ProductGrid() {
    const [searchTerm, setSearchTerm] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Helper to filter and group in one place
    const filteredResults = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // This internal helper prevents repeating the card UI code
    const renderSection = (title, category, accent, showSearch = false) => {
        const products = filteredResults.filter(p => p.category === category);
        
        if (products.length === 0 && !showSearch) return null;

        return (
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className={`text-xl font-bold text-slate-700 dark:text-slate-200 border-l-4 ${accent} pl-3 shrink-0`}>
                        {title}
                    </h2>
                    <div className="flex flex-1 items-center justify-end w-full">
                        {showSearch && (
                            <div className="flex items-center gap-3 w-full max-w-lg ml-auto">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shrink-0 whitespace-nowrap">
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm font-medium">Add Product</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {products.map((item) => (
                        <div key={item.id} className="relative group p-5 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-blue-500/30 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                                </div>
                                <div className="flex gap-1.5">
                                    <button className="p-2 text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button className="p-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</h3>
                            {item.subCategory && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{item.subCategory}</span>}
                            <div className="flex items-center justify-between mt-4">
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-slate-500">Price</p>
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">₱{item.price.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-semibold text-slate-500">Stock</p>
                                    <p className={`text-sm font-bold ${Number(item.quantity) < 20 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-400'}`}>{item.quantity} units</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* {products.length > 0 ? products.map((item) => (
                        <div key={item.id} className="relative group p-5 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-blue-500/30 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                                </div>
                                <div className="flex gap-1.5">
                                    <button className="p-2 text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button className="p-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</h3>
                            {item.subCategory && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{item.subCategory}</span>}
                            <div className="flex items-center justify-between mt-4">
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-slate-500">Price</p>
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">₱{item.price.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-semibold text-slate-500">Stock</p>
                                    <p className={`text-sm font-bold ${Number(item.quantity) < 20 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-400'}`}>{item.quantity} units</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-slate-500 dark:text-slate-400">No products match your search.</p>
                        </div>
                    )
                    } */}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-10 px-2 pb-10">
            {renderSection("All Products", "Hog Pellets", "border-blue-500", true)}
            {renderSection("Medications", "Medications", "border-emerald-500", false)}

            <AddProductModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
}

export default ProductGrid;