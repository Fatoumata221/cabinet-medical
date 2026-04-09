import React from 'react';

const ParametrageList = ({ 
  title, 
  itemCount, 
  itemName = "éléments",
  children,
  emptyMessage = "Aucun élément enregistré. Cliquez sur le bouton Ajouter pour commencer."
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {title} ({itemCount})
        </h3>
      </div>
      {children}
      {itemCount === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default ParametrageList;
