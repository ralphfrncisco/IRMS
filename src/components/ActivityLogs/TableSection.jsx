import React, { useState, useEffect } from 'react'
import { supabase } from "../../lib/supabase";
import { Loader2 } from 'lucide-react';

function TableSection() {
    const [logs, setActivityLogs] = useState([])
    const [loading, setLoading] = useState(false);
    // READ
    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('activity_logs') // Fixed table name to match realtime listener
                .select('*')
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

        // REALTIME SUBSCRIPTION
        const channel = supabase
        .channel('activity_logs-realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'activity_logs' },
            () => {
            fetchLogs()
            }
        )
        .subscribe()

        // CLEANUP
        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 mb-25">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row activitys-start md:activitys-center gap-4 w-full md:w-auto">
                {/* Filter Grid Container */}
                <div className = "flex items-center justify-between w-full py-2">
                    <div className = "space-y-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Activity Logs</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Records of all the activity across the app</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="p-4 pl-10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Activity</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</th>
                            <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-slate-500">
                                    <p className="text-md font-normal">No records found</p>
                                </td>
                            </tr>
                        ) : (
                        
                            logs.map((activity, index) => (
                                <tr key={index} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{activity.id}</td>
                                    <td className="p-4 text-center text-sm font-semibold text-blue-500 dark:text-blue-400">{activity.title}</td>
                                    <td className="p-4 text-center text-sm">{activity.description}</td>
                                    <td className="p-4 text-center text-sm font-normal">{activity.time}</td>
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