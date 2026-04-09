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
    <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30">
      <div className="flex flex-col gap-4">
        {stats.map((stat, index) => {
          const Icon = statIcons[stat.label] || CalendarIcon
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden bg-white backdrop-blur-sm rounded-3xl border border-gray-100 p-4 hover:shadow-2xl transition-all duration-500"
              style={{
                transitionDelay: `${index * 100}ms`,
                opacity: animatedStats ? 1 : 0,
                transform: animatedStats ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`p-2 bg-gradient-to-r ${stat.color} rounded-2xl text-white shadow-lg mb-2`}
                >
                  <Icon size={20} />
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </h3>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StatsCards
