import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';

function CustomerFilter({ options, initialValue, onSelect, iconProps, className = "" }) {
    
    const [selectedValue, setSelectedValue] = useState(initialValue);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedTextColor = selectedValue === initialValue 
        ? 'text-slate-100 dark:text-white'
        : 'text-slate-100 dark:text-white';

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
            className="relative py-1 px-3 bg-slate-300/30 dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-lg transition-all"
        >
            <button
                type="button"

                className={`${className} bg-transparent focus:outline-none hover:cursor-pointer flex items-center justify-between ${selectedTextColor}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="text-sm truncate">{selectedValue}</span>
                <ArrowDownWideNarrow
                    {...iconProps}
                    className={`${iconProps.className}`}
                />
            </button>
            {isOpen && (
                <ul
                    className="absolute z-60 top-full mt-2 w-full left-0 bg-white dark:bg-[#1e1e1e] shadow-xl rounded-lg border border-slate-300 dark:border-white/10 overflow-hidden"
                    role="listbox"
                >
                    {selectableOptions.map((option) => (
                        <li
                            key={option}
                            onClick={() => handleOptionClick(option)}
                            className={`p-2 text-sm cursor-pointer text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${selectedValue === option ? 'bg-slate-200 dark:bg-slate-600 font-medium' : ''}`}
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

export default CustomerFilter;