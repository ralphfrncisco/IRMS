import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react"; // Added useState
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Purchasing from "./pages/Purchasing";
import ActivityLog from "./pages/ActivityLog";
import Accounts from "./pages/Accounts";

function App() {
  // Adding the state here just like your portfolio
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Routes>
      {/* Pass darkMode and setDarkMode to MainLayout */}
      <Route path="/" element={<MainLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
        
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Pass darkMode to pages if they need manual switching too */}
        <Route path="dashboard" element={<Dashboard darkMode={darkMode} />} />
        <Route path="purchasing" element={<Purchasing darkMode={darkMode} />} />
        <Route path="orders" element={<Orders darkMode={darkMode} />} />
        <Route path="inventory" element={<Inventory darkMode={darkMode} />} />
        <Route path="activityLog" element={<ActivityLog darkMode={darkMode} />} />
        <Route path="accounts" element={<Accounts darkMode={darkMode} />} />
        
      </Route>
    </Routes>
  );
}

export default App;