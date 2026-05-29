import React, { useState } from 'react';
import { CheckCircle, Calendar, X } from 'lucide-react';
import CreateRdvModal from '../doctor/CreateRdvModal';

/**
 * Menu affiché après la création d'un patient : proposer de planifier un RDV ou fermer.
 */
const PatientPostCreateMenu = ({ patient, isOpen, onClose, onRdvSuccess }) => {
  const [showRdvModal, setShowRdvModal] = useState(false);

  if (!isOpen || !patient) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Dossier créé !</h3>
          <p className="text-gray-600 mb-8">
            Le patient <strong>{patient.prenom} {patient.nom}</strong> a été enregistré.
            Souhaitez-vous planifier un rendez-vous ?
          </p>

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => setShowRdvModal(true)}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              Planifier un rendez-vous
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
            >
              Plus tard / Fermer
            </button>
          </div>
        </div>
      </div>

      {showRdvModal && (
        <CreateRdvModal
          isOpen={showRdvModal}
          onClose={() => setShowRdvModal(false)}
          patientId={patient.id}
          isNewPatient
          addToQueueOnCreate={false}
          onSuccess={() => {
            setShowRdvModal(false);
            onRdvSuccess?.();
            onClose();
          }}
        />
      )}
    </>
  );
};

export default PatientPostCreateMenu;
