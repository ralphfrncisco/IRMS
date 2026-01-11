import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    /* The 'dark' class is typically managed on the <html> element via the Header component, 
       but we use dark:bg-slate-950 here to respond to it.
    */
    <div className="flex h-screen overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-900">

      <Sidebar collapsed={collapsed} darkMode={darkMode} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onToggleSidebar={() => setCollapsed(!collapsed)} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
        />

        <main className="p-4 overflow-y-auto flex-1">
          {/* We pass darkMode through context so Recharts/Logic-heavy components can still access the boolean */}
          <Outlet context={{ darkMode }} /> 
        </main>
      </div>
    </div>
  );
};

export default MainLayout;