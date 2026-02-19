import React, { useState, useEffect } from 'react'
import { Pencil, Trash, Plus, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

import noProfile from '../../assets/no-profile.png';
import AddAccountModal from '../Modals/AddAccountModal';
import EditAccountModal from '../Modals/EditAccountModal';

function AccountsGrid() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [accounts, setAccounts] = useState([]); // Dynamic state
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // --- FETCH ALL ACCOUNTS ---
    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('account')
                .select('*')
                .in('role', ['Administrator', 'Staff'])
                .order('full_name', { ascending: true });

            if (!error) {
                setAccounts(data);
            } else {
                console.error("Error fetching accounts:", error.message);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleEditClick = (acc) => {
        setSelectedAccount(acc);
        setIsEditModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <button onClick={() => setIsAddModalOpen(true)}
                    className="flex cursor-pointer items-center justify-center space-x-2 py-2 px-3 pr-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-all shrink-0 whitespace-nowrap">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Account</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="mt-4 text-slate-500">Loading accounts...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mt-5">
                    {accounts.map((acc, index) => (
                        <div key={acc.id || index} 
                            className="p-6 py-8 w-full rounded-2xl border transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col justify-center hover:shadow-md"
                        >
                            <div className="flex flex-row items-center gap-5">
                                <div className="shrink-0">
                                    <img 
                                        src={acc.avatar_url || noProfile} 
                                        alt={acc.full_name} 
                                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" 
                                    />
                                </div>
                                
                                <div className="flex-1 max-w-full">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                                        {acc.role || "Staff"}
                                    </p>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight break-words">
                                        {acc.full_name}
                                    </h3>

                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={() => handleEditClick(acc)} 
                                            className="p-2 text-blue-600 bg-blue-500/20 dark:bg-blue-500/10 rounded-md hover:bg-blue-600 hover:text-white transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-red-600 bg-red-500/20 dark:bg-red-500/10 rounded-md hover:bg-red-600 hover:text-white transition-all">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddAccountModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchAccounts} // Refresh list after adding
            />
            <EditAccountModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                account={selectedAccount}
                onSuccess={fetchAccounts} // Refresh list after editing
            />
        </div>
    )
}

export default AccountsGrid;