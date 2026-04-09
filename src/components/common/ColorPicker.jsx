import React from 'react';
import { HelpCircle } from 'lucide-react';
import Tooltip from './Tooltip';

const ColorPicker = ({ label, field, value, description, tooltip, handleInputChange }) => (
    <div className="group">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        {label}
        {tooltip && (
          <Tooltip content={tooltip}>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </Tooltip>
        )}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-16 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
            title="Cliquez pour choisir une couleur"
          />
          <div 
            className="absolute inset-0 rounded-lg pointer-events-none border-2 border-white shadow-inner"
            style={{ backgroundColor: value || '#000000' }}
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300 font-mono text-sm"
          placeholder="#000000"
        />
        <div 
          className="w-10 h-10 rounded border-2 border-gray-300 shadow-sm transition-transform hover:scale-110"
          style={{ backgroundColor: value || '#000000' }}
          title="Aperçu de la couleur"
        />
      </div>
    </div>
  );

  export default ColorPicker;
