import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, WalletCards, ShoppingCart, 
  Package, FileText, Users, Zap, UserCog,
  ArrowLeftRight, ChevronDown
} from 'lucide-react';

// 1. Define the dynamic structure in one array
const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { 
    id: "transactions", 
    icon: ArrowLeftRight, 
    label: "Transactions",
    submenu: [
      { id: "sales", label: "Sales", path: "/transactions/Sales" },
      { id: "expenses", label: "Expenses", path: "/transactions/Expenses" },
    ]
  },
  {id: "orders", icon: ShoppingCart, label: "Orders", path: "/orders" },
  { id: "inventory", icon: Package, label: "Inventory", path: "/inventory" },
  { id: "suppliers", icon: Users, label: "Suppliers", path: "/suppliers" },
  { id: "activityLog", icon: FileText, label: "Activity Logs", path: "/activityLog" },
  { id: "accounts", icon: UserCog, label: "Accounts", path: "/accounts" }
];

function Sidebar({ collapsed, darkMode }) { 
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();

  // 2. Toggle function for any dynamic submenu
  const toggleMenu = (id) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className={`${collapsed ? "w-20" : "w-72"} transition-all duration-300 border-r h-screen flex flex-col
      ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      
      {/* Branding Section */}
      <div className={`p-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
            collapsed 
              ? "bg-transparent shadow-none text-emerald-500" 
              : "bg-[#164E48] text-white shadow-lg shadow-[#164E48]/20"
          }`}>
            <Zap className= "w-6 h-6" />
          </div>
          {!collapsed && (
            <div>
              <h1 className={`text-xl font-bold leading-none ${darkMode ? 'text-white' : 'text-slate-800'}`}>IRMS</h1>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Navigation Section */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isOpen = openMenus[item.id];

          return (
            <div key={item.id} className="space-y-1">
              {hasSubmenu ? (
                // 3. Render Collapsible Button for items with submenus
                <>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200
                      ${darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    <item.icon className="w-5 h-5 min-w-[20px]" />
                    {!collapsed && (
                      <>
                        <span className="ml-3 font-medium flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>

                  {isOpen && !collapsed && (
                    <div className= "ml-6 pl-4 space-y-1 mt-1">
                      {item.submenu.map((sub) => (
                        <NavLink 
                          key={sub.id} 
                          to={sub.path} 
                          className={({ isActive }) =>
                            `block p-2 text-sm rounded-lg transition-colors ${
                              isActive ? "text-emerald-500 font-bold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-700"
                            }`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                
                <NavLink
                  to={item.path}
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
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;