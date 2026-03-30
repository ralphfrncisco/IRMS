import React ,{ useEffect, useState}from 'react';
import { PhilippinePeso, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const statsData = [
    {title: "Active Debts", value: "3", icon: Users, bgColor: "bg-blue-500/10", textColor: "text-blue-500"},
    { title: "Account Receivables", value: "₱25,000", icon: PhilippinePeso, bgColor: "bg-yellow-500/10", textColor: "text-yellow-500" },
];

function StatsGrid() {
    const [balanceData, setBalanceData] = useState([]);

    const fetchBalanceData = async () => {
        const { data, error } = await supabase
            .from('customers')
            .select('remaining_balance');

        if (!error) setBalanceData(data || []);
    };

    useEffect(() => {
        fetchBalanceData();

        const channel = supabase
            .channel('customers-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
                fetchBalanceData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const totalReceivables = balanceData.reduce((sum, row) => sum + (Number(row.remaining_balance) || 0), 0);

    const statsCards = [
        {title: "Active Debts", value: balanceData.length.toString(), icon: Users, bgColor: "bg-blue-500/10", textColor: "text-blue-500"},
        { title: "Account Receivables", value: `₱ ${totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: PhilippinePeso, bgColor: "bg-yellow-500/10", textColor: "text-yellow-500" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {statsCards.map((item, index) => (
                <div 
                    key={index} 
                    className="p-4 lg:p-6 py-8 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-[#111] dark:border-white/10"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-md font-medium text-slate-600 dark:text-slate-400">
                                {item.title}
                            </p>
                            <h3 className="text-2xl lg:text-3xl xl:text-xl 2xl:text-3xl font-bold mt-2 text-slate-900 dark:text-white truncate" title={item.value}>
                                {item.value}
                            </h3>
                        </div>

                        <div className={`p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-all duration-300`}>
                            <item.icon className={`w-5 h-5 2xl:w-6 2xl:h-6 ${item.textColor}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;