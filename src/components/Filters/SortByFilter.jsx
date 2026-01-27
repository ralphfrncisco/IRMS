import React, { useState, useRef, useEffect } from 'react';
import { Columns } from 'lucide-react';

function SortByFilter({ options, onSelect, iconProps }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleColumn = (columnName) => {
        const updatedOptions = {
            ...options,
            [columnName]: !options[columnName]
        };
        onSelect(updatedOptions);
    };

    // Filter out 'ACTIONS' from the selectable list and count visible ones
    const columnKeys = Object.keys(options);
    const visibleCount = columnKeys.filter(key => options[key]).length;

    return (
        <div ref={dropdownRef} className="relative py-1 px-3 bg-slate-300/30 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all">
            <button
                type="button"
                className="w-full md:w-32 bg-transparent focus:outline-none hover:cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-sm font-normal">Columns ({visibleCount})</span>
                {/* Removed ml-2 to let justify-between handle the spacing */}
                <Columns {...iconProps} className={`${iconProps.className}`} />
            </button>

            {isOpen && (
                <ul className="absolute z-20 top-full mt-2 w-48 right-0 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden py-1">
                    <div className="px-3 py-1 border-b border-slate-200 dark:border-slate-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Display Columns</span>
                    </div>
                    {columnKeys.map((columnName) => (
                        <li
                            key={columnName}
                            className="flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer group"
                            onClick={() => handleToggleColumn(columnName)}
                        >
                            <input
                                type="checkbox"
                                checked={options[columnName]}
                                readOnly
                                className="w-4 h-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="ml-3 text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                                {columnName}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SortByFilter;