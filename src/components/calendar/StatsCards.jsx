import React from 'react'
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  User,
  Zap,
} from 'lucide-react'

const statIcons = {
  'Total RDV': CalendarIcon,
  "Aujourd'hui": ClockIcon,
  'En attente': User,
  Terminés: Zap,
  Urgences: Zap,
}

const StatsCards = ({ stats, animatedStats }) => {
  return (
    <div className="w-full px-3 py-2 sm:px-4">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, index) => {
          const Icon = statIcons[stat.label] || CalendarIcon
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden bg-white/95 backdrop-blur rounded-lg border border-slate-200 px-3 py-2 shadow-sm transition-all duration-200"
              style={{
                transitionDelay: `${index * 50}ms`,
                opacity: animatedStats ? 1 : 0,
                transform: animatedStats ? 'translateY(0)' : 'translateY(5px)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center bg-gradient-to-r ${stat.color} rounded-lg text-white shadow-sm`}
                >
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-600 font-medium truncate">
                    {stat.label}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {stat.value}
                  </h3>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StatsCards
