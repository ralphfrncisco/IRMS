import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FloatingNotifications from "../components/Notification";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false); 
  const [userRole, setUserRole] = useState(null);

  return (
    <div className="fixed inset-0 flex flex-col sm:flex-row h-screen overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-[#090909]">
      
      <div className="order-last sm:order-first">
        <Sidebar collapsed={collapsed} userRole={userRole}/>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">

        <Header 
          onToggleSidebar={() => setCollapsed(!collapsed)}
          onRoleLoaded={(role) => setUserRole(role)}
        />

        <main className="p-4 pt-5 pb-20 sm:pb-4 h-full overflow-auto custom-scrollbar">
          <Outlet context={{ darkMode }} /> 
        </main>
      </div>

      <FloatingNotifications />
    </div>
  );
};

export default MainLayout;