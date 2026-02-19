import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Loader2 } from "lucide-react";

import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Sales from './pages/Transactions/Sales/SalesPage'; 
import Expenses from './pages/Transactions/Expenses/ExpensesPage';
import Balances from './pages/Transactions/Balances/BalancesPage';
import Ledger from './pages/Transactions/Ledger/LedgerPage';
import ActivityLog from "./pages/ActivityLog";
import Accounts from "./pages/Accounts";
import Suppliers from "./pages/Suppliers";
import LoginPage from "./pages/auth/Login";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    // 2. Listen for auth changes (the fix)
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (loading) setLoading(false);
    });

    const subscription = data?.subscription;

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {!session ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <Route path="/" element={<MainLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard darkMode={darkMode} />} />
          <Route path="transactions/Expenses" element={<Expenses darkMode={darkMode} />} />
          <Route path="transactions/Sales" element={<Sales darkMode={darkMode} />} />
          <Route path="transactions/Balances" element={<Balances darkMode={darkMode} />} />
          <Route path="transactions/Ledger" element={<Ledger darkMode={darkMode} />} />
          <Route path="customers" element={<Customers darkMode={darkMode} />} />
          <Route path="suppliers" element={<Suppliers darkMode={darkMode} />} />
          <Route path="inventory" element={<Inventory darkMode={darkMode} />} />
          <Route path="activityLog" element={<ActivityLog darkMode={darkMode} />} />
          <Route path="accounts" element={<Accounts darkMode={darkMode} />} />
          
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;