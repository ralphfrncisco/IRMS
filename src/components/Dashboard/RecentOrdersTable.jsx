import React from 'react'
import { useOutletContext } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';

const recentOrders = [
  {
    id: 'ORD-1001',
    customer: 'John Doe',
    product: 'Wireless Headphones',
    amount: '$99.99',
    status: 'completed',
    date: '2024-06-15',
  },
  {
    id: 'ORD-1002',
    customer: 'Jane Smith',
    product: 'Smart Watch',
    amount: '$199.99',
    status: 'pending',
    date: '2024-06-14',
  },
  {
    id: 'ORD-1003',
    customer: 'Mike Johnson',
    product: 'Gaming Laptop',
    amount: '$1299.99',
    status: 'cancelled',
    date: '2024-06-13',
  },
  {
    id: 'ORD-1004',
    customer: 'Emily Davis',
    product: '4K Monitor',
    amount: '$399.99',
    status: 'completed',
    date: '2024-06-12',
  },

];

function RecentOrdersTable() {
    const { darkMode } = useOutletContext();

    const getStatusColor = (status) => {
        switch (status) {
        case "completed":
            return darkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700";
        case "pending":
            return darkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-700";
        case "cancelled": 
            return darkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700";
        default:
            return darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-700";
        }
    };

  return (
        <div className="space-y-6">

            <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
                <div className={`p-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                    <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Recent Orders</h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Latest customer orders</p>
                    </div>
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">View All</button>
                </div>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                    <tr className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}>
                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Order ID</th>
                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customer</th>
                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Product</th>
                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Amount</th>
                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {recentOrders.map((order, index) => (
                        <tr key={order.id} className={`border-b transition-colors ${
                        darkMode ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50'
                        }`}>
                        <td className="p-4 text-sm font-medium text-emerald-500">{order.id}</td>
                        <td className={`p-4 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{order.customer}</td>
                        <td className={`p-4 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{order.product}</td>
                        <td className={`p-4 text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{order.amount}</td>
                        <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                            </span>
                        </td>
                        <td className={`p-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.date}</td>
                        <td className="p-4 text-right">
                            <button className={`${darkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
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