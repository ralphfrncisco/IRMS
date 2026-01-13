import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, PiggyBank, ShoppingCart, 
  Package, FileText, Users, UserCog,
  ArrowLeftRight, ChevronDown
} from 'lucide-react';

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
  { id: "orders", icon: ShoppingCart, label: "Orders", path: "/orders" },
  { id: "inventory", icon: Package, label: "Inventory", path: "/inventory" },
  { id: "suppliers", icon: Users, label: "Suppliers", path: "/suppliers" },
  { id: "activityLog", icon: FileText, label: "Activity Logs", path: "/activityLog" },
  { id: "accounts", icon: UserCog, label: "Accounts", path: "/accounts" }
];

function Sidebar({ collapsed, darkMode }) { 
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className={`
      fixed bottom-0 left-0 w-full h-16 border-t flex flex-row z-50
      sm:relative sm:h-screen sm:flex-col sm:border-r sm:border-t-0
      ${collapsed ? "sm:w-20" : "sm:w-72"} 
      transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800
    `}>
      
      {/* Branding Section */}
      <div className="hidden sm:block p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
            collapsed 
              ? "bg-transparent shadow-none text-emerald-500" 
              : "bg-[#164E48] text-white shadow-lg shadow-[#164E48]/20"
          }`}>
            <PiggyBank className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold leading-none text-slate-800 dark:text-white">IRMS</h1>
              <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 flex flex-row sm:flex-col items-center sm:items-stretch justify-around sm:justify-start p-0 sm:p-4 sm:space-y-2 sm:overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isOpen = openMenus[item.id];

          return (
            <div key={item.id} className="sm:space-y-1 flex-shrink-0 relative">
              {hasSubmenu ? (
                <>
                  {/* MOBILE FLOATING POPUP (Horizontal like image 2) */}
                  {isOpen && (
                    <div className="sm:hidden absolute top-[-65px] left-3/4 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700 overflow-hidden p-1.5 z-50">
                      <div className="flex flex-row gap-1">
                        {item.submenu.map((sub) => (
                          <NavLink 
                            key={sub.id} 
                            to={sub.path}
                            onClick={() => toggleMenu(item.id)}
                            className={({ isActive }) =>
                              `px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                                isActive 
                                  ? "bg-emerald-500 text-white rounded-lg" 
                                  : "text-slate-300 hover:text-white"
                              }`
                            }
                          >
                            {sub.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex flex-col sm:flex-row items-center p-2 sm:p-3 rounded-xl transition-all duration-200
                      ${isOpen ? 'text-slate-700 dark:text-white' : 'text-slate-600/90 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <item.icon className="w-6 h-6 sm:w-5 sm:h-5 min-w-[20px]" />
                    <span className={`hidden md:block text-[10px] sm:text-sm sm:ml-3 font-medium ${collapsed ? 'sm:hidden' : 'block'}`}>
                      {item.label}
                    </span>
                    {!collapsed && <ChevronDown className={`hidden sm:block w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                  </button>

                  {/* DESKTOP ACCORDION (Same as image 1) */}
                  {isOpen && !collapsed && (
                    <div className="hidden sm:block ml-6 pl-4 space-y-1 mt-1 border-l border-slate-100 dark:border-slate-800">
                      {item.submenu.map((sub) => (
                        <NavLink 
                          key={sub.id} 
                          to={sub.path} 
                          className={({ isActive }) =>
                            `w-full flex items-center pl-4 p-2 rounded-xl transition-all duration-200 text-sm
                            ${isActive 
                              ? "bg-[#164E48] text-white font-semibold shadow-md" 
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    `w-full flex flex-col sm:flex-row items-center p-2 sm:p-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? "text-[#164E48] sm:bg-[#164E48] text-white shadow-sm"
                      : "text-slate-600/90 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  <item.icon className="w-6 h-6 sm:w-5 sm:h-5 min-w-[20px]" />
                  <span className={`hidden md:block text-[10px] sm:text-sm sm:ml-3 font-medium ${collapsed ? 'sm:hidden' : 'block'}`}>
                    {item.label}
                  </span>
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