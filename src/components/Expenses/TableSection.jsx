import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Funnel, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter';
import ColumnFilter from '../Filters/SortByFilter';

import AddExpenseModal from '../Modals/AddExpenseModal';
import EditExpenseModal from '../Modals/EditExpenseModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const TYPE_PLACEHOLDER = 'Expense Type';

function TableSection() {
    const { darkMode } = useOutletContext();
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = React.useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
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

    // --- STATE MANAGEMENT ---
    const [expenseData, setExpenseData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [typeFilter, setTypeFilter] = useState(TYPE_PLACEHOLDER); 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    // --- FETCH DATA FROM SUPABASE ---
    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ExpensesTable')
                .select('*')
                .order('expense_id', { ascending: false });

            if (error) throw error;

            setExpenseData(data || []);
        } catch (err) {
            console.error("Error fetching expenses:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    // Refresh data when modals close
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        fetchExpenses();
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        fetchExpenses();
    };

    // --- CURRENCY FORMATTING LOGIC ---
    const formatCurrency = (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "₱ 0.00";
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `₱ ${formatter.format(num)}`;
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // --- DYNAMIC OPTION GENERATION ---
    const extractUniqueOptions = (key, placeholder) => {
        if (!expenseData || !Array.isArray(expenseData)) return [placeholder, ALL_OPTION];
        const uniqueValues = [...new Set(expenseData.map(item => item[key]).filter(Boolean))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const typeOptions = extractUniqueOptions('expense_type', TYPE_PLACEHOLDER);

    const handleViewExpense = (expense) => {
        setSelectedExpense(expense);
        setIsEditModalOpen(true);
    };

    // --- FILTERING LOGIC ---
    const filteredExpenses = useMemo(() => {
        try {
            let filtered = Array.isArray(expenseData) ? [...expenseData] : [];

            // Type Filter
            if (typeFilter !== TYPE_PLACEHOLDER && typeFilter !== ALL_OPTION) {
                filtered = filtered.filter(item => item.expense_type === typeFilter);
            }

            // Date Filter
            if (dateRangeFilter !== DATE_RANGE_PLACEHOLDER && dateRangeFilter !== ALL_OPTION) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                filtered = filtered.filter(item => {
                    if (!item.date) return false;
                    const itemDate = new Date(item.date);
                    if (isNaN(itemDate.getTime())) return false; // Guard against Invalid Date

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
        } catch (error) {
            console.error("Filtering logic crashed:", error);
            return [];
        }
    }, [dateRangeFilter, typeFilter, expenseData]);

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
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 xl:flex xl:items-center gap-4 w-full md:w-auto">
                <div className="flex items-center justify-between w-full py-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Expenses</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {loading ? 'Loading...' : `Total: ${filteredExpenses.length} entries`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 relative" ref={filterRef}> 
                        {/* The Toggle Button */}
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex sm:hidden items-center cursor-pointer space-x-2 py-2 px-4 rounded-lg transition-all ${
                                showFilters 
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            }`}
                        >
                            <Funnel className="w-4 h-4" />
                            <span className="text-sm font-medium">Filters</span>
                        </button>

                        {/* The Dropdown Menu */}
                        {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 space-y-3 animate-in fade-in zoom-in duration-200">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter By</h4>
                                <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                                <CustomerFilter options={typeOptions} initialValue={typeFilter} onSelect={setTypeFilter} iconProps={iconProps}/>
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} 
                                    dropdownClassName="mt-[-270px] w-full"/>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setIsAddModalOpen(true)} className="block xl:hidden cursor-pointer flex items-center justify-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Add</span>
                        </button>
                    </div>
                </div>

                {/* --- FILTER BAR --- */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:flex lg:items-center md:justify-end gap-2 w-full md:w-auto">
                    <div className="col-span-1">
                        <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                    </div>
                    <div className="col-span-1">
                        <CustomerFilter options={typeOptions} initialValue={typeFilter} onSelect={setTypeFilter} iconProps={iconProps}/>
                    </div>
                    <div className = "ml-0 lg:ml-3">
                        <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                    </div>
                </div>
                
                <button onClick={() => setIsAddModalOpen(true)} className="hidden xl:flex w-auto flex-shrink-0 cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">Add Expense</span>
                </button>
            </div>

            <div className="overflow-x-auto p-2 no-scrollbar">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            {visibleColumns['ID'] && <th className="p-4 md:pl-7 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>}
                            {visibleColumns['AMOUNT'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>}
                            {visibleColumns['EXPENSE TYPE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>}
                            {visibleColumns['DATE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>}
                            {visibleColumns['REMARKS'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</th>}
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="6" className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : filteredExpenses.length > 0 ? (
                            filteredExpenses.map((item) => (
                                <tr key={item.expense_id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    {visibleColumns['ID'] && <td className="p-4 md:pl-7 text-sm font-medium text-blue-600 dark:text-blue-500">EXP-{item.expense_id.toString().padStart(4, '0')}</td>}
                                    {visibleColumns['AMOUNT'] && <td className="p-4 text-center text-sm font-semibold">
                                        {formatCurrency(item.amount)}
                                    </td>}
                                    {visibleColumns['EXPENSE TYPE'] && <td className="p-4 text-center">
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getTypeColor(item.expense_type)}`}>
                                            {item.expense_type}
                                        </span>
                                    </td>}
                                    
                                    {visibleColumns['DATE'] && <td className="p-4 text-center text-sm">{formatDisplayDate(item.date)}</td>}
                                    {visibleColumns['REMARKS'] && <td className="p-4 text-center text-sm italic text-slate-500 dark:text-slate-400">{item.remarks || 'N/A'}</td>}
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
                                    No expenses found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddExpenseModal 
                isOpen={isAddModalOpen} 
                onClose={handleCloseAddModal} 
            />
            
            <EditExpenseModal 
                isOpen={isEditModalOpen} 
                onClose={handleCloseEditModal} 
                expenseData={selectedExpense}
            />
        </div>
    )
}

export default TableSection;