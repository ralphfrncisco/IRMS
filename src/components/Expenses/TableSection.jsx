import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Funnel, Loader2, Search, X } from 'lucide-react';
import { supabase } from "../../lib/supabase";

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter';
import ColumnFilter from '../Filters/SortByFilter';
import { formatDateTimeShort } from '../../utils/dateTimeFormatter';

import AddExpenseModal from '../Modals/AddExpenseModal';
import EditExpenseModal from '../Modals/EditExpenseModal';

const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const TYPE_PLACEHOLDER = 'Expense Type';

function TableSection() {
    const { darkMode } = useOutletContext();
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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
        className: "text-slate-600 dark:text-white/60" 
    };

    const [visibleColumns, setVisibleColumns] = useState({
        'RECORDED BY' : true,
        'EXPENSE TYPE': true,
        'AMOUNT': true,
        'DATE': true,
        'STATUS': true,
        'REMARKS': true
    });

    const [expenseData, setExpenseData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [typeFilter, setTypeFilter] = useState(TYPE_PLACEHOLDER); 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ExpensesTable')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setExpenseData(data || []);
        } catch (err) {
            console.error("Error fetching expenses:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleCloseAddModal = () => { setIsAddModalOpen(false); fetchExpenses(); };
    const handleCloseEditModal = () => { setIsEditModalOpen(false); fetchExpenses(); };

    const formatCurrency = (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "₱ 0.00";
        return `₱ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`;
    };

    const formatDisplayDateTime = (dateTimeString) => formatDateTimeShort(dateTimeString);

    const extractUniqueOptions = (key, placeholder) => {
        if (!expenseData || !Array.isArray(expenseData)) return [placeholder, ALL_OPTION];
        const uniqueValues = [...new Set(expenseData.map(item => item[key]).filter(Boolean))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const typeOptions = extractUniqueOptions('expense_type', TYPE_PLACEHOLDER);

    const handleViewExpense = (expense) => { setSelectedExpense(expense); setIsEditModalOpen(true); };

    const filteredExpenses = useMemo(() => {
        try {
            let filtered = Array.isArray(expenseData) ? [...expenseData] : [];

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(item =>
                    item.recorded_by?.toLowerCase().includes(q) ||
                    item.expense_type?.toLowerCase().includes(q) ||
                    item.remarks?.toLowerCase().includes(q) ||
                    item.status?.toLowerCase().includes(q) ||
                    formatCurrency(item.amount)?.toLowerCase().includes(q) ||
                    formatDisplayDateTime(item.created_at)?.toLowerCase().includes(q) ||
                    `exp-${item.expense_id.toString().padStart(4, '0')}`.includes(q)
                );
            }

            if (typeFilter !== TYPE_PLACEHOLDER && typeFilter !== ALL_OPTION) {
                filtered = filtered.filter(item => item.expense_type === typeFilter);
            }

            if (dateRangeFilter !== DATE_RANGE_PLACEHOLDER && dateRangeFilter !== ALL_OPTION) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                filtered = filtered.filter(item => {
                    if (!item.date) return false;
                    const itemDate = new Date(item.date);
                    if (isNaN(itemDate.getTime())) return false;
                    if (dateRangeFilter === 'Today') return itemDate.toDateString() === today.toDateString();
                    if (dateRangeFilter === 'Last 7 Days') { const d = new Date(today); d.setDate(today.getDate() - 7); return itemDate >= d; }
                    if (dateRangeFilter === 'Last 30 Days') { const d = new Date(today); d.setDate(today.getDate() - 30); return itemDate >= d; }
                    return true;
                });
            }

            return filtered;
        } catch (error) {
            console.error("Filtering logic crashed:", error);
            return [];
        }
    }, [dateRangeFilter, typeFilter, expenseData, searchQuery]);

    const getTypeColor = (type) => {
        switch (type) {
            case "Stock Expense":   return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
            case "Electrical Bill": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            case "Water Bill":      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400";
            case "Miscellaneous":   return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-white/70";
            default:                return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-white/70";
        }
    };

    
    const getStatusColor = (status) => {
        switch (status) {
            case 'Just Ordered': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'Received':     return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'Paid':         return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
            default:             return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-white/70';
        }
    };

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-[#111] dark:border-white/10 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-white/10 gap-4 w-full md:w-auto space-y-2">
                <div className="flex items-center justify-between w-full py-2">
                    <div>
                        <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">Expenses</h3>
                        <p className="text-sm text-slate-500 dark:text-white/70">
                            {loading ? 'Loading...' : `Total: ${filteredExpenses.length} entries`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 relative" ref={filterRef}>
                        <div className="relative hidden xl:block w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 dark:text-white/60" />
                            </div>
                            <input type="text" placeholder="Search by type, status, amount..."
                                className="block w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#111] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition-all"
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <button 
                        onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center cursor-pointer space-x-2 py-2 px-4 rounded-lg transition-all ${
                                showFilters 
                                ? "bg-blue-100 text-blue-700 dark:bg-white/10 dark:text-white" 
                                : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-200"
                            }`}
                        >
                            <Funnel className="w-4 h-4" />
                            <span className="text-sm font-medium">Filters</span>
                        </button>

                        {showFilters && (
                            <div className="absolute top-full right-0 lg:right-36 mt-2 w-60 p-4 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 space-y-3 animate-in fade-in zoom-in duration-200">
                                <h4 className="text-xs font-bold text-slate-400 dark:text-white uppercase tracking-wider mb-2">Filter By</h4>
                                <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                                <CustomerFilter className="w-full" options={typeOptions} initialValue={typeFilter} onSelect={setTypeFilter} iconProps={iconProps}/>
                                <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                                    <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} dropdownClassName="mt-[-270px] w-full"/>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setIsAddModalOpen(true)} className="block cursor-pointer flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-600 transition-all">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Add <span className="hidden md:inline">Expense</span></span>
                        </button>
                    </div>
                </div>

                {/* Mobile search */}
                <div className="relative flex xl:hidden">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400 dark:text-white/60" />
                    </div>
                    <input type="text" placeholder="Search by type, status, amount..."
                        className="block w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#090909] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition-all"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto h-auto md:max-h-[580px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="sticky top-0 z-10 bg-slate-50 dark:bg-[#191919]">
                            <th className="p-4 md:pl-7 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">ID</th>
                            {visibleColumns['RECORDED BY'] && <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Recorded By</th>}
                            {visibleColumns['EXPENSE TYPE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Type</th>}
                            {visibleColumns['AMOUNT'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Amount</th>}
                            {visibleColumns['DATE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Date</th>}
                            {visibleColumns['STATUS'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Status</th>}
                            {visibleColumns['REMARKS'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Remarks</th>}
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                        {loading ? (
                            <tr><td colSpan="7" className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : filteredExpenses.length > 0 ? (
                            filteredExpenses.map((item) => (
                                <tr key={item.expense_id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 md:pl-7 text-sm font-medium text-blue-600 dark:text-blue-500">
                                        EXP-{item.expense_id.toString().padStart(4, '0')}
                                    </td>
                                    {visibleColumns['RECORDED BY'] && (
                                        <td className="p-4 text-center text-sm font-medium text-slate-700 dark:text-white/90">{item.recorded_by || 'N/A'}</td>
                                    )}
                                    {visibleColumns['EXPENSE TYPE'] && (
                                        <td className="p-4 text-center">
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getTypeColor(item.expense_type)}`}>
                                                {item.expense_type}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns['AMOUNT'] && (
                                        <td className="p-4 text-center text-sm font-semibold text-emerald-500">{formatCurrency(item.amount)}</td>
                                    )}
                                    {visibleColumns['DATE'] && (
                                        <td className="p-4 text-center text-sm text-slate-600 dark:text-white/70">{formatDisplayDateTime(item.created_at)}</td>
                                    )}
                                    {/* ✅ Colored status badge instead of plain italic text */}
                                    {visibleColumns['STATUS'] && (
                                        <td className="p-4 text-center">
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusColor(item.status)}`}>
                                                {item.status || 'N/A'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns['REMARKS'] && (
                                        <td className="p-4 text-center text-sm italic text-slate-500 dark:text-white/70">{item.remarks || 'N/A'}</td>
                                    )}
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleViewExpense(item)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                                            <Eye className="text-blue-500 w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-10 text-center text-slate-500 dark:text-white/70">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <p className="text-lg font-medium">No records found</p>
                                        <p className="text-sm">Try adjusting your filters or add an expense.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddExpenseModal isOpen={isAddModalOpen} onClose={handleCloseAddModal} />
            <EditExpenseModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} expenseData={selectedExpense} />
        </div>
    );
}

export default TableSection;