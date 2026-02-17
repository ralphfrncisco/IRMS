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
      const currentDay = now.getDay(); // 0=Sun, 1=Mon, 2=Tue...

      console.log('📅 Today:', now.toISOString(), '| Day of week:', currentDay);

      // ✅ FIXED: Properly calculate Monday
      // If Sunday (0), go back 6 days
      // If Monday (1), go back 0 days
      // If Tuesday (2), go back 1 day... etc
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // ✅ Use LOCAL date string to avoid timezone offset issues
      const toLocalDateStr = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const mondayStr = toLocalDateStr(monday);
      const sundayStr = toLocalDateStr(sunday);

      console.log('🗓️ Current week:', { mondayStr, sundayStr });
      // Expected: mondayStr: '2026-02-16', sundayStr: '2026-02-22'

      // Fetch sales for current week
      const { data: salesData, error: salesError } = await supabase
        .from('SalesTable')
        .select('date, amount')
        .gte('date', mondayStr)
        .lte('date', sundayStr);

      if (salesError) throw salesError;

      console.log('💰 Sales this week:', salesData);

      // Fetch expenses for current week
      const { data: expensesData, error: expensesError } = await supabase
        .from('ExpensesTable')
        .select('amount')
        .gte('date', mondayStr)
        .lte('date', sundayStr);

      if (expensesError) throw expensesError;

      console.log('💸 Expenses this week:', expensesData);

      // Calculate total weekly expense
      const totalWeeklyExpense = expensesData.reduce((sum, exp) => {
        return sum + (Number(exp.amount) || 0);
      }, 0);

      console.log('📊 Total weekly expense:', totalWeeklyExpense);

      // Divide by 7 to get daily expense
      const dailyExpense = totalWeeklyExpense / 7;

      // Group sales by day
      const dailyRevenue = {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0
      };

      salesData.forEach(sale => {
        const saleDate = new Date(sale.date + 'T00:00:00');
        const dayName = saleDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        console.log('📅 Sale:', { date: sale.date, dayName, amount: sale.amount });
        
        if (dailyRevenue[dayName] !== undefined) {
          dailyRevenue[dayName] += Number(sale.amount) || 0;
        }
      });

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const formattedData = daysOfWeek.map(day => ({
        day,
        revenue: dailyRevenue[day],
        // expenses: Math.round(dailyExpense * 100) / 100
        expenses:totalWeeklyExpense
      }));

      console.log('📊 Final chart data:', formattedData);

      setChartData(formattedData);
    } catch (err) {
      console.error('❌ Error fetching weekly data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();

    // Real-time updates
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
    // Reduced padding slightly to allow chart more room
    <div className="p-4 sm:p-6 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Revenue Chart
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Daily Revenue vs Total Expense (This Week)
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-600 dark:text-slate-300">Revenue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
            <span className="text-sm text-slate-600 dark:text-slate-300">Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* Adjusted margins to use more of the horizontal space */}
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
              cursor={{ fill: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)' }}
              contentStyle={{
                backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              }}
              formatter={(value) => `₱${value.toLocaleString()}`}
            />
            {/* Increased maxBarSize slightly */}
            <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar dataKey="expenses" fill="url(#expensesGradient)" radius={[4, 4, 0, 0]} maxBarSize={60} />
            
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
  );
}

export default RevenueChart;