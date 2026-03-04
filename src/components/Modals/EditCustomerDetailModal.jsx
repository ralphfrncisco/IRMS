import React, { useState, useEffect } from 'react';
import { X, User, Phone, PhilippinePeso, Loader2, ShoppingBag } from 'lucide-react';
import { supabase } from "../../lib/supabase";
import { formatDateTimeShort } from '../../utils/dateTimeFormatter';

function EditCustomerDetailModal({ isOpen, onClose, customerData }) {
    const [formData, setFormData] = useState({
        full_name: '',
        contact_number: '',
        credit_limit: '',
        remaining_balance: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const formatInputCurrency = (value) => {
        if (!value || value === '0') return '';
        const cleanValue = value.toString().replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts.length > 1) {
            return `${parts[0]}.${parts[1].substring(0, 2)}`;
        }
        return parts[0];
    };

    const formatCurrency = (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return '₱ 0.00';
        return `₱ ${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num)}`;
    };

    // Fetch customer orders when modal opens
    useEffect(() => {
        if (customerData) {
            setFormData({
                full_name: customerData.full_name || '',
                contact_number: customerData.contact_number || '',
                credit_limit: formatInputCurrency(customerData.credit_limit?.toString() || ''),
                remaining_balance: formatInputCurrency(customerData.remaining_balance?.toString() || '')
            });

            const fetchOrders = async () => {
                setOrdersLoading(true);
                const { data, error } = await supabase
                    .from('SalesTable')
                    .select('order_id, purchased_items, total_amount, paid_amount, remaining_balance, created_at, status')
                    .eq('customer_id', customerData.customer_id)
                    .order('created_at', { ascending: false });

                if (!error) setOrders(data || []);
                setOrdersLoading(false);
            };

            fetchOrders();
        }
    }, [customerData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'credit_limit' || name === 'remaining_balance') {
            setFormData(prev => ({ ...prev, [name]: formatInputCurrency(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerData?.customer_id) {
            alert('Customer ID is missing. Cannot update.');
            return;
        }
        setIsUpdating(true);

        try {
            const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;

            const { error } = await supabase
                .from('customers')
                .update({
                    full_name: formData.full_name,
                    contact_number: formData.contact_number,
                    credit_limit: parseNum(formData.credit_limit),
                    remaining_balance: parseNum(formData.remaining_balance)
                })
                .eq('customer_id', customerData.customer_id);

            if (error) throw error;
            onClose();
        } catch (err) {
            alert('Error updating customer: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Fully Paid":   return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
            case "With Balance": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            case "Unpaid":       return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
            default:             return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    };

    if (!isOpen || !customerData) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Customer Details</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{customerData.full_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Body — two side-by-side panels */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                    {/* LEFT PANEL — Edit Form */}
                    <div className="w-full md:w-85 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 h-full flex flex-col">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Full Name 
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Contact Number *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <input
                                        type="tel"
                                        name="contact_number"
                                        value={formData.contact_number}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Remaining Balance */}
                            <div>
                                <label className="block text-sm font-semibold text-red-600 dark:text-red-500 mb-2">
                                    Remaining Balance
                                </label>
                                <div className="relative">
                                    <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <input
                                        type="text"
                                        name="remaining_balance"
                                        value={formData.remaining_balance}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Credit Limit */}
                            <div>
                                <label className="block text-sm font-semibold text-orange-600 dark:text-orange-500 mb-2">
                                    Credit Limit
                                </label>
                                <div className="relative">
                                    <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <input
                                        type="text"
                                        name="credit_limit"
                                        value={formData.credit_limit}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            

                            {/* Buttons — pushed to bottom */}
                            <div className="flex gap-3 pt-2 mt-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT PANEL — Order History */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                            <p className="text-md font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order History</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {ordersLoading ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} found`}
                            </p>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {ordersLoading ? (
                                <div className="flex items-center justify-center h-48">
                                    <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 dark:text-slate-600">
                                    <ShoppingBag className="w-8 h-8" />
                                    <p className="text-sm">No orders found for this customer</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead>
                                        <tr className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                                            <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">Order ID</th>
                                            <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Items</th>
                                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">Total</th>
                                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">Paid</th>
                                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">Balance</th>
                                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">Date</th>
                                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {orders.map((order) => (
                                            <tr key={order.order_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3 text-sm font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                    {`ORD-${order.order_id.toString().padStart(4, '0')}`}
                                                </td>
                                                <td className="p-3 text-sm text-slate-700 dark:text-slate-300">
                                                    <p className="max-w-[180px] truncate">{order.purchased_items}</p>
                                                </td>
                                                <td className="p-3 text-center text-sm font-semibold text-slate-700 dark:text-white whitespace-nowrap">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="p-3 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    {formatCurrency(order.paid_amount)}
                                                </td>
                                                <td className="p-3 text-center text-sm font-semibold text-red-500 whitespace-nowrap">
                                                    {formatCurrency(order.remaining_balance)}
                                                </td>
                                                <td className="p-3 text-center text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {formatDateTimeShort(order.created_at)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditCustomerDetailModal;