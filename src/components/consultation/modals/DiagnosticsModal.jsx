import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';

import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import PropTypes from 'prop-types';


const DiagnosticsModal = ({
  setShowDiagnosticModal,
  fetchDiagnostics,
  diagnosticsRef,
  id
}) => {

    const {  showSuccess , showError, showWarning} = useConfirmDialog();
      
    
  
 const [diagnosticForm, setDiagnosticForm] = useState({
    diagnostic_id: '',
    certitude: 'probable',
    commentaires: ''
  });

  const saveDiagnostic = async () => {
    console.log('saveDiagnostic appelée avec:', diagnosticForm);
    console.log('Diagnostics disponibles:', diagnosticsRef.length);
    
    if (!diagnosticForm.diagnostic_id) {
      showWarning('Veuillez sélectionner un diagnostic');
      return;
    }

    try {
      const insertData = {
        consultation_id: parseInt(id),
        diagnostic_id: parseInt(diagnosticForm.diagnostic_id),
        certitude: diagnosticForm.certitude,
        commentaires: diagnosticForm.commentaires || null
      };
      
      console.log('Insertion diagnostic avec:', insertData);
      
      const { error } = await supabase
        .from('diagnostics_consultation')
        .insert(insertData);

      console.log('Résultat insertion diagnostic, error:', error);

      if (error) throw error;
      
      await fetchDiagnostics();
      setDiagnosticForm({
        diagnostic_id: '',
        certitude: 'probable',
        commentaires: ''
      });
      showSuccess('Diagnostic ajouté avec succès !');
      setShowDiagnosticModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du diagnostic:', error);
      showError('Erreur lors de l\'ajout du diagnostic: ' + error.message);
    }
  };



return ( 
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un diagnostic</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnostic *
                  </label>
                  <select
                    value={diagnosticForm.diagnostic_id}
                    onChange={(e) => setDiagnosticForm({...diagnosticForm, diagnostic_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un diagnostic</option>
                    {diagnosticsRef.map((diagnostic) => (
                      <option key={diagnostic.id} value={diagnostic.id}>
                        {diagnostic.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certitude
                  </label>
                  <select
                    value={diagnosticForm.certitude}
                    onChange={(e) => setDiagnosticForm({...diagnosticForm, certitude: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="probable">Probable</option>
                    <option value="certain">Certain</option>
                    <option value="possible">Possible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaires
                  </label>
                  <textarea
                    value={diagnosticForm.commentaires}
                    onChange={(e) => setDiagnosticForm({...diagnosticForm, commentaires: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Commentaires sur le diagnostic..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDiagnosticModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={saveDiagnostic}
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
export default DiagnosticsModal;

DiagnosticsModal.propTypes = {
  setShowDiagnosticModal: PropTypes.func.isRequired,
  fetchDiagnostics: PropTypes.func.isRequired,
  diagnosticsRef: PropTypes.array.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};