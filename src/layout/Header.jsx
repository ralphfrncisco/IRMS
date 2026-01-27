import React, { useEffect, useState, useRef } from 'react'
import { Menu, ChevronDown, Bell, Sun, Moon, LogOut, KeyRound, User } from 'lucide-react';

function Header({ onToggleSidebar }) {

  // THEME STATE
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // --- DROPDOWN STATE ---
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false); // Added for Notifications
  const menuRef = useRef(null);
  const notifRef = useRef(null);

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
      // Handle User Menu
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      // Handle Notification Menu
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full flex items-center justify-between p-4 py-5 gap-2 border-b transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">

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

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
            className={`relative p-2.5 rounded-xl transition-colors text-black/50 dark:text-white ${isNotifMenuOpen ? 'bg-gray-200/50 dark:bg-slate-800' : 'text-black/50 dark:text-white hover:bg-gray-200/50 dark:hover:bg-slate-800'}`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">3</span>
          </button>

          {isNotifMenuOpen && (
            <div className="absolute right-[-70px] md:right-0 mt-4 w-72 md:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-100">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full">3 New</span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {/* Example Notification Item */}
                <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">New Purchase Order</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ORD-1005 has been fully paid by Emily Davis.</p>
                  <p className="text-[10px] text-blue-500 mt-2 font-medium">2 minutes ago</p>
                </div>
                <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">New Purchase Order</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ORD-1005 has been fully paid by Emily Davis.</p>
                  <p className="text-[10px] text-blue-500 mt-2 font-medium">2 minutes ago</p>
                </div>
                <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">New Purchase Order</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ORD-1005 has been fully paid by Emily Davis.</p>
                  <p className="text-[10px] text-blue-500 mt-2 font-medium">2 minutes ago</p>
                </div>
                <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">New Purchase Order</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ORD-1005 has been fully paid by Emily Davis.</p>
                  <p className="text-[10px] text-blue-500 mt-2 font-medium">2 minutes ago</p>
                </div>
              </div>

              <button className="w-full py-3 text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>

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
            <div className="absolute right-2 mt-4 w-50 md:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 px-2 animate-in fade-in zoom-in duration-100">

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