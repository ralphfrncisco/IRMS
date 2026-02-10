import React , {useEffect, useState} from 'react';
import { BanknoteArrowUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const statsData = [
  { title: "Total Expenses", value: "₱ 15,240.00", icon: BanknoteArrowUp, bgColor: "bg-emerald-500/10", textColor: "text-emerald-500" }
];

function StatsGrid() {
    const [expensesData, setExpensesData] = useState([]);

    const fetchExpensesData = async () => {
        const { data, error } = await supabase
            .from('ExpensesTable')
            .select('amount')

        if (!error) setExpensesData(data || []);
    };

    useEffect(() => {
        fetchExpensesData();

        const channel = supabase
            .channel('ExpensesTable-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ExpensesTable' }, () => {
                fetchExpensesData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);
    
    // Derived array for the UI
    const totalExpenses = expensesData.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

    const statsCards = [
        { title: "Total Expenses", value: `₱ ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: BanknoteArrowUp, bgColor: "bg-emerald-500/10", textColor: "text-emerald-500" }
    ];
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {statsCards.map((item, index) => (
                <div 
                    key={index} 
                    className="p-6 py-8 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 ">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
                                {item.title}
                            </p>
                            <h3 className="text-lg lg:text-3xl font-bold mt-1 text-slate-900/90 dark:text-white">
                                {item.value}
                            </h3>
                        </div>

                        <div className={`p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-all duration-300`}>
                            <item.icon className={`w-6 h-6 ${item.textColor}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;