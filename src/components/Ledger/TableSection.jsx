import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Plus, Funnel } from 'lucide-react';

import DateRangeFilter from '../Filters/DateRangeFilter';
import CustomerFilter from '../Filters/CustomerFilter'; 
import ColumnFilter from '../Filters/SortByFilter';

import AddSalaryModal from '../Modals/AddSalaryModal';

// 1. Define Constants
const ALL_OPTION = 'All';
const DATE_RANGE_PLACEHOLDER = 'Date Range';
const EMPLOYEE_PLACEHOLDER = 'Employee';

const salaryData = [
    { id: 'SAL-1001', employee: 'John Doe', amount: 15000.00, date: '2026-01-11' },
    { id: 'SAL-1002', employee: 'Jane Smith', amount: 18500.00, date: '2026-01-10' },
    { id: 'SAL-1003', employee: 'Mike Johnson', amount: 12000.00, date: '2026-01-09' },
    { id: 'SAL-1004', employee: 'Emily Davis', amount: 22000.00, date: '2026-01-08' },
    { id: 'SAL-1005', employee: 'Emily Davis', amount: 5000.00, date: '2026-01-11' },
];

function TablSection() {
    const { darkMode } = useOutletContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

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
    
    const iconProps = { 
      size: 16, 
      className: darkMode ? "text-slate-400" : "text-slate-500" 
    };

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
    const employeeOptions = extractUniqueOptions('employee', EMPLOYEE_PLACEHOLDER);

    // --- STATE MANAGEMENT ---
    const [dateRangeFilter, setDateRangeFilter] = useState(DATE_RANGE_PLACEHOLDER);
    const [employeeFilter, setEmployeeFilter] = useState(EMPLOYEE_PLACEHOLDER); 

    // --- FILTERING LOGIC ---
    const filteredSalary = useMemo(() => {
        let filtered = salaryData;

        if (employeeFilter !== EMPLOYEE_PLACEHOLDER && employeeFilter !== ALL_OPTION) {
            filtered = filtered.filter(item => item.employee === employeeFilter);
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
    }, [dateRangeFilter, employeeFilter]);

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25">
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

            <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            {visibleColumns['ID'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>}
                            {visibleColumns['EMPLOYEE'] && <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Name</th>}
                            {visibleColumns['AMOUNT'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>}
                            {visibleColumns['DATE'] && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSalary.map((entry) => (
                            <tr key={entry.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                {visibleColumns['ID'] && (
                                    <td className="p-4 text-sm font-medium text-blue-600 dark:text-blue-500 whitespace-nowrap">
                                        {entry.id}
                                    </td>
                                )}
                                {visibleColumns['EMPLOYEE'] && (
                                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                        {entry.employee}
                                    </td>
                                )}
                                {visibleColumns['AMOUNT'] && 
                                    <td className="p-4 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-500">
                                        {formatCurrency(entry.amount)}
                                    </td>}
                                {visibleColumns['DATE'] && <td className="p-4 text-center text-sm">{entry.date}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddSalaryModal
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    )
}

export default TablSection;