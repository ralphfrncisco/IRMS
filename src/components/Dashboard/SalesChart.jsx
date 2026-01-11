import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
    { name: "Electronics", value: 45, color: "#3b82f6" },
    { name: "Clothing", value: 30, color: "#8b5cf6" },
    { name: "Books", value: 15, color: "#10b981" },
    { name: "Other", value: 10, color: "#f59e0b" },
];

function SalesChart() {
    // Get dark mode from your MainLayout context
    const { darkMode } = useOutletContext();

    return (
        <div className="p-6 rounded-2xl border transition-all duration-300 bg-white border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Sales by Category
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Production Distribution
                </p>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            // Matches the stroke to the background color for a clean look
                            stroke={darkMode ? "#0f172a" : "#fff"} 
                            strokeWidth={2}
                        >
                            {data.map((entry, index) => (
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
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-4">
                {data.map((item, index) => (
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
                        <div className="text-sm font-semibold text-slate-800 dark:text-white">
                            {item.value}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SalesChart;