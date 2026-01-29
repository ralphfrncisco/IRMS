import React from 'react';
import { BanknoteArrowUp, Package2, Package, PackagePlus } from 'lucide-react';

const statsData = [
  { title: "Total Expenses", value: "₱ 15,240.00", icon: BanknoteArrowUp, bgColor: "bg-emerald-500/10", textColor: "text-emerald-500" },
  { title: "Total Ordered Items (Qty)", value: "1524", icon: Package, bgColor: "bg-blue-500/10", textColor: "text-blue-500" },
  { title: "Total Received Items (Qty)", value: "784", icon: PackagePlus, bgColor: "bg-violet-500/10", textColor: "text-violet-500" },
  { title: "Total Pending Items (Qty)", value: "1634", icon: Package2, bgColor: "bg-amber-500/10", textColor: "text-amber-500" }
];

function StatsGrid() {
    // const { darkMode } = useOutletContext();
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {statsData.map((item, index) => (
                <div 
                    key={index} 
                    className="p-4 lg:p-6 py-8 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                                {item.title}
                            </p>
                            <h3 className="text-lg lg:text-3xl font-bold mt-1 text-slate-900/90 dark:text-white">
                                {item.value}
                            </h3>
                        </div>

                        <div className={`p-2 lg:p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-all duration-300`}>
                            <item.icon className={`w-6 h-6 ${item.textColor}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;