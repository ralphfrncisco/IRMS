import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Funnel, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter';
import PaymentStatusFilter from '../Filters/PaymentStatusFilter';
import ColumnFilter from '../Filters/SortByFilter';

import AddPurchaseModal from '../Modals/AddPurchaseModal';
import EditPurchaseModal from '../Modals/EditPurchaseModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const CUSTOMER_PLACEHOLDER = 'Customer';
const STATUS_PLACEHOLDER = 'Payment Status';

function TableSection() {
    const { darkMode } = useOutletContext();
    const [orders, setOrders] = useState([]);
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

    // --- FETCH DATA FROM SUPABASE ---
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('SalesTable')
                .select('*')
                .order('order_id', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    
        // Real-time listener for SalesTable
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
    const customerOptions = useMemo(() => {
        // Map from the 'orders' state, not the fetch function
        const names = [...new Set(orders.map(order => order.customer))];
        return [CUSTOMER_PLACEHOLDER, ALL_OPTION, ...names.sort((a, b) => a.localeCompare(b))];
    }, [orders]);

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const paymentOptions = [STATUS_PLACEHOLDER, ALL_OPTION, 'Fully Paid', 'With Balance', 'Unpaid'];

    // --- STATE MANAGEMENT ---
    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [customerFilter, setCustomerFilter] = useState(CUSTOMER_PLACEHOLDER); 
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(STATUS_PLACEHOLDER);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // --- FILTERING LOGIC ---
    const filteredOrders = useMemo(() => {
        let filtered = [...orders];

        if (customerFilter && customerFilter !== CUSTOMER_PLACEHOLDER && customerFilter !== ALL_OPTION) {
            filtered = filtered.filter(order => order.customer === customerFilter);
        }

        if (paymentStatusFilter && paymentStatusFilter !== STATUS_PLACEHOLDER && paymentStatusFilter !== ALL_OPTION) {
            filtered = filtered.filter(order => order.status === paymentStatusFilter);
        }

        if (dateRangeFilter && dateRangeFilter !== DATE_RANGE_PLACEHOLDER && dateRangeFilter !== ALL_OPTION) {
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
                }
                return true;
            });
        }
        return filtered;
    }, [orders, dateRangeFilter, customerFilter, paymentStatusFilter]);

    const handleOpenEdit = (order) => {
        setSelectedOrder(order);
        setIsEditModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Fully Paid": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
            case "With Balance": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            case "Unpaid": return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
            default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    };

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 xl:flex xl:items-center gap-4 w-full md:w-auto">
                <div className = "flex items-center justify-between w-full py-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Sales</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {loading ? 'Loading...' : `Total: ${filteredOrders.length} entries`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 relative" ref={filterRef}>
                        {/* The Toggle Button */}
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex sm:hidden items-center cursor-pointer space-x-2 py-2 px-4 rounded-lg transition-all ${
                                showFilters 
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            }`}
                        >
                            <Funnel className="w-4 h-4" />
                            <span className="text-sm font-medium">Filters</span>
                        </button>

                        {/* The Dropdown Menu */}
                        {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 space-y-3 animate-in fade-in zoom-in duration-200">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter By</h4>
                                <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                                <PaymentStatusFilter options={paymentOptions} initialValue={paymentStatusFilter} onSelect={setPaymentStatusFilter} iconProps={iconProps}/>
                                <CustomerFilter options={customerOptions} initialValue={customerFilter} onSelect={setCustomerFilter} iconProps={iconProps}/>
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} 
                                    dropdownClassName="mt-[-330px] w-full"/>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setIsModalOpen(true)} className="block xl:hidden cursor-pointer flex items-center justify-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Add</span>
                        </button>
                    </div>
                </div>

                <div className="hidden sm:grid sm:grid-cols-2 lg:flex lg:items-center md:justify-end gap-2 w-full md:w-auto">
                    <div className="col-span-1">
                        <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                    </div>
                    <div className="col-span-1">
                        <PaymentStatusFilter options={paymentOptions} initialValue={paymentStatusFilter} onSelect={setPaymentStatusFilter} iconProps={iconProps}/>
                    </div>
                    <div className="col-span-1">
                        <CustomerFilter options={customerOptions} initialValue={customerFilter} onSelect={setCustomerFilter} iconProps={iconProps}/>
                    </div>
                    <div className = "ml-0 lg:ml-3">
                        <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                    </div>
                </div>
                
                <button onClick={() => setIsModalOpen(true)} className="hidden xl:flex w-auto flex-shrink-0 cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Purchase</span>
                </button>
            </div>

            <div className="overflow-x-auto h-auto md:max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                            {visibleColumns['ORDER ID'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order ID</th>}
                            {visibleColumns['CUSTOMER'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>}
                            {visibleColumns['PURCHASED ITEMS'] && <th className="w-[100px] p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Purchased Items</th>}
                            {visibleColumns['AMOUNT'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Paid Amount</th>}
                            {visibleColumns['DATE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>}
                            {visibleColumns['STATUS'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>}
                            {visibleColumns['ACTIONS'] &&<th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="7" className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : filteredOrders.length === 0 ?
                        (
                            <tr>
                                <td colSpan="7" className="p-10 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <p className="text-lg font-medium">No records found</p>
                                        <p className="text-sm">Try adjusting your filters or Add a purchase.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (filteredOrders.map((order) => (
                                <tr key={order.order_id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    {visibleColumns['ORDER ID'] && (
                                        <td className="p-4 text-sm font-medium text-blue-600 dark:text-blue-500">
                                            {`ORD-${order.order_id.toString().padStart(4, '0')}`}
                                        </td>
                                    )}
                                    {visibleColumns['CUSTOMER'] && <td className="p-4 text-sm">{order.customer}</td>}
                                    {visibleColumns['PURCHASED ITEMS'] && <td className="p-4 text-sm"><p className = "w-[200px] lg:w-full md:max-w-[400px] truncate">{order.purchased_items}</p></td>}
                                    {visibleColumns['AMOUNT'] && <td className="p-4 text-center text-sm font-semibold text-slate-700 dark:text-white">{formatCurrency(order.amount)}</td>}
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

            <AddPurchaseModal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    fetchOrders(); 
                }} 
            />

            <EditPurchaseModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedOrder(null);
                    fetchOrders(); 
                }} 
                orderData={selectedOrder} 
            />
        </div>
    )
}

export default TableSection;