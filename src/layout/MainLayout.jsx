import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FloatingNotifications from "../components/Notification";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false); 
  const [userRole, setUserRole] = useState(null);

  // useEffect(() => {
  //   const hideStyle = document.createElement("style")
  //   hideStyle.id = "tuqlas-hide"
  //   hideStyle.textContent = `
  //     #tuqlas-btn, #tuqlas-win { opacity: 0 !important; pointer-events: none !important; }
  //   `
  //   document.head.appendChild(hideStyle)

  //   const el = document.createElement("script")
  //   el.src = "https://www.tuqlas.com/chatbot.js"
  //   el.setAttribute("data-key", "tq_live_0ce8c423b018cb99ef3e9ac84c364d770655ce04")
  //   el.setAttribute("data-api", "https://www.tuqlas.com")
  //   el.defer = true
  //   document.body.appendChild(el)

  //   const interval = setInterval(() => {
  //     const btn = document.getElementById("tuqlas-btn")
  //     const win = document.getElementById("tuqlas-win")

  //     if (btn && win) {
  //       btn.style.setProperty("bottom", "110px", "important")
  //       win.style.setProperty("bottom", "178px", "important")
  //       hideStyle.textContent = ""
  //       clearInterval(interval)
  //     }
  //   }, 200)

  //   // Hide chatbot when any modal is open
  //   const observer = new MutationObserver(() => {
  //     const btn = document.getElementById("tuqlas-btn")
  //     if (!btn) return

  //     // Detect open modals — adjust selector to match your modal's class
  //     const modalOpen = document.querySelector(
  //       ".modal-open, [role='dialog'], .overlay, .backdrop"
  //     )

  //     btn.style.setProperty(
  //       "display",
  //       modalOpen ? "none" : "flex",
  //       "important"
  //     )
  //   })

  //   observer.observe(document.body, { childList: true, subtree: true })

  //   return () => {
  //     el.remove()
  //     hideStyle.remove()
  //     clearInterval(interval)
  //     observer.disconnect()
  //   }
  // }, [])

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