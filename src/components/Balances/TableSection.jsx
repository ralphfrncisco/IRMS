import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Funnel, Eye, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter';
import PaymentStatusFilter from '../Filters/PaymentStatusFilter';
import ColumnFilter from '../Filters/SortByFilter';

import EditPurchaseModal from '../Modals/EditPurchaseModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const CUSTOMER_PLACEHOLDER = 'Customer';
const STATUS_PLACEHOLDER = 'Payment Status';

export default function TableSection() {
    const { darkMode } = useOutletContext();
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const filterRef = React.useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- HELPERS ---
    const formatCurrency = (value) => {
        if (isNaN(value)) return "₱ 0.00";
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `₱ ${formatter.format(value)}`;
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

    const [visibleColumns, setVisibleColumns] = useState({
        'ORDER ID': true,
        'CUSTOMER': true,
        'PURCHASED ITEMS': true,
        'AMOUNT': true,
        'DATE': true,
        'STATUS': true,
        'ACTIONS': true
    });

    // --- FETCH FUNCTION ---
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('SalesTable')
                .select('*')
                .in('status', ['With Balance', 'Unpaid'])
                .order('order_id', { ascending: false });

            if (error) throw error;

            // Map id to db_id to ensure Modal consistency
            const formattedData = (data || []).map(item => ({
                ...item,
                db_id: item.id 
            }));

            setSalesData(formattedData);
        } catch (error) {
            console.error('Error fetching orders:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    
        const channel = supabase
            .channel('sales-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'SalesTable' },
                () => { fetchOrders() }
            )
            .subscribe();
    
        return () => { supabase.removeChannel(channel) }
    }, []);
    

    // --- DYNAMIC OPTION GENERATION ---
    const extractUniqueOptions = (key, placeholder) => {
        const uniqueValues = [...new Set(salesData.map(order => order[key]))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const customerOptions = extractUniqueOptions('customer', CUSTOMER_PLACEHOLDER);
    const paymentOptions = [STATUS_PLACEHOLDER, ALL_OPTION, 'With Balance', 'Unpaid', 'Fully Paid'];

    // --- STATE MANAGEMENT ---
    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [customerFilter, setCustomerFilter] = useState(CUSTOMER_PLACEHOLDER); 
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(STATUS_PLACEHOLDER);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // --- FILTERING LOGIC ---
    const filteredOrders = useMemo(() => {
        let filtered = salesData;

        if (customerFilter !== CUSTOMER_PLACEHOLDER && customerFilter !== ALL_OPTION) {
            filtered = filtered.filter(order => order.customer === customerFilter);
        }

        if (paymentStatusFilter !== STATUS_PLACEHOLDER && paymentStatusFilter !== ALL_OPTION) {
            filtered = filtered.filter(order => order.status === paymentStatusFilter);
        }

        if (dateRangeFilter !== DATE_RANGE_PLACEHOLDER && dateRangeFilter !== ALL_OPTION) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            filtered = filtered.filter(order => {
                const orderDate = new Date(order.date);
                if (dateRangeFilter === 'Today') {
                    return orderDate.toDateString() === today.toDateString();
                } else if (dateRangeFilter === 'Last 7 Days') {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(today.getDate() - 7);
                    return orderDate >= sevenDaysAgo;
                } else if (dateRangeFilter === 'Last 30 Days') {
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    return orderDate >= thirtyDaysAgo;
                }
                return true;
            });
        }
        return filtered;
    }, [dateRangeFilter, customerFilter, paymentStatusFilter, salesData]);

    const handleOpenEdit = (order) => {
        setSelectedOrder(order);
        setIsEditModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "With Balance": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            case "Unpaid": return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
            case "Fully Paid": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
            default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    };

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25 pb-5">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 lg:flex lg:items-center gap-4 w-full md:w-auto">
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Outstanding Accounts</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Latest customer orders and payment statuses</p>
                </div>

                <div className="flex lg:hidden items-center justify-end gap-2 relative" ref={filterRef}>
                    {/* The Toggle Button */}
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex lg:hidden items-center cursor-pointer space-x-2 py-2 px-4 rounded-lg transition-all ${
                            showFilters 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        }`}
                    >
                        <Funnel className="w-4 h-4" />
                        <span className="text-sm md:font-medium">Filters</span>
                    </button>

                    {/* The Dropdown Menu */}
                    {showFilters && (
                        <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 space-y-3 animate-in fade-in zoom-in duration-200">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter By</h4>
                            <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                            <PaymentStatusFilter options={paymentOptions} initialValue={paymentStatusFilter} onSelect={setPaymentStatusFilter} iconProps={iconProps}/>
                            <CustomerFilter options={customerOptions} initialValue={customerFilter} onSelect={setCustomerFilter} iconProps={iconProps}/>
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden lg:flex lg:items-center md:justify-center xl:justify-end gap-2 w-full ">
                    <div className="col-span-1">
                        <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                    </div>
                    <div className="col-span-1">
                        <PaymentStatusFilter options={paymentOptions} initialValue={paymentStatusFilter} onSelect={setPaymentStatusFilter} iconProps={iconProps}/>
                    </div>
                    <div className="col-span-1">
                        <CustomerFilter options={customerOptions} initialValue={customerFilter} onSelect={setCustomerFilter} iconProps={iconProps}/>
                    </div>
                    <div className="ml-0 lg:ml-3">
                        <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] p-2">
                <table className="w-full text-left border-separate border-spacing-y-1">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            {visibleColumns['ORDER ID'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order ID</th>}
                            {visibleColumns['CUSTOMER'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>}
                            {visibleColumns['PURCHASED ITEMS'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Purchased Items</th>}
                            {visibleColumns['AMOUNT'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>}
                            {visibleColumns['DATE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>}
                            {visibleColumns['STATUS'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>}
                            {visibleColumns['ACTIONS'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="7" className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-10 text-center text-slate-500">
                                    <p className="text-lg font-normal">No records found</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.db_id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    {visibleColumns['ORDER ID'] && (
                                        <td className="p-4 text-sm font-medium text-blue-600 dark:text-blue-500">
                                            {`ORD-${order.order_id?.toString().padStart(4, '0')}`}
                                        </td>
                                    )}
                                    {visibleColumns['CUSTOMER'] && <td className="p-4 text-sm">{order.customer}</td>}
                                    {visibleColumns['PURCHASED ITEMS'] && <td className="p-4 text-sm">{order.purchased_items}</td>}
                                    {visibleColumns['AMOUNT'] && <td className="p-4 text-center text-sm font-semibold">{formatCurrency(order.amount)}</td>}
                                    {visibleColumns['DATE'] && <td className="p-4 text-center text-sm">{formatDisplayDate(order.date)}</td>}
                                    {visibleColumns['STATUS'] && (
                                        <td className="p-4 text-center">
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns['ACTIONS'] && (
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleOpenEdit(order)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                                <Eye className="w-5 h-5 text-blue-500" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <EditPurchaseModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedOrder(null);
                }} 
                orderData={selectedOrder} 
            />
        </div>
    )
}