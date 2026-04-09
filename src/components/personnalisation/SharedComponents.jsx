import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Info, AlertCircle, Image as ImageIcon } from 'lucide-react';

// ============================================================================
// COMPOSANTS DE MISE EN PAGE
// ============================================================================

export const CollapsibleSection = ({ 
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
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
      <button
        onClick={onToggle}
        className={`w-full px-6 py-5 flex items-center justify-between transition-colors rounded-t-xl ${
            isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center flex-1 gap-4">
          {Icon && (
            <div className={`p-2.5 rounded-lg ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'} transition-colors duration-300`}>
                <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="text-left flex-1">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
              {title}
              {badge && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                  {badge}
                </span>
              )}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-gray-200 rotate-180' : 'bg-transparent'}`}>
            <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 border-t border-gray-100 space-y-6">
            {children}
        </div>
      </div>
    </div>
  );
};

export const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help transition-opacity hover:opacity-80"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl w-64 text-center animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export const StickyActions = ({ children, isVisible = true }) => {
    return (
        <div className="sticky bottom-6 z-40 mx-auto max-w-4xl">
             <div className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-500">
                {children}
             </div>
        </div>
    );
};


// ============================================================================
// COMPOSANTS DE FORMULAIRE (PREMIUM UI)
// ============================================================================

const Label = ({ label, required, tooltip, icon: Icon }) => (
    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        {label}
        {required && <span className="text-red-500">*</span>}
        {tooltip && (
            <Tooltip content={tooltip}>
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
            </Tooltip>
        )}
    </label>
);

const HelperText = ({ text, error }) => {
    if (!text && !error) return null;
    return (
        <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${error ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {error ? <AlertCircle className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
            {text || error}
        </p>
    );
};

export const SettingInput = ({ 
    label, 
    value, 
    onChange, 
    type = "text", 
    placeholder, 
    description, 
    tooltip, 
    required, 
    error,
    icon: Icon,
    leftAddon,
    rightAddon,
    className = ""
}) => (
  <div className={`w-full ${className}`}>
    <Label label={label} required={required} tooltip={tooltip} icon={Icon} />
    
    <div className="relative group transition-all duration-200">
        {leftAddon && (
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                 {leftAddon}
             </div>
        )}
        
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full ${leftAddon ? 'pl-10' : 'pl-4'} ${rightAddon ? 'pr-10' : 'pr-4'} py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block transition-all duration-200 hover:bg-white hover:border-gray-300 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
            placeholder={placeholder}
            required={required}
        />
        
         {rightAddon && (
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                 {rightAddon}
             </div>
        )}
    </div>

    <HelperText text={description} error={error} />
  </div>
);

export const SettingSelect = ({
    label,
    value,
    onChange,
    options = [],
    description,
    tooltip,
    required,
    className = ""
}) => (
    <div className={`w-full ${className}`}>
        <Label label={label} required={required} tooltip={tooltip} />
        
        <div className="relative">
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block transition-all duration-200 hover:bg-white cursor-pointer appearance-none"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500 bg-gray-50 rounded-r-lg border-l border-gray-200">
                <ChevronDown className="w-4 h-4" />
            </div>
        </div>
        
        <HelperText text={description} />
    </div>
);

export const SettingColorPicker = ({ 
    label, 
    value, 
    onChange, 
    description, 
    tooltip 
}) => {
    // Local state to manage input value immediately for smooth UI
    const [localValue, setLocalValue] = useState(value || '#000000');
    // Ref to debounce updating the parent
    const timeoutRef = useRef(null);

    // Sync local state when external value changes (e.g. from initial load or other sources)
    useEffect(() => {
        setLocalValue(value || '#000000');
    }, [value]);

    const handleChange = (newValue) => {
        setLocalValue(newValue);
        
        // Debounce the parent update to avoid lag
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            onChange(newValue);
        }, 100); // 100ms delay is usually enough to feel responsive but prevent excessive rerenders
    };

    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
             <Label label={label} tooltip={tooltip} />
             <div 
                className="w-12 h-6 rounded-md shadow-sm border border-gray-200"
                style={{ backgroundColor: localValue }}
             />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <input
                type="color"
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
              />
              <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 pointer-events-none" />
            </div>
            
            <div className="relative flex-1">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">HEX</span>
                <input
                    type="text"
                    value={localValue}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                    placeholder="#000000"
                    maxLength={7}
                />
            </div>
          </div>
           <HelperText text={description} />
        </div>
    );
};

export const SettingImageUpload = ({
    label,
    value,
    onChange,
    description,
    tooltip,
    placeholder = "URL de l'image..."
}) => {
    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="mb-3">
                <Label label={label} tooltip={tooltip} icon={ImageIcon} />
            </div>
            
            <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-all group-hover:border-blue-200">
                    {value ? (
                        <img src={value} alt="Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                </div>
                
                <div className="flex-1 space-y-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder={placeholder}
                        />
                    </div>
                    {description && <p className="text-xs text-gray-500">{description}</p>}
                    <div className="flex gap-2">
                        <label className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-all shadow-sm">
                            Modifier l'image
                            <input type="file" className="hidden" onChange={() => {/* Logique d'upload à implémenter plus tard */}} />
                        </label>
                        {value && (
                            <button 
                                onClick={() => onChange('')}
                                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                            >
                                Supprimer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SettingSwitch = ({
    label,
    checked,
    onChange,
    description
}) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex-1 pr-4">
            <span className="text-sm font-semibold text-gray-900 block">{label}</span>
            {description && <span className="text-xs text-gray-500 mt-1 block">{description}</span>}
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={checked || false}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    </div>
);
