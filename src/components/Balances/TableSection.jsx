import React, { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom';
import { MoreHorizontal, Plus, Eye } from 'lucide-react';

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

const recentOrders = [
    { id: 'ORD-1002', customer: 'Jane Smith', product: 'Pre-Starter Pellets, Hog-Grower Pellets', amount: 199.99, status: 'With Balance', date: '2026-01-10' },
    { id: 'ORD-1003', customer: 'Mike Johnson', product: 'Pre-Starter Pellets, Hog-Grower Pellets', amount: 0.00, status: 'Unpaid', date: '2026-01-09' },
    { id: 'ORD-1004', customer: 'Emily Davis', product: 'Pre-Starter Pellets, Hog-Grower Pellets', amount: 399.99, status: 'With Balance', date: '2026-01-08' },
];

function TableSection() {
    const { darkMode } = useOutletContext();

    const formatCurrency = (value) => {
        if (isNaN(value)) return "₱ 0.00";
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `₱ ${formatter.format(value)}`;
    };
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

    const [visibleColumns, setVisibleColumns] = useState({
        'ORDER ID': true,
        'CUSTOMER': true,
        'PRODUCT': true,
        'AMOUNT': true,
        'DATE': true,
        'STATUS': true,
        'ACTIONS': true
    });

    // --- DYNAMIC OPTION GENERATION (Like CustomerList) ---
    const extractUniqueOptions = (key, placeholder) => {
        const uniqueValues = [...new Set(recentOrders.map(order => order[key]))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const customerOptions = extractUniqueOptions('customer', CUSTOMER_PLACEHOLDER);
    const paymentOptions = [STATUS_PLACEHOLDER, ALL_OPTION, 'With Balance', 'Unpaid'];

    // --- STATE MANAGEMENT ---
    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [customerFilter, setCustomerFilter] = useState(CUSTOMER_PLACEHOLDER); 
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(STATUS_PLACEHOLDER);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // --- FILTERING LOGIC ---
    const filteredOrders = useMemo(() => {
        let filtered = recentOrders;

        // Customer Logic
        if (customerFilter !== CUSTOMER_PLACEHOLDER && customerFilter !== ALL_OPTION) {
            filtered = filtered.filter(order => order.customer === customerFilter);
        }

        // Status Logic
        if (paymentStatusFilter !== STATUS_PLACEHOLDER && paymentStatusFilter !== ALL_OPTION) {
            filtered = filtered.filter(order => order.status === paymentStatusFilter);
        }

        // Date Logic
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
                }
                return true;
            });
        }
        return filtered;
    }, [dateRangeFilter, customerFilter, paymentStatusFilter]);

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
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300">
            {/* <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Sales</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Latest customer orders</p>
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                        <CustomerFilter options={customerOptions} initialValue={customerFilter} onSelect={setCustomerFilter} iconProps={iconProps}/>
                        <PaymentStatusFilter options={paymentOptions} initialValue={paymentStatusFilter} onSelect={setPaymentStatusFilter} iconProps={iconProps}/>
                    </div>
                    
                    <button onClick={() => setIsModalOpen(true)} className="cursor-pointer flex items-center md:space-x-2 py-2 px-2 md:px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                        <Plus className="w-4 h-4" />
                        <span className="md:block hidden text-sm font-medium">Add Purchase</span>
                    </button>
                </div>
            </div> */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                {/* Filter Grid Container */}
                <div className = "flex items-center justify-between w-full py-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Pending Balances</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Latest customer orders with pending balances</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto">
                    <div className="col-span-1">
                        <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                    </div>
                    
                    <div className="col-span-1">
                        <PaymentStatusFilter options={paymentOptions} initialValue={paymentStatusFilter} onSelect={setPaymentStatusFilter} iconProps={iconProps}/>
                    </div>

                    {/* Customer Filter occupying 2 columns on mobile */}
                    <div className="col-span-1">
                        <CustomerFilter options={customerOptions} initialValue={customerFilter} onSelect={setCustomerFilter} iconProps={iconProps}/>
                    </div>

                    <div className = "md:ml-3">
                        <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            {visibleColumns['ORDER ID'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order ID</th>}
                            {visibleColumns['CUSTOMER'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>}
                            {visibleColumns['PRODUCT'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product</th>}
                            {visibleColumns['AMOUNT'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Paid Amount</th>}
                            {visibleColumns['DATE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>}
                            {visibleColumns['STATUS'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>}
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                {visibleColumns['ORDER ID'] && <td className="p-4 text-sm font-medium text-blue-600 dark:text-blue-500">{order.id}</td>}
                                {visibleColumns['CUSTOMER'] && <td className="p-4 text-sm">{order.customer}</td>}
                                {visibleColumns['PRODUCT'] && <td className="max-w-[100px] p-4 text-sm truncate">{order.product}</td>}
                                {visibleColumns['AMOUNT'] && 
                                    <td className="p-4 text-center text-sm font-semibold">
                                        {formatCurrency(order.amount)}
                                    </td>}
                                {visibleColumns['DATE'] && <td className="p-4 text-center text-sm">{order.date}</td>}
                                {visibleColumns['STATUS'] && (
                                    <td className="p-4 text-center">
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                )}
                                <td className="p-4 text-center">
                                    <button onClick={() => handleOpenEdit(order)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <Eye className="w-5 h-5 text-blue-500" />
                                    </button>
                                </td>
                            </tr>
                        ))}
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

export default TableSection;