import React, { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom';
import { MoreHorizontal, Plus } from 'lucide-react';

// 1. Define Constants
const ALL_OPTION = 'All';

const activityLogs = [
    {
        id: 'ALS-0004',
        activity: 'create account',
        title: 'New user registered',
        description: 'John Smith created an account',
        time: '2 minutes ago',
        // time should be dynamic
    },
    {
        id: 'ALS-0005',
        activity: 'order',
        title: 'Product Bought',
        description: 'User bought an activity of ₱15,000',
        time: '2 minutes ago',
    },
    {
        id: 'ALS-0006',
        activity: 'order',
        title: 'Deleted an activity',
        description: 'User deleted an item with a Product ID of 2009',
        time: '2 minutes ago',
    },
    {
        id: 'ALS-0007',
        activity: 'modify',
        title: 'Modified an activity',
        description: 'changed Product name of id:#2009 from Pellet1 to Pellet2',
        time: '2 minutes ago',
    },
    {
        id: 'ALS-0008',
        activity: 'create activity',
        title: 'Added a new activity',
        description: 'User created a new item with a Product ID of 2009',
        time: '2 minutes ago',
    },
];

function TableSection() {
    const { darkMode } = useOutletContext();
    
    // const iconProps = { 
    //   size: 16, 
    //   className: darkMode ? "text-slate-400" : "text-slate-500" 
    // };

    // // --- DYNAMIC OPTION GENERATION ---
    // const extractUniqueOptions = (key, placeholder) => {
    //     const uniqueValues = [...new Set(supplierData.map(activity => activity[key]))];
    //     return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    // };

    // const supplierOptions = extractUniqueOptions('supplier', SUPPLIER_PLACEHOLDER);

    // // --- STATE MANAGEMENT ---
    // const [supplierFilter, setSupplierFilter] = useState(SUPPLIER_PLACEHOLDER); 
    // const [isModalOpen, setIsModalOpen] = useState(false);

    // // --- FILTERING LOGIC ---
    // const filteredSuppliers = useMemo(() => {
    //     let filtered = supplierData;

    //     // Supplier Name Logic
    //     if (supplierFilter !== SUPPLIER_PLACEHOLDER && supplierFilter !== ALL_OPTION) {
    //         filtered = filtered.filter(activity => activity.supplier === supplierFilter);
    //     }

    //     return filtered;
    // }, [supplierFilter]);

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row activitys-start md:activitys-center gap-4 w-full md:w-auto">
                {/* Filter Grid Container */}
                <div className = "flex items-center justify-between w-full py-2">
                    <div className = "space-y-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Activity Logs</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">All of your activity across the app</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:activitys-center gap-2 w-full md:w-auto">
                    {/* Customer Filter occupying 2 columns on mobile */}
                    {/* <div className="col-span-1">
                        <CustomerFilter options={supplierOptions} initialValue={supplierFilter} onSelect={setSupplierFilter} iconProps={iconProps}/>
                    </div> */}
                </div>
            </div>

            <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Activity</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                        
                        {activityLogs.map((activity, index) => (
                            <tr key={index} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{activity.id}</td>
                                <td className="p-4 text-center text-sm font-semibold text-blue-500 dark:text-blue-400">{activity.title}</td>
                                <td className="p-4 text-center text-sm">{activity.description}</td>
                                <td className="p-4 text-center text-sm font-normal">{activity.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    )
}

export default TableSection;