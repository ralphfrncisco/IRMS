import React, { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase";
import { Loader2 } from 'lucide-react';

function LedgerHistoryTable() {
  const [ledgerData, setLedgerData] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState({ revenue: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  // Check if we need to create a new weekly ledger entry
  const checkAndCreateWeeklyLedger = async () => {
    const now = new Date();
    const phtNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    
    const dayOfWeek = phtNow.getDay();
    const hour = phtNow.getHours();
    const minute = phtNow.getMinutes();
    
    if (dayOfWeek === 1 && hour === 0 && minute < 5) {
      try {
        const { error } = await supabase.rpc('create_weekly_ledger');
        if (error) throw error;
        console.log('✅ Weekly ledger created successfully');
        fetchLedgerData();
      } catch (err) {
        console.error('Error creating weekly ledger:', err);
      }
    }
  };

  const fetchLedgerData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .gte('week_start', monthStart.toISOString().split('T')[0])
        .lte('week_end', monthEnd.toISOString().split('T')[0])
        .order('week_start', { ascending: true });

      if (error) throw error;

      setLedgerData(data || []);

      const totals = (data || []).reduce(
        (acc, week) => ({
          revenue: acc.revenue + Number(week.total_revenue || 0),
          expense: acc.expense + Number(week.total_expense || 0)
        }),
        { revenue: 0, expense: 0 }
      );

      setMonthlyTotals(totals);
    } catch (err) {
      console.error('Error fetching ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
    checkAndCreateWeeklyLedger();

    const interval = setInterval(checkAndCreateWeeklyLedger, 60000);

    const channel = supabase
      .channel('ledger-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ledger' },
        () => fetchLedgerData()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDateRange = (weekStart, weekEnd) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    return `${formatDate(start)} to ${formatDate(end)}`;
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          Revenue & Expense History
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Revenue and expense history per week update
        </p>
      </div>

      <div className="overflow-x-auto h-auto md:max-h-[580px] overflow-y-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Time Frame
              </th>
              <th className="py-4 px-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Revenue
              </th>
              <th className="py-4 px-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Expense
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {ledgerData.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No data available for this month
                </td>
              </tr>
            ) : (
              <>
                {ledgerData.map((week) => (
                  <tr key={week.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                      {formatDateRange(week.week_start, week.week_end)}
                    </td>
                    <td className="py-4 px-6 text-sm text-center font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(week.total_revenue)}
                    </td>
                    <td className="py-4 px-6 text-sm text-center font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(week.total_expense)}
                    </td>
                  </tr>
                ))}
                
                <tr className="bg-slate-100 dark:bg-slate-800/50 font-bold">
                  <td className="py-4 px-6 text-sm text-blue-600 dark:text-blue-400">
                    Total for the month
                  </td>
                  <td className="py-4 px-6 text-sm text-center text-green-600 dark:text-green-400">
                    {formatCurrency(monthlyTotals.revenue)}
                  </td>
                  <td className="py-4 px-6 text-sm text-center text-red-600 dark:text-red-400">
                    {formatCurrency(monthlyTotals.expense)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LedgerHistoryTable;