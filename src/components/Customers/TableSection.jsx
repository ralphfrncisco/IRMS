import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

import CustomerFilter from '../Filters/CustomerFilter';
import AddCustomerModal from '../Modals/AddCustomerModal';
import EditCustomerDetailModal from '../Modals/EditCustomerDetailModal';
import DeleteConfirmModal from '../Modals/DeleteConfirmModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const CUSTOMER_PLACEHOLDER = 'Customer';

function TableSection() {
    const { darkMode } = useOutletContext();
    const [customerData, setCustomerData] = useState([])
    const [loading, setLoading] = useState(true);
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

    const formatCurrency = (value) => {
        if (isNaN(value)) return "₱ 0.00";
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `₱ ${formatter.format(value)}`;
    };

    // --- UNIFIED STATE MANAGEMENT ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerFilter, setCustomerFilter] = useState(CUSTOMER_PLACEHOLDER); 

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('customer_id', { ascending: true })
    
        if (!error) setCustomerData(data);
        setLoading(false);
    }
    
    useEffect(() => {
        fetchCustomers();
    
        // Real-time listener for customers
        const channel = supabase
            .channel('customers-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customers' },
                () => { fetchCustomers() }
            )
            .subscribe();
    
        return () => { supabase.removeChannel(channel) }
    }, []);

    // --- DYNAMIC OPTION GENERATION ---
    const extractUniqueOptions = (key, placeholder) => {
        const uniqueValues = [...new Set(customerData.map(item => item[key]))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const customerOptions = extractUniqueOptions('full_name', CUSTOMER_PLACEHOLDER);

    // --- FILTERING LOGIC ---
    const filteredCustomers = useMemo(() => {
        let filtered = [...customerData];

        if (customerFilter !== CUSTOMER_PLACEHOLDER && customerFilter !== ALL_OPTION) {
            filtered = filtered.filter(item => item.full_name === customerFilter);
        }

        return filtered;
    }, [customerFilter, customerData]);

    const handleOpenEdit = (customer) => {
        setSelectedCustomer(customer);
        setIsEditModalOpen(true);
    };

    const triggerDelete = (customer) => {
        setSelectedCustomer(customer);
        setIsDeleteModalOpen(true);
    };

    // --- EXECUTE DELETE ---
    const handleDelete = async () => {
        if (!selectedCustomer) return;
        setIsDeleting(true);

        try {
            const { error: customerError } = await supabase
                .from('customers')
                .delete()
                .eq('customer_id', selectedCustomer.customer_id);

            if (customerError) throw customerError;
            
            setIsDeleteModalOpen(false);
            setSelectedCustomer(null);
            
        } catch (error) {
            console.error("Delete failed:", error.message);
            alert(`Error: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                
                {/* Header Title Section */}
                <div className="flex items-center justify-between w-full py-2">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Customers List</h3>
                        <p className="text-[7pt] md:text-sm text-slate-500 dark:text-slate-400">Manage your customer contacts and balances</p>
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
                            options={customerOptions} 
                            initialValue={customerFilter} 
                            onSelect={setCustomerFilter} 
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
                    <span className="text-sm font-medium">Add Customer</span>
                </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="p-4 md:pl-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Number</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Credit Limit</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Balance</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="5" className="p-10 text-center text-slate-400">Loading customers...</td></tr>
                        ) : filteredCustomers.map((customer) => (
                            <tr key={customer.customer_id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 md:pl-7 text-sm font-semibold text-blue-500 dark:text-blue-400">
                                    {customer.full_name}
                                </td>
                                <td className="p-4 text-center text-sm">
                                    {customer.contact_number}
                                </td>
                                <td className="p-4 text-center text-sm font-normal">
                                    {formatCurrency(customer.credit_limit)}
                                </td>
                                <td className="p-4 text-center text-sm font-normal">
                                    {formatCurrency(customer.remaining_balance)}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button 
                                            onClick={() => handleOpenEdit(customer)} 
                                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>

                                        <button 
                                            onClick={() => triggerDelete(customer)} 
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete Customer"
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
                {!loading && filteredCustomers.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-slate-500 dark:text-slate-400">No customers found.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddCustomerModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
            />
            
            <EditCustomerDetailModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCustomer(null);
                }} 
                customerData={selectedCustomer} 
            />

            <DeleteConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedCustomer(null);
                }}
                onConfirm={handleDelete}
                itemId={selectedCustomer?.customer_id}
                itemName={selectedCustomer?.full_name}
                loading={isDeleting}
            />
        </div>
    )
}

export default TableSection;