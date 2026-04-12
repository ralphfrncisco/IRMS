import React, { useState, useRef, useEffect } from 'react';
import { Funnel } from 'lucide-react';

function ChartHeader({ title, selectedFilter, onFilterChange }) {
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);

    const filterOptions = [
        { value: 'day', label: 'Hourly' },
        { value: 'week', label: 'Daily' },
        { value: 'month', label: 'Weekly' },
        { value: 'year', label: 'Monthly' }
    ];

    useEffect(() => {
        function handleClickOutside(event) {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFilterClick = (filterValue) => {
        onFilterChange(filterValue);
        setShowFilters(false);
    };

    const getSubtitle = () => {
        switch (selectedFilter) {
            case 'day':
                return 'Hourly Revenue';
            case 'week':
                return 'Daily Revenue';
            case 'month':
                return 'Weekly Revenue';
            case 'year':
                return 'Monthly Revenue';
            default:
                return 'Daily Revenue';
        }
    };

    return (
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div className="flex w-full">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {title}
                    </h3>
                    <p className="block text-sm text-slate-500 dark:text-white/50">
                        {getSubtitle()}
                    </p>
                </div>

                <div className="h-9 px-2 pr-1.5 py-[1.2rem] hidden md:flex justify-center items-center gap-1 border border-slate-300 dark:bg-black/20 dark:border-white/20 text-sm text-slate-700 dark:text-slate-100 rounded-lg shadow-xs dark:shadow-none">
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onFilterChange(option.value)}
                            className={`px-3 py-1.5 transition-colors rounded-md font-normal tracking-wide leading-snug ${
                                selectedFilter === option.value
                                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                                    : 'hover:bg-slate-200/60 dark:hover:bg-white/10'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="flex md:hidden items-center gap-2 relative" ref={filterRef}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center cursor-pointer space-x-2 py-2.5 px-4 rounded-md transition-all ${
                            showFilters
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                                : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200"
                        }`}
                    >
                        <Funnel className="w-4 h-4" />
                    </button>

                    {showFilters && (
                        <div className="absolute top-full right-0 mt-2 w-32 p-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-[#191919] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in duration-200">
                            {filterOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleFilterClick(option.value)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                                        selectedFilter === option.value
                                            ? 'bg-blue-500 text-white dark:bg-blue-600'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChartHeader;