import React, { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom';
import { MoreHorizontal, Plus } from 'lucide-react';

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter';
import PaymentStatusFilter from '../Filters/PaymentStatusFilter';

import AddPurchaseModal from '../Modals/AddPurchaseModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const CUSTOMER_PLACEHOLDER = 'Customer';
const STATUS_PLACEHOLDER = 'Payment Status';

const recentOrders = [
    { id: 'ORD-1001', customer: 'John Doe', product: 'Wireless Headphones', amount: '$99.99', status: 'Fully Paid', date: '2026-01-11' },
    { id: 'ORD-1002', customer: 'Jane Smith', product: 'Smart Watch', amount: '$199.99', status: 'With Balance', date: '2026-01-10' },
    { id: 'ORD-1003', customer: 'Mike Johnson', product: 'Gaming Laptop', amount: '$1299.99', status: 'Unpaid', date: '2026-01-09' },
    { id: 'ORD-1004', customer: 'Emily Davis', product: '4K Monitor', amount: '$399.99', status: 'With Balance', date: '2026-01-08' },
    { id: 'ORD-1005', customer: 'Emily Davis', product: '4K Monitor', amount: '$399.99', status: 'Fully Paid', date: '2026-01-11' },
];

function TableSection() {
    const { darkMode } = useOutletContext();
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

    // --- DYNAMIC OPTION GENERATION (Like CustomerList) ---
    const extractUniqueOptions = (key, placeholder) => {
        const uniqueValues = [...new Set(recentOrders.map(order => order[key]))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const customerOptions = extractUniqueOptions('customer', CUSTOMER_PLACEHOLDER);
    const paymentOptions = [STATUS_PLACEHOLDER, ALL_OPTION, 'Fully Paid', 'With Balance', 'Unpaid'];

    // --- STATE MANAGEMENT ---
    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [customerFilter, setCustomerFilter] = useState(CUSTOMER_PLACEHOLDER); 
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(STATUS_PLACEHOLDER);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            <div className="p-4 flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Sales</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Latest customer orders</p>
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                        <CustomerFilter options={customerOptions} initialValue={customerFilter} onSelect={setCustomerFilter} iconProps={iconProps}/>
                        <PaymentStatusFilter options={paymentOptions} initialValue={paymentStatusFilter} onSelect={setPaymentStatusFilter} iconProps={iconProps}/>
                    </div>
                    
                    <button onClick={() => setIsModalOpen(true)} className="cursor-pointer flex items-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add Purchase</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order ID</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 text-sm font-medium text-blue-600 dark:text-blue-500">{order.id}</td>
                                <td className="p-4 text-sm">{order.customer}</td>
                                <td className="p-4 text-sm">{order.product}</td>
                                <td className="p-4 text-sm font-semibold">{order.amount}</td>
                                <td className="p-4 text-sm">{order.date}</td>
                                <td className="p-4">
                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddPurchaseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />

        </div>
    )
}

export default TableSection;