import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    // YOU MUST APPLY THE DARK CLASS HERE TO THE WRAPPER
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>

      <Sidebar collapsed={collapsed} darkMode={darkMode} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onToggleSidebar={() => setCollapsed(!collapsed)} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
        />

        <main className="p-4 overflow-y-auto flex-1">
          <Outlet context={{ darkMode }} /> 
        </main>
      </div>
    </div>
  );
};

export default MainLayout;