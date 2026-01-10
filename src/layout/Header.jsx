import React from 'react'
import { Menu, ChevronDown, Bell, Sun, Moon } from 'lucide-react';

function Header({ onToggleSidebar, darkMode, setDarkMode }) {
  return (
    <div className={`w-full flex items-center justify-between p-4 py-5 gap-2 border-b transition-colors duration-300 
      ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>

      <div className = "flex items-center gap-3">
        <button
          className={`p-2 mt-1 rounded-lg transition-all duration-200 
            ${darkMode ? 'text-white hover:bg-slate-800' : 'text-black/50 hover:bg-gray-200/50'}`}
          onClick={onToggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Dashboard
        </h1>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2.5 rounded-xl transition-colors 
            ${darkMode ? 'text-white hover:bg-slate-800' : 'hover:bg-gray-200/50'}`}
        >
          {darkMode ? (
            <Moon className="w-5 h-5 text-blue-500" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </button>

        <button className={`relative p-2.5 rounded-xl transition-colors 
          ${darkMode ? 'text-white hover:bg-slate-800' : 'text-black/50 hover:bg-gray-200/50'}`}>
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
        </button>

        <div className={`flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
            <img
            src="https://cdn-icons-png.flaticon.com/512/4042/4042171.png"
            alt="User"
            className="w-8 h-8 rounded-full ring-2 ring-blue-500"
          />
          <div className="hidden md:block">
            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-700'}`}>John Doe</p>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Administrator</p>
          </div>
          <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>
      </div>
    </div>
  )
}

export default Header;