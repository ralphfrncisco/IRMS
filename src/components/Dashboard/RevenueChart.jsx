import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart } from "recharts";
import { supabase } from "../../lib/supabase";
import { Loader2 } from 'lucide-react';
import ChartHeader from './ChartHeader';

function RevenueChart() {
  const { darkMode } = useOutletContext();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('week');

  const fetchData = async (filter) => {
    try {
      setLoading(true);
      switch (filter) {
        case 'day':
          await fetchHourlyData();
          break;
        case 'week':
          await fetchWeeklyData();
          break;
        case 'month':
          await fetchMonthlyData();
          break;
        case 'year':
          await fetchYearlyData();
          break;
        default:
          await fetchWeeklyData();
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHourlyData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data: salesData, error: salesError } = await supabase
      .from('SalesTable')
      .select('created_at, paid_amount')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (salesError) throw salesError;

    const hourlyRevenue = {};
    for (let i = 0; i < 24; i++) {
      const hour = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
      hourlyRevenue[hour] = 0;
    }

    (salesData || []).forEach(sale => {
      const saleDate = new Date(sale.created_at);
      const hour = saleDate.getHours();
      const hourLabel = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
      
      if (hourlyRevenue[hourLabel] !== undefined) {
        hourlyRevenue[hourLabel] += Number(sale.paid_amount) || 0;
      }
    });

    const hoursOrder = [
      '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
      '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'
    ];

    const formattedData = hoursOrder.map(hour => ({
      day: hour,
      revenue: hourlyRevenue[hour]
    }));

    setChartData(formattedData);
  };

  const fetchWeeklyData = async () => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { data: salesData, error: salesError } = await supabase
      .from('SalesTable')
      .select('created_at, paid_amount')
      .gte('created_at', monday.toISOString())
      .lte('created_at', sunday.toISOString());

    if (salesError) throw salesError;

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
      revenue: dailyRevenue[day]
    }));

    setChartData(formattedData);
  };

  const fetchMonthlyData = async () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    const { data: salesData, error: salesError } = await supabase
      .from('SalesTable')
      .select('created_at, paid_amount')
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString());

    if (salesError) throw salesError;

    const weeklyRevenue = {
      'Week 1': 0,
      'Week 2': 0,
      'Week 3': 0,
      'Week 4': 0,
    };

    const daysInMonth = lastDay.getDate();
    if (daysInMonth > 28) weeklyRevenue['Week 5'] = 0;

    (salesData || []).forEach(sale => {
      const saleDate = new Date(sale.created_at);
      const dayOfMonth = saleDate.getDate();
      const weekNumber = Math.ceil(dayOfMonth / 7);
      const weekLabel = `Week ${weekNumber}`;
      
      if (weeklyRevenue[weekLabel] !== undefined) {
        weeklyRevenue[weekLabel] += Number(sale.paid_amount) || 0;
      }
    });

    const formattedData = Object.keys(weeklyRevenue).map(week => ({
      day: week,
      revenue: weeklyRevenue[week]
    }));

    setChartData(formattedData);
  };

  const fetchYearlyData = async () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    firstDay.setHours(0, 0, 0, 0);
    
    const lastDay = new Date(now.getFullYear(), 11, 31);
    lastDay.setHours(23, 59, 59, 999);

    const { data: salesData, error: salesError } = await supabase
      .from('SalesTable')
      .select('created_at, paid_amount')
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString());

    if (salesError) throw salesError;

    const monthlyRevenue = {
      'Jan': 0,
      'Feb': 0,
      'Mar': 0,
      'Apr': 0,
      'May': 0,
      'Jun': 0,
      'Jul': 0,
      'Aug': 0,
      'Sep': 0,
      'Oct': 0,
      'Nov': 0,
      'Dec': 0
    };

    (salesData || []).forEach(sale => {
      const saleDate = new Date(sale.created_at);
      const monthName = saleDate.toLocaleDateString('en-US', { 
        month: 'short',
        timeZone: 'Asia/Manila' 
      });
      
      if (monthlyRevenue[monthName] !== undefined) {
        monthlyRevenue[monthName] += Number(sale.paid_amount) || 0;
      }
    });

    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = monthsOrder.map(month => ({
      day: month,
      revenue: monthlyRevenue[month]
    }));

    setChartData(formattedData);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    fetchData(filter);
  };

  useEffect(() => {
    fetchData(selectedFilter);

    const salesChannel = supabase
      .channel('sales-chart-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'SalesTable' }, () => fetchData(selectedFilter))
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
    };
  }, [selectedFilter]);

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
      <ChartHeader
        title="Revenue Chart"
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />

      <div className="h-85 w-full">
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
                <stop offset="0%" stopColor="#00BC7D" />
                <stop offset="100%" stopColor="#0e3327" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueChart;