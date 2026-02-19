import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertTriangle, ShoppingCart, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../App.css';

function Notification() {
  const [notifications, setNotifications] = useState([]);

  const triggerExit = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isExiting: true } : n
    ));

    // Wait for animation (400ms) then remove from state
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 400);
  };

  useEffect(() => {
    // Subscribe to real-time activity logs
    const channel = supabase
      .channel('activity-logs-realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activityLogs' 
        },
        (payload) => {
          const newLog = payload.new;
          
          // Add to notifications
          const notification = {
            id: newLog.id,
            keyword: newLog.keyword,
            description: newLog.description,
            datetime: newLog.datetime,
            timestamp: Date.now()
          };

          setNotifications(prev => [notification, ...prev].slice(0, 3)); // Keep max 3

          // Auto-remove after 5 seconds
          setTimeout(() => triggerExit(notification.id), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getIcon = (keyword) => {
    switch (keyword) {
      case 'New Sale':
        return <ShoppingCart className="w-5 h-5 text-emerald-500" />;
      case 'Low Stock':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'Payment':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <>

      <div className="fixed top-22 right-1 md:right-6 z-[9999] space-y-3 pointer-events-none">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`notification-item w-[300px] md:w-[330px] p-4 rounded-xl border shadow-xl pointer-events-auto bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 ${
                notification.isExiting ? 'exiting' : ''
            }`}
            style={{ animationDelay: notification.isExiting ? '0s' : `${index * 0.1}s` }}
            >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.keyword)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                  {notification.keyword}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 break-words">
                  {notification.description}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                  {new Date(notification.datetime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(notification.id)}
                className="flex-shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Notification;