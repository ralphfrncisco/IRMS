import React from 'react'
import { useOutletContext } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';

const recentOrders = [
  { id: 'ORD-1001', customer: 'John Doe', product: 'Wireless Headphones', amount: '$99.99', status: 'completed', date: '2024-06-15' },
  { id: 'ORD-1002', customer: 'Jane Smith', product: 'Smart Watch', amount: '$199.99', status: 'pending', date: '2024-06-14' },
  { id: 'ORD-1003', customer: 'Mike Johnson', product: 'Gaming Laptop', amount: '$1299.99', status: 'cancelled', date: '2024-06-13' },
  { id: 'ORD-1004', customer: 'Emily Davis', product: '4K Monitor', amount: '$399.99', status: 'completed', date: '2024-06-12' },
];

function RecentOrdersTable() {
    const { darkMode } = useOutletContext();

    const getStatusColor = (status) => {
        switch (status) {
        case "completed":
            return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
        case "pending":
            return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
        case "cancelled": 
            return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
        default:
            return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    };

  return (
        <div className="space-y-6">
            <div className="rounded-2xl border transition-all duration-300 overflow-hidden bg-white border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Sales</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Latest customer orders</p>
                        </div>
                        <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">View All</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order ID</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="border-b transition-colors border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/30">
                                    <td className="p-4 text-sm font-medium text-emerald-500">{order.id}</td>
                                    <td className="p-4 text-sm text-slate-800 dark:text-slate-300">{order.customer}</td>
                                    <td className="p-4 text-sm text-slate-800 dark:text-slate-300">{order.product}</td>
                                    <td className="p-4 text-sm font-semibold text-slate-900 dark:text-white">{order.amount}</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{order.date}</td>
                                    <td className="p-4 text-right">
                                        <button className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
export default RecentOrdersTable;