import React from 'react';
import { supabase } from '../../../lib/supabase';
import { X } from 'lucide-react';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import PropTypes from 'prop-types';


const AppareilsModal = ({
  setShowAppareilModal,
  appareilForm,
  appareilsRef,
  setAppareilForm,
  id,
  fetchExamensAppareils,

}) => {

    const {  showSuccess , showError, showWarning} = useConfirmDialog();
      
    
  
    

 const saveAppareil = async () => {
    if (!appareilForm.appareil_id || !appareilForm.resultat_examen) {
      showWarning('Veuillez sélectionner un appareil et saisir le résultat');
      return;
    }

    try {
      const { error } = await supabase
        .from('examens_appareils')
        .insert({
          consultation_id: parseInt(id),
          appareil_id: parseInt(appareilForm.appareil_id),
          resultat_examen: appareilForm.resultat_examen,
          anomalies_detectees: appareilForm.anomalies_detectees || null,
          recommandations: appareilForm.recommandations || null
        });

      if (error) throw error;
      
      await fetchExamensAppareils();
      setAppareilForm({
        appareil_id: '',
        resultat_examen: '',
        anomalies_detectees: '',
        recommandations: ''
      });
      showSuccess('Examen d\'appareil ajouté avec succès !');
      setShowAppareilModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'examen:', error);
      showError('Erreur lors de l\'ajout de l\'examen: ' + error.message);
    }
  };


return ( 
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Ajouter un examen d&apos;pareil</h3>
                <button
                  onClick={() => setShowAppareilModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appareil *
                  </label>
                  <select
                    value={appareilForm.appareil_id || ''}
                    onChange={(e) => setAppareilForm({...appareilForm, appareil_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={false}
                  >
                    <option value="">Sélectionner un appareil</option>
                    {appareilsRef.map((appareil) => (
                      <option key={appareil.id} value={appareil.id}>
                        {appareil.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Résultat de l&apos;examen *
                  </label>
                  <textarea
                    value={appareilForm.resultat_examen || ''}
                    onChange={(e) => setAppareilForm({...appareilForm, resultat_examen: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    placeholder="Décrivez le résultat de l'examen..."
                    disabled={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anomalies détectées
                  </label>
                  <textarea
                    value={appareilForm.anomalies_detectees || ''}
                    onChange={(e) => setAppareilForm({...appareilForm, anomalies_detectees: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    placeholder="Anomalies observées..."
                    disabled={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommandations
                  </label>
                  <textarea
                    value={appareilForm.recommandations || ''}
                    onChange={(e) => setAppareilForm({...appareilForm, recommandations: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    placeholder="Recommandations suite à l'examen..."
                    disabled={false}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAppareilModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  type="button"
                >
                  Annuler
                </button>
                <button
                  onClick={saveAppareil}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
        
      )
    };
export default AppareilsModal;

AppareilsModal.propTypes = {
  setShowAppareilModal: PropTypes.func.isRequired,
  fetchExamensAppareils: PropTypes.func.isRequired,
  consultation: PropTypes.object.isRequired,
  appareilsRef: PropTypes.array.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setAppareilForm: PropTypes.func.isRequired,
  appareilForm: PropTypes.object.isRequired
};
