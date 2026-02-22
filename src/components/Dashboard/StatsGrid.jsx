import React, { useState, useEffect } from 'react';
import { PhilippinePeso, ShoppingCart, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

function StatsGrid() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        totalExpense: 0,
        needRestock: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // Fetch Total Revenue (sum of all sales amounts)
            const { data: salesData, error: salesError } = await supabase
                .from('SalesTable')
                .select('amount');

            if (salesError) throw salesError;

            const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.amount || 0), 0);

            // Fetch Total Sales Count
            const { count: salesCount, error: countError } = await supabase
                .from('SalesTable')
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;

            // Fetch Total Expenses (sum of all expenses)
            const { data: expensesData, error: expensesError } = await supabase
                .from('ExpensesTable')
                .select('amount');

            if (expensesError) throw expensesError;

            const totalExpense = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);

            // Fetch Products Needing Restock (quantity <= 10, for example)
            const { count: restockCount, error: restockError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .lte('quantity', 10); // Products with 10 or fewer items

            if (restockError) throw restockError;

            setStats({
                totalRevenue,
                totalSales: salesCount || 0,
                totalExpense,
                needRestock: restockCount || 0
            });

        } catch (error) {
            console.error('Error fetching stats:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Real-time listeners for all relevant tables
        const salesChannel = supabase
            .channel('sales-stats-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'SalesTable' },
                () => fetchStats()
            )
            .subscribe();

        const expensesChannel = supabase
            .channel('expenses-stats-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ExpensesTable' },
                () => fetchStats()
            )
            .subscribe();

        const productsChannel = supabase
            .channel('products-stats-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => fetchStats()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(salesChannel);
            supabase.removeChannel(expensesChannel);
            supabase.removeChannel(productsChannel);
        };
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(value);
    };

    const statsData = [
        { 
            title: "Total Revenue", 
            value: formatCurrency(stats.totalRevenue), 
            icon: PhilippinePeso, 
            bgColor: "bg-emerald-500/10", 
            textColor: "text-emerald-500" 
        },
        { 
            title: "Total Sales", 
            value: stats.totalSales.toLocaleString(), 
            icon: ShoppingCart, 
            bgColor: "bg-blue-500/10", 
            textColor: "text-blue-500" 
        },
        { 
            title: "Total Expense", 
            value: formatCurrency(stats.totalExpense), 
            icon: TrendingUp, 
            bgColor: "bg-orange-500/10", 
            textColor: "text-orange-500" 
        },
        { 
            title: "Critical Stock", 
            value: stats.needRestock.toLocaleString(), 
            icon: AlertTriangle, 
            bgColor: "bg-red-500/10", 
            textColor: "text-red-500" 
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-6 py-8 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                        <div className="flex items-center justify-center h-20">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {statsData.map((item, index) => (
                <div 
                    key={index} 
                    className="p-6 py-8 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 group"
                >
                    <div className="flex md:flex-col lg:flex-row items-start justify-between">
                        <div className="flex-1 order-1 md:order-2 lg:order-1 mt-2 lg:mt-0">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {item.title}
                            </p>
                            <h3 className="text-lg sm:text-2xl lg:text-3xl xl:text-xl 2xl:text-3xl font-bold mt-2 text-slate-900 dark:text-white truncate" title={item.value}>
                                {item.value}
                            </h3>
                        </div>

                        <div className={`order-2 md:order-1 mt-[-10px] lg:mt-0 lg:order-2 p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-all duration-300`}>
                            <item.icon className={`w-5 h-5 2xl:w-6 2xl:h-6 ${item.textColor}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;