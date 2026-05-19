import React from 'react';
import { X, Receipt, Pill,  Stethoscope, User, FileText, Clock } from 'lucide-react';
import PropTypes from 'prop-types';
import { getConsultationMotif } from '../../../utils/consultationUtils';
const ConsultationDetailsModal = ({ 
  consultation, 
  workflows, 
  facture, 
  loading, 
  onClose, 
  actions 
}) => {
  if (!consultation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-medical-primary to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold flex items-center">
                <Stethoscope className="w-6 h-6 mr-3" /> Détails de la consultation
              </h3>
              <p className="text-blue-100 mt-1 text-sm">
                {new Date(consultation.date_consultation).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            
            {/* Actions Rapides Header */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={facture ? actions.onEditFacture : actions.onCreateFacture}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{facture ? 'Facture' : 'Créer Facture'}</span>
                </button>

                {workflows.ordonnances.length > 0 && (
                  <button onClick={() => actions.onEditOrdonnance(workflows.ordonnances[0])} className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium">
                    <Pill className="w-4 h-4" /> <span>Ordonnance</span>
                  </button>
                )}
                
                {/* Ajoutez ici les autres boutons (Certificats, Actes, etc.) de manière similaire */}
              </div>
              <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Clock className="w-10 h-10 text-medical-primary animate-spin mr-4" />
              <p className="text-gray-600 text-lg">Chargement des détails...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Info Card */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" /> Informations Patient
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <InfoRow label="Nom complet" value={`${consultation.patients?.prenom} ${consultation.patients?.nom}`} />
                    <InfoRow label="N° Dossier" value={consultation.patients?.numero_dossier} isMono />
                    {/* ... Autres infos patient ... */}
                  </div>
                </div>

                {/* Doctor & Consultation Info */}
                <div className="space-y-4">
                   <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <Stethoscope className="w-5 h-5 mr-2 text-green-600" /> Informations Médecin
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                         <InfoRow label="Médecin" value={`Dr. ${consultation.users?.prenom} ${consultation.users?.nom}`} />
                      </div>
                   </div>
                   
                   <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
                         <h4 className="font-semibold text-gray-900 flex items-center">
                           <FileText className="w-5 h-5 mr-2 text-purple-600" /> Motif
                         </h4>
                      </div>
                      <div className="p-4">
                        <p className="text-gray-700">{getConsultationMotif(consultation) || 'Aucun motif spécifié'}</p>
                      </div>
                   </div>
                </div>
              </div>
              
              {/* Ici vous pouvez ajouter les sections pour afficher les workflows (listes d'ordonnances, actes, etc.) */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Petit composant helper pour les lignes d'info
const InfoRow = ({ label, value, isMono }) => (
  <div className="flex items-start">
    <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">{label} :</span>
    <span className={`text-sm text-gray-900 ${isMono ? 'font-mono' : 'font-medium'}`}>{value || 'Non renseigné'}</span>
  </div>
);
InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  isMono: PropTypes.bool,
};

ConsultationDetailsModal.propTypes = {
  consultation: PropTypes.object.isRequired,
  workflows: PropTypes.object.isRequired,
  facture: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
};


export default ConsultationDetailsModal;