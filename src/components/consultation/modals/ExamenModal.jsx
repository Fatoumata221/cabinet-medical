import React, { useState } from 'react';
import * as consultationService from '../../../services/consultation/consultationService';

import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import PropTypes from 'prop-types';


export const SignModal = ({
  setShowSigneModal,
  id,
  fetchSignesCliniques,
  signesCliniques,
  signesCliniquesRef

}) => {

  const safeSignesCliniques = signesCliniques || [];
  const safeSignesCliniquesRef = signesCliniquesRef || [];
  const {  showSuccess , showError, showWarning} = useConfirmDialog();
      
  const [signeForm, setSigneForm] = useState({
    signe_ids: [], // Array pour sélection multiple
    intensite: 'faible',
    commentaires: ''
  });
  
  const saveSigne = async () => {
    if (!signeForm.signe_ids || signeForm.signe_ids.length === 0) {
      showWarning('Veuillez sélectionner au moins un signe clinique');
      return;
    }

    try {
      const existingSigneIds = safeSignesCliniques.map(s => s.signe_clinique_id);
      const newSigneIds = signeForm.signe_ids.filter(id => !existingSigneIds.includes(parseInt(id)));

      if (newSigneIds.length === 0) {
        showWarning('Tous les signes sélectionnés sont déjà enregistrés');
        setShowSigneModal(false);
        return;
      }

      const signesToInsert = newSigneIds.map(signeId => ({
        consultation_id: parseInt(id),
        signe_clinique_id: parseInt(signeId),
        intensite: null,
        commentaires: null
      }));

      await consultationService.addSignesCliniques(id, signesToInsert);
      
      await fetchSignesCliniques();
      setSigneForm({
        signe_ids: [],
        intensite: 'faible',
        commentaires: ''
      });
      showSuccess(`${newSigneIds.length} signe(s) clinique(s) ajouté(s) avec succès !`);
      setShowSigneModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du signe:', error);
      showError('Erreur lors de l\'ajout du signe: ' + error.message);
    }
  };

  return ( 
        
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter des signes cliniques</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sélectionner les signes cliniques * (plusieurs choix possibles)
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                    {safeSignesCliniquesRef.map((signe) => {
                      const isSelected = signeForm.signe_ids.includes(signe.id.toString());
                      const isAlreadyAdded = safeSignesCliniques.some(s => s.signe_clinique_id === signe.id);
                      
                      return (
                        <label
                          key={signe.id}
                          className={`flex items-center p-2 rounded cursor-pointer ${
                            isSelected ? 'bg-blue-50 border border-blue-300' : 
                            isAlreadyAdded ? 'bg-gray-100 opacity-60' : 
                            'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAlreadyAdded}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSigneForm({
                                  ...signeForm,
                                  signe_ids: [...signeForm.signe_ids, signe.id.toString()]
                                });
                              } else {
                                setSigneForm({
                                  ...signeForm,
                                  signe_ids: signeForm.signe_ids.filter(id => id !== signe.id.toString())
                                });
                              }
                            }}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <span className={`text-sm ${isAlreadyAdded ? 'text-gray-500' : 'text-gray-900'}`}>
                              {signe.nom}
                            </span>
                            {signe.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{signe.description}</p>
                            )}
                            {isAlreadyAdded && (
                              <span className="text-xs text-gray-400 ml-2">(déjà ajouté)</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Les champs Intensité et Commentaires sont masqués. Les signes existants conservent leurs valeurs.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSigneModal(false);
                    setSigneForm({
                      signe_ids: [],
                      intensite: 'faible',
                      commentaires: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={saveSigne}
                  disabled={signeForm.signe_ids.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Ajouter ({signeForm.signe_ids.length})
                </button>
              </div>
            </div>
          </div>
        </div>
        )
    };


SignModal.propTypes = {
  setShowSigneModal: PropTypes.func.isRequired,
  fetchSignesCliniques: PropTypes.func.isRequired,
  signesCliniques: PropTypes.array.isRequired,
  autresSignes: PropTypes.array.isRequired,
  signesCliniquesRef: PropTypes.array.isRequired,
  id: PropTypes.string.isRequired
};


export const OtherSignModal = ({
  setShowAutreSigneModal,
  id,
  fetchAutresSignesCliniques,
  

}) => {

    const {  showSuccess , showError, showWarning} = useConfirmDialog();
  const saveAutreSigne = async (data) => {
    try {
      await consultationService.addAutreSigne(id, data.description);
      
      await fetchAutresSignesCliniques();
      setShowAutreSigneModal(false);
      showSuccess('Signe ajouté avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du signe:', error);
      showError('Erreur lors de l\'ajout du signe');
    }
  };
return ( 
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un autre signe physique</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaires *
                  </label>
                  <textarea
                    id="autreSigneCommentaires"
                    rows="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Saisissez vos commentaires sur le signe physique observé..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAutreSigneModal(false);
                    document.getElementById('autreSigneCommentaires').value = '';
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const commentaires = document.getElementById('autreSigneCommentaires').value;
                    if (commentaires.trim()) {
                      saveAutreSigne({ categorie: null, description: commentaires });
                      document.getElementById('autreSigneCommentaires').value = '';
                    } else {
                      showWarning('Veuillez saisir des commentaires');
                    }
                  }}
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


OtherSignModal.propTypes = {
  setShowAutreSigneModal: PropTypes.func.isRequired,
  fetchAutresSignesCliniques: PropTypes.func.isRequired,
  AutresSignesCliniques: PropTypes.array.isRequired,
  AutresSignesCliniquesRef: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired
};

