import React, { useEffect, useState, useRef } from 'react'
import { Menu, ChevronDown, Bell, Sun, Moon, LogOut, KeyRound, User } from 'lucide-react';
import { supabase } from "../lib/supabase";
import noProfile from "../assets/no-profile.png";
import AccountSettingsModal from './../components/Modals/AccountSettingsModal';
import ChangePasswordModal from './../components/Modals/ChangePasswordModal';

function Header({ onToggleSidebar, onRoleLoaded }) {
    // --- THEME STATE ---
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );

    // --- DROPDOWN & PROFILE STATE ---
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const menuRef = useRef(null);
    const notifRef = useRef(null);

    // --- MODAL STATE ---
    const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // ✅ NOTIFICATIONS STATE
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // --- FETCH PROFILE DATA ---
    useEffect(() => {
        let isMounted = true;
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('account')
                        .select('*')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (!error && data && isMounted) {
                        setProfile(data);
                        if (onRoleLoaded) onRoleLoaded(data.role);
                    }
                }
            } catch (err) {
                console.error("Header Profile Error:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchProfile();
        return () => { isMounted = false; };
    }, [onRoleLoaded]);

    // ✅ FETCH NOTIFICATIONS
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('activityLogs')
                    .select('*')
                    .order('datetime', { ascending: false })
                    .limit(10);

                if (!error && data) {
                    setNotifications(data);
                    // Count unread (last 24 hours)
                    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const unread = data.filter(n => new Date(n.datetime) > oneDayAgo).length;
                    setUnreadCount(unread);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        fetchNotifications();

        // ✅ Real-time subscription
        const channel = supabase
            .channel('header-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activityLogs'
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev].slice(0, 10));
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // ✅ FORMAT TIME (relative or absolute)
    const formatNotificationTime = (datetime) => {
        const now = new Date();
        const notifTime = new Date(datetime);
        const diffMs = now - notifTime;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins === 1) return '1 minute ago';
        if (diffMins < 30) return `${diffMins} minutes ago`;

        // If >= 30 minutes, show actual time
        return notifTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };
    // --- LOGOUT HANDLER ---
    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setIsUserMenuOpen(false);
            window.location.href = "/login";
        } catch (err) {
            alert("Error logging out: " + err.message);
        }
    };

    // --- THEME EFFECT ---
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    // --- CLOSE DROPDOWN ON OUTSIDE CLICK ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <div className="sticky top-0 z-50 w-full flex items-center justify-between p-4 py-5 gap-2 border-b transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">

                <div className="flex items-center gap-3">
                    <button
                        className="hidden md:block p-2 mt-1 rounded-lg transition-all duration-200 text-black/50 hover:bg-gray-200/50 dark:text-white dark:hover:bg-slate-800"
                        onClick={onToggleSidebar}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        Dashboard
                    </h1>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 rounded-xl transition-colors hover:bg-gray-200/50 dark:text-white dark:hover:bg-slate-800"
                    >
                        {darkMode ? (
                            <Moon className="w-5 h-5 text-blue-500" />
                        ) : (
                            <Sun className="w-5 h-5 text-yellow-400" />
                        )}
                    </button>

                    {/* ✅ NOTIFICATIONS DROPDOWN */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                            className={`relative p-2.5 rounded-xl transition-colors text-black/50 dark:text-white ${isNotifMenuOpen ? 'bg-gray-200/50 dark:bg-slate-800' : 'hover:bg-gray-200/50 dark:hover:bg-slate-800'}`}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 px-1">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {isNotifMenuOpen && (
                            <div className="absolute right-[-70px] md:right-0 mt-4 w-72 md:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-100">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 dark:text-white"><Bell className="w-5 h-6 mt-[-2px] mr-2 inline" />Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                            {unreadCount} New
                                        </span>
                                    )}
                                </div>
                                
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((notif) => (
                                            <div 
                                                key={notif.id}
                                                className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                            >
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                    {notif.activity}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line">
                                                    {notif.description}
                                                </p>
                                                <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-2 font-medium">
                                                    {notif.user} • {formatNotificationTime(notif.datetime)}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                                        </div>
                                    )}
                                </div>
                                
                                {notifications.length > 0 && (
                                    <div className="p-3 border-t border-slate-100 dark:border-slate-700 text-center">
                                        <button className="text-xs font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                                            View All Notifications
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- USER PROFILE DROPDOWN --- */}
                    <div className="relative" ref={menuRef}>
                        <div 
                          className="flex items-center gap-3 pl-3 border-l border-slate-300 dark:border-slate-700 cursor-pointer group"
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                          <img
                            src={profile?.avatar_url || noProfile}
                            alt="User"
                            className="w-8 h-8 rounded-full ring-2 ring-blue-500 transition-transform group-hover:scale-105"
                          />
                          <div className="hidden md:block">
                            <p className="text-sm font-medium text-slate-700 dark:text-white">
                              {isLoading ? "Fetching..." : (profile?.full_name || "Guest User")}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {isLoading ? "Please wait" : (profile?.role || "Staff")}
                            </p>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isUserMenuOpen && (
                            <div className="absolute right-2 mt-4 w-50 md:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 px-2 animate-in fade-in zoom-in duration-100">
                                <button 
                                    onClick={() => {
                                        setIsAccountSettingsOpen(true);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    Account Settings
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsChangePasswordOpen(true);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    Change Password
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AccountSettingsModal 
                isOpen={isAccountSettingsOpen}
                onClose={() => setIsAccountSettingsOpen(false)}
                currentProfile={profile}
            />

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />
        </>
    )
}

export default Header;