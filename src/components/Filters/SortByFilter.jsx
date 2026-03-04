import React, { useState, useRef, useEffect } from 'react';
import { Columns, ChevronDown } from 'lucide-react';

function SortByFilter({ options, onSelect, iconProps, dropdownClassName = "mt-2" }) {
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
        const updatedOptions = { ...options, [columnName]: !options[columnName] };
        onSelect(updatedOptions);
    };

    const columnKeys = Object.keys(options);
    const visibleCount = columnKeys.filter(key => options[key]).length;

    return (
        <div ref={dropdownRef} className="relative w-full transition-all">
            <button
                type="button"
                className={`w-full py-1 px-3 bg-slate-300/30 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-300 transition-colors 
                    ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Columns size={16} {...iconProps} />
                    <span className="text-sm font-normal">Columns ({visibleCount})</span>
                </div>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <ul className={`absolute z-20 top-full w-full sm:w-38 right-0 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden py-1 ${dropdownClassName}`}>
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
                                className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                            />
                            <span className="ml-3 text-sm text-slate-700 dark:text-slate-200">
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