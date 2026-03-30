import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Funnel, Loader2, Search, X } from 'lucide-react'; // ✅ added Search, X
import { supabase } from "../../lib/supabase";
import LedgerHistoryTable from './LedgerHistoryTable';

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter'; 
import ColumnFilter from '../Filters/SortByFilter';
import { formatDate } from '../../utils/dateTimeFormatter';

import AddSalaryModal from '../Modals/AddSalaryModal';

const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const EMPLOYEE_PLACEHOLDER = 'Employee';

function TableSection() {
    const { darkMode } = useOutletContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [salaryData, setSalaryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(''); // ✅ search state
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

    const formatCurrency = (value) => {
        if (isNaN(value)) return "₱ 0.00";
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `₱ ${formatter.format(value)}`;
    };

    const formatDisplayDateTime = (dateTimeString) => {
        return formatDateTimeShort(dateTimeString);
    };
    
    const iconProps = { 
        size: 16, 
        className: darkMode ? "text-slate-400" : "text-white/50" 
    };

    const fetchSalary = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('salary')
            .select('*')
            .order('date', { ascending: false });

        if (!error) setSalaryData(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSalary();
    
        const channel = supabase
            .channel('salary-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'salary' },
                () => { fetchSalary() }
            )
            .subscribe();
    
        return () => { supabase.removeChannel(channel) }
    }, []);

    const [visibleColumns, setVisibleColumns] = useState({
        'EMPLOYEE': true,
        'AMOUNT': true,
        'DATE': true
    });

    const extractUniqueOptions = (key, placeholder) => {
        const uniqueValues = [...new Set(salaryData.map(item => item[key]))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const employeeOptions = extractUniqueOptions('employee_name', EMPLOYEE_PLACEHOLDER);

    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [employeeFilter, setEmployeeFilter] = useState(EMPLOYEE_PLACEHOLDER); 

    const filteredSalary = useMemo(() => {
        let filtered = [...salaryData];

        // ✅ Search filter — matches employee name, ID, amount, date
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.employee_name?.toLowerCase().includes(q) ||
                item.employee_id?.toString().toLowerCase().includes(q) ||
                formatCurrency(item.amount)?.toLowerCase().includes(q) ||
                formatDisplayDateTime(item.created_at)?.toLowerCase().includes(q)
            );
        }

        if (employeeFilter !== EMPLOYEE_PLACEHOLDER && employeeFilter !== ALL_OPTION) {
            filtered = filtered.filter(item => item.employee_name === employeeFilter);
        }

        if (dateRangeFilter !== DATE_RANGE_PLACEHOLDER && dateRangeFilter !== ALL_OPTION) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            filtered = filtered.filter(item => {
                const entryDate = new Date(item.date || item.created_at);
                if (dateRangeFilter === 'Today') {
                    return entryDate.toDateString() === today.toDateString();
                } else if (dateRangeFilter === 'Last 7 Days') {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(today.getDate() - 7);
                    return entryDate >= sevenDaysAgo;
                }
                return true;
            });
        }

        return filtered;
    }, [dateRangeFilter, employeeFilter, salaryData, searchQuery]); // ✅ added searchQuery

    return (
        <div className="mb-30 md:mb-0">
            <div className="rounded-2xl border bg-white border-slate-200 dark:bg-[#111] dark:border-white/10 transition-all duration-300 mb-10">
                <div className="p-4 border-b border-slate-100 dark:border-white/10 gap-4 w-full md:w-auto space-y-2">
                    <div className="flex items-center justify-between w-full py-2">
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">Salary Ledger</h3>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {isLoading ? 'Loading...' : `Total: ${filteredSalary.length} entries`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 relative" ref={filterRef}>
                            {/* Desktop search */}
                            <div className="relative hidden xl:block w-72">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by employee, amount, date..."
                                    className="block w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#111] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center cursor-pointer space-x-2 py-2 px-4 rounded-lg transition-all ${
                                    showFilters 
                                    ? "bg-blue-100 text-blue-700 dark:bg-white/10 dark:text-white" 
                                    : "bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200"
                                }`}
                            >
                                <Funnel className="w-4 h-4" />
                                <span className="text-xs sm:text-sm font-medium">Filters</span>
                            </button>

                            {showFilters && (
                                <div className="absolute top-full right-0 lg:right-30 mt-2 w-60 p-4 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 space-y-3 animate-in fade-in zoom-in duration-200">
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-white uppercase tracking-wider mb-2">Filter By</h4>
                                    <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                                    <CustomerFilter className = "w-full" options={employeeOptions} initialValue={employeeFilter} onSelect={setEmployeeFilter} iconProps={iconProps}/>
                                    <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                                        <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                                    </div>
                                </div>
                            )}

                            <button onClick={() => setIsModalOpen(true)} className="block cursor-pointer flex items-center justify-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                                <Plus className="w-4 h-4" />
                                <span className="text-xs sm:text-sm font-medium">Add <span className="hidden md:inline">Entry</span></span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile search */}
                    <div className="relative flex xl:hidden">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by employee, amount, date..."
                            className="block w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto h-auto md:max-h-[580px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-[#191919]">
                                {visibleColumns['EMPLOYEE'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Name</th>}
                                {visibleColumns['AMOUNT'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>}
                                {visibleColumns['DATE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                                    </td>
                                </tr>
                            ) : filteredSalary.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <p className="text-lg font-medium">No records found</p>
                                            <p className="text-sm">Try adjusting your filters or add an entry.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSalary.map((entry) => (
                                    <tr key={entry.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        {visibleColumns['EMPLOYEE'] && (
                                            <td className="pl-7 p-4 text-sm font-medium text-slate-900 dark:text-white">
                                                {entry.employee_name}
                                            </td>
                                        )}
                                        {visibleColumns['AMOUNT'] && (
                                            <td className="p-4 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-500">
                                                {formatCurrency(entry.amount)}
                                            </td>
                                        )}
                                        {visibleColumns['DATE'] && (
                                            <td className="p-4 text-center text-sm">{formatDate(entry.date)}</td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <AddSalaryModal
                    isOpen={isModalOpen} 
                    onClose={() => {
                        setIsModalOpen(false);
                        fetchSalary();
                    }} 
                />
            </div>

            <LedgerHistoryTable/>
        </div>
    );
}

export default TableSection;