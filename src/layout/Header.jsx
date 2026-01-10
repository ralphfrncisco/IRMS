import React from 'react'
import { Menu } from 'lucide-react';

function Header({ onToggleSidebar }) {
  return (
    <div className = "w-full flex items-center p-4 gap-2 bg-white border-b border-slate-200">
      <button
        className="p-2 rounded-lg text-black/50 hover:bg-gray-300/30 transition-all duration-200"
        onClick={onToggleSidebar}
      >
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-bold text-slate-800">Header</h1>
    </div>
  )
}

export default Header;