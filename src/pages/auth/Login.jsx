import React, { useState, useEffect, useRef } from 'react'
import { Eye, EyeClosed, Loader2, Moon, Sun } from 'lucide-react';
import { supabase } from "../../lib/supabase";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;
const STORAGE_KEY = 'irms_login_lockout';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Enter your details to login');
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const countdownRef = useRef(null);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { unlocksAt, attempts: storedAttempts } = JSON.parse(stored);
      const remaining = Math.ceil((unlocksAt - Date.now()) / 1000);
      if (remaining > 0) {
        setLockedOut(true);
        setLockCountdown(remaining);
        setAttempts(storedAttempts);
        setIsError(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!lockedOut) return;
    countdownRef.current = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setLockedOut(false);
          setAttempts(0);
          setIsError(false);
          setErrorMessage('Enter your details to login');
          localStorage.removeItem(STORAGE_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [lockedOut]);

  const triggerLockout = (attemptCount) => {
    const unlocksAt = Date.now() + LOCKOUT_SECONDS * 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocksAt, attempts: attemptCount }));
    setLockedOut(true);
    setLockCountdown(LOCKOUT_SECONDS);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading || lockedOut) return;
    setLoading(true);
    setIsError(false);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setIsError(true);
        if (error.message.toLowerCase().includes('rate') || error.message.toLowerCase().includes('too many')) {
          setErrorMessage('Too many attempts. Please wait before trying again.');
          triggerLockout(newAttempts);
        } else if (newAttempts >= MAX_ATTEMPTS) {
          setErrorMessage(`Too many failed attempts. Try again in ${LOCKOUT_SECONDS}s.`);
          triggerLockout(newAttempts);
        } else {
          setErrorMessage(`Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setIsError(true);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (isError && !lockedOut) {
      setIsError(false);
      setErrorMessage('Enter your details to login');
    }
  };

  const isDisabled = loading || lockedOut;

  return (
    <div className={`
      fixed inset-0 h-screen flex items-center justify-center px-3 lg:p-4 transition-all duration-500 ease-in-out
      ${darkMode
        ? 'bg-gradient-to-t from-[#08090d] via-[#0f1118] to-[#181c26]'
        // Slightly more saturated so it visibly bleeds through the glass card
        : 'bg-gradient-to-t from-[#c8d3ea] via-[#d8e2f4] to-[#e8eef8]'
      }
    `}>

      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`p-2.5 rounded-xl absolute top-5 right-5 z-10 transition-all duration-300
          ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
      >
        {darkMode ? (
          <Moon className="w-5 h-5 text-blue-400 animate-in fade-in zoom-in duration-300" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500 animate-in fade-in zoom-in duration-300" />
        )}
      </button>

      <div className={`
        max-w-md w-full mt-[-25%] md:mt-0 p-8 py-17 rounded-2xl md:rounded-xl
        backdrop-blur-6xl
        transition-all duration-500 ease-in-out
        ${isError ? 'animate-shake' : ''}
        ${darkMode
          ? `bg-white/[0.05] border border-white/[0.05]
             shadow-[0_8px_40px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.07)]`
             
          : `bg-white/[0.15] border border-white/[0.02]
             shadow-[0_8px_48px_rgba(140,160,210,0.25),inset_0_1px_0_rgba(255,255,255,0.7)]`
        }
      `}>

        <div className="flex flex-col items-center justify-center space-y-2 mb-10">
          <img src="/logo.png" alt="Talaan" className="w-12 h-13 transition-colors duration-500" />
          <h2 className={`text-3xl text-center transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-800'}`} id="brand-name">
            Talaan
          </h2>
          <small className={`text-xs text-center transition-colors duration-500 ${
            isError ? 'text-red-500 font-medium' : darkMode ? 'text-white/40' : 'text-slate-500'
          }`}>
            {lockedOut ? `Locked out. Try again in ${lockCountdown}s` : errorMessage}
          </small>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>

          <div className="w-full">
            <label className={`block text-sm font-semibold mb-1 transition-colors duration-500 ${
              isError ? 'text-red-500' : darkMode ? 'text-white/80' : 'text-slate-700'
            }`}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={handleInputChange(setEmail)}
              disabled={isDisabled}
              placeholder=""
              className={`w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                ${darkMode ? 'text-slate-200' : 'text-slate-700'}
                ${isError
                  ? 'border-red-500/60 ring-2 ring-red-500/15 bg-red-500/5'
                  : darkMode
                    ? 'bg-white/[0.06] border-white/[0.01] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50'
                    : 'bg-white/[0.3] border-white/[0.25] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50'
                }`}
            />
          </div>

          <div className="w-full">
            <label className={`block text-sm font-semibold mb-1 transition-colors duration-500 ${
              isError ? 'text-red-500' : darkMode ? 'text-white/80' : 'text-slate-700'
            }`}>
              Password
            </label>
            <div className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border transition-all duration-300
              ${isError
                ? 'border-red-500/60 ring-2 ring-red-500/15 bg-red-500/5'
                : darkMode
                  ? 'bg-white/[0.06] border-white/[0.01] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50'
                  : 'bg-white/[0.4] border-white/[0.25] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50'
              }
              ${isDisabled ? 'opacity-50' : ''}
            `}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={handleInputChange(setPassword)}
                disabled={isDisabled}
                placeholder=""
                className={`flex-1 bg-transparent outline-none disabled:cursor-not-allowed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isDisabled}
                className={`ml-2 transition-colors duration-300 disabled:cursor-not-allowed ${
                  darkMode ? 'text-white/50 hover:text-white/80' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeClosed className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className={`mt-10 flex items-center justify-center w-full font-semibold rounded-lg p-2.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed
              ${darkMode
                ? 'text-white bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] backdrop-blur-sm'
                : 'text-white bg-[#1e1e1e] hover:bg-[#2e2e2e]'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing In...
              </>
            ) : lockedOut ? (
              `Locked out (${lockCountdown}s)`
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