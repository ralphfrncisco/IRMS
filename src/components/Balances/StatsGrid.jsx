import React from 'react';
import { PhilippinePeso, Users } from 'lucide-react';

const statsData = [
    {title: "Active Debts", value: "3", icon: Users, bgColor: "bg-blue-500/10", textColor: "text-blue-500"},
    { title: "Account Receivables", value: "₱25,000", icon: PhilippinePeso, bgColor: "bg-yellow-500/10", textColor: "text-yellow-500" },
];

function StatsGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {statsData.map((item, index) => (
                <div 
                    key={index} 
                    className="p-4 lg:p-6 py-8 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-normal md:text-sm lg:text-normal font-medium text-slate-600 dark:text-slate-400">
                                {item.title}
                            </p>
                            <h3 className="text-xl lg:text-3xl font-bold mt-1 text-slate-900/90 dark:text-white">
                                {item.value}
                            </h3>
                        </div>

                        <div className={`p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-all duration-300`}>
                            <item.icon className={`md:w-5 md:h-5 lg:w-6 lg:h-6 ${item.textColor}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;