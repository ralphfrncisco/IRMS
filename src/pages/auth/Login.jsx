import React, { useState, useEffect } from 'react'
import { PiggyBank, Eye, EyeClosed, Loader2, Moon, Sun } from 'lucide-react';
import { supabase } from "../../lib/supabase";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        alert(error.message);
      } else {
        window.location.href = '/dashboard'; 
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ADDED: transition-all duration-500 to the main container
    <div id="loginForm" className="min-h-screen bg-white md:bg-slate-100 dark:bg-[#1E1E1E] flex items-center justify-center lg:p-4 transition-all duration-500 ease-in-out">
      
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2.5 rounded-xl transition-all duration-300 hover:bg-gray-200/50 dark:text-white dark:hover:bg-slate-800 absolute top-5 right-5 z-10"
      >
        {darkMode ? (
          <Moon className="w-5 h-5 text-blue-500 animate-in fade-in zoom-in duration-300" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400 animate-in fade-in zoom-in duration-300" />
        )}
      </button>

      {/* ADDED: transition-colors duration-500 to the card */}
      <div className="max-w-md w-full rounded-xl bg-white dark:bg-[#111] p-8 py-17 shadow-sm md:shadow-xl transition-colors duration-500 ease-in-out">
        <div className="flex flex-col items-center justify-center space-y-2 mb-10">
          <PiggyBank className="w-9 h-9 text-black dark:text-white transition-colors duration-500"/>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white transition-colors duration-500">IRMS</h2>
          <small className="text-slate-500 dark:text-white/60 text-xs transition-colors duration-500">Enter your details to login</small>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="w-full">
            <label className="block text-sm font-semibold text-slate-700 dark:text-white/90 mb-1 transition-colors duration-500">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" 
              className="w-full text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-100/20 dark:bg-black/70 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" 
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-slate-700 dark:text-white/90 mb-1 transition-colors duration-500">Password</label>
            <div className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-100/20 dark:bg-black/70 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-300">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••" 
                className="flex-1 bg-transparent text-slate-700 dark:text-slate-200 outline-none" 
              />
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="ml-2 text-slate-500 dark:text-white/80 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-300"
              >
                {showPassword ? <EyeClosed className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-10 flex items-center justify-center w-full bg-black text-white dark:text-white font-semibold rounded-lg p-2.5 hover:bg-black/90 dark:hover:bg-blue-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login;