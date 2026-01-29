import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from './pages/Transactions/Sales/SalesPage'; 
import Expenses from './pages/Transactions/Expenses/ExpensesPage';
import Balances from './pages/Transactions/Balances/BalancesPage';
import Ledger from './pages/Transactions/Ledger/LedgerPage';
import ActivityLog from "./pages/ActivityLog";
import Accounts from "./pages/Accounts";
import Suppliers from "./pages/Suppliers";


function App() {

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase
        .from('account')
        .select('*')

      console.log('DATA:', data)
      console.log('ERROR:', error)
    }

    testConnection()
  }, [])

  return (
    <Routes>
      <Route path="/" element={<MainLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
        
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard darkMode={darkMode} />} />
        <Route path="transactions/Expenses" element={<Expenses darkMode={darkMode} />} />
        <Route path = "transactions/Sales" element={<Sales darkMode={darkMode} />} />
        <Route path = "transactions/Balances" element={<Balances darkMode={darkMode} />} />
        <Route path = "transactions/Ledger" element={<Ledger darkMode={darkMode} />} />
        <Route path="suppliers" element={<Suppliers darkMode={darkMode} />} />
        <Route path="inventory" element={<Inventory darkMode={darkMode} />} />
        <Route path="activityLog" element={<ActivityLog darkMode={darkMode} />} />
        <Route path="accounts" element={<Accounts darkMode={darkMode} />} />
      </Route>
    </Routes>
  );
}

export default App;