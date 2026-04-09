import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendNotification, NOTIFICATION_TYPES } from '../../lib/notifications';
import { useConsultationData } from '../../hooks/consultation/useConsultationData';
import { createConsultationFromModele } from '../../services/consultation/referenceDataService';
import ConstantesTab from '../../components/consultation/ConstantesTab';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../contexts/AuthContext';
import ConsultationDentalChart from '../../components/consultation/ConsultationDentalChart';
import PatientDocumentsViewer from '../../components/doctor/PatientDocumentsViewer';
import DevisModal from '../../components/consultation/modals/DevisModal';
import {
  ArrowLeft,
  User,
  Activity,
  Heart,
  Eye,
  Brain,
  FileText,
  Pill,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  Printer,
  Stethoscope,
  FileImage,
  Star,
  X,
  Smile
} from 'lucide-react';
import { generateCertificatsPDF, generateSingleCertificatPDF } from '../../services/impression/certificatPdf';
import { printConsultationReport } from '../../services/impression/rapportConsultationPrint';
import AntecedentsMedicaux from '../../components/consultation/AntecedentsMedicaux';
import ExamenMedicaux from '../../components/consultation/ExamenMedicaux';
import AppareilsTab from '../../components/consultation/AppareilsTab';
import ActesTab from '../../components/consultation/ActesTab';
import OrdonnancesTab from '../../components/consultation/OrdonnancesTab';
import CertificatsTab from '../../components/consultation/CertificatsTab';
import SyntheseTab from '../../components/consultation/SyntheseTab';
import DiagnosticsTab from '../../components/consultation/DiagnosticsTab';

const MockConsultationTestRendu = () => {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromWorkflow = (searchParams.get('from') === 'workflow');
  const waitingQueueId = searchParams.get('waiting_queue_id');

  const { dialogState, showConfirm, showSuccess: showSuccessDialog, closeDialog } = useConfirmDialog();
  const { showError, showWarning } = useAlert();
  const { userProfile, hasRole } = useAuth();

  const id = paramId || searchParams.get('id');

  // Données mock pour le test de rendu
  const mockConsultation = {
    id: 'mock-123',
    date: new Date().toISOString(),
    motif: 'Consultation de test pour rendu',
    medecin_id: userProfile?.id || 'mock-medecin',
    medecin_nom: userProfile?.nom || 'Dr. Test',
    statut: 'en_cours',
    started_at: new Date().toISOString()
  };

  const mockPatient = {
    id: 'mock-patient-123',
    nom: 'MOCK',
    prenom: 'Patient',
    date_naissance: '1990-01-01',
    sexe: 'M',
    telephone: '771234567',
    email: 'mock.patient@example.com',
    adresse: '123 Rue Mock, Dakar',
    profession: 'Profession Test'
  };

  const mockAntecedents = [];
  const mockConstantes = [];
  const mockSignesCliniques = [];
  const mockExamensAppareils = [];
  const mockSyntheses = [];
  const mockAutresSignes = [];
  const mockDiagnostics = [];
  const mockActes = [];
  const mockOrdonnances = [];
  const mockCertificats = [];
  const mockDossierMedical = {
    documentsPatient: []
  };
  const mockReferenceData = {
    antecedentsRef: [],
    constantesRef: [],
    signesCliniquesRef: [],
    examensAppareilsRef: [],
    synthesesRef: [],
    autresSignesRef: [],
    diagnosticsRef: [],
    actesRef: [],
    medicamentsRef: [],
    typesCertificatsRef: []
  };
  const mockModeles = [];
  const mockSyntheseHistorique = [];
  const mockRefetchFunctions = {
    refetchAntecedents: () => {},
    refetchConstantes: () => {},
    refetchSignesCliniques: () => {},
    refetchExamensAppareils: () => {},
    refetchSyntheses: () => {},
    refetchAutresSignes: () => {},
    refetchDiagnostics: () => {},
    refetchActes: () => {},
    refetchOrdonnances: () => {},
    refetchCertificats: () => {},
    refetchSyntheseHistorique: () => {}
  };

  const [syntheseMode, setSyntheseMode] = useState('current');
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsStatus, setDocumentsStatus] = useState('none');
  const [showDevisModal, setShowDevisModal] = useState(false);

  // États pour les modals
  const [showConstanteModal, setShowConstanteModal] = useState(false);
  const [showModeleModal, setShowModeleModal] = useState(false);
  const [showCreateRdvModal, setShowCreateRdvModal] = useState(false);
  const [showExamenDetailsModal, setShowExamenDetailsModal] = useState(false);
  const [selectedExamen, setSelectedExamen] = useState(null);
  const [medecinInfo, setMedecinInfo] = useState(null);
  const [consultationStarted, setConsultationStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(null);
  const [showDentalChart, setShowDentalChart] = useState(false);
  const [showCertificatsModal, setShowCertificatsModal] = useState(false);
  const [showOrdonnanceModal, setShowOrdonnanceModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showSyntheseModal, setShowSyntheseModal] = useState(false);

  // Mock functions
  const calculateAge = (dateNaissance) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleFinishWorkflow = async () => {
    showSuccessDialog('Mock consultation terminée avec succès');
  };

  const handlePrintReport = () => {
    showSuccessDialog('Mock impression du rapport');
  };

  const handleGenerateCertificat = () => {
    showSuccessDialog('Mock génération de certificat');
  };

  const handleCreateOrdonnance = () => {
    showSuccessDialog('Mock création d\'ordonnance');
  };

  const handleAddDiagnostic = () => {
    showSuccessDialog('Mock ajout de diagnostic');
  };

  const handleAddSynthese = () => {
    showSuccessDialog('Mock ajout de synthèse');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  MOCK - Test Rendu Consultation
                </h1>
                <p className="text-sm text-gray-500">
                  {mockPatient.prenom} {mockPatient.nom} • {calculateAge(mockPatient.date_naissance)} ans
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDocumentsModal(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-500 text-white text-sm hover:bg-gray-600 transition-colors"
              >
                <FileImage className="w-4 h-4 mr-1" /> Documents
              </button>
              <button
                onClick={() => setShowDevisModal(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-1" /> Faire un devis
              </button>
              <button
                onClick={handlePrintReport}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                <Printer className="w-4 h-4 mr-1" /> Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Tous les éléments sur une seule page */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Schéma Dentaire - Toujours visible en haut */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-cyan-500" />
              Schéma Dentaire
            </h3>
          </div>
          <div className="p-4">
            <ConsultationDentalChart
              consultationId={mockConsultation.id}
              patientId={mockPatient.id}
              readOnly={false}
            />
          </div>
        </div>

        {/* Grille pour les autres éléments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Antécédents Médicaux */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Heart className="w-4 h-4 mr-2 text-red-500" />
                Antécédents
              </h3>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <AntecedentsMedicaux
                antecedents={mockAntecedents}
                fetchAntecedents={mockRefetchFunctions.refetchAntecedents}
                antecedentsRef={mockReferenceData.antecedentsRef}
                id={mockConsultation.id}
                patient={mockPatient}
              />
            </div>
          </div>

          {/* Constantes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-blue-500" />
                Constantes
              </h3>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <ConstantesTab
                constantes={mockConstantes}
                fetchConstantes={mockRefetchFunctions.refetchConstantes}
                constantesRef={mockReferenceData.constantesRef}
                id={mockConsultation.id}
                patient={mockPatient}
              />
            </div>
          </div>

          {/* Signes Cliniques */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Stethoscope className="w-4 h-4 mr-2 text-green-500" />
                Signes Cliniques
              </h3>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <ExamenMedicaux
                signesCliniques={mockSignesCliniques}
                fetchSignesCliniques={mockRefetchFunctions.refetchSignesCliniques}
                signesCliniquesRef={mockReferenceData.signesCliniquesRef}
                id={mockConsultation.id}
                patient={mockPatient}
              />
            </div>
          </div>

          {/* Examens Appareils */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-purple-500" />
                Examens Appareils
              </h3>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <AppareilsTab
                examensAppareils={mockExamensAppareils}
                fetchExamensAppareils={mockRefetchFunctions.refetchExamensAppareils}
                examensAppareilsRef={mockReferenceData.examensAppareilsRef}
                id={mockConsultation.id}
                patient={mockPatient}
              />
            </div>
          </div>

          {/* Diagnostics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Brain className="w-4 h-4 mr-2 text-indigo-500" />
                Diagnostics
              </h3>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <DiagnosticsTab
                diagnostics={mockDiagnostics}
                fetchDiagnostics={mockRefetchFunctions.refetchDiagnostics}
                diagnosticsRef={mockReferenceData.diagnosticsRef}
                id={mockConsultation.id}
                consultation={mockConsultation}
              />
            </div>
          </div>

          {/* Actes Médicaux */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Stethoscope className="w-4 h-4 mr-2 text-orange-500" />
                Actes Médicaux
              </h3>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <ActesTab
                actes={mockActes}
                fetchActes={mockRefetchFunctions.refetchActes}
                actesRef={mockReferenceData.actesRef}
                id={mockConsultation.id}
                patient={mockPatient}
                consultation={mockConsultation}
              />
            </div>
          </div>

          {/* Ordonnances */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Pill className="w-4 h-4 mr-2 text-teal-500" />
                Ordonnances
              </h3>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <OrdonnancesTab
                ordonnances={mockOrdonnances}
                fetchOrdonnances={mockRefetchFunctions.refetchOrdonnances}
                id={mockConsultation.id}
                medicamentsRef={mockReferenceData.medicamentsRef}
                patient={mockPatient}
                calculateAge={calculateAge}
              />
            </div>
          </div>

          {/* Certificats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Award className="w-4 h-4 mr-2 text-yellow-500" />
                Certificats
              </h3>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <CertificatsTab
                certificats={mockCertificats}
                fetchCertificats={mockRefetchFunctions.refetchCertificats}
                typesCertificatsRef={mockReferenceData.typesCertificatsRef}
                id={mockConsultation.id}
                consultation={mockConsultation}
                patient={mockPatient}
              />
            </div>
          </div>

        </div>

        {/* Synthèse - Pleine largeur en bas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-500" />
              Synthèse
            </h3>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <SyntheseTab
              syntheses={mockSyntheses}
              fetchSyntheses={mockRefetchFunctions.refetchSyntheses}
              synthesesRef={mockReferenceData.synthesesRef}
              id={mockConsultation.id}
              consultation={mockConsultation}
              patient={mockPatient}
              antecedents={mockAntecedents}
              constantes={mockConstantes}
              signesCliniques={mockSignesCliniques}
              examensAppareils={mockExamensAppareils}
              diagnostics={mockDiagnostics}
              ordonnances={mockOrdonnances}
              certificats={mockCertificats}
              syntheseMode={syntheseMode}
              setSyntheseMode={setSyntheseMode}
              syntheseHistorique={mockSyntheseHistorique}
              fetchSyntheseHistorique={mockRefetchFunctions.refetchSyntheseHistorique}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDocumentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileImage className="text-blue-600" size={28} />
                  Documents du patient
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {mockPatient?.prenom} {mockPatient?.nom} - Documents uploadés en salle d&apos;attente
                </p>
              </div>
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <PatientDocumentsViewer
                patient={mockPatient}
                consultationId={mockConsultation?.id || null}
              />
            </div>
          </div>
        </div>
      )}

      {showDevisModal && (
        <DevisModal
          patientId={mockPatient?.id || null}
          patientNom={mockPatient?.nom || 'Patient'}
          patientPrenom={mockPatient?.prenom || 'Inconnu'}
          medecinId={mockConsultation?.medecin_id || null}
          medecinNom={mockConsultation?.medecin_nom || 'Médecin'}
          onClose={() => setShowDevisModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        showCancel={dialogState.showCancel}
      />
    </div>
  );
};

export default MockConsultationTestRendu;
