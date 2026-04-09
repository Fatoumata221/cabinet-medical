import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';

import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import PropTypes from 'prop-types';


const SyntheseModal = ({
  setShowSyntheseModal,
  fetchSyntheses,
  id,
  elementsSyntheseRef
}) => {

    const {  showSuccess , showError, showWarning} = useConfirmDialog();
      
    
  
 const [syntheseForm, setSyntheseForm] = useState({
    element_id: '',
    commentaires: ''
  });
 
 const saveSynthese = async () => {
    console.log('saveSynthese appelée');
    console.log('syntheseForm:', syntheseForm);
    
    if (!syntheseForm.element_id) {
      showWarning('Veuillez sélectionner un élément de synthèse');
      return;
    }

    try {
      console.log('Insertion synthèse avec:', {
        consultation_id: parseInt(id),
        element_synthese_id: parseInt(syntheseForm.element_id),
        commentaires: syntheseForm.commentaires || null
      });
      
      const { error } = await supabase
        .from('syntheses_consultation')
        .insert({
          consultation_id: parseInt(id),
          element_synthese_id: parseInt(syntheseForm.element_id),
          commentaires: syntheseForm.commentaires || null
        });

      console.log('Résultat insert synthèse, error:', error);
      
      if (error) throw error;
      
      await fetchSyntheses();
      setSyntheseForm({
        element_id: '',
        commentaires: ''
      });
      showSuccess('Synthèse enregistrée avec succès !');
      setShowSyntheseModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la synthèse:', error);
      showError('Erreur lors de l\'ajout de la synthèse: ' + error.message);
    }
  };





return ( 
             <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un élément de synthèse</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Élément de synthèse *
                  </label>
                  <select
                    value={syntheseForm.element_id}
                    onChange={(e) => setSyntheseForm({...syntheseForm, element_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un élément</option>
                    {elementsSyntheseRef.map((element) => (
                      <option key={element.id} value={element.id}>
                        {element.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaires
                  </label>
                  <textarea
                    value={syntheseForm.commentaires}
                    onChange={(e) => setSyntheseForm({...syntheseForm, commentaires: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Commentaires sur cet élément de synthèse..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSyntheseModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={saveSynthese}
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
export default SyntheseModal;

SyntheseModal.propTypes = {
  setShowSyntheseModal: PropTypes.func.isRequired,
  fetchSyntheses: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  elementsSyntheseRef: PropTypes.array.isRequired
};