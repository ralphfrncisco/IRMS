import React from 'react';
import { Pencil, Trash, Plus } from 'lucide-react';
import noProfile from '../../assets/no-profile.png';

const Accounts = 
[
    {
        name: "Kuya Glen",
        image: noProfile,
        role: "Admin"
    }
];

function AccountsGrid() {
  return (
    <div>
        <button
            className="flex cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shrink-0 whitespace-nowrap">
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
                            <div className="">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {accs.role}
                                </p>
                                <h3 className="text-3xl font-bold mt-1 text-slate-900/90 dark:text-white">
                                    {accs.name}
                                </h3>
                            </div>

                            <div className = "flex items-start gap-3">
                                <Pencil className="w-7 h-7 text-white bg-blue-500 p-1 rounded-sm" />   
                                <Trash className="w-7 h-7 text-white bg-red-500 p-1 rounded-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
    
  )
}

export default AccountsGrid;