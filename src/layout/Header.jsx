import React, { useEffect, useState } from 'react'
import { Menu, ChevronDown, Bell, Sun, Moon } from 'lucide-react';

function Header({ onToggleSidebar }) {

  // THEME STATE
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="w-full flex items-center justify-between p-4 py-5 gap-2 border-b transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">

      <div className="flex items-center gap-3">
        <button
          className="p-2 mt-1 rounded-lg transition-all duration-200 text-black/50 hover:bg-gray-200/50 dark:text-white dark:hover:bg-slate-800"
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

        <div className="flex items-center gap-3 pl-3 border-l border-slate-300 dark:border-slate-700">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4042/4042171.png"
            alt="User"
            className="w-8 h-8 rounded-full ring-2 ring-blue-500"
          />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700 dark:text-white">John Doe</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>
    </div>
  )
}

export default Header;