import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Composant Section Collapsible
const CollapsibleSection = ({ 
  id, 
  title, 
  icon: Icon, 
  children, 
  isExpanded, 
  onToggle, 
  badge,
  description,
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center flex-1">
          {Icon && <Icon className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />}
          <div className="text-left flex-1">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {title}
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  {badge}
                </span>
              )}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400 transition-transform" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 transition-transform" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;