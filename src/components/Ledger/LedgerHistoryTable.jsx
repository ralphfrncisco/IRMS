import React, { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase";
import { Loader2 } from 'lucide-react';

function LedgerHistoryTable() {
  const [ledgerData, setLedgerData] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState({ revenue: 0, expense: 0 });
  const [yearlyTotals, setYearlyTotals] = useState({ revenue: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);

      // Get start of current year (Jan 1, 2026)
      const yearStart = new Date(new Date().getFullYear(), 0, 1);

      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .gte('week_start', yearStart.toISOString().split('T')[0])
        .order('week_start', { ascending: true });

      if (error) throw error;

      setLedgerData(data || []);

      // Calculate yearly totals (all data)
      const yearTotals = (data || []).reduce(
        (acc, week) => ({
          revenue: acc.revenue + Number(week.total_revenue || 0),
          expense: acc.expense + Number(week.total_expense || 0)
        }),
        { revenue: 0, expense: 0 }
      );
      setYearlyTotals(yearTotals);

      // Calculate monthly totals (current month only)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthTotals = (data || []).reduce(
        (acc, week) => {
          const weekStart = new Date(week.week_start);
          const weekEnd = new Date(week.week_end);
          
          // Include week if it overlaps with current month
          if (
            (weekStart.getMonth() === currentMonth && weekStart.getFullYear() === currentYear) ||
            (weekEnd.getMonth() === currentMonth && weekEnd.getFullYear() === currentYear)
          ) {
            return {
              revenue: acc.revenue + Number(week.total_revenue || 0),
              expense: acc.expense + Number(week.total_expense || 0)
            };
          }
          return acc;
        },
        { revenue: 0, expense: 0 }
      );
      setMonthlyTotals(monthTotals);

    } catch (err) {
      console.error('Error fetching ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLedgerData();

    // Subscribe to ledger table changes
    const ledgerChannel = supabase
      .channel('ledger-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ledger'
        },
        (payload) => {
          console.log('📊 Ledger updated:', payload);
          fetchLedgerData();
        }
      )
      .subscribe();

    // Subscribe to Sales changes
    const salesChannel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SalesTable'
        },
        (payload) => {
          console.log('💰 Sale changed:', payload);
        }
      )
      .subscribe();

    // Subscribe to Expense changes
    const expenseChannel = supabase
      .channel('expense-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ExpensesTable'
        },
        (payload) => {
          console.log('💸 Expense changed:', payload);
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(ledgerChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(expenseChannel);
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

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
    <div className="py-5 px-3 md:p-4 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="px-0 flex flex-col md:flex-row items-center md:justify-between mb-5">
        <div>       
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Revenue & Expense History
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Revenue and expense history per week update
          </p>
        </div>
        <div className = "w-full md:w-auto pl-4 md:pl-0 mt-7 md:mt-0 mr-0 md:mr-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing data from January 1, {new Date().getFullYear()} onwards
          </p>
        </div>
      </div>

      <div className="overflow-x-auto h-auto md:max-h-[580px] overflow-y-auto custom-scrollbar">
        <table className="w-full">

          {/* <caption className="md:hidden text-xs text-slate-500 dark:text-slate-400 mt-4 mb-4 text-left md:text-right">
            Showing data from January 1, {new Date().getFullYear()} onwards
          </caption> */}
          
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
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
                  No data available for this year
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
                
                {/* Monthly Total */}
                <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold">
                  <td className="py-4 px-6 text-sm text-blue-600 dark:text-blue-400">
                    Total for the month ({getCurrentMonthName()})
                  </td>
                  <td className="py-4 px-6 text-sm text-center text-green-600 dark:text-green-400">
                    {formatCurrency(monthlyTotals.revenue)}
                  </td>
                  <td className="py-4 px-6 text-sm text-center text-red-600 dark:text-red-400">
                    {formatCurrency(monthlyTotals.expense)}
                  </td>
                </tr>

                {/* Yearly Total (with top margin) */}
                <tr className="bg-slate-100 dark:bg-slate-800/50 font-bold border border-slate-300 dark:border-slate-900">
                  <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                    Total for the year ({new Date().getFullYear()})
                  </td>
                  <td className="py-4 px-6 text-sm text-center text-green-700 dark:text-green-500">
                    {formatCurrency(yearlyTotals.revenue)}
                  </td>
                  <td className="py-4 px-6 text-sm text-center text-red-700 dark:text-red-500">
                    {formatCurrency(yearlyTotals.expense)}
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