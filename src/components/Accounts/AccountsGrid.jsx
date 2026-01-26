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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
            {Accounts.map((accs, index) => (
                <div key={index} 
                    className=
                    "p-6 py-8 rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                >
                    <div className="flex items-start justify-between gap-5">
                        <img src={accs.image} alt="" className="w-30 h-30 rounded-full" />
                        <div className = "flex-1 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {accs.role}
                                </p>
                                <h3 className="text-3xl font-bold mt-1 text-slate-900/90 dark:text-white">
                                    {accs.name}
                                </h3>
                            </div>

                            <div className="flex gap-1.5">
                                <button className="p-2 text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                                <button className="p-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash className="w-4 h-4" /></button>
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