import React, { useEffect, useState, useRef } from 'react'
import { Menu, ChevronDown, Bell, Sun, Moon, LogOut, KeyRound, User } from 'lucide-react';

function Header({ onToggleSidebar }) {

  // THEME STATE
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // --- DROPDOWN STATE ---
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // --- CLOSE DROPDOWN ON OUTSIDE CLICK ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full flex items-center justify-between p-4 py-5 gap-2 border-b transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">

      <div className="flex items-center gap-3">
        <button
          className="hidden md:block p-2 mt-1 rounded-lg transition-all duration-200 text-black/50 hover:bg-gray-200/50 dark:text-white dark:hover:bg-slate-800"
          onClick={onToggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl transition-colors hover:bg-gray-200/50 dark:text-white dark:hover:bg-slate-800"
        >
          {darkMode ? (
            <Moon className="w-5 h-5 text-blue-500" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </button>

        <button className="relative p-2.5 rounded-xl transition-colors text-black/50 hover:bg-gray-200/50 dark:text-white dark:hover:bg-slate-800">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
        </button>

        {/* --- USER PROFILE DROPDOWN CONTAINER --- */}
        <div className="relative" ref={menuRef}>
          <div 
            className="flex items-center gap-3 pl-3 border-l border-slate-300 dark:border-slate-700 cursor-pointer group"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/4042/4042171.png"
              alt="User"
              className="w-8 h-8 rounded-full ring-2 ring-blue-500 transition-transform group-hover:scale-105"
            />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-700 dark:text-white">John Doe</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* --- DROPDOWN MENU --- */}
          {isUserMenuOpen && (
            <div className="absolute right-2 mt-4 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 px-2 animate-in fade-in zoom-in duration-100">

              <button 
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700 rounded-lg"
                onClick={() => {
                  console.log("Account Credentials Clicked");
                  setIsUserMenuOpen(false);
                }}
              >
                <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                Account Settings
              </button>

              <button 
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700 rounded-lg"
                onClick={() => {
                  console.log("Change Password Clicked");
                  setIsUserMenuOpen(false);
                }}
              >
                <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                Change Password
              </button>
              
              <div className="my-1" />
              
              <button 
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400"
                onClick={() => {
                  console.log("Logout Clicked");
                  setIsUserMenuOpen(false);
                }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header;