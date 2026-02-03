import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { supabase } from "../../lib/supabase";

import CustomerFilter from '../Filters/CustomerFilter';
import AddSupplierModal from '../Modals/AddSupplierModal';
import EditSupplierDetailModal from '../Modals/EditSupplierDetailModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const SUPPLIER_PLACEHOLDER = 'Supplier';

const supplierData = [
    // {
    //     id: 'SP-0001',
    //     supplier: 'John Doe', 
    //     contactNumber: '0917-555-1029', 
    //     Address: '123 Rizal St, Brgy. Poblacion, Makati City, Metro Manila', 
    //     remarks: 'Order ORD-1001: Fully Paid - Fast delivery requested',
    // },
    // {
    //     id: 'SP-0002',
    //     supplier: 'Jane Smith', 
    //     contactNumber: '0920-412-8834', 
    //     Address: 'Lot 42, Block 7, Golden Meadows, Biñan, Laguna', 
    //     remarks: 'Order ORD-1002: With Balance - Partial payment received',
    // },
    // {
    //     id: 'SP-0003',
    //     supplier: 'Mike Johnson', 
    //     contactNumber: '0908-771-2290', 
    //     Address: 'Unit 1502, Sky Tower, Fuente Osmeña Circle, Cebu City', 
    //     remarks: 'Order ORD-1003: Unpaid - Pending credit verification',
    // },
    // {
    //     id: 'SP-0004',
    //     supplier: 'Emily Davis', 
    //     contactNumber: '0966-223-4451', 
    //     Address: 'G/F Commercial Bldg, J.P. Laurel Ave, Davao City, Davao del Sur', 
    //     remarks: 'Order ORD-1004: With Balance - Installment plan active',
    // }
];

function TableSection() {
    const { darkMode } = useOutletContext();
    const [supplierData, setSupplierData] = useState([])
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

    const fetchSuppliers = async () => {
        const { data, error } = await supabase
            .from('supplier')
            .select('*')
            .order('id', { ascending: true })
    
        if (!error) setSupplierData(data)
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

    // --- STATE MANAGEMENT ---
    const [supplierFilter, setSupplierFilter] = useState(SUPPLIER_PLACEHOLDER); 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // --- FILTERING LOGIC ---
    const filteredSuppliers = useMemo(() => {
        let filtered = [...supplierData];

        // Supplier Name Logic: Handles both Placeholder and "All"
        if (supplierFilter !== SUPPLIER_PLACEHOLDER && supplierFilter !== ALL_OPTION) {
            filtered = filtered.filter(item => item.supplier === supplierFilter);
        }

        return filtered;
    }, [supplierFilter, supplierData]);

    const handleOpenEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setIsEditModalOpen(true);
    };

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                
                {/* Header Title Section */}
                <div className="flex items-center justify-between w-full py-2">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Suppliers List</h3>
                        <p className="text-[7pt] md:text-sm text-slate-500 dark:text-slate-400">Manage your business contacts and supply sources</p>
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
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Supplier</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Number</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Address</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSuppliers.map((supplier) => (
                            <tr key={supplier.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 text-sm font-semibold text-blue-500 dark:text-blue-400">
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
                                    <button 
                                        onClick={() => handleOpenEdit(supplier)} 
                                        className="p-2 text-blue-500"
                                        title="View Details"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State Handler */}
                {filteredSuppliers.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-slate-500 dark:text-slate-400">No suppliers found matching your criteria.</p>
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
        </div>
    )
}

export default TableSection;