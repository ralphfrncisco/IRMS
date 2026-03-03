import React, { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase";
import { Loader2, Package } from 'lucide-react';

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

function TopProductsSold() {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase
                    .from('purchasedItems')
                    .select('product_name, quantity, amount');

                if (error) throw error;

                // Aggregate both quantity and revenue per product in one pass
                const productTotals = {};
                data.forEach(item => {
                    const name = item.product_name;
                    const qty = Number(item.quantity) || 0;
                    const amount = Number(item.amount) || 0;

                    if (!productTotals[name]) {
                        productTotals[name] = { quantity: 0, revenue: 0 };
                    }

                    productTotals[name].quantity += qty;
                    productTotals[name].revenue += amount * qty; // ✅ Fixed: was using wrong accumulator
                });

                const sorted = Object.entries(productTotals)
                    .map(([name, { quantity, revenue }]) => ({ name, quantity, revenue }))
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5);

                const max = sorted[0]?.quantity || 1;

                const formatted = sorted.map((product, index) => ({
                    ...product,
                    percentage: Math.round((product.quantity / max) * 100),
                    color: COLORS[index % COLORS.length],
                }));

                setChartData(formatted);
            } catch (err) {
                console.error('Error fetching top products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopProducts();

        const channel = supabase
            .channel('purchased-items-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'purchasedItems' }, fetchTopProducts)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    if (loading) {
        return (
            <div className="h-auto lg:h-119.5 p-6 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center justify-center h-119.5">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="h-119.5 p-6 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Top Products Sold</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Most Purchased Items</p>
                </div>
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 dark:text-slate-600 mt-[-10%]">
                    <Package className="w-8 h-8" />
                    <p className="text-sm">No sales data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-auto lg:h-119.5 p-6 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Top Products Sold</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Most Purchased Items (All Time)</p>
            </div>

            {/* Bar Chart Rows */}
            <div className="space-y-5">
                {chartData.map((item, index) => (
                    <div key={index}>
                        {/* Top row: Product Name + Revenue */}
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                                    {item.name}
                                </span>
                            </div>
                            {/* Revenue on the right */}
                            <span className="text-sm font-semibold text-slate-800 dark:text-white tabular-nums flex-shrink-0 ml-2">
                                ₱{item.revenue.toLocaleString()}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${item.percentage}%`,
                                    backgroundColor: item.color,
                                }}
                            />
                        </div>

                        {/* Bottom label: quantity sold */}
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {item.quantity.toLocaleString()} {item.quantity === 1 ? 'item' : 'items'} sold
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TopProductsSold;