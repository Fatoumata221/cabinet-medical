import React from 'react';
import { Plus, X } from 'lucide-react';

const ParametrageLayout = ({ 
  title, 
  addButtonText, 
  showForm, 
  onAddClick, 
  onCancelClick, 
  children, 
  itemCount = 0,
  itemName = "éléments"
}) => {
  return (
    <div className="p-6">
      {/* Header avec titre et bouton Ajouter */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {addButtonText && onAddClick && (
          <button
            onClick={onAddClick}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            {addButtonText}
          </button>
        )}
      </div>

      {/* Formulaire (affiché conditionnellement) */}
      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {addButtonText}
            </h2>
            <button
              onClick={onCancelClick}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
};

export default ParametrageLayout;
