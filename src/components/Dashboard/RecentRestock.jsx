import React, {useEffect, useState} from 'react';
import { Loader2, Package, Clock, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {useNavigate} from "react-router-dom";

import { formatDateTimeShort } from '../../utils/dateTimeFormatter';

function RecentRestock() {
  const [RestockData, setRestockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ExpensesTable')
      .select('expense_type, amount, created_at, supplier_name, purchased_items, recorded_by')
      .eq('expense_type', 'Stock Expense')
      .order('created_at', { ascending: false })
      .limit(4);

    if (!error) setRestockData(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchExpenses ();

    // Real-time listener for customers
    const channel = supabase
      .channel('expenses-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ExpensesTable' },
        () => { fetchExpenses () }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel) }
  }, []);

  const formatCurrency = (value) => {
    if (isNaN(value)) return "₱ 0.00";
    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `₱ ${formatter.format(value)}`;
  };

  if (RestockData.length === 0) {
    return (
      <div className="h-80 p-6 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Recent Restock
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View your recent restock
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 dark:text-slate-600 mt-[-10%]">
          <Package className="w-8 h-8" />
          <p className="text-sm">No sales data available</p>
        </div>
      </div>
    );
  }

  const handleViewAll = () => {
      navigate('/transactions/Expenses');
  }

  return (
    <div className="h-full pb-6 space-y-5 rounded-2xl border transition-all duration-300 bg-white border-slate-200 border-red-500 dark:bg-slate-900 dark:border-slate-800">
      <div className="p-6 border-b flex items-center justify-between border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Recent Restock
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View your recent restock
          </p>
        </div>
        <button onClick = {handleViewAll} className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
          View All
        </button>
      </div>

      {loading ? (
        <div className = "h-80 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : 
      (
        <div className="p-3">
          <div className="space-y-2">
            {RestockData.map((expense) => (
              <div key={expense.expense_id} className="flex items-start py-2.5 space-x-4 px-4 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className = "p-2 rounded-lg shrink-0 bg-blue-500/10 transition-all duration-300">
                  <Package className = "w-4 h-4 text-blue-500"/>
                </div>

                <div className = "flex-1 min-w-0 space-y-1">
                  <p className = "max-w-[250px] text-sm text-slate-700 font-medium dark:text-slate-200 truncate">
                    {expense.purchased_items || expense.expense_type}
                  </p>

                  <p className = "text-xs text-slate-500 dark:text-slate-300 truncate">
                    Bought from {expense.supplier_name}
                  </p>

                  <div className = "flex items-center space-x-2 mt-2">
                    <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-500">
                      {formatDateTimeShort(expense.created_at)}
                    </span>
                  </div>

                  <div className = "flex items-center space-x-2 mt-2">
                    <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-500">
                      {expense.recorded_by}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-orange-500 dark:text-orange-400">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentRestock;