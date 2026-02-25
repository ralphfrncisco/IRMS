import React, {useState, useEffect} from 'react';
import { Users } from 'lucide-react';
import { supabase } from "../../lib/supabase";

const statsData = [
  { title: "Total Suppliers", value: "15", icon: Users, bgColor: "bg-blue-500/10", textColor: "text-blue-500" },
];

function StatsGrid() {
    const [supplierData, setSupplierData] = useState([])

    
    const fetchSuppliers = async () => {
        const { data, error } = await supabase
            .from('supplier')
            .select('*')
            .order('id', { ascending: true })
    
        if (!error) setSupplierData(data);
    }
    
    useEffect(() => {
        fetchSuppliers();
    
        // Real-time listener for SupplierTable
        const channel = supabase
            .channel('supplier-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'supplier' },
                () => { fetchSuppliers() }
            )
            .subscribe();
    
        return () => { supabase.removeChannel(channel) }
    }, []);

    const statsCards = [
        { 
            title: "Total Suppliers", 
            value: supplierData.length.toString(), 
            icon: Users, 
            bgColor: "bg-blue-500/10", 
            textColor: "text-blue-500" 
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {statsCards.map((item, index) => (
                <div 
                    key={index} 
                    className="p-6 py-8 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {item.title}
                            </p>
                            <h3 className="text-3xl font-bold mt-1 text-slate-900/90 dark:text-white">
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