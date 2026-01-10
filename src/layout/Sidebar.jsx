import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  Users, 
  Zap,
  LogOut
} from 'lucide-react';

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "purchasing", icon: ShoppingCart, label: "Purchasing" },
  { id: "orders", icon: Package, label: "Orders" },
  { id: "inventory", icon: Package, label: "Inventory" },
  { id: "activityLog", icon: FileText, label: "Activity Logs" },
  { id: "accounts", icon: Users, label: "Accounts" }
];

function Sidebar({ collapsed }) {
  return (
    <div className={`${collapsed ? "w-20" : "w-72"} transition-all duration-300 bg-white border-slate-200 border-r h-screen flex flex-col`}>
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#164E48] rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">IRMS</h1>
              <p className="text-xs text-slate-500 mt-1">Admin Panel</p>
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
                ? "bg-[#164E48] text-white shadow-lg"
                : "text-slate-600/90 hover:bg-slate-400/20 hover:text-slate-700"
              }`
            }
          >
            <item.icon className="w-5 h-5 min-w-[20px]" />
            {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <button className="w-full flex items-center text-center justify-center gap-3 p-3 bg-[#164E48] text-white rounded-lg hover:translate-y-[-2px] transition-all duration-200">
          <LogOut className = "w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium mr-3">Log Out</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;