import React from 'react'
import { useOutletContext } from 'react-router-dom';
import {
  Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart
} from "recharts";

function RevenueChart() {
  const { darkMode } = useOutletContext(); // Get dark mode from your layout context

  const data = [
    { day: 'Monday', revenue: 45000, expenses: 32000 },
    { day: 'Tuesday', revenue: 52000, expenses: 38000 },
    { day: 'Wednesday', revenue: 48000, expenses: 35000 },
    { day: 'Thursday', revenue: 61000, expenses: 42000 },
    { day: 'Friday', revenue: 55000, expenses: 40000 },
  ];

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${
      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Revenue Chart
          </h3>
          <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
            Daily Revenue and Expenses
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Revenue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
            <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={darkMode ? "#334155" : "#e2e8f0"} 
              vertical={false}
            />
            <XAxis 
              dataKey="day" 
              stroke={darkMode ? "#94a3b8" : "#64748b"}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={darkMode ? "#94a3b8" : "#64748b"}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₱${value / 1000}k`}
            />
            <Tooltip
              cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              contentStyle={{
                backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
                color: darkMode ? "#f8fafc" : "#1e293b"
              }}
              itemStyle={{ color: darkMode ? "#cbd5e1" : "#475569" }}
            />
            <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expenses" fill="url(#expensesGradient)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RevenueChart;