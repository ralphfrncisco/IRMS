import React, { useState, useEffect, useRef } from 'react'
import { Pencil, Trash, Search, Plus, Loader2 } from 'lucide-react'
import { supabase } from "../../lib/supabase";

import NoImage from './../../assets/no_image.jpg'
import AddProductModal from '../Modals/AddProductModal';
import EditProductModal from '../Modals/EditProductModal';
import DeleteConfirmModal from '../Modals/DeleteConfirmModal';

export default function ProductGrid() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    // States for deletion
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Cache signed URLs so realtime refreshes don't re-fetch everything
    const signedUrlCache = useRef({});

    const resolveImageUrl = async (path) => {
        if (!path) return NoImage;
        if (path.startsWith('http') && path.includes('token=')) return path;
        if (signedUrlCache.current[path]) return signedUrlCache.current[path];
        
        const filePath = path.startsWith('http') ? path.split('/product-images/').pop() : path;
        const { data, error } = await supabase.storage
            .from('product-images')
            .createSignedUrl(filePath, 3600);
            
        const resolved = error ? NoImage : data.signedUrl;
        signedUrlCache.current[path] = resolved;
        return resolved;
    };

    const fetchProducts = async (isInitialLoad = false) => {
        if (isInitialLoad) setIsLoading(true);
        try {
            const { data, error } = await supabase
              .from('products')
              .select('*')
              .order('id', { ascending: true });

            if (!error && data) {
                const productsWithSignedUrls = await Promise.all(
                    data.map(async (p) => ({
                        ...p,
                        image: await resolveImageUrl(p.image)
                    }))
                );
                setProducts(productsWithSignedUrls);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleDelete = async () => {
        if (!selectedProduct) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', selectedProduct.id);

            if (error) throw error;
            
            setIsDeleteModalOpen(false);
            setSelectedProduct(null);
            // Realtime will trigger the refresh, but we update locally for speed
            setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
        } catch (error) {
            alert("Something went wrong. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchProducts(true);
    
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

    // Filters
    // ✅ CHANGED: Added medication_usage as a third search condition
    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            p.name.toLowerCase().includes(term) ||
            (p.sub_category && p.sub_category.toLowerCase().includes(term)) ||
            (p.medication_usage && p.medication_usage.toLowerCase().includes(term))
        );
    });

    const pelletProducts = filteredProducts.filter(p => p.category === 'Hog Pellets' || p.category === 'Feeds');
    const fertilizerProducts = filteredProducts.filter(p => p.category === 'Fertilizer');
    const medicationProducts = filteredProducts.filter(p => p.category === 'Medication' || p.category === 'Medications');
    const equipmentProducts = filteredProducts.filter(p => p.category === 'Equipments' || p.category === 'Equipment');
    const otherProducts = filteredProducts.filter(p => 
        p.category !== 'Hog Pellets' && 
        p.category !== 'Feeds' && 
        p.category !== 'Fertilizer' && 
        p.category !== 'Medication' && 
        p.category !== 'Medications' && 
        p.category !== 'Equipments' && 
        p.category !== 'Equipment'
    );

    const ProductCard = ({ item }) => (
        <div className="relative group p-5 rounded-2xl border bg-white border-slate-200 dark:bg-[#111] dark:border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-100 dark:bg-white/5 p-2 rounded-xl w-16 h-16 flex items-center justify-center overflow-hidden">
                    {/* ✅ CHANGED: Added loading="lazy" */}
                    <img 
                        src={item.image || NoImage} 
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-lg" 
                        onError={(e) => { e.target.src = NoImage }}
                    />
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => {
                            setSelectedProduct(item);
                            setIsEditModalOpen(true);
                        }} 
                        className="p-2 text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500 hover:text-white transition-colors">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => {
                            setSelectedProduct(item);
                            setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                        <Trash className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</h3>
            
            {item.sub_category && (
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#111] text-slate-500 dark:text-white/60 border border-slate-200 dark:border-white/15">
                    {item.sub_category}
                </span>
            )}

            <div className="flex items-center justify-between mt-4">
                <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-white/50">Price</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">₱{Number(item.price).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-white/50">Stock</p>
                    <p className={`text-sm font-bold ${
                        Number(item.quantity) <= 10 ? 'text-red-500' : 
                        Number(item.quantity) < 20 ? 'text-amber-500' : 'text-slate-700 dark:text-white/70'
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
                                <Search className="h-4 w-4 text-slate-400 dark:text-white/50" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="block w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#111] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition-all"
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

            {/* Main Content Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-slate-500 dark:text-white/50 animate-pulse">Loading inventory...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
                    <p className="text-slate-500 dark:text-white/60">No products found matching your criteria.</p>
                </div>
            ) : (
                <>
                    {/* Hog Pellets & Feeds */}
                    {pelletProducts.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Hog Pellets</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                {pelletProducts.map(item => <ProductCard key={item.id} item={item} />)}
                            </div>
                        </section>
                    )}

                    {/* Fertilization */}
                    {fertilizerProducts.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-1 bg-lime-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Fertilization</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                {fertilizerProducts.map(item => <ProductCard key={item.id} item={item} />)}
                            </div>
                        </section>
                    )}

                    {/* Medications */}
                    {medicationProducts.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Medications</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                {medicationProducts.map(item => <ProductCard key={item.id} item={item} />)}
                            </div>
                        </section>
                    )}

                    {/* Equipments */}
                    {equipmentProducts.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-1 bg-rose-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Equipments</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                {equipmentProducts.map(item => <ProductCard key={item.id} item={item} />)}
                            </div>
                        </section>
                    )}

                    {/* Other Products */}
                    {otherProducts.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-1 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Other Products</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                {otherProducts.map(item => <ProductCard key={item.id} item={item} />)}
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* Modals */}
            <AddProductModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />

            <EditProductModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedProduct(null);
                }} 
                product={selectedProduct}
            />

            <DeleteConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedProduct(null);
                }}
                onConfirm={handleDelete}
                itemId={selectedProduct?.id}
                itemName={selectedProduct?.name}
                loading={isDeleting}
            />
        </div>
    );
}