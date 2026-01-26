import React, { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter';
import ColumnFilter from '../Filters/SortByFilter';

import AddExpenseModal from '../Modals/AddExpenseModal';
import EditExpenseModal from '../Modals/EditExpenseModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const TYPE_PLACEHOLDER = 'Expense Type';

// --- DATA CONVERTED TO NUMBERS ---
const expenseData = [
    { id: 'EXD-1002', expenseType: 'Electrical Bill', amount: 4250.00, date: '2026-01-12', remarks: 'Monthly office electricity' },
    { id: 'EXD-1003', expenseType: 'Stock Expense', amount: 8100.50, date: '2026-01-12', remarks: 'Bulk purchase of raw materials' },
    { id: 'EXD-1004', expenseType: 'Water Bill', amount: 890.00, date: '2026-01-13', remarks: 'Water utility payment' },
    { id: 'EXD-1005', expenseType: 'Miscellaneous', amount: 350.00, date: '2026-01-13', remarks: 'Cleaning supplies' },
    { id: 'EXD-1006', expenseType: 'Stock Expense', amount: 2400.00, date: '2026-01-14', remarks: 'Restock of beverage items' },
    { id: 'EXD-1007', expenseType: 'Stock Expense', amount: 1150.00, date: '2026-01-14', remarks: 'Packaging materials' },
    { id: 'EXD-1008', expenseType: 'Miscellaneous', amount: 1200.00, date: '2026-01-15', remarks: 'Repaired office chair' },
    { id: 'EXD-1009', expenseType: 'Electrical Bill', amount: 3800.00, date: '2026-01-15', remarks: 'Warehouse electricity' },
    { id: 'EXD-1010', expenseType: 'Water Bill', amount: 720.00, date: '2026-01-16', remarks: 'Utility fee for annex' },
    { id: 'EXD-1011', expenseType: 'Stock Expense', amount: 5600.00, date: '2026-01-16', remarks: 'Quarterly hardware restock' }
];

function TableSection() {
    const { darkMode } = useOutletContext();
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

    const [visibleColumns, setVisibleColumns] = useState({
        'ID': true,
        'EXPENSE TYPE': true,
        'AMOUNT': true,
        'DATE': true,
        'REMARKS': true
    });

    // --- CURRENCY FORMATTING LOGIC ---
    const formatCurrency = (value) => {
        if (isNaN(value)) return "₱ 0.00";
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `₱ ${formatter.format(value)}`;
    };

    // --- DYNAMIC OPTION GENERATION ---
    const extractUniqueOptions = (key, placeholder) => {
        const uniqueValues = [...new Set(expenseData.map(item => item[key]))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const typeOptions = extractUniqueOptions('expenseType', TYPE_PLACEHOLDER);

    // --- STATE MANAGEMENT ---

    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [typeFilter, setTypeFilter] = useState(TYPE_PLACEHOLDER); 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const handleViewExpense = (expense) => {
        setSelectedExpense(expense);
        setIsEditModalOpen(true);
    };

    // --- FILTERING LOGIC ---
    const filteredExpenses = useMemo(() => {
        let filtered = expenseData;

        // 2. Type Filter
        if (typeFilter !== TYPE_PLACEHOLDER && typeFilter !== ALL_OPTION) {
            filtered = filtered.filter(item => item.expenseType === typeFilter);
        }

        // 3. Date Filter
        if (dateRangeFilter !== DATE_RANGE_PLACEHOLDER && dateRangeFilter !== ALL_OPTION) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                if (dateRangeFilter === 'Today') {
                    return itemDate.toDateString() === today.toDateString();
                } else if (dateRangeFilter === 'Last 7 Days') {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(today.getDate() - 7);
                    return itemDate >= sevenDaysAgo;
                } else if (dateRangeFilter === 'Last 30 Days') {
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    return itemDate >= thirtyDaysAgo;
                }
                return true;
            });
        }
        return filtered;
    }, [dateRangeFilter, typeFilter]);

    const getTypeColor = (type) => {
        switch (type) {
            case "Stock Expense": return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
            case "Electrical Bill": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            case "Water Bill": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400";
            case "Miscellaneous": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
            default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    };

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                <div className="flex items-center justify-between w-full py-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Expenses</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total: {filteredExpenses.length} entries</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="md:hidden flex items-center justify-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add</span>
                    </button>
                </div>

                {/* --- UPDATED FILTER BAR --- */}
                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
                    {/* Column Search Filter */}
                    
                    <div className="grid grid-cols-2 md:flex md:items-center gap-2">
                        <div className="col-span-1">
                            <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                        </div>
                        <div className="col-span-1">
                            <CustomerFilter options={typeOptions} initialValue={typeFilter} onSelect={setTypeFilter} iconProps={iconProps}/>
                        </div>
                        <div className = "md:ml-3">
                            <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                        </div>
                    </div>
                </div>
                
                <button onClick={() => setIsAddModalOpen(true)} className="hidden md:flex cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shrink-0 whitespace-nowrap">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">Add Expense</span>
                </button>
            </div>

            <div className="overflow-x-auto p-2 no-scrollbar">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            {visibleColumns['ID'] &&<th className="p-4 md:pl-7 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>}
                            {visibleColumns['EXPENSE TYPE'] &&<th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>}
                            {visibleColumns['AMOUNT'] &&<th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>}
                            {visibleColumns['DATE'] &&<th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>}
                            {visibleColumns['REMARKS'] &&<th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</th>}
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredExpenses.length > 0 ? (
                            filteredExpenses.map((item) => (
                                <tr key={item.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    {visibleColumns['ID'] && <td className="p-4 md:pl-7 text-sm font-medium text-blue-600 dark:text-blue-500">{item.id}</td>}
                                    {visibleColumns['EXPENSE TYPE'] && <td className="p-4 text-center">
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getTypeColor(item.expenseType)}`}>
                                            {item.expenseType}
                                        </span>
                                    </td>}
                                    {visibleColumns['AMOUNT'] && <td className="p-4 text-center text-sm font-semibold">
                                        {formatCurrency(item.amount)}
                                    </td>}
                                    {visibleColumns['DATE'] && <td className="p-4 text-center text-sm">{item.date}</td>}
                                    {visibleColumns['REMARKS'] && <td className="p-4 text-center text-sm italic text-slate-500 dark:text-slate-400">{item.remarks}</td>}
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleViewExpense(item)}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                        >
                                            <Eye className="text-blue-500 w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                                    No results found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddExpenseModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
            />
            
            <EditExpenseModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                expenseData={selectedExpense}
            />
        </div>
    )
}

export default TableSection;