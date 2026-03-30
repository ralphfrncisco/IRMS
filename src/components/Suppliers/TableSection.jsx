import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

import CustomerFilter from '../Filters/CustomerFilter';
import AddSupplierModal from '../Modals/AddSupplierModal';
import EditSupplierDetailModal from '../Modals/EditSupplierDetailModal';
import DeleteConfirmModal from '../Modals/DeleteConfirmModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const SUPPLIER_PLACEHOLDER = 'Supplier';

function TableSection() {
    const { darkMode } = useOutletContext();
    const [supplierData, setSupplierData] = useState([])
    const [loading, setLoading] = useState(true);
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

    // --- UNIFIED STATE MANAGEMENT ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [supplierFilter, setSupplierFilter] = useState(SUPPLIER_PLACEHOLDER); 

    const fetchSuppliers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('supplier')
            .select('*')
            .order('id', { ascending: true })
    
        if (!error) setSupplierData(data);
        setLoading(false);
    }
    
    useEffect(() => {
        fetchSuppliers();
    
        // Real-time listener for SupplierTable
        const channel = supabase
            .channel('supplier-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'supplier' },
                () => { fetchSuppliers() }
            )
            .subscribe();
    
        return () => { supabase.removeChannel(channel) }
    }, []);

    // --- DYNAMIC OPTION GENERATION ---
    const extractUniqueOptions = (key, placeholder) => {
        const uniqueValues = [...new Set(supplierData.map(item => item[key]))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const supplierOptions = extractUniqueOptions('supplierName', SUPPLIER_PLACEHOLDER);

    // --- FILTERING LOGIC ---
    const filteredSuppliers = useMemo(() => {
        let filtered = [...supplierData];

        if (supplierFilter !== SUPPLIER_PLACEHOLDER && supplierFilter !== ALL_OPTION) {
            filtered = filtered.filter(item => item.supplierName === supplierFilter);
        }

        return filtered;
    }, [supplierFilter, supplierData]);

    const handleOpenEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setIsEditModalOpen(true);
    };

    const triggerDelete = (supplier) => {
        setSelectedSupplier(supplier);
        setIsDeleteModalOpen(true);
    };

    // --- EXECUTE DELETE (Adapted from ProductGrid) ---
    const handleDelete = async () => {
        if (!selectedSupplier) return;
        setIsDeleting(true);

        try {
            // 1. Delete associated products from retailProducts first
            const { error: productError } = await supabase
                .from('retailProducts')
                .delete()
                .eq('supplier_id', selectedSupplier.id);

            if (productError) throw productError;

            // 2. Now delete the supplier record
            const { error: supplierError } = await supabase
                .from('supplier')
                .delete()
                .eq('id', selectedSupplier.id);

            if (supplierError) throw supplierError;
            
            setIsDeleteModalOpen(false);
            setSelectedSupplier(null);
            
        } catch (error) {
            console.error("Delete failed:", error.message);
            alert(`Error: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-[#111] dark:border-white/10 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                
                {/* Header Title Section */}
                <div className="flex items-center justify-between w-full py-2">
                    <div className="space-y-1">
                        <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">Suppliers List</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {loading ? 'Loading...' : `Total: ${filteredSuppliers.length} entries`}
                        </p>
                    </div>
                    <div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)} 
                            className="block md:hidden w-full md:w-auto cursor-pointer flex items-center justify-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium truncate">Add</span>
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="flex items-center justify-end gap-2 w-full md:w-auto">
                    <div className="w-40 md:w-auto">
                        <CustomerFilter 
                            options={supplierOptions} 
                            initialValue={supplierFilter} 
                            onSelect={setSupplierFilter} 
                            iconProps={iconProps}
                            className = "w-28"
                        />
                    </div>
                </div>
                
                {/* Desktop Add Button */}
                <button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="hidden md:flex w-auto flex-shrink-0 cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Supplier</span>
                </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-[#191919]">
                            <th className="p-4 md:pl-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Supplier</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Number</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Address</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                        {loading ? (
                            <tr><td colSpan="5" className="p-10 text-center text-slate-400">Loading suppliers...</td></tr>
                        ) : filteredSuppliers.map((supplier) => (
                            <tr key={supplier.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 md:pl-7 text-sm font-semibold text-blue-500 dark:text-blue-400">
                                    {supplier.supplierName}
                                </td>
                                <td className="p-4 text-center text-sm">
                                    {supplier.contactNumber}
                                </td>
                                <td className="p-4 text-center text-sm font-normal max-w-xs truncate">
                                    {supplier.address}
                                </td>
                                <td className="p-4 text-center text-sm font-normal italic text-slate-400">
                                    {supplier.remarks}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button 
                                            onClick={() => handleOpenEdit(supplier)} 
                                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>

                                        <button 
                                            onClick={() => triggerDelete(supplier)} 
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete Supplier"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State Handler */}
                {!loading && filteredSuppliers.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-slate-500 dark:text-slate-400">No records found.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddSupplierModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
            />
            
            <EditSupplierDetailModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedSupplier(null);
                }} 
                supplierData={selectedSupplier} 
            />

             <DeleteConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(true && setIsDeleteModalOpen(false));
                    setSelectedSupplier(null);
                }}
                onConfirm={handleDelete}
                itemId={selectedSupplier?.id}
                itemName={selectedSupplier?.supplierName}
                loading={isDeleting}
            />
        </div>
    )
}

export default TableSection;