import { Clock, ShoppingCart, User } from 'lucide-react'
import React from 'react'
import { useOutletContext } from 'react-router-dom'

const activities = [
    {
        id: 1,
        type: "user",
        icon: User,
        title: "New user registered",
        description: "John Smith created an account",
        time: "2 minutes ago",
        color: "text-blue-500",
        lightBg: "bg-blue-100",
        darkBg: "bg-blue-500/20"
    },
    {
        id: 2,
        type: "order",
        icon: ShoppingCart,
        title: "New order received",
        description: "Order #3847 for $2,399",
        time: "5 minutes ago",
        color: "text-emerald-500",
        lightBg: "bg-emerald-100",
        darkBg: "bg-emerald-500/20"
    },
    {
        id: 3,
        type: "order",
        icon: ShoppingCart,
        title: "New order received",
        description: "Order #3847 for $2,399",
        time: "5 minutes ago",
        color: "text-emerald-500",
        lightBg: "bg-emerald-100",
        darkBg: "bg-emerald-500/20"
    }
]

function ActivityFeed() {
  const { darkMode } = useOutletContext();

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${
      darkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className={`p-6 border-b flex items-center justify-between ${
        darkMode ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Activity Feed
          </h3>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
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
              className={`flex items-start space-x-4 px-3 rounded-xl transition-colors ${
                darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                        darkMode ? activity.darkBg : activity.lightBg
                    }`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {activity.title}
                    </h4>
                    <p className={`text-sm truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {activity.description}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                        <Clock className={`w-3 h-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
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