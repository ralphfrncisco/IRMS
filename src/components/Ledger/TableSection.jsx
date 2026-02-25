import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Funnel, Loader2 } from 'lucide-react'; // Added Loader2
import { supabase } from "../../lib/supabase";
import LedgerHistoryTable from './LedgerHistoryTable';

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter'; 
import ColumnFilter from '../Filters/SortByFilter';

import AddSalaryModal from '../Modals/AddSalaryModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const EMPLOYEE_PLACEHOLDER = 'Employee';

function TableSection() {
    const { darkMode } = useOutletContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [salaryData, setSalaryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Added loading state
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

    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

    const fetchSalary = async () => {
        setIsLoading(true); // Start loading
        const { data, error } = await supabase
            .from('salary')
            .select('*')
            .order('id', { ascending: true })

        if (!error) setSalaryData(data);
        setIsLoading(false); // Stop loading
    }

    useEffect(() => {
        fetchSalary();
    
        // Real-time listener for SalaryTable
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
        'ID': true,
        'EMPLOYEE': true,
        'AMOUNT': true,
        'DATE': true
    });

    // --- DYNAMIC OPTION GENERATION ---
    const extractUniqueOptions = (key, placeholder) => {
        const uniqueValues = [...new Set(salaryData.map(item => item[key]))];
        return [placeholder, ALL_OPTION, ...uniqueValues.sort()];
    };

    const dateRangeOptions = [DATE_RANGE_PLACEHOLDER, ALL_OPTION, 'Today', 'Last 7 Days', 'Last 30 Days'];
    const employeeOptions = extractUniqueOptions('employee_name', EMPLOYEE_PLACEHOLDER);

    // --- STATE MANAGEMENT ---
    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [employeeFilter, setEmployeeFilter] = useState(EMPLOYEE_PLACEHOLDER); 

    // --- FILTERING LOGIC ---
    const filteredSalary = useMemo(() => {
        let filtered = [...salaryData];

        if (employeeFilter !== EMPLOYEE_PLACEHOLDER && employeeFilter !== ALL_OPTION) {
            filtered = filtered.filter(item => item.employee_name === employeeFilter);
        }

        if (dateRangeFilter !== DATE_RANGE_PLACEHOLDER && dateRangeFilter !== ALL_OPTION) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            filtered = filtered.filter(item => {
                const entryDate = new Date(item.date);
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
    }, [dateRangeFilter, employeeFilter, salaryData]);

    return (
        <div className = "mb-30 md:mb-0">

            <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-10">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 xl:flex xl:items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center justify-between w-full py-2">
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">Salary Ledger</h3>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">View employee compensation history</p>
                        </div>
                        {/* Mobile Button */}
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
                                <span className="text-xs sm:text-sm font-medium">Filters</span>
                            </button>

                            {/* The Dropdown Menu */}
                            {showFilters && (
                                <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 space-y-3 animate-in fade-in zoom-in duration-200">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter By</h4>
                                    <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                                    <CustomerFilter options={employeeOptions} initialValue={employeeFilter} onSelect={setEmployeeFilter} iconProps={iconProps}/>
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                                    </div>
                                </div>
                            )}

                            <button onClick={() => setIsModalOpen(true)} className="block xl:hidden cursor-pointer flex items-center justify-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                                <Plus className="w-4 h-4" />
                                <span className="text-xs sm:text-sm font-medium">Add</span>
                            </button>
                        </div>
                    </div>

                    <div className="hidden sm:grid sm:grid-cols-2 lg:flex lg:items-center md:justify-end gap-2 w-full md:w-auto">
                        <div className="col-span-1">
                            <DateRangeFilter options={dateRangeOptions} initialValue={dateRangeFilter} onSelect={setDateRangeFilter} iconProps={iconProps}/>
                        </div>
                        
                        <div className="col-span-1">
                            <CustomerFilter options={employeeOptions} initialValue={employeeFilter} onSelect={setEmployeeFilter} iconProps={iconProps}/>
                        </div>

                        <div className="ml-0 lg:ml-3">
                            <ColumnFilter options={visibleColumns} onSelect={setVisibleColumns} iconProps={iconProps} />
                        </div>
                    </div>

                    {/* Desktop Button */}
                    <button onClick={() => setIsModalOpen(true)} className="hidden lg:flex w-auto flex-shrink-0 cursor-pointer items-center justify-center space-x-2 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add Entry</span>
                    </button>
                </div>

                <div className="overflow-x-auto h-auto md:max-h-[580px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                {visibleColumns['ID'] && <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>}
                                {visibleColumns['EMPLOYEE'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Name</th>}
                                {visibleColumns['AMOUNT'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>}
                                {visibleColumns['DATE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                                    </td>
                                </tr>
                            ) : filteredSalary.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                                        No salary records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSalary.map((entry) => (
                                    <tr key={entry.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        {visibleColumns['ID'] && (
                                            <td className="text-center p-4 text-sm font-medium text-blue-600 dark:text-blue-500 whitespace-nowrap">
                                                {entry.id}
                                            </td>
                                        )}
                                        {visibleColumns['EMPLOYEE'] && (
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                                {entry.employee_name}
                                            </td>
                                        )}
                                        {visibleColumns['AMOUNT'] && 
                                            <td className="p-4 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-500">
                                                {formatCurrency(entry.amount)}
                                            </td>}
                                        {visibleColumns['DATE'] && <td className="p-4 text-center text-sm">{formatDisplayDate(entry.date)}</td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <AddSalaryModal
                    isOpen={isModalOpen} 
                    onClose={() => {
                        setIsModalOpen(false)
                        fetchSalary()
                    }} 
                />
            </div>
            <LedgerHistoryTable/>
            
            {/* <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 xl:flex xl:items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center justify-between w-full py-2">
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">Revenue & Expense History</h3>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Revenue and expense history per week update</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto p-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                {visibleColumns['ID'] && <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time Frame</th>}
                                {visibleColumns['EMPLOYEE'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Revenue</th>}
                                {visibleColumns['AMOUNT'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Expense</th>}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <tr>
                                <td className="text-center p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    February 1 2025 to February 7 2025
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 25,000.00
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 15,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    February 8 2025 to February 14 2025
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 25,000.00
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 15,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    February 15 2025 to February 21 2025
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 25,000.00
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 15,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    February 22 2025 to February 28 2025
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 25,000.00
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 15,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 pb-8 text-sm font-bold text-blue-500">
                                    Total for the month
                                </td>
                                <td className="p-4 pb-8 text-sm font-medium text-emerald-500">
                                    ₱ 100,000.00
                                </td>
                                <td className="p-4 pb-8 text-sm font-medium text-red-500">
                                    ₱ 60,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    March 1 2025 to March 7 2025
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 25,000.00
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 15,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    March 8 2025 to March 14 2025
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 25,000.00
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 15,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    March 15 2025 to March 21 2025
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 25,000.00
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 15,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    March 22 2025 to March 28 2025
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 25,000.00
                                </td>
                                <td className="p-4 text-sm font-normal text-slate-900 dark:text-white">
                                    ₱ 15,000.00
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center p-4 pb-8 text-sm font-bold text-blue-500">
                                    Total for the month
                                </td>
                                <td className="p-4 pb-8 text-sm font-medium text-emerald-500">
                                    ₱ 100,000.00
                                </td>
                                <td className="p-4 pb-8 text-sm font-medium text-red-500">
                                    ₱ 60,000.00
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <AddSalaryModal
                    isOpen={isModalOpen} 
                    onClose={() => {
                        setIsModalOpen(false)
                        fetchSalary()
                    }} 
                />
            </div> */}
        </div>
    )
}

export default TableSection;