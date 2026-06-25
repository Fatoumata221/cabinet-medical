import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AccessDenied from './components/AccessDenied';
import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './utils/permissions';

// Composant de chargement optimisé
const LoadingSpinner = ({ message = "Chargement..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-700 font-medium">{message}</p>
      <p className="text-gray-500 text-sm mt-1">Optimisation en cours...</p>
    </div>
  </div>
);

// Composant Dashboard intelligent qui redirige selon le rôle
const SmartDashboard = () => {
  const { hasRole, userProfile, isLoading, currentUser } = useAuth();
  
  // Attendre que l'authentification soit chargée
  if (isLoading) {
    return <LoadingSpinner message="Vérification des permissions..." />;
  }
  
  // Si pas d'utilisateur connecté, rediriger vers login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Utiliser le profil ou les métadonnées utilisateur comme fallback
  const role = userProfile?.role || currentUser?.user_metadata?.role || currentUser?.app_metadata?.role;
  
  if (role === ROLES.ADMIN) {
    return <Dashboard />;
  } else if (role === ROLES.DOCTOR) {
    return <Navigate to="/dashboard" replace />;
  } else if (role === ROLES.SECRETARY) {
    return <Navigate to="/secretary" replace />;
  } else {
    return <Dashboard />;
  }
};

// ============================================================================
// LAZY LOADING DES COMPOSANTS POUR OPTIMISER LE DÉMARRAGE
// ============================================================================

// Pages principales (chargement prioritaire)
const CalendarPage = lazy(() => import('./components/Calendar'));
const TestSimple = lazy(() => import('./pages/TestSimple'));
const TestAuth = lazy(() => import('./pages/TestAuth'));

// Pages de paramétrage (chargement à la demande)
const Medecins = lazy(() => import('./pages/parametrage/Medecins'));
const MedecinsForm = lazy(() => import('./pages/parametrage/MedecinsForm'));
const Specialites = lazy(() => import('./pages/parametrage/Specialites'));
const SpecialitesForm = lazy(() => import('./pages/parametrage/SpecialitesForm'));
const AnnuaireActesTarifs = lazy(() => import('./pages/parametrage/AnnuaireActesTarifs'));
const AnnuaireActesTarifsForm = lazy(() => import('./pages/parametrage/AnnuaireActesTarifsForm'));
const ExamensDiagnostic = lazy(() => import('./pages/parametrage/ExamensDiagnostic'));
const ExamensDiagnosticForm = lazy(() => import('./pages/parametrage/ExamensDiagnosticForm'));
const ListeMaladies = lazy(() => import('./pages/parametrage/ListeMaladies'));
const ListeMaladiesForm = lazy(() => import('./pages/parametrage/ListeMaladiesForm'));
const ListeVaccins = lazy(() => import('./pages/parametrage/ListeVaccins'));
const ListeVaccinsForm = lazy(() => import('./pages/parametrage/ListeVaccinsForm'));
const ListeEtiologies = lazy(() => import('./pages/parametrage/ListeEtiologies'));
const PlaintesPrincipales = lazy(() => import('./pages/parametrage/PlaintesPrincipales'));
const TypesSymptomes = lazy(() => import('./pages/parametrage/TypesSymptomes'));
const CategoriesAntecedents = lazy(() => import('./pages/parametrage/CategoriesAntecedents'));
const TypesAntecedents = lazy(() => import('./pages/parametrage/TypesAntecedents'));
const TypesCertificats = lazy(() => import('./pages/parametrage/TypesCertificats'));
const Employeurs = lazy(() => import('./pages/parametrage/Employeurs'));
const TiersPayant = lazy(() => import('./pages/parametrage/TiersPayant'));
const TypeCouvertureMedicale = lazy(() => import('./pages/parametrage/TypeCouvertureMedicale'));
const ListeArchives = lazy(() => import('./pages/parametrage/ListeArchives'));
const TypesArchives = lazy(() => import('./pages/parametrage/TypesArchives'));
const FamillesArchives = lazy(() => import('./pages/parametrage/FamillesArchives'));

// Pages de paramétrage médical - Phase 1
const Constantes = lazy(() => import('./pages/parametrage/Constantes'));
const SignesCliniques = lazy(() => import('./pages/parametrage/SignesCliniques'));
const Appareils = lazy(() => import('./pages/parametrage/Appareils'));
const Diagnostics = lazy(() => import('./pages/parametrage/Diagnostics'));

// Pages de paramétrage médical - Phase 2
const Antecedents = lazy(() => import('./pages/parametrage/Antecedents'));
const Medicaments = lazy(() => import('./pages/parametrage/Medicaments'));

// Pages de paramétrage médical - Phase 3
const ElementsSynthese = lazy(() => import('./pages/parametrage/ElementsSynthese'));
const TypesActes = lazy(() => import('./pages/parametrage/TypesActes'));
const Assurances = lazy(() => import('./pages/parametrage/Assurances'));

// Pages du module Rendez-vous
const FichePatient = lazy(() => import('./pages/rendez-vous/FichePatient'));
const PatientForm = lazy(() => import('./pages/PatientForm'));
const PriseRendezVous = lazy(() => import('./pages/rendez-vous/PriseRendezVous'));
const SalleAttente = lazy(() => import('./pages/rendez-vous/SalleAttente'));
const RappelsSMS = lazy(() => import('./pages/rendez-vous/RappelsSMS'));
const NotificationsRealtime = lazy(() => import('./pages/rendez-vous/NotificationsRealtime'));
const ScanDocuments = lazy(() => import('./pages/rendez-vous/ScanDocuments'));
const StatistiquesRealtime = lazy(() => import('./pages/rendez-vous/StatistiquesRealtime'));

// Pages du module Consultation
const Consultations = lazy(() => import('./pages/consultation/Consultations'));
const ConsultationDetail = lazy(() => import('./pages/consultation/ConsultationDetail'));

// Pages du module Facturation
const ActesPage = lazy(() => import('./pages/facturation/Actes'));
const ExamensPage = lazy(() => import('./pages/facturation/Examens'));
const FacturesPage = lazy(() => import('./pages/facturation/Factures'));
const LaboPage = lazy(() => import('./pages/facturation/Labo'));
const PharmaciePage = lazy(() => import('./pages/facturation/Pharmacie'));
const DiversPage = lazy(() => import('./pages/facturation/Divers'));
const ReportingPage = lazy(() => import('./pages/reporting/Reporting'));

// Pages d'administration
const CanalProvenance = lazy(() => import('./pages/administration/CanalProvenance'));
const Professions = lazy(() => import('./pages/administration/Professions'));
const ListePeriodes = lazy(() => import('./pages/administration/ListePeriodes'));
const ListeProduits = lazy(() => import('./pages/administration/ListeProduits'));
const PosologieProduits = lazy(() => import('./pages/administration/PosologieProduits'));
const GestionUtilisateurs = lazy(() => import('./pages/administration/GestionUtilisateurs'));
const FormulaireUtilisateur = lazy(() => import('./pages/administration/FormulaireUtilisateur'));

// Pages pour médecins et secrétaires
const IntroductionPatientPage = lazy(() => import('./pages/IntroductionPatientPage'));
const FicheIdentificationPage = lazy(() => import('./pages/FicheIdentificationPage'));
const ExamenMedicalPage = lazy(() => import('./pages/ExamenMedicalPage'));
const PrescriptionPage = lazy(() => import('./pages/PrescriptionPage'));
const ActesConsultationPage = lazy(() => import('./pages/ActesPage'));
const BcdsPage = lazy(() => import('./pages/BcdsPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const HistoriquesArchivesPage = lazy(() => import('./pages/HistoriquesArchivesPage'));
const PatientsPage = lazy(() => import('./pages/Patients'));
const WaitingQueuePage = lazy(() => import('./pages/WaitingQueuePage'));
const SecretaryDashboard = lazy(() => import('./components/secretary/SecretaryDashboard'));
const MedicalRecordsPage = lazy(() => import('./pages/MedicalRecordsPage'));
const PrescriptionsPage = lazy(() => import('./pages/PrescriptionsPage'));
const MyWaitingQueuePage = lazy(() => import('./pages/MyWaitingQueuePage'));
const TestDoctorSpecificQueue = lazy(() => import('./pages/test/TestDoctorSpecificQueue'));
const DoctorDashboard = lazy(() => import('./components/doctor/DoctorDashboard'));
const PermissionTestPage = lazy(() => import('./pages/PermissionTestPage'));
const MesPatientsPage = lazy(() => import('./pages/MesPatients'));

// Wrapper pour les pages avec Suspense et Layout
const LazyPageWrapper = ({ Component, message }) => (
  <Suspense fallback={<LoadingSpinner message={message} />}>
    <Layout>
      <Component />
    </Layout>
  </Suspense>
);

// Wrapper pour les pages sans Layout
const LazyComponentWrapper = ({ Component, message }) => (
  <Suspense fallback={<LoadingSpinner message={message} />}>
    <Component />
  </Suspense>
);

// Pages temporaires optimisées
const AppointmentsPage = () => (
  <Suspense fallback={<LoadingSpinner message="Chargement du calendrier..." />}>
    <CalendarPage />
  </Suspense>
);

// Pages de paramètres simples (pas de lazy loading nécessaire)
const SettingsPage = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
    <div className="card">
      <p className="text-gray-600">Page de paramètres en cours de développement...</p>
    </div>
  </div>
);

const UsersPage = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
    <div className="card">
      <p className="text-gray-600">Page de gestion des utilisateurs en cours de développement...</p>
    </div>
  </div>
);

const CabinetSettingsPage = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Paramètres du Cabinet</h1>
    <div className="card">
      <p className="text-gray-600">Page des paramètres du cabinet en cours de développement...</p>
    </div>
  </div>
);

const SecurityPage = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Sécurité</h1>
    <div className="card">
      <p className="text-gray-600">Page de sécurité en cours de développement...</p>
    </div>
  </div>
);

const AppContent = () => {
  return (
    <Router>
      {/* Gestionnaire de notifications global */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={5}
      />
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<Login />} />
        
        {/* Routes de test */}
        <Route path="/test-simple" element={
          <LazyComponentWrapper Component={TestSimple} message="Chargement du test..." />
        } />
        <Route path="/test-auth" element={
          <LazyComponentWrapper Component={TestAuth} message="Chargement du test d'auth..." />
        } />
        
        {/* Route calendrier */}
        <Route path="/calendar" element={
          <LazyPageWrapper Component={CalendarPage} message="Chargement du calendrier..." />
        } />
        
        {/* Routes protégées principales */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <SmartDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <SmartDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Routes d'accueil spécifiques par rôle */}
        <Route path="/secretary" element={
          <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
            <LazyPageWrapper Component={SecretaryDashboard} message="Chargement tableau de bord secrétaire..." />
          </ProtectedRoute>
        } />
        
        <Route path="/doctor" element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <LazyPageWrapper Component={MyWaitingQueuePage} message="Chargement file d'attente médecin..." />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Routes principales avec lazy loading */}
        <Route path="/patients" element={
          <ProtectedRoute>
            <LazyPageWrapper Component={PatientsPage} message="Chargement des patients..." />
          </ProtectedRoute>
        } />
        
        <Route path="/appointments" element={
          <ProtectedRoute>
            <Layout>
              <AppointmentsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Routes de paramétrage avec lazy loading */}
        <Route path="/parametrage/medecins" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LazyPageWrapper Component={Medecins} message="Chargement paramètres médecins..." />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrage/medecins/form" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LazyPageWrapper Component={MedecinsForm} message="Chargement formulaire médecin..." />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrage/specialites" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LazyPageWrapper Component={Specialites} message="Chargement spécialités..." />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrage/specialites/form" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LazyPageWrapper Component={SpecialitesForm} message="Chargement formulaire spécialité..." />
          </ProtectedRoute>
        } />
        
        {/* Routes d'administration avec lazy loading */}
        <Route path="/administration/gestion-utilisateurs" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LazyPageWrapper Component={GestionUtilisateurs} message="Chargement gestion utilisateurs..." />
          </ProtectedRoute>
        } />
        
        <Route path="/administration/gestion-utilisateurs/details/:id" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Suspense fallback={<LoadingSpinner message="Chargement formulaire utilisateur..." />}>
              <FormulaireUtilisateur />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* Routes médecin avec lazy loading */}
        <Route path="/my-patients" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <LazyPageWrapper Component={MesPatientsPage} message="Chargement mes patients..." />
          </ProtectedRoute>
        } />
        
        <Route path="/consultations" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <LazyPageWrapper Component={Consultations} message="Chargement consultations..." />
          </ProtectedRoute>
        } />
        
        <Route path="/consultation/:id" element={
          <ProtectedRoute>
            <LazyPageWrapper Component={ConsultationDetail} message="Chargement détails consultation..." />
          </ProtectedRoute>
        } />
        
        {/* Routes secrétaire avec lazy loading */}
        <Route path="/secretary-dashboard" element={
          <ProtectedRoute allowedRoles={[ROLES.SECRETARY, ROLES.ADMIN]}>
            <LazyPageWrapper Component={SecretaryDashboard} message="Chargement tableau de bord..." />
          </ProtectedRoute>
        } />
        
        {/* Routes de facturation avec lazy loading */}
        <Route path="/facturation/actes" element={
          <ProtectedRoute allowedRoles={['secretary']}>
            <LazyPageWrapper Component={ActesPage} message="Chargement facturation actes..." />
          </ProtectedRoute>
        } />
        
        <Route path="/facturation/factures" element={
          <ProtectedRoute allowedRoles={['secretary']}>
            <LazyPageWrapper Component={FacturesPage} message="Chargement factures..." />
          </ProtectedRoute>
        } />
        
        {/* Page d'accès refusé */}
        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* Route par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
