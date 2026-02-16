import React, {useEffect, useState} from 'react';
import { Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {useNavigate} from "react-router-dom";

function RecentOrdersTable() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('SalesTable')
                .select('*')
                .order('order_id', { ascending: false })
                .limit(4);

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

    const formatCurrency = (value) => {
        if (isNaN(value)) return "₱ 0.00";
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `₱ ${formatter.format(value)}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
        case "Fully Paid":
            return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
        case "With Balance":
            return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
        case "Unpaid": 
            return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
        default:
            return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    };

    const handleViewAll = () => {
        navigate('/transactions/sales');
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border transition-all duration-300 overflow-hidden bg-white border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Sales</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Latest customer orders</p>
                        </div>
                        <button onClick = {handleViewAll} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">View All</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-1">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order ID</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>
                                <th className="w-[100px] p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Purchased Item/s</th>
                                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>
                                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="6" className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : orders.length === 0 ?
                        (
                            <tr>
                                <td colSpan="7" className="p-10 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <p className="text-lg font-medium">No records found</p>
                                        <p className="text-sm">Try adjusting your filters or Add a purchase.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (orders.map((order) => (
                                <tr key={order.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-sm font-medium text-blue-600 dark:text-blue-500">
                                        {`ORD-${order.order_id.toString().padStart(4, '0')}`}
                                    </td>
                                    <td className="p-4 text-sm text-slate-800 dark:text-slate-300">{order.customer}</td>
                                    <td className="p-4 text-sm">
                                        <p className = "max-w-[200px] lg:w-full truncate dark:text-slate-300">{order.purchased_items}</p>
                                    </td>
                                    <td className="p-4 text-sm text-center font-semibold text-slate-700 dark:text-white">{formatCurrency(order.amount)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-center text-slate-500 dark:text-slate-400">{order.date}</td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
export default RecentOrdersTable;