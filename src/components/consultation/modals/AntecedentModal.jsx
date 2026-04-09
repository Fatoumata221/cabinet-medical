import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';

import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import PropTypes from 'prop-types';


const AntecedentModal = ({
  setShowAntecedentModal,
  fetchAntecedents
, patient
, antecedentsRef
}) => {

    const {  showSuccess , showError, showWarning} = useConfirmDialog();
      
    
  
  const [antecedentForm, setAntecedentForm] = useState({
      antecedent_id: '',
      date_decouverte: '',
      commentaires: ''
    });

const saveAntecedent = async () => {
    if (!antecedentForm.antecedent_id) {
      showWarning('Veuillez sélectionner un antécédent');
      return;
    }

    try {
      const { error } = await supabase
        .from('antecedents_patients')
        .insert({
          patient_id: patient.id,
          antecedent_id: parseInt(antecedentForm.antecedent_id),
          date_decouverte: antecedentForm.date_decouverte || null,
          commentaires: antecedentForm.commentaires || null,
          actif: true
        });

      if (error) throw error;
      
      await fetchAntecedents(patient?.id);
      setShowAntecedentModal(false);
      setAntecedentForm({
        antecedent_id: '',
        date_decouverte: '',
        commentaires: ''
      });
      showSuccess('Antécédent ajouté avec succès !');
      setShowAntecedentModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'antécédent:', error);
      showError('Erreur lors de l\'ajout de l\'antécédent: ' + error.message);
    }
  };



return ( 
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un antécédent</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antécédent *
                  </label>
                  <select
                    value={antecedentForm.antecedent_id}
                    onChange={(e) => setAntecedentForm({...antecedentForm, antecedent_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un antécédent</option>
                    {antecedentsRef.map((ant) => (
                      <option key={ant.id} value={ant.id}>
                        {ant.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de découverte
                  </label>
                  <input
                    type="date"
                    value={antecedentForm.date_decouverte}
                    onChange={(e) => setAntecedentForm({...antecedentForm, date_decouverte: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaires
                  </label>
                  <textarea
                    value={antecedentForm.commentaires}
                    onChange={(e) => setAntecedentForm({...antecedentForm, commentaires: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Commentaires sur l'antécédent..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAntecedentModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={saveAntecedent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
        
      )
    };
export default AntecedentModal;

AntecedentModal.propTypes = {
  setShowAntecedentModal: PropTypes.func.isRequired,
  fetchAntecedents: PropTypes.func.isRequired,
  patient: PropTypes.object,
  antecedentsRef: PropTypes.array.isRequired
};