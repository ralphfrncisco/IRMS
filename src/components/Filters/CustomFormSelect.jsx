import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// This component handles the UI and logic for a form-style dropdown.
function CustomFormSelect({ label, name, options, initialValue, onSelect, placeholder = "Select an option" }) {
    
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);
    
    // Find the initial label based on the initialValue
    const initialOption = options.find(opt => opt.value === initialValue);
    const initialLabel = initialOption ? initialOption.label : placeholder;
    
    const [selectedValue, setSelectedValue] = useState(initialValue || '');
    const [selectedLabel, setSelectedLabel] = useState(initialLabel);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleSelect = (option) => {
        setSelectedValue(option.value);
        setSelectedLabel(option.label);
        setIsOpen(false);
        if (onSelect) {
            // Pass the value and the field name back to the parent component
            onSelect(option.value, name);
        }
    };

    // Handle clicks outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const isPlaceholder = selectedValue === '';
    
    return (
        <div className="relative w-full " ref={selectRef}>
            
            {/* Label */}
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>

            {/* Custom Display Button */}
            <button
                type="button"
                id={name}
                className={`
                    w-full mt-1 px-3 py-1.5 h-[2.4rem] cursor-pointer text-left rounded-md border 
                    ${isOpen 
                        ? 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all' // Focus/Open style
                        : 'border-slate-300 dark:border-slate-600' // Default border
                    }
                    bg-white dark:bg-slate-700 shadow-xs
                    text-sm flex justify-between items-center transition-colors
                    ${isPlaceholder 
                        ? 'text-slate-400 dark:text-slate-500' // Placeholder color
                        : 'text-slate-900 dark:text-white' // Selected value color
                    }
                `}
                onClick={handleToggle}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate pr-4">{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown List */}
            {isOpen && (
                <ul
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-300 dark:border-slate-600 max-h-60 overflow-auto"
                    role="listbox"
                >
                    {options.map((option) => (
                        <li
                            key={option.value}
                            className={`
                                px-3 py-2 text-sm cursor-pointer transition-colors
                                ${option.value === selectedValue
                                    ? 'bg-blue-500 text-white font-medium' // Selected style
                                    : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700' // Hover style
                                }
                            `}
                            onClick={() => handleSelect(option)}
                            role="option"
                            aria-selected={option.value === selectedValue}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default CustomFormSelect;