import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart
} from "recharts";
import { supabase } from "../../lib/supabase";
import { Loader2 } from 'lucide-react';

function RevenueChart() {
  const { darkMode } = useOutletContext();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const currentDay = now.getDay();
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // ✅ Fetch sales using created_at and paid_amount
      const { data: salesData, error: salesError } = await supabase
        .from('SalesTable')
        .select('created_at, paid_amount')
        .gte('created_at', monday.toISOString())
        .lte('created_at', sunday.toISOString());

      if (salesError) throw salesError;

      // ✅ Fetch expenses using created_at
      const { data: expensesData, error: expensesError } = await supabase
        .from('ExpensesTable')
        .select('amount, created_at')
        .gte('created_at', monday.toISOString())
        .lte('created_at', sunday.toISOString());

      if (expensesError) throw expensesError;

      const totalWeeklyExpense = (expensesData || []).reduce((sum, exp) => {
        return sum + (Number(exp.amount) || 0);
      }, 0);

      const dailyRevenue = {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0
      };

      (salesData || []).forEach(sale => {
        const saleDate = new Date(sale.created_at);
        const dayName = saleDate.toLocaleDateString('en-US', { 
          weekday: 'long',
          timeZone: 'Asia/Manila' 
        });
        
        if (dailyRevenue[dayName] !== undefined) {
          dailyRevenue[dayName] += Number(sale.paid_amount) || 0;
        }
      });

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const formattedData = daysOfWeek.map(day => ({
        day,
        revenue: dailyRevenue[day],
        expenses: totalWeeklyExpense
      }));

      setChartData(formattedData);
    } catch (err) {
      console.error('❌ Error fetching weekly data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();

    const salesChannel = supabase
      .channel('sales-chart-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'SalesTable' },
        () => fetchWeeklyData()
      )
      .subscribe();

    const expensesChannel = supabase
      .channel('expenses-chart-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ExpensesTable' },
        () => fetchWeeklyData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
        <div className = "w-full">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Revenue Chart
          </h3>
          <p className="block text-sm text-slate-500 dark:text-slate-400">
            Daily Revenue vs Total Expense
          </p>
        </div>

        <div className = "hidden md:flex w-full justify-end items-center mt-5 pr-2">
          <span className="text-sm font-normal text-slate-700 dark:text-slate-300">
            Total Expense of this Week: <span className = "text-lg font-semibold text-slate-700 dark:text-slate-200">₱ {chartData.length > 0 ? chartData[0].expenses.toLocaleString() : '0'}</span>
          </span>
        </div>
      </div>

      <div className="h-85 w-full pb-12 md:pb-7">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              tick={{ dy: 10 }} 
            />
            <YAxis 
              stroke={darkMode ? "#94a3b8" : "#64748b"}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)' }}
              contentStyle={{
                backgroundColor: darkMode ? "#f3f3f5" : "#ffffff",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              }}
              formatter={(value) => `₱${value.toLocaleString()}`}
            />
            <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} maxBarSize={60} />
            
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>

        <div className = "flex md:hidden justify-end items-center mt-5 pr-2">
          <span className="text-sm font-normal text-slate-700 dark:text-slate-300">
            Total Weekly Expenses: <span className = "text-lg font-semibold text-slate-700 dark:text-slate-200">₱ {chartData.length > 0 ? chartData[0].expenses.toLocaleString() : '0'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default RevenueChart;