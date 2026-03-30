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
        case 'day':   await fetchHourlyData(); break;
        case 'week':  await fetchWeeklyData(); break;
        case 'month': await fetchMonthlyData(); break;
        case 'year':  await fetchYearlyData(); break;
        default:      await fetchWeeklyData();
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
      '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
      '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'
    ];

    setChartData(hoursOrder.map(hour => ({
      day: hour,
      label: hour, // hours are already short
      revenue: hourlyRevenue[hour]
    })));
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

    // Full names used for matching, short labels for display
    const dayMap = [
      { day: 'Monday',    label: 'Mon' },
      { day: 'Tuesday',   label: 'Tue' },
      { day: 'Wednesday', label: 'Wed' },
      { day: 'Thursday',  label: 'Thu' },
      { day: 'Friday',    label: 'Fri' },
      { day: 'Saturday',  label: 'Sat' },
      { day: 'Sunday',    label: 'Sun' },
    ];

    const dailyRevenue = {};
    dayMap.forEach(({ day }) => dailyRevenue[day] = 0);

    (salesData || []).forEach(sale => {
      const dayName = new Date(sale.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'Asia/Manila'
      });
      if (dailyRevenue[dayName] !== undefined) {
        dailyRevenue[dayName] += Number(sale.paid_amount) || 0;
      }
    });

    setChartData(dayMap.map(({ day, label }) => ({
      day,
      label,  // ✅ short label for X-axis display
      revenue: dailyRevenue[day]
    })));
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

    const weeklyRevenue = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };
    if (lastDay.getDate() > 28) weeklyRevenue['Week 5'] = 0;

    (salesData || []).forEach(sale => {
      const dayOfMonth = new Date(sale.created_at).getDate();
      const weekLabel = `Week ${Math.ceil(dayOfMonth / 7)}`;
      if (weeklyRevenue[weekLabel] !== undefined) {
        weeklyRevenue[weekLabel] += Number(sale.paid_amount) || 0;
      }
    });

    setChartData(Object.keys(weeklyRevenue).map(week => ({
      day: week,
      label: week, // "Week 1" is already short enough
      revenue: weeklyRevenue[week]
    })));
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

    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = {};
    monthsOrder.forEach(m => monthlyRevenue[m] = 0);

    (salesData || []).forEach(sale => {
      const monthName = new Date(sale.created_at).toLocaleDateString('en-US', {
        month: 'short',
        timeZone: 'Asia/Manila'
      });
      if (monthlyRevenue[monthName] !== undefined) {
        monthlyRevenue[monthName] += Number(sale.paid_amount) || 0;
      }
    });

    setChartData(monthsOrder.map(month => ({
      day: month,
      label: month,
      revenue: monthlyRevenue[month]
    })));
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

    return () => supabase.removeChannel(salesChannel);
  }, [selectedFilter]);

  if (loading) {
    return (
      <div className="h-119.5 p-6 rounded-2xl border bg-white border-slate-200 dark:bg-[#111] dark:border-white/10">
        <div className="flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-[#111] dark:border-white/10">
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
              dataKey="label"  // ✅ display short label
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
              labelFormatter={(label, payload) => payload?.[0]?.payload?.day ?? label} // ✅ show full name in tooltip
              formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
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