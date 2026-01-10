import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, WalletCards, ShoppingCart, 
  Package, FileText, Users, Zap, LogOut
} from 'lucide-react';

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "purchasing", icon: WalletCards, label: "Purchasing" },
  { id: "orders", icon: ShoppingCart, label: "Orders" },
  { id: "inventory", icon: Package, label: "Inventory" },
  { id: "activityLog", icon: FileText, label: "Activity Logs" },
  { id: "accounts", icon: Users, label: "Accounts" }
];

function Sidebar({ collapsed, darkMode }) { // Added darkMode prop
  return (
    <div className={`${collapsed ? "w-20" : "w-72"} transition-all duration-300 border-r h-screen flex flex-col
      ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      
      <div className={`p-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#164E48] rounded-xl flex items-center justify-center shadow-lg shadow-[#164E48]/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className={`text-xl font-bold leading-none ${darkMode ? 'text-white' : 'text-slate-800'}`}>IRMS</h1>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={`/${item.id}`}
            className={({ isActive }) =>
              `w-full flex items-center p-3 rounded-xl transition-all duration-200
              ${isActive 
                ? "bg-[#164E48] text-white"
                : darkMode 
                  ? "text-slate-300 hover:bg-slate-800 hover:text-white" 
                  : "text-slate-600/90 hover:bg-slate-100 hover:text-slate-700"
              }`
            }
          >
            <item.icon className="w-5 h-5 min-w-[20px]" />
            {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <button className={`w-full flex items-center text-center justify-center gap-3 p-3 rounded-lg hover:translate-y-[-2px] transition-all duration-200
          ${darkMode ? 'bg-slate-800 text-white' : 'bg-[#164E48] text-white shadow-md'}`}>
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium mr-3">Log Out</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;