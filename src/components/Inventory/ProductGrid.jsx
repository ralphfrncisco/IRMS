import React, { useState, useEffect } from 'react'
import { Pencil, Trash, Search, Plus } from 'lucide-react'
import { supabase } from "../../lib/supabase";

import NoImage from './../../assets/no_image.jpg'
import AddProductModal from '../Modals/AddProductModal';

export default function ProductGrid() {
    const [products, setProducts] = useState([])
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProducts = async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true })
    
        if (!error) setProducts(data)
    }

    // Logic to transform the DB path into a public URL from Supabase Storage
    const getImageUrl = (path) => {
        if (!path) return NoImage;
        if (path.startsWith('http')) return path;
        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        return data.publicUrl;
    };
    
    useEffect(() => {
        fetchProducts()
    
        const channel = supabase
          .channel('products-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            () => { fetchProducts() }
          )
          .subscribe()
    
        return () => { supabase.removeChannel(channel) }
      }, [])

    // Logic to separate products by category while keeping search functional
    const pelletProducts = products.filter(p => 
        p.category === 'Hog Pellets' && 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const medicationProducts = products.filter(p => 
        (p.category === 'Medication' || p.category === 'Medications') && 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const equipmentProducts = products.filter(p => 
        (p.category === 'Equipments' || p.category === 'Equipment') && 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Reusable Card Component to keep the grid consistent
    const ProductCard = ({ item }) => (
        <div className="relative group p-5 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-blue-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl w-16 h-16 flex items-center justify-center overflow-hidden">
                    <img 
                        src={getImageUrl(item.image)} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-lg" 
                        onError={(e) => { e.target.src = NoImage }}
                    />
                </div>
                <div className="flex gap-1.5">
                    <button className="p-2 text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button className="p-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash className="w-4 h-4" /></button>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</h3>
            
            {/* Scientific Sub-category Badge */}
            {item.sub_category && (
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {item.sub_category}
                </span>
            )}

            <div className="flex items-center justify-between mt-4">
                <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-500">Price</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">₱{Number(item.price).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-semibold text-slate-500">Stock</p>
                    <p className={`text-sm font-bold ${
                        Number(item.quantity) <= 10 ? 'text-red-500' : 
                        Number(item.quantity) < 20 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-400'
                    }`}>
                        {item.quantity} units
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 px-2 pb-10 mb-15">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Product Inventory</h2>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex md:hidden cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shrink-0 whitespace-nowrap">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add</span>
                    </button>
                </div>
                <div className="flex flex-1 items-center justify-end w-full">
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
                            className="hidden md:flex cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shrink-0 whitespace-nowrap">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Add Product</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION 1: HOG PELLETS */}
            <section className = "space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Hog Pellets</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {pelletProducts.map(item => <ProductCard key={item.id} item={item} />)}
                </div>
            </section>

            {/* SECTION 2: MEDICATIONS */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Medications</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {medicationProducts.map(item => <ProductCard key={item.id} item={item} />)}
                </div>
            </section>

            {/* SECTION 3: EQUIPMENTS */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-rose-500 rounded-full"></div>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Equipments</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {equipmentProducts.map(item => <ProductCard key={item.id} item={item} />)}
                </div>
            </section>

            <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}