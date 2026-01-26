import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col sm:flex-row h-screen overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-900">
      
      {/* On Mobile: order-last puts Sidebar at the bottom of the column.
         On Desktop: order-first puts it on the left of the row.
      */}
      <div className="order-last sm:order-first">
        <Sidebar collapsed={collapsed} darkMode={darkMode} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          onToggleSidebar={() => setCollapsed(!collapsed)} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
        />

        {/* pb-16 ensures content isn't covered by the mobile bottom nav */}
        <main className="p-4 pt-5 pb-20 sm:pb-4 overflow-y-auto flex-1">
          <Outlet context={{ darkMode }} /> 
        </main>
      </div>
    </div>
  );
};

export default MainLayout;