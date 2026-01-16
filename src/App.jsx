import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from './pages/Transactions/Sales/SalesPage'; 
import Expenses from './pages/Transactions/Expenses/ExpensesPage';
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
        <Route path="transactions/Expenses" element={<Expenses darkMode={darkMode} />} />
        <Route path = "transactions/Sales" element={<Sales darkMode={darkMode} />} />
        <Route path="suppliers" element={<Suppliers darkMode={darkMode} />} />
        <Route path="inventory" element={<Inventory darkMode={darkMode} />} />
        <Route path="activityLog" element={<ActivityLog darkMode={darkMode} />} />
        <Route path="accounts" element={<Accounts darkMode={darkMode} />} />
        
      </Route>
    </Routes>
  );
}

export default App;