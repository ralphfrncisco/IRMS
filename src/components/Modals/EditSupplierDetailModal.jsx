import React, { useState, useEffect } from 'react';
import { X, Plus, Phone, MapPin, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

// --- ASSET IMPORTS ---
import AddRetailProductModal from './AddRetailProductModal';

function EditSupplierDetailModal({ isOpen, onClose, supplierData }) {
    const [statusModal, setStatusModal] = useState({ show: false, type: '', message: '' });
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [formValues, setFormValues] = useState({
        id: '',
        supplier: '',
        contactNumber: '',
        address: '',
        remarks: '',
    });

    // --- POPULATION LOGIC ---
    useEffect(() => {
        const fetchSupplierData = async () => {
            if (isOpen && supplierData) {
                setFormValues({
                    id: supplierData.id || '',
                    supplier: supplierData.supplierName || '',
                    contactNumber: supplierData.contactNumber || '',
                    address: supplierData.address || '',
                    remarks: supplierData.remarks || '',
                });

                try {
                    const { data, error } = await supabase
                        .from('retailProducts')
                        .select('*')
                        .eq('supplier_id', supplierData.id);

                    if (error) throw error;

                    const fetchedItems = data.map(item => ({
                        id: item.id,
                        name: item.productName,
                        price: item.netUnitPrice
                    }));

                    setPurchaseItems(fetchedItems);
                } catch (err) {
                    alert("Something went wrong. Please try again.");
                }
            }
        };

        fetchSupplierData();
    }, [isOpen, supplierData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleAddProducts = (newItems) => {
        const formattedItems = newItems.map(item => ({
            ...item,
            id: `temp-${Date.now()}-${Math.random()}`,
            price: parseFloat(item.price) || 0
        }));
        setPurchaseItems(prev => [...prev, ...formattedItems]);
    };

    const handleRemoveItem = async (id) => {
        setPurchaseItems(prev => prev.filter(item => item.id !== id));

        if (typeof id === 'number') {
            try {
                const { error } = await supabase
                    .from('retailProducts')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (err) {
                alert("Something went wrong. Please try again.");
            }
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setStatusModal({ show: true, type: 'loading', message: 'Saving changes...' });
        
        try {
            // 1. Update Supplier Profile
            const { error: supplierError } = await supabase
                .from('supplier') 
                .update({
                    supplierName: formValues.supplier,
                    contactNumber: formValues.contactNumber,
                    address: formValues.address,
                    remarks: formValues.remarks
                })
                .eq('id', formValues.id);

            if (supplierError) throw supplierError;

            // 2. Separate items to avoid ID conflicts with the database sequence
            const newItems = purchaseItems
                .filter(item => typeof item.id !== 'number')
                .map(item => ({
                    supplier_id: formValues.id,
                    productName: item.name,
                    netUnitPrice: item.price
                }));

            const existingItems = purchaseItems
                .filter(item => typeof item.id === 'number')
                .map(item => ({
                    id: item.id,
                    supplier_id: formValues.id,
                    productName: item.name,
                    netUnitPrice: item.price
                }));

            // 3. Parallel Database Operations
            const promises = [];
            if (newItems.length > 0) promises.push(supabase.from('retailProducts').insert(newItems));
            if (existingItems.length > 0) promises.push(supabase.from('retailProducts').upsert(existingItems));

            const results = await Promise.all(promises);
            const dbError = results.find(res => res.error);
            if (dbError) throw dbError.error;

            setStatusModal({ show: true, type: 'success', message: 'Supplier profile updated!' });
            
            setTimeout(() => {
                setStatusModal({ show: false, type: '', message: '' });
                onClose();
            }, 1500);

        } catch (err) {
            setStatusModal({ show: true, type: 'error', message: err.message });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex py-4 items-center justify-center">
            <div className="flex flex-col h-auto max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-2 border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                
                {/* Status Feedback Overlay */}
                {statusModal.show && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/80 dark:bg-slate-900/90 animate-in fade-in duration-200">
                        <div className="flex flex-col items-center p-6 text-center">
                            {statusModal.type === 'loading' && <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />}
                            {statusModal.type === 'success' && <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />}
                            {statusModal.type === 'error' && <AlertCircle className="w-12 h-12 text-red-500 mb-4" />}
                            
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                                {statusModal.type === 'loading' ? 'Processing' : statusModal.type === 'success' ? 'Success' : 'Error'}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-[200px]">{statusModal.message}</p>
                            
                            {statusModal.type === 'error' && (
                                <button 
                                    onClick={() => setStatusModal({ show: false, type: '', message: '' })}
                                    className="mt-6 px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Supplier Profile</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase">Record ID: {formValues.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                        <X className="w-6 h-6 text-slate-500 dark:text-slate-400 cursor-pointer"/>
                    </button>
                </div>

                {/* Body */}
                <form id="supplier-edit-form" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
                            <input type="text" name="supplier" value={formValues.supplier} onChange={handleInputChange} className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                        </div>
                        <div className="relative w-full">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" name="contactNumber" value={formValues.contactNumber} maxLength={11} onChange={handleInputChange} className="w-full text-slate-700 dark:text-slate-200 pl-10 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" name="address" value={formValues.address} onChange={handleInputChange} className="w-full text-slate-700 dark:text-slate-200 pl-10 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                        <textarea name="remarks" rows="2" value={formValues.remarks} onChange={handleInputChange} className="w-full text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"></textarea>
                    </div>

                    <div className="mt-4 flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Retail Products</h1>
                            <button type="button" onClick={() => setIsProductModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95 cursor-pointer">
                                <Plus className="w-5 h-5" />
                                <span>Add Item</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-200">Product Name</th>
                                        <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-200">Price</th>
                                        <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {purchaseItems.length > 0 ? (
                                        purchaseItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4 text-sm text-slate-700 dark:text-slate-200 font-medium">{item.name}</td>
                                                <td className="p-4 text-sm font-bold text-green-600 dark:text-green-400">₱ {item.price?.toLocaleString() || 0}</td>
                                                <td className="p-4 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-2 cursor-pointer transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-sm text-slate-400 italic font-medium">No products registered to this supplier.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">Close</button>
                    <button type="submit" form="supplier-edit-form" className="px-6 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Update Supplier</button>
                </div>
            </div>

            {isProductModalOpen && (
                <AddRetailProductModal
                    isOpen={isProductModalOpen}
                    onClose={() => setIsProductModalOpen(false)}
                    onAdd={handleAddProducts}
                />
            )}
        </div>
    );
}

export default EditSupplierDetailModal;