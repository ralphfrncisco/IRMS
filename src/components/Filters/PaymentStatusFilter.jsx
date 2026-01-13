import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';

function PaymentStatusFilter({ options, initialValue, onSelect, iconProps }) {
    
    const [selectedValue, setSelectedValue] = useState(initialValue);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedTextColor = selectedValue === initialValue 
        ? 'text-slate-700 dark:text-slate-300'
        : 'text-slate-700 dark:text-white';   

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleOptionClick = (value) => {
        setSelectedValue(value);
        onSelect(value);
        setIsOpen(false);
    };

    const selectableOptions = options.slice(1);

    return (
        <div 
            ref={dropdownRef} 
            className="relative py-1 px-3 bg-slate-300/30 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
        >
            <button
                type="button"
                // Adjusted width to 'w-32' for status names, matching original code structure
                className={`w-30 bg-transparent focus:outline-none hover:cursor-pointer flex items-center justify-between ${selectedTextColor}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="text-sm truncate">{selectedValue}</span>
                <ArrowDownWideNarrow
                    {...iconProps}
                    className={`${iconProps.className} ml-2 top-[-6] transform -translate-y-[-1px]`} 
                />
            </button>
            {isOpen && (
                <ul
                    className="absolute z-10 top-full mt-2 w-full left-0 bg-white dark:bg-slate-700 shadow-xl rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden"
                    role="listbox"
                >
                    {selectableOptions.map((option) => (
                        <li
                            key={option}
                            onClick={() => handleOptionClick(option)}
                            className={`p-2 text-sm cursor-pointer text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${selectedValue === option ? 'bg-slate-200 dark:bg-slate-600 font-medium' : ''}`}
                            role="option"
                            aria-selected={selectedValue === option}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PaymentStatusFilter;