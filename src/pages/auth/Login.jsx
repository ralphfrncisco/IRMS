import React, { useState, useEffect } from 'react'
import { PiggyBank, Eye, EyeClosed, Loader2, Moon, Sun } from 'lucide-react';
import { supabase } from "../../lib/supabase";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false); // New error state

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
    setIsError(false); // Reset error state on new attempt

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setIsError(true); // Trigger red borders
        console.error("Login failed:", error.message);
      } else {
        window.location.href = '/dashboard'; 
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to reset error when user types
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (isError) setIsError(false);
  };

  return (
    <div id="loginForm" className="fixed inset-0 h-screen bg-slate-100 dark:bg-[#1E1E1E] flex items-center justify-center px-3 lg:p-4 transition-all duration-500 ease-in-out">
      
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

      <div className={`max-w-md w-full rounded-2xl md:rounded-xl bg-white dark:bg-[#111] mt-[-25%] md:mt-0 p-8 py-17 shadow-sm md:shadow-xl transition-all duration-500 ease-in-out ${isError ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center justify-center space-y-2 mb-10">
          <PiggyBank className= "w-9 h-9 transition-colors duration-500 text-black dark:text-white"/>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white transition-colors duration-500">IRMS</h2>
          <small className={`text-xs transition-colors duration-500 ${isError ? 'text-red-500 font-medium' : 'text-slate-500 dark:text-white/60'}`}>
            {isError ? 'Invalid email or password' : 'Enter your details to login'}
          </small>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="w-full">
            <label className={`block text-sm font-semibold mb-1 transition-colors duration-500 ${isError ? 'text-red-500' : 'text-slate-700 dark:text-white/90'}`}>Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={handleInputChange(setEmail)}
              placeholder="" 
              className={`w-full text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg border outline-none transition-all duration-300 ring-offset-transparent
                ${isError 
                  ? 'border-red-500 ring-2 ring-red-500/20 dark:bg-red-500/5' 
                  : 'border-slate-300 dark:border-slate-100/20 dark:bg-black/70 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'} 
              `} 
            />
          </div>

          <div className="w-full">
            <label className={`block text-sm font-semibold mb-1 transition-colors duration-500 ${isError ? 'text-red-500' : 'text-slate-700 dark:text-white/90'}`}>Password</label>
            <div className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border transition-all duration-300
                ${isError 
                  ? 'border-red-500 ring-2 ring-red-500/20 dark:bg-red-500/5' 
                  : 'border-slate-300 dark:border-slate-100/20 dark:bg-black/70 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500'}
            `}>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={handleInputChange(setPassword)}
                placeholder="" 
                className="flex-1 bg-transparent text-slate-700 dark:text-slate-200 outline-none" 
              />
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="ml-2 text-slate-500 dark:text-white/80 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-300"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeClosed className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className= "mt-10 flex items-center justify-center w-full text-white font-semibold rounded-lg p-2.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed bg-black hover:bg-black/90 dark:hover:bg-black/80"
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

      {/* Tailwind CSS for the shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}

export default Login;