import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
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

const IDLE_TIMEOUT_MS  = 5 * 60 * 1000;  // 5 minutes
const WARN_BEFORE_MS   = 1 * 60 * 1000;  // warn at 4 minutes (1 min before logout)
const ACTIVITY_EVENTS  = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Idle timeout state
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const idleTimerRef   = useRef(null);
  const warnTimerRef   = useRef(null);
  const countdownRef   = useRef(null);

  // ✅ Sign out and clean up
  const handleLogout = useCallback(async () => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(warnTimerRef.current);
    clearInterval(countdownRef.current);
    setShowWarning(false);
    await supabase.auth.signOut();
  }, []);

  // ✅ Reset all timers on activity
  const resetTimers = useCallback(() => {
    if (!session) return;

    clearTimeout(idleTimerRef.current);
    clearTimeout(warnTimerRef.current);
    clearInterval(countdownRef.current);
    setShowWarning(false);
    setCountdown(60);

    // Show warning at 4 minutes
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);

      // Start 60s countdown
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT_MS - WARN_BEFORE_MS);

    // Auto logout at 5 minutes
    idleTimerRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT_MS);

  }, [session, handleLogout]);

  // ✅ Attach/detach activity listeners when session changes
  useEffect(() => {
    if (!session) return;

    resetTimers();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));

    return () => {
      clearTimeout(idleTimerRef.current);
      clearTimeout(warnTimerRef.current);
      clearInterval(countdownRef.current);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetTimers));
    };
  }, [session, resetTimers]);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (loading) setLoading(false);
    });

    const subscription = data?.subscription;
    return () => { if (subscription) subscription.unsubscribe(); };
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
    <>

      {showWarning && session && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-sm w-full text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Still there?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You've been inactive for 4 minutes. You'll be automatically logged out in
            </p>
            <p className="text-4xl font-bold text-amber-500">{countdown}s</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Log Out
              </button>
              <button
                onClick={resetTimers}
                className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}

      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions/Expenses" element={<Expenses />} />
            <Route path="transactions/Sales" element={<Sales />} />
            <Route path="transactions/Balances" element={<Balances />} />
            <Route path="transactions/Ledger" element={<Ledger />} />
            <Route path="customers" element={<Customers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="activityLog" element={<ActivityLog />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </>
  );
}

export default App;