import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from "../../lib/supabase";
import { Loader2 } from 'lucide-react';

// Predefined colors for the pie chart
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];

function SalesChart() {
    const { darkMode } = useOutletContext();
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                setLoading(true);

                // Fetch all purchased items and aggregate by product name
                const { data, error } = await supabase
                    .from('purchasedItems')
                    .select('product_name, quantity');

                if (error) throw error;

                // Aggregate quantities by product name
                const productTotals = {};
                data.forEach(item => {
                    const productName = item.product_name;
                    const qty = Number(item.quantity) || 0;
                    
                    if (productTotals[productName]) {
                        productTotals[productName] += qty;
                    } else {
                        productTotals[productName] = qty;
                    }
                });

                // Convert to array and sort by quantity (descending)
                const sortedProducts = Object.entries(productTotals)
                    .map(([name, quantity]) => ({ name, quantity }))
                    .sort((a, b) => b.quantity - a.quantity);

                // Take top 5 products
                const topProducts = sortedProducts.slice(0, 5);

                // Calculate total quantity for percentage calculation
                const totalQuantity = topProducts.reduce((sum, product) => sum + product.quantity, 0);

                // Format data for pie chart with percentages
                const formattedData = topProducts.map((product, index) => ({
                    name: product.name,
                    value: Math.round((product.quantity / totalQuantity) * 100),
                    quantity: product.quantity,
                    color: COLORS[index % COLORS.length]
                }));

                setChartData(formattedData);
            } catch (err) {
                console.error('Error fetching top products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopProducts();

        // Real-time listener for purchasedItems
        const channel = supabase
            .channel('purchased-items-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'purchasedItems' },
                () => fetchTopProducts()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return (
            <div className="p-6 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="p-6 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Top Products Sold
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Most Purchased Items
                    </p>
                </div>
                <div className="flex items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                    <p className="text-sm">No sales data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl border transition-all duration-300 bg-white border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Top Products Sold
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Most Purchased Items (All Time)
                </p>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke={darkMode ? "#0f172a" : "#fff"} 
                            strokeWidth={2}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: darkMode ? '#1e293b' : 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
                                color: darkMode ? '#f8fafc' : '#1e293b'
                            }}
                            itemStyle={{ color: darkMode ? '#cbd5e1' : '#475569' }}
                            formatter={(value, name, props) => [
                                `${props.payload.quantity} units (${value}%)`,
                                props.payload.name
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-4">
                {chartData.map((item, index) => (
                    <div className="flex items-center justify-between" key={index}>
                        <div className="flex items-center space-x-3">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                {item.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                                {item.quantity} units
                            </span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-white">
                                {item.value}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SalesChart;