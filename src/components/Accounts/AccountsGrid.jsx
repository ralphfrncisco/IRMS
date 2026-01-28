import React, { useState, useMemo } from 'react'
import { Pencil, Trash, Plus } from 'lucide-react';

import noProfile from '../../assets/no-profile.png';
import AddAccountModal from '../Modals/AddAccountModal';


const Accounts = 
[
    {
        name: "Kuya Glen",
        image: noProfile,
        role: "Admin"
    },
    {
        name: "Admin 1",
        image: noProfile,
        role: "Admin"
    }
];

function AccountsGrid() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    
    <div>
        <button onClick={() => setIsAddModalOpen(true)}
            className="flex cursor-pointer items-center justify-center space-x-2 py-2 px-3 pr-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shrink-0 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Account</span>
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mt-5">
            {Accounts.map((accs, index) => (
                <div key={index} 
                    className="p-6 py-8 w-full rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col justify-center"
                >
                    <div className="flex flex-row items-center gap-5">
                        <div className="shrink-0">
                            <img src={accs.image} alt="" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" />
                        </div>
                        
                        <div className="flex-1 max-w-full">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {accs.role}
                            </p>
                            {/* Removed whitespace-nowrap and truncate to allow wrapping */}
                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                {accs.name}
                            </h3>

                            <div className="flex gap-2 mt-4">
                                <button className="p-2 text-blue-400 bg-blue-500/10 rounded-md hover:bg-blue-500 hover:text-white transition-all">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-red-400 bg-red-500/10 rounded-md hover:bg-red-600 hover:text-white transition-all">
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <AddAccountModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
        />
    </div>
    
  )
}

export default AccountsGrid;