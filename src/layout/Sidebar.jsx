import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, PiggyBank, 
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
      { id: "balances", label: "Balances", path: "/transactions/Balances" }
    ]
  },
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
        <div className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
            collapsed 
              ? "bg-transparent shadow-none text-emerald-500" 
              : "bg-[#164E48] text-white shadow-lg shadow-[#164E48]/20"
          }`}>
            <PiggyBank className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="transition-opacity duration-300">
              <h1 className="text-xl font-bold leading-none text-slate-800 dark:text-white">IRMS</h1>
              <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`flex-1 flex flex-row sm:flex-col items-center sm:items-stretch justify-around sm:justify-start p-0 sm:p-4 sm:space-y-2 ${collapsed ? "sm:overflow-visible" : "sm:overflow-y-auto"} no-scrollbar`}>
        {menuItems.map((item) => {
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isOpen = openMenus[item.id];

          return (
            <div key={item.id} className="sm:space-y-1 flex-shrink-0 relative group">
              {hasSubmenu ? (
                <>
                  {/* MOBILE FLOATING POPUP */}
                  {isOpen && (
                    <div className="sm:hidden absolute bottom-15 left-3/2 -translate-x-1/2 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden p-1 z-50">
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
                                  : "text-black/50 dark:text-slate-300 hover:text-white"
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
                    className={`w-full flex items-center p-2 sm:p-3 rounded-xl transition-all duration-200
                      ${collapsed ? 'justify-center' : 'justify-start'}
                      ${isOpen ? 'text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800' : 'text-slate-600/90 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <item.icon className={`w-6 h-6 sm:w-5 sm:h-5 transition-all ${collapsed ? 'min-w-0' : 'min-w-[20px]'}`} />
                    {!collapsed && (
                      <>
                        <span className="hidden md:block text-sm ml-3 font-medium whitespace-nowrap transition-opacity">
                          {item.label}
                        </span>
                        <ChevronDown className={`hidden sm:block w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>

                  {/* DESKTOP ACCORDION (Visible when clicked/expanded) */}
                  {isOpen && !collapsed && (
                    <div className="hidden sm:block ml-6 pl-4 space-y-1 mt-3 border-l border-slate-100 dark:border-slate-800">
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

                  {/* COLLAPSED HOVER POPOUT - Improved Hover Stability */}
                  {collapsed && (
                    <div className="absolute left-full top-0 h-full w-4 hidden group-hover:block z-[99]">
                        {/* This is a transparent bridge to keep the hover active while moving mouse to the menu */}
                    </div>
                  )}
                  {collapsed && (
                    <div className="absolute left-[calc(100%+8px)] top-0 hidden group-hover:block z-[100] animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 min-w-[160px]">
                        <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-3">{item.label}</p>
                        <div className="flex flex-col gap-1.5">
                        {item.submenu.map((sub) => (
                          <NavLink 
                            key={sub.id} 
                            to={sub.path}
                            className={({ isActive }) => 
                              `block px-3 py-2 text-sm rounded-lg transition-colors space-y-2 ${
                                isActive 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold" 
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`
                            }
                          >
                            {sub.label}
                          </NavLink>
                        ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center p-2 sm:p-3 rounded-xl transition-all duration-200
                    ${collapsed ? 'justify-center' : 'justify-start'}
                    ${isActive 
                      ? "bg-[#164E48] text-white shadow-md shadow-[#164E48]/20"
                      : "text-slate-600/90 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  <item.icon className={`w-6 h-6 sm:w-5 sm:h-5 transition-all ${collapsed ? 'min-w-0' : 'min-w-[20px]'}`} />
                  {!collapsed && (
                    <span className="hidden md:block text-sm ml-3 font-medium whitespace-nowrap transition-opacity">
                      {item.label}
                    </span>
                  )}
                  
                  {/* Tooltip for simple items */}
                  {collapsed && (
                    <div className="absolute left-[calc(100%+20px)] top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 dark:text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-[100] border border-slate-400 dark:border-slate-800 bg-white dark:bg-slate-900">
                      {item.label}
                    </div>
                  )}
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