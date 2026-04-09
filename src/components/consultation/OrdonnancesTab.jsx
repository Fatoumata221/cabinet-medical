import React, { useState } from 'react';
import { Plus, Pill } from 'lucide-react';
import PropTypes from 'prop-types';
import OrdonnanceModal from './modals/OrdonnancesModal';

export default function OrdonnancesTab({
  ordonnances,
  id,
  fetchOrdonnances,
  patient,
  calculateAge,
  medicamentsRef

}) {
  // Handlers détectés et injectés automatiquement
  const [showOrdonnanceModal, setShowOrdonnanceModal] = useState(false)
  const handleAddOrdonnance = () => {
    setShowOrdonnanceModal(true);
  };


  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Ordonnances</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleAddOrdonnance}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Créer
            </button>
          </div>
        </div>
    
        {ordonnances.length > 0 ? (
          <div className="space-y-4">
            {ordonnances.map((ordonnance) => (
              <div key={ordonnance.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Ordonnance {ordonnance.numero_ordonnance}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(ordonnance.date_prescription).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ordonnance.statut === 'active' ? 'bg-green-100 text-green-800' :
                      ordonnance.statut === 'terminee' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ordonnance.statut}
                    </span>
                  </div>
                </div>
    
                {ordonnance.instructions_generales && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Recommandations:</p>
                    <p className="text-sm text-gray-700 italic bg-yellow-50 p-2 rounded">
                    {ordonnance.instructions_generales}
                  </p>
                  </div>
                )}
    
                {ordonnance.lignes_ordonnance && ordonnance.lignes_ordonnance.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Médicaments prescrits:</h4>
                    {ordonnance.lignes_ordonnance.map((ligne) => (
                      <div key={ligne.id} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {ligne.medicaments?.nom}
                            </p>
                            <p className="text-sm text-gray-600">
                              {ligne.posologie}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Qté: {ligne.quantite}
                            </p>
                            {ligne.duree_traitement && (
                              <p className="text-sm text-gray-600">
                                Durée: {ligne.duree_traitement} jours
                              </p>
                            )}
                          </div>
                        </div>
                        {ligne.instructions_particulieres && (
                          <p className="text-sm text-gray-700 mt-2">
                            {ligne.instructions_particulieres}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Pill className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune ordonnance</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucune ordonnance n&apos;a été prescrite lors de cette consultation.
            </p>
          </div>
        )}
      </div>
      
      {showOrdonnanceModal && (
        <OrdonnanceModal
        
          setShowOrdonnanceModal={setShowOrdonnanceModal}
          id={id}
          fetchOrdonnances={fetchOrdonnances}
          patient={patient}
          calculateAge={calculateAge}
          medicamentsRef={medicamentsRef}

          />
      )}

    </>
    
    
    )}
OrdonnancesTab.propTypes = {
  ordonnances: PropTypes.array.isRequired,
  id: PropTypes.number.isRequired,
  fetchOrdonnances: PropTypes.func.isRequired,  
  patient: PropTypes.object.isRequired,
  calculateAge: PropTypes.func.isRequired,
  medicamentsRef: PropTypes.array.isRequired
};

