import React, { useState, useEffect } from 'react';
import { PhilippinePeso, Wallet, PackageCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function StatsGrid() {
    const [salesData, setSalesData] = useState([]);
    const [receivablesData, setReceivablesData] = useState([]);

    const fetchSalesData = async () => {
        const { data, error } = await supabase
            .from('SalesTable')
            .select('paid_amount');

        if (!error) setSalesData(data || []);
    };

    const fetchReceivablesData = async () => {
        const { data, error } = await supabase
            .from('customers')
            .select('remaining_balance');

        if (!error) setReceivablesData(data || []);
    };

    useEffect(() => {
        fetchSalesData();

        const salesChannel = supabase
            .channel('sales-stats-channel')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'SalesTable' 
            }, () => {
                fetchSalesData();
            })
            .subscribe();

        return () => { supabase.removeChannel(salesChannel); };
    }, []);

    useEffect(() => {
        fetchReceivablesData();

        const receivablesChannel = supabase
            .channel('customers-stats-channel')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'customers' 
            }, () => {
                fetchReceivablesData();
            })
            .subscribe();

        return () => { supabase.removeChannel(receivablesChannel); };
    }, []);

    // ✅ Fixed calculations
    const totalProfit = salesData.reduce((sum, row) => sum + (Number(row.paid_amount) || 0), 0);
    const totalReceivables = receivablesData.reduce((sum, row) => sum + (Number(row.remaining_balance) || 0), 0);
    
    const statsCards = [
        { 
            title: "Total Number of Sales", 
            value: salesData.length.toString(), 
            icon: PackageCheck, 
            bgColor: "bg-emerald-500/10", 
            textColor: "text-emerald-500" 
        },
        { 
            title: "Total Amount of Profit", 
            value: `₱ ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            icon: Wallet, 
            bgColor: "bg-blue-500/10", 
            textColor: "text-blue-500" 
        },
        { 
            title: "Account Receivables", 
            value: `₱ ${totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            icon: PhilippinePeso, 
            bgColor: "bg-orange-500/10", 
            textColor: "text-red-500" 
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {statsCards.map((card, index) => (
                <div 
                    key={index} 
                    className="p-6 py-8 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-[#111] dark:border-white/10 group"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-normal text-slate-600 dark:text-white/70" id = "grid-title">
                                {card.title}
                            </p>
                            <h3 className="text-lg lg:text-3xl font-bold mt-1 text-slate-900/90 dark:text-white">
                                {card.value}
                            </h3>
                        </div>

                        <div className={`p-3 rounded-xl ${card.bgColor}`}>
                            <card.icon className={`w-6 h-6 ${card.textColor}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;