import { Clock, ShoppingCart, User } from 'lucide-react'
import React from 'react'

const activities = [
    { id: 1, type: "user", icon: User, title: "New user registered", description: "John Smith created an account", time: "2 minutes ago", color: "text-blue-500", bgStyles: "bg-blue-100 dark:bg-blue-500/20" },
    { id: 2, type: "order", icon: ShoppingCart, title: "New order received", description: "Order #3847 for $2,399", time: "5 minutes ago", color: "text-emerald-500", bgStyles: "bg-emerald-100 dark:bg-emerald-500/20" },
    { id: 3, type: "order", icon: ShoppingCart, title: "New order received", description: "Order #3847 for $2,399", time: "5 minutes ago", color: "text-emerald-500", bgStyles: "bg-emerald-100 dark:bg-emerald-500/20" }
]

function ActivityFeed() {
  return (
    <div className="h-[39vh] rounded-2xl border transition-all duration-300 bg-white border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <div className="p-6 border-b flex items-center justify-between border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Activity Feed
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Recent System Activities
          </p>
        </div>
        <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">
          View All
        </button>
      </div>

      <div className="p-6">
        <div className="space-y-5">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start space-x-4 px-3 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className={`p-2 rounded-lg shrink-0 ${activity.bgStyles}`}>
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {activity.title}
                  </h4>
                  <p className="text-sm truncate text-slate-600 dark:text-slate-400">
                      {activity.description}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span className="text-xs text-slate-500">
                          {activity.time}
                      </span>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ActivityFeed;