import React, { useState, useEffect } from 'react';
import { X, PhilippinePeso, AlertTriangle, ShoppingCart, Bell, Package, Users, PackageCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../App.css';

function Notification() {
  const [notifications, setNotifications] = useState([]);

  const triggerExit = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isExiting: true } : n
    ));

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 400);
  };

  useEffect(() => {
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
          
          const notification = {
            id: newLog.id,
            activity: newLog.activity,
            keyword: newLog.keyword,
            description: newLog.description,
            datetime: newLog.datetime,
            timestamp: Date.now()
          };

          setNotifications(prev => [notification, ...prev].slice(0, 3));

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
            return <div className="p-2.5 bg-green-100/50 dark:bg-green-900/30 rounded-lg"><ShoppingCart className="w-4.5 h-4.5 text-green-500" /></div>;
        case 'Low Stock':
            return <div className="p-2.5 bg-red-100/50 dark:bg-red-900/30 rounded-lg"><AlertTriangle className="w-4.5 h-4.5 text-red-500" /></div>;
        case 'Payment':
            return <div className="p-2.5 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg"><PhilippinePeso className="w-4.5 h-4.5 text-blue-500" /></div>;
        case 'Expense':
            return <div className="p-2.5 bg-red-100/50 dark:bg-red-900/30 rounded-lg"><PhilippinePeso className="w-4.5 h-4.5 text-red-500" /></div>;
        case 'Inventory':
            return <div className="p-2.5 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg"><PackageCheck className="w-4.5 h-4.5 text-purple-500" /></div>;
        case 'Salary':
            return <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg"><Users className="w-4.5 h-4.5 text-emerald-500" /></div>;
        default:
            return <div className="p-2.5 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg"><Bell className="w-4.5 h-4.5 text-slate-500" /></div>;
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
            className={`notification-item w-[300px] md:w-[330px] p-4 rounded-xl border shadow-sm pointer-events-auto bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 ${
                notification.isExiting ? 'exiting' : ''
            }`}
            style={{ animationDelay: notification.isExiting ? '0s' : `${index * 0.1}s` }}
            >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.keyword)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-md font-semibold text-slate-800 dark:text-white">
                  {notification.activity}
                </h4>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 break-words whitespace-pre-line">
                  {notification.description}
                </p>
                <p className="text-[10px] text-blue-500 mt-3 font-medium">
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