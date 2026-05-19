import React, { useState, useEffect } from 'react';
import { useConsultations } from '../../hooks/consultation/useConsultations';
import { supabase } from '../../lib/supabase';
import transfertDossierService from '../../services/transfertDossierService';
import { useAlert } from '../../contexts/AlertContext';
import { getConsultationMotif } from '../../utils/consultationUtils';
import { X, CheckCircle, ArrowRight, ArrowLeft, FileText, Building2, Hospital, User, Save } from 'lucide-react';

/**
 * Modal de transfert de dossier médical
 * 3 étapes :
 * 1. Sélection du destinataire (cabinet/hôpital/médecin)
 * 2. Sélection des données à transférer
 * 3. Motif et notes
 */
const TransfertDossierModal = ({
  isOpen,
  onClose,
  patient,
  consultationId = null,
  onSuccess
}) => {
  const { showError, showSuccess, showWarning } = useAlert();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const { consultations } = useConsultations({ patientId: patient?.id }); // Use the hook
  const [selectedConsultations, setSelectedConsultations] = useState([]);

  // Étape 1 : Informations du destinataire
  const [destinataire, setDestinataire] = useState({
    type_destinataire: 'cabinet',
    nom_destinataire: '',
    adresse_destinataire: '',
    telephone_destinataire: '',
    email_destinataire: '',
    medecin_destinataire: ''
  });

  // Étape 2 : Sélection des données
  const [donneesSelectionnees, setDonneesSelectionnees] = useState({
    consultations: true,
    documents: true,
    antecedents: true,
    constantes: true,
    diagnostics: true,
    ordonnances: true,
    certificats: true,
    actes: false
  });

  // Étape 3 : Motif et notes
  const [motif, setMotif] = useState('');
  const [notes, setNotes] = useState('');



  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setDestinataire({
        type_destinataire: 'cabinet',
        nom_destinataire: '',
        adresse_destinataire: '',
        telephone_destinataire: '',
        email_destinataire: '',
        medecin_destinataire: ''
      });
      setDonneesSelectionnees({
        consultations: true,
        documents: true,
        antecedents: true,
        constantes: true,
        diagnostics: true,
        ordonnances: true,
        certificats: true,
        actes: false
      });
      setMotif('');
      setNotes('');
      setSelectedConsultations([]);
    }
  }, [isOpen]);



  const handleNextStep = () => {
    // Validation étape 1
    if (currentStep === 1) {
      if (!destinataire.nom_destinataire.trim()) {
        showWarning('Veuillez renseigner le nom du destinataire');
        return;
      }
      if (!destinataire.adresse_destinataire.trim()) {
        showWarning('Veuillez renseigner l\'adresse du destinataire');
        return;
      }
      if (destinataire.type_destinataire === 'medecin' && !destinataire.medecin_destinataire.trim()) {
        showWarning('Veuillez renseigner le nom du médecin destinataire');
        return;
      }
    }

    // Validation étape 2
    if (currentStep === 2) {
      const auMoinsUneDonnee = Object.values(donneesSelectionnees).some(v => v === true);
      if (!auMoinsUneDonnee) {
        showWarning('Veuillez sélectionner au moins un type de données à transférer');
        return;
      }
    }

    // Validation étape 3
    if (currentStep === 3) {
      if (!motif.trim()) {
        showWarning('Veuillez renseigner le motif du transfert');
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Préparer les données du transfert
      const transfertData = {
        patient_id: patient.id,
        consultation_id: consultationId,
        type_destinataire: destinataire.type_destinataire,
        nom_destinataire: destinataire.nom_destinataire.trim(),
        adresse_destinataire: destinataire.adresse_destinataire.trim(),
        telephone_destinataire: destinataire.telephone_destinataire.trim() || null,
        email_destinataire: destinataire.email_destinataire.trim() || null,
        medecin_destinataire: destinataire.medecin_destinataire.trim() || null,
        motif_transfert: motif.trim(),
        notes: notes.trim() || null,
        donnees_transferees: {
          ...donneesSelectionnees,
          consultationIds: donneesSelectionnees.consultations && selectedConsultations.length > 0 
            ? selectedConsultations 
            : null
        },
        statut: 'en_preparation'
      };

      // Créer le transfert
      const transfert = await transfertDossierService.creerTransfert(transfertData);

      // Générer le document
      showSuccess('Transfert créé. Génération du document en cours...');
      const documentUrl = await transfertDossierService.genererDocumentTransfert(transfert.id);

      showSuccess('Transfert de dossier créé avec succès !');
      
      if (onSuccess) {
        onSuccess(transfert);
      }

      onClose();
    } catch (error) {
      console.error('Erreur lors de la création du transfert:', error);
      showError('Erreur lors de la création du transfert: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const toggleDonnee = (key) => {
    setDonneesSelectionnees(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleConsultation = (consultationId) => {
    setSelectedConsultations(prev => {
      if (prev.includes(consultationId)) {
        return prev.filter(id => id !== consultationId);
      } else {
        return [...prev, consultationId];
      }
    });
  };

  const toggleAllConsultations = () => {
    if (selectedConsultations.length === consultations.length) {
      setSelectedConsultations([]);
    } else {
      setSelectedConsultations(consultations.map(c => c.id));
    }
  };

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Destinataire', description: 'Informations du destinataire' },
    { id: 2, title: 'Données', description: 'Sélection des données à transférer' },
    { id: 3, title: 'Motif', description: 'Motif et notes du transfert' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Transfert de dossier médical
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stepper */}
            <div className="mt-6 flex flex-col md:flex-row md:items-start md:space-x-4 space-y-4 md:space-y-0">
              {steps.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                return (
                  <div key={step.id} className="flex items-start md:flex-1 gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        isCurrent
                          ? 'border-blue-600 text-blue-600'
                          : isCompleted
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : step.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500 leading-4">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Étape 1 : Destinataire */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Informations du destinataire</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de destinataire *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setDestinataire(prev => ({ ...prev, type_destinataire: 'cabinet' }))}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center ${
                        destinataire.type_destinataire === 'cabinet'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Building2 className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Cabinet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinataire(prev => ({ ...prev, type_destinataire: 'hopital' }))}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center ${
                        destinataire.type_destinataire === 'hopital'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Hospital className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Hôpital</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinataire(prev => ({ ...prev, type_destinataire: 'medecin' }))}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center ${
                        destinataire.type_destinataire === 'medecin'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <User className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Médecin</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom {destinataire.type_destinataire === 'medecin' ? 'du médecin' : 'du ' + destinataire.type_destinataire} *
                  </label>
                  <input
                    type="text"
                    value={destinataire.nom_destinataire}
                    onChange={(e) => setDestinataire(prev => ({ ...prev, nom_destinataire: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {destinataire.type_destinataire === 'medecin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du médecin destinataire *
                    </label>
                    <input
                      type="text"
                      value={destinataire.medecin_destinataire}
                      onChange={(e) => setDestinataire(prev => ({ ...prev, medecin_destinataire: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <textarea
                    value={destinataire.adresse_destinataire}
                    onChange={(e) => setDestinataire(prev => ({ ...prev, adresse_destinataire: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={destinataire.telephone_destinataire}
                      onChange={(e) => setDestinataire(prev => ({ ...prev, telephone_destinataire: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={destinataire.email_destinataire}
                      onChange={(e) => setDestinataire(prev => ({ ...prev, email_destinataire: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Étape 2 : Sélection des données */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Sélection des données à transférer</h4>
                
                <div className="space-y-3">
                  {[
                    { key: 'consultations', label: 'Consultations', icon: FileText },
                    { key: 'documents', label: 'Documents patients', icon: FileText },
                    { key: 'antecedents', label: 'Antécédents', icon: FileText },
                    { key: 'constantes', label: 'Constantes médicales', icon: FileText },
                    { key: 'diagnostics', label: 'Diagnostics', icon: FileText },
                    { key: 'ordonnances', label: 'Ordonnances', icon: FileText },
                    { key: 'certificats', label: 'Certificats médicaux', icon: FileText },
                    { key: 'actes', label: 'Actes médicaux', icon: FileText }
                  ].map(({ key, label, icon: Icon }) => (
                    <label
                      key={key}
                      className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={donneesSelectionnees[key] || false}
                        onChange={() => toggleDonnee(key)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Icon className="w-5 h-5 ml-3 text-gray-600" />
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>

                {donneesSelectionnees.consultations && consultations.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Consultations à inclure ({selectedConsultations.length} / {consultations.length})
                      </label>
                      <button
                        type="button"
                        onClick={toggleAllConsultations}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {selectedConsultations.length === consultations.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {consultations.map(consultation => (
                        <label
                          key={consultation.id}
                          className="flex items-center p-2 border rounded cursor-pointer hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={selectedConsultations.includes(consultation.id)}
                            onChange={() => toggleConsultation(consultation.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {new Date(consultation.date_consultation).toLocaleDateString('fr-FR')} - 
                            {getConsultationMotif(consultation) || 'Sans motif'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Étape 3 : Motif et notes */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Motif et notes du transfert</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif du transfert *
                  </label>
                  <textarea
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Ex: Demande du patient, orientation spécialisée, deuxième avis..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes additionnelles (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Informations complémentaires..."
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Résumé du transfert :</strong>
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Patient: {patient?.prenom} {patient?.nom}</li>
                    <li>Destinataire: {destinataire.nom_destinataire} ({destinataire.type_destinataire})</li>
                    <li>Données sélectionnées: {Object.values(donneesSelectionnees).filter(v => v).length} type(s)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Footer avec boutons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={currentStep === 1 ? onClose : handlePreviousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? 'Annuler' : 'Précédent'}
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Créer le transfert
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransfertDossierModal;

