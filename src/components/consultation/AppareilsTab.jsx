import React, { useState } from 'react';
import { Plus, Heart, Eye } from 'lucide-react';
import PropTypes from 'prop-types';
import { supabase } from '../../lib/supabase';
import AppareilsModal from './modals/AppareilsModal';

export default function AppareilsTab(
  {examensAppareils, 
  setSelectedExamen,
  setShowExamenDetailsModal,
  consultation,
  setMedecinInfo,
  fetchExamensAppareils
  ,appareilsRef,
  isTerminated = false
  }
) {
  


  const [showAppareilModal, setShowAppareilModal] = useState(false)
  
      const [appareilForm, setAppareilForm] = useState({
    appareil_id: '',
    resultat_examen: '',
    anomalies_detectees: '',
    recommandations: ''
  });

  const handleAddAppareil = () => {
    // Réinitialiser le formulaire à l'ouverture du modal
    setAppareilForm({
      appareil_id: '',
      resultat_examen: '',
      anomalies_detectees: '',
      recommandations: ''
    });
    setShowAppareilModal(true);
  };

  return (
    <>
     <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Examens des appareils</h2>
          {!isTerminated && (
            <button 
              onClick={handleAddAppareil}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </button>
          )}
        </div>
    
        {examensAppareils.length > 0 ? (
          <div className="space-y-4">
            {examensAppareils.map((examen) => (
              <div key={examen.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {examen.appareils?.nom}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {examen.appareils?.description}
                    </p>
    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Résultat de l&apos;examen</h4>
                        <p className="text-sm text-gray-900 mt-1">
                          {examen.resultat_examen}
                        </p>
                      </div>
    
                      {examen.anomalies_detectees && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Anomalies détectées</h4>
                          <p className="text-sm text-red-600 mt-1">
                            {examen.anomalies_detectees}
                          </p>
                        </div>
                      )}
    
                      {examen.recommandations && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Recommandations</h4>
                          <p className="text-sm text-gray-900 mt-1">
                            {examen.recommandations}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setSelectedExamen(examen);
                      // Récupérer les informations du médecin
                      if (consultation?.medecin_id) {
                        const { data: medecinData } = await supabase
                          .from('users')
                          .select('nom, prenom, specialite')
                          .eq('id', consultation.medecin_id)
                          .single();
                        setMedecinInfo(medecinData);
                      }
                      setShowExamenDetailsModal(true);
                    }}
                    className="ml-4 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                    title="Voir les détails de l'examen"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun examen d&apos;
              appareil</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun examen d&apos;pareil n&apos; été effectué lors de cette consultation.
            </p>
          </div>
        )}
      </div>
      {showAppareilModal && (
        <AppareilsModal
          setShowAppareilModal={setShowAppareilModal}
          appareilForm={appareilForm}
          appareilsRef={appareilsRef}
          setAppareilForm={setAppareilForm}
          id={consultation.id}
          fetchExamensAppareils={fetchExamensAppareils}
        />
      )}  
    </>
     
    )};

    AppareilsTab.propTypes = {
  examensAppareils: PropTypes.array.isRequired,
  setSelectedExamen: PropTypes.func.isRequired,
  setShowExamenDetailsModal: PropTypes.func.isRequired,
  consultation: PropTypes.object.isRequired,
  setMedecinInfo: PropTypes.func.isRequired,
  fetchExamensAppareils: PropTypes.func.isRequired
  ,appareilsRef: PropTypes.array.isRequired
    };

 
