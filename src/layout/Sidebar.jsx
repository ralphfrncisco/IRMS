import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PiggyBank, 
  Package, FileText, User, Users, UserCog, ContactRound,
  ArrowLeftRight, ChevronDown, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { 
    id: "transactions", 
    icon: ArrowLeftRight, 
    label: "Transactions",
    submenu: [
      { id: "sales", label: "Sales", path: "/transactions/Sales" },
      { id: "expenses", label: "Expenses", path: "/transactions/Expenses" },
      { id: "balances", label: "Balances", path: "/transactions/Balances" },
      { id: "ledger", label: "Ledger", path: "/transactions/Ledger" }
    ]
  },
  { id: "inventory", icon: Package, label: "Inventory", path: "/inventory" },
  {
    id: "entities",
    icon: User,
    label: "Entities",
    submenu: [
      { id: "customers", label: "Customers", path: "/customers" },
      { id: "suppliers", label: "Suppliers", path: "/suppliers" },
    ]
  },
  { id: "activityLog", icon: FileText, label: "Activity Logs", path: "/activityLog" },
  { id: "accounts", icon: UserCog, label: "Accounts", path: "/accounts" },
];

// ─── Pulsing badge component ──────────────────────────────────────────────────
function LowStockBadge({ count }) {
  if (!count || count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
  );
}

function Sidebar({ collapsed, darkMode, userRole }) { 
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [mobileSubmenu, setMobileSubmenu] = useState(null);
  const [screenSize, setScreenSize] = useState('desktop');
  const [lowStockCount, setLowStockCount] = useState(0);       // ✅ how many items are low
  const [showLowStockBanner, setShowLowStockBanner] = useState(true); // ✅ persistent banner
  const location = useLocation();
  const navigate = useNavigate();

  // ─── Fetch low stock count ────────────────────────────────────────────────
  const fetchLowStock = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .lte('quantity', 10);

    if (!error) setLowStockCount(data?.length ?? 0);
  };

  useEffect(() => {
    fetchLowStock();

    // Re-check whenever products table changes (same trigger as log_low_stock)
    const channel = supabase
      .channel('low-stock-badge')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        () => fetchLowStock()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ─── Screen size detection ────────────────────────────────────────────────
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    setOpenSubmenu(null);
    setMobileSubmenu(null);
  }, [location.pathname]);

  const filteredMenuItems = menuItems.filter(item => {
    const restrictedIds = ['activityLog', 'accounts'];
    if (restrictedIds.includes(item.id)) {
      return userRole === 'Administrator' || userRole === 'Super Admin';
    }
    return true;
  });

  const toggleSubmenu = (id) => setOpenSubmenu(prev => prev === id ? null : id);
  const toggleMobileSubmenu = (id) => setMobileSubmenu(prev => prev === id ? null : id);

  const isCollapsed = screenSize === 'tablet' ? true : screenSize === 'desktop' ? collapsed : false;
  const isMobile = screenSize === 'mobile';

  return (
    <>
      {/* ========================================
          MOBILE BOTTOM NAVIGATION (< 640px)
      ======================================== */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 w-full border-t flex flex-col z-50 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">

          {/* ✅ Persistent low stock banner — mobile */}
          {lowStockCount > 0 && showLowStockBanner && (
            <div className="flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} low on stock
                </p>
              </div>
              <button
                onClick={() => setShowLowStockBanner(false)}
                className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          )}

          <nav className="h-16 flex flex-row items-center justify-around px-2">
            {filteredMenuItems.map((item) => {
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isActive = hasSubmenu
                ? item.submenu.some(sub => location.pathname === sub.path)
                : location.pathname === item.path;
              const isInventory = item.id === 'inventory';

              return (
                <div key={item.id} className="relative flex-1">
                  {hasSubmenu ? (
                    <>
                      <button
                        onClick={() => toggleMobileSubmenu(item.id)}
                        className={`w-full flex flex-col items-center justify-center p-2 transition-all ${
                          isActive ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {/* ✅ Badge on icon */}
                        <span className="relative inline-flex">
                          <item.icon className="w-6 h-6" />
                          {isInventory && <LowStockBadge count={lowStockCount} />}
                        </span>
                      </button>

                      {mobileSubmenu === item.id && (
                        <>
                          <div className="fixed inset-0 bg-black/20 z-[60]" onClick={() => setMobileSubmenu(null)} />
                          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-300 dark:border-slate-700 p-3 z-[70] min-w-[230px] max-w-[70vw]">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</p>
                              <button onClick={() => setMobileSubmenu(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              </button>
                            </div>
                            <div className="space-y-1">
                              {item.submenu.map((sub) => (
                                <NavLink
                                  key={sub.id}
                                  to={sub.path}
                                  onClick={() => setMobileSubmenu(null)}
                                  className={({ isActive }) =>
                                    `block px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                      isActive
                                        ? "bg-emerald-500 text-white"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`
                                  }
                                >
                                  {sub.label}
                                </NavLink>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `w-full flex flex-col items-center justify-center p-2 transition-all ${
                          isActive ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-400'
                        }`
                      }
                    >
                      <span className="relative inline-flex">
                        <item.icon className="w-6 h-6" />
                        {isInventory && <LowStockBadge count={lowStockCount} />}
                      </span>
                    </NavLink>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}

      {/* ========================================
          SIDEBAR (>= 640px)
      ======================================== */}
      {!isMobile && (
        <div className={`
          flex flex-col h-screen border-r
          ${isCollapsed ? "w-20" : "w-72"} 
          transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800
        `}>
          
          {/* Branding */}
          <div
            onClick={() => navigate('/dashboard')}
            className="p-6 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
                isCollapsed
                  ? "bg-transparent shadow-none text-emerald-500"
                  : "bg-[#164E48] text-white shadow-lg shadow-[#164E48]/20"
              }`}>
                <PiggyBank className="w-6 h-6" />
              </div>
              {!isCollapsed && (
                <div className="transition-opacity duration-300">
                  <h1 className="text-xl font-bold leading-none text-slate-800 dark:text-white">IRMS</h1>
                  <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Persistent low stock banner — sidebar expanded only */}
          {!isCollapsed && lowStockCount > 0 && showLowStockBanner && (
            <div className="mx-3 mt-3 flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} low on stock
                </p>
              </div>
              <button
                onClick={() => setShowLowStockBanner(false)}
                className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className={`flex-1 p-4 space-y-2 ${isCollapsed ? "overflow-visible" : "overflow-y-auto"} custom-scrollbar`}>
            {filteredMenuItems.map((item) => {
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isOpen = openSubmenu === item.id;
              const isInventory = item.id === 'inventory';

              return (
                <div key={item.id} className="space-y-1 relative">
                  {hasSubmenu ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(item.id)}
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200
                          ${isCollapsed ? 'justify-center' : 'justify-start'}
                          ${isOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white' : 'text-slate-600/90 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        <span className="relative inline-flex">
                          <item.icon className="w-5 h-5" />
                          {isInventory && <LowStockBadge count={lowStockCount} />}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="text-sm ml-3 font-medium whitespace-nowrap">{item.label}</span>
                            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>

                      {/* Collapsed popup */}
                      {isCollapsed && isOpen && (
                        <>
                          <div className="fixed inset-0 z-[90]" onClick={() => setOpenSubmenu(null)} />
                          <div className="absolute left-[calc(100%+8px)] top-0 z-[100] animate-in fade-in slide-in-from-left-2 duration-200">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 min-w-[200px]">
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">{item.label}</p>
                                <button onClick={() => setOpenSubmenu(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                  <X className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                              </div>
                              <div className="space-y-1">
                                {item.submenu.map((sub) => (
                                  <NavLink
                                    key={sub.id}
                                    to={sub.path}
                                    onClick={() => setOpenSubmenu(null)}
                                    className={({ isActive }) =>
                                      `block px-3 py-2.5 text-sm rounded-lg transition-all font-medium ${
                                        isActive
                                          ? "bg-[#164E48] text-white shadow-md"
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
                        </>
                      )}

                      {/* Expanded accordion */}
                      {!isCollapsed && isOpen && (
                        <div className="ml-6 pl-4 space-y-1 border-l border-slate-100 dark:border-slate-800">
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
                        `w-full flex items-center p-3 rounded-xl transition-all duration-200 relative
                        ${isCollapsed ? 'justify-center' : 'justify-start'}
                        ${isActive
                          ? "bg-[#164E48] text-white shadow-md shadow-[#164E48]/20"
                          : "text-slate-600/90 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`
                      }
                    >
                      <span className="relative inline-flex">
                        <item.icon className="w-5 h-5" />
                        {/* ✅ Badge on Inventory nav item */}
                        {isInventory && <LowStockBadge count={lowStockCount} />}
                      </span>
                      {!isCollapsed && (
                        <span className="text-sm ml-3 font-medium whitespace-nowrap">{item.label}</span>
                      )}
                    </NavLink>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

export default Sidebar;