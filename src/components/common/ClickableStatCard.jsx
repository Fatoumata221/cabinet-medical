import React from 'react'

const TONE_STYLES = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    value: 'text-blue-600',
    label: 'text-blue-600',
    labelMuted: 'text-blue-700',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    value: 'text-green-600',
    label: 'text-green-600',
    labelMuted: 'text-green-700',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    value: 'text-yellow-600',
    label: 'text-yellow-600',
    labelMuted: 'text-yellow-700',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'text-orange-600',
    value: 'text-orange-900',
    label: 'text-orange-700',
    labelMuted: 'text-orange-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    value: 'text-red-600',
    label: 'text-red-600',
    labelMuted: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    value: 'text-purple-900',
    label: 'text-purple-700',
    labelMuted: 'text-purple-700',
  },
}

const ClickableStatCard = ({
  tone = 'blue',
  icon: Icon,
  label,
  value,
  onClick,
  active = false,
  disabled = false,
  title,
  size = 'md',
  bordered = false,
  className = '',
  children,
}) => {
  const styles = TONE_STYLES[tone] || TONE_STYLES.blue
  const interactive = Boolean(onClick) && !disabled
  const Wrapper = interactive ? 'button' : 'div'

  const sizeClass =
    size === 'sm'
      ? 'rounded p-2 text-center w-full'
      : 'rounded-lg p-4 w-full'

  const hoverClass = interactive
    ? 'cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-medical-primary/30 focus:outline-none focus:ring-2 focus:ring-medical-primary'
    : ''

  const activeClass = active ? 'ring-2 ring-medical-primary shadow-md' : ''

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      disabled={interactive ? disabled : undefined}
      title={title || label}
      className={`${styles.bg} ${sizeClass} ${bordered ? `border ${styles.border}` : ''} ${hoverClass} ${activeClass} ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      } ${size === 'md' && interactive ? 'text-left' : ''} ${className}`}
    >
      {children || (
        <div
          className={`flex items-center ${size === 'sm' ? 'flex-col gap-0.5' : ''}`}
        >
          {Icon && (
            <Icon
              className={`${styles.icon} flex-shrink-0 ${
                size === 'sm' ? 'w-4 h-4' : 'w-6 h-6 mr-3'
              }`}
            />
          )}
          <div className={size === 'sm' ? '' : 'min-w-0'}>
            <p
              className={`font-bold ${styles.value} ${
                size === 'sm' ? 'text-lg leading-none' : 'text-2xl'
              }`}
            >
              {value}
            </p>
            <p
              className={`${size === 'sm' ? 'text-xs' : 'text-sm'} ${
                size === 'sm' ? styles.label : styles.labelMuted
              }`}
            >
              {label}
            </p>
          </div>
        </div>
      )}
    </Wrapper>
  )
}

export default ClickableStatCard
