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

const StatsCards = ({
  stats,
  animatedStats,
  compact = false,
  onStatClick,
  activeStatLabel,
}) => {
  return (
    <div className={`w-full ${compact ? 'px-1 py-1' : 'px-3 py-2 sm:px-4'}`}>
      <div className={`grid grid-cols-3 ${compact ? 'gap-1' : 'gap-2'}`}>
        {stats.map((stat, index) => {
          const Icon = statIcons[stat.label] || CalendarIcon
          const handleClick = onStatClick?.[stat.label]
          const Wrapper = handleClick ? 'button' : 'div'
          return (
            <Wrapper
              key={stat.label}
              type={handleClick ? 'button' : undefined}
              onClick={handleClick || undefined}
              title={stat.label}
              className={`relative overflow-hidden bg-white/95 backdrop-blur rounded-lg border border-slate-200 shadow-sm transition-all duration-200 text-left w-full ${
                compact ? 'px-2 py-1.5' : 'px-3 py-2'
              } ${
                handleClick
                  ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : ''
              } ${activeStatLabel === stat.label ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                transitionDelay: `${index * 50}ms`,
                opacity: animatedStats ? 1 : 0,
                transform: animatedStats ? 'translateY(0)' : 'translateY(5px)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center bg-gradient-to-r ${stat.color} rounded-lg text-white shadow-sm ${
                    compact ? 'h-6 w-6' : 'h-8 w-8'
                  }`}
                >
                  <Icon size={compact ? 12 : 14} />
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
            </Wrapper>
          )
        })}
      </div>
    </div>
  )
}

export default StatsCards
