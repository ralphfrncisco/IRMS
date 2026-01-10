import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard/DashboardPage";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Purchasing from "./pages/Purchasing";
import ActivityLog from "./pages/ActivityLog";
import Accounts from "./pages/Accounts";
import Suppliers from "./pages/Suppliers";

function App() {

  const [darkMode, setDarkMode] = useState(false);

  return (
    <Routes>
      <Route path="/" element={<MainLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
        
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard darkMode={darkMode} />} />
        <Route path="purchasing" element={<Purchasing darkMode={darkMode} />} />
        <Route path="orders" element={<Orders darkMode={darkMode} />} />
        <Route path="suppliers" element={<Suppliers darkMode={darkMode} />} />
        <Route path="inventory" element={<Inventory darkMode={darkMode} />} />
        <Route path="activityLog" element={<ActivityLog darkMode={darkMode} />} />
        <Route path="accounts" element={<Accounts darkMode={darkMode} />} />
        
      </Route>
    </Routes>
  );
}

export default App;