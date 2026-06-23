import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * Composant Select avec recherche intégrée
 * @param {Array} options - Liste des options [{id, label, ...}]
 * @param {string} value - Valeur sélectionnée (ID)
 * @param {function} onChange - Callback lors de la sélection
 * @param {string} placeholder - Texte placeholder
 * @param {string} searchPlaceholder - Texte placeholder pour la recherche
 * @param {string} label - Label du champ
 * @param {boolean} required - Champ obligatoire
 * @param {function} renderOption - Fonction personnalisée pour rendre une option
 * @param {string} emptyMessage - Message si aucun résultat
 */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  label = '',
  required = false,
  renderOption = null,
  emptyMessage = 'Aucun résultat trouvé',
  maxHeight = 'max-h-60', // Hauteur de la liste défilante
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les options selon la recherche
  const filteredOptions = options.filter(option => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return option.label?.toLowerCase().includes(searchLower) ||
           option.nom?.toLowerCase().includes(searchLower) ||
           option.prenom?.toLowerCase().includes(searchLower) ||
           option.telephone?.includes(searchTerm) ||
           option.email?.toLowerCase().includes(searchLower);
  });

  // Focus sur l'input de recherche quand on ouvre le dropdown
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    console.log('🔍 [SearchableSelect] isOpen changed:', isOpen, 'filteredOptions:', filteredOptions.length);
  }, [isOpen, filteredOptions.length]);

  // Trouver l'option sélectionnée
  const selectedOption = options.find(opt => {
    if (value === '' || value === null || value === undefined) {
      return opt.id === '' || opt.id === null || opt.id === undefined;
    }
    return opt.id === value || String(opt.id) === String(value) || opt.id === parseInt(value, 10);
  });

  // Gérer la sélection
  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Réinitialiser la sélection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  // Rendu par défaut d'une option
  const defaultRenderOption = (option) => (
    <div className="flex flex-col">
      <span className="font-medium text-gray-900">
        {option.label || `${option.prenom || ''} ${option.nom || ''}`.trim()}
      </span>
      {(option.telephone || option.email) && (
        <span className="text-xs text-gray-500">
          {option.telephone || option.email}
        </span>
      )}
    </div>
  );

  const optionRenderer = renderOption || defaultRenderOption;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Bouton de sélection */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          console.log('🔍 [SearchableSelect] Click detected, disabled:', disabled, 'current isOpen:', isOpen);
          if (!disabled) {
            setIsOpen(!isOpen);
            console.log('🔍 [SearchableSelect] New isOpen state:', !isOpen);
          }
        }}
        className={`w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent transition-colors ${
          isOpen ? 'border-medical-primary ring-2 ring-medical-primary' : 'border-gray-300'
        } ${!selectedOption ? 'text-gray-400' : 'text-gray-900'} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white'}`}
      >
        <div className="flex items-center justify-between">
          <span className="truncate">
            {selectedOption 
              ? (selectedOption.label || `${selectedOption.prenom || ''} ${selectedOption.nom || ''}`.trim())
              : placeholder
            }
          </span>
          <div className="flex items-center space-x-1">
            {selectedOption && (
              <X 
                className="w-4 h-4 text-gray-400 hover:text-gray-600" 
                onClick={handleClear}
              />
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Dropdown avec recherche */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Champ de recherche */}
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Liste des options */}
          <div className={`${maxHeight} overflow-y-auto`}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    option.id === value ? 'bg-blue-50 border-l-4 border-l-medical-primary' : ''
                  }`}
                >
                  {optionRenderer(option)}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                {emptyMessage}
              </div>
            )}
          </div>

          {/* Footer avec compteur */}
          {filteredOptions.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
              {filteredOptions.length} résultat{filteredOptions.length > 1 ? 's' : ''} trouvé{filteredOptions.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
