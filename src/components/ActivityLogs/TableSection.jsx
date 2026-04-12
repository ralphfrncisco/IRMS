import React, { useState, useEffect } from 'react'
import { supabase } from "../../lib/supabase";
import { Loader2 } from 'lucide-react';

function TableSection() {
    const [logs, setActivityLogs] = useState([])
    const [loading, setLoading] = useState(false);

    // Date Formatter Function
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        
        const datePart = new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(date);

        const timePart = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);

        return `${datePart} - ${timePart}`; 
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('activityLogs') 
                .select('*')
                .limit(12)
                .order('id', { ascending: false });

            if (error) throw error;

            const formattedData = (data || []).map(item => ({
                ...item,
                db_id: item.id 
            }));

            setActivityLogs(formattedData);
        } catch (error) {
            console.error('Error fetching activity logs:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs()
        const channel = supabase
        .channel('activity_logs-realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'activityLogs' },
            () => fetchLogs()
        )
        .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-[#111] dark:border-white/10 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                <div className="flex items-center justify-between w-full py-2">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Activity Records</h3>
                        <p className="text-sm text-slate-500 dark:text-white/60">Records of all the activity across the app</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-[#191919]">
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Activity</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">User</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Description</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/70">Time</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                        {loading ? (
                            <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-slate-500 dark:text-white/60">
                                    <p className="text-md font-normal">No records found</p>
                                </td>
                            </tr>
                        ) : (
                            logs.map((activity) => (
                                <tr key={activity.db_id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-center text-sm font-semibold text-blue-500 dark:text-blue/50">{activity.activity}</td>
                                    <td className="p-4 text-center text-sm font-medium text-slate-500 dark:text-white/80">{activity.user}</td>
                                    <td className="p-4 text-center text-sm dark:text-white/70 italic">{activity.description}</td>
                                    <td className="p-4 text-center text-sm font-normal dark:text-white">
                                        {formatDateTime(activity.datetime || activity.created_at)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default TableSection;