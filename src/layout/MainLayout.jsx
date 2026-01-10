import React, { useState } from 'react'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import { Outlet } from 'react-router-dom';

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className = "flex h-screen overflow-hidden">
      
      <Sidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
      />

      <div className = "flex-1 flex flex-col bg-slate-100 transition-all">
        
        <Header onToggleSidebar={() => setCollapsed(!collapsed)} />
        
        
        <div className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default MainLayout;