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

      // Get LAST week's Monday and Sunday (more useful data)
      const now = new Date();
      
      // Go back to last week
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      
      const currentDay = lastWeek.getDay();
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const monday = new Date(lastWeek);
      monday.setDate(lastWeek.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const mondayStr = monday.toISOString().split('T')[0];
      const sundayStr = sunday.toISOString().split('T')[0];

      console.log('🗓️ Showing LAST week:', { mondayStr, sundayStr });

      // Rest of your code stays the same...
      const { data: salesData, error: salesError } = await supabase
        .from('SalesTable')
        .select('date, amount')
        .gte('date', mondayStr)
        .lte('date', sundayStr);

      if (salesError) throw salesError;

      console.log('💰 Sales found:', salesData?.length || 0);

      const { data: ledgerData, error: ledgerError } = await supabase
        .from('ledger')
        .select('total_expense')
        .eq('week_start', mondayStr)
        .eq('week_end', sundayStr)
        .single();

      console.log('📋 Ledger query:', { 
        mondayStr, 
        sundayStr, 
        found: !!ledgerData, 
        error: ledgerError?.message,
        expense: ledgerData?.total_expense 
      });

      let totalWeeklyExpense = 0;

      if (ledgerData && !ledgerError) {
        totalWeeklyExpense = Number(ledgerData.total_expense) || 0;
        console.log('✅ Using expense from ledger:', totalWeeklyExpense);
      } else {
        console.log('⚠️ Ledger not found, calculating from ExpensesTable');
        
        const { data: expensesData, error: expensesError } = await supabase
          .from('ExpensesTable')
          .select('amount')
          .gte('date', mondayStr)
          .lte('date', sundayStr);

        if (!expensesError && expensesData) {
          totalWeeklyExpense = expensesData.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
          console.log('✅ Calculated expense from ExpensesTable:', totalWeeklyExpense);
        }
      }

      const dailyExpense = totalWeeklyExpense / 7;
      console.log('📊 Daily expense (total / 7):', dailyExpense);

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
        expenses: Math.round(dailyExpense * 100) / 100
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
    <div className="p-6 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
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
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)' }}
              contentStyle={{
                backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
                color: darkMode ? "#f8fafc" : "#1e293b"
              }}
              itemStyle={{ color: darkMode ? "#cbd5e1" : "#475569" }}
              formatter={(value) => `₱${value.toLocaleString()}`}
            />
            <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="expenses" fill="url(#expensesGradient)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            
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