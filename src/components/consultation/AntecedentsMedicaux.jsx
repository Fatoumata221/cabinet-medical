import React, {useState} from 'react';
import { Plus, User } from 'lucide-react';
import * as consultationService from '../../services/consultation/consultationService';
import AntecedentsModal from "./modals/AntecedentModal";
import {useConfirmDialog} from '../../hooks/useConfirmDialog';
import PropTypes from 'prop-types';

const AntecedentsMedicaux = ({ 
  antecedents,
  fetchAntecedents,
  antecedentsRef,
  patient

}) => {
  // State
  const [showAntecedentModal, setShowAntecedentModal] = useState(false);

     const {  showSuccess , showError, } = useConfirmDialog();
 
     console.log('AntecedentsMedicaux rendered with antecedents:', antecedents);

 const handleAddAntecedent = () => {
    setShowAntecedentModal(true);
  };

 const toggleAntecedentStatus = async (antecedentId, currentStatus) => {
    try {
      const newStatus = await consultationService.toggleAntecedentStatus(antecedentId, currentStatus);
      await fetchAntecedents(patient?.id);
      showSuccess(`Antécédent marqué comme ${newStatus ? 'actif' : 'inactif'} !`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      showError('Erreur lors de la mise à jour du statut de l\'antécédent');
    }
  };

  return (
    <>
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Antécédents médicaux
        </h2>
        <button
          onClick={handleAddAntecedent}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </button>
      </div>

      {antecedents.length > 0 ? (
        <div className="space-y-3">
          {antecedents.map((antecedent) => (
            <div
              key={antecedent.id}
              className={`border rounded-lg p-4 ${
                !antecedent.actif ? 'bg-red-50 border-red-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className={`font-medium ${
                      antecedent.actif ? 'text-gray-900' : 'text-red-900'
                    }`}
                  >
                    {antecedent.antecedents?.nom}
                  </h3>

                  <p
                    className={`text-sm mt-1 ${
                      antecedent.actif ? 'text-gray-600' : 'text-red-700'
                    }`}
                  >
                    {antecedent.antecedents?.description}
                  </p>

                  {antecedent.date_decouverte && (
                    <p
                      className={`text-xs mt-1 ${
                        antecedent.actif ? 'text-gray-500' : 'text-red-600'
                      }`}
                    >
                      Découvert le :{' '}
                      {new Date(
                        antecedent.date_decouverte
                      ).toLocaleDateString('fr-FR')}
                    </p>
                  )}

                  {antecedent.commentaires && (
                    <p
                      className={`text-sm mt-2 ${
                        antecedent.actif ? 'text-gray-700' : 'text-red-800'
                      }`}
                    >
                      {antecedent.commentaires}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      antecedent.actif
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {antecedent.actif ? 'Actif' : 'Inactif'}
                  </span>

                  <button
                    onClick={() =>
                      toggleAntecedentStatus(
                        antecedent.id,
                        antecedent.actif
                      )
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      antecedent.actif
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-200 text-green-700 hover:bg-green-300'
                    }`}
                    title={
                      antecedent.actif
                        ? 'Marquer comme inactif'
                        : 'Marquer comme actif'
                    }
                  >
                    {antecedent.actif ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucun antécédent
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Aucun antécédent médical enregistré pour ce patient.
          </p>
        </div>
      )}
    </div>
    { showAntecedentModal && (
      <AntecedentsModal
    setShowAntecedentModal={setShowAntecedentModal}
    fetchAntecedents={fetchAntecedents}
    patient={patient}
    antecedentsRef={antecedentsRef}
    />
    )}
    </>
  );
};

export default AntecedentsMedicaux;

AntecedentsMedicaux.propTypes = {
  antecedents: PropTypes.array.isRequired,
  fetchAntecedents: PropTypes.func.isRequired,
  antecedentsRef: PropTypes.object,
  setShowAntecedentModal: PropTypes.func.isRequired,
  patient: PropTypes.object
};