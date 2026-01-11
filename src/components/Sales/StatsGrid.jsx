import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PhilippinePeso, Wallet, ShoppingCart, PackageCheck, Package, Users } from 'lucide-react';

const statsData = [
  { title: "Total Item Sales (Qty)", value: "125", icon: PackageCheck, bgColor: "bg-emerald-500/10", textColor: "text-emerald-500" },
  { title: "Total Profit", value: "₱ 15,240.00", icon: Wallet, bgColor: "bg-blue-500/10", textColor: "text-blue-500" },
  { title: "Account Receivables", value: "₱ 15,240.00", icon: PhilippinePeso, bgColor: "bg-orange-500/10", textColor: "text-red-500" },
];

function StatsGrid() {

    const { darkMode } = useOutletContext();
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {statsData.map((item, index) => (
            <div key={index} className={`p-6 py-8 rounded-2xl border transition-all duration-300 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
                <div className="flex items-start justify-between">
                    <div className = "flex-1">
                        <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {item.title}
                        </p>
                        <h3 className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900/90'}`}>
                            {item.value}
                        </h3>
                    </div>

                    <div 
                        className={`p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-all duration-300`}>
                        <item.icon className={`w-6 h-6 ${item.textColor}`} />
                    </div>
                </div>
            </div>
            ))}
        </div>
    );
}

export default StatsGrid;