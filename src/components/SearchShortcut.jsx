import React from 'react';
import { Search, Command } from 'lucide-react';

const SearchShortcut = ({ onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-medical-primary hover:bg-medical-primary/5 rounded-lg transition-colors group ${className}`}
    >
      <Search size={18} className="text-gray-400 group-hover:text-medical-primary" />
      <span className="flex-1 text-left text-sm">Recherche rapide</span>
      <div className="flex items-center space-x-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <Command size={10} />
        <span>K</span>
      </div>
    </button>
  );
};

export default SearchShortcut;
