import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Eye, 
  Activity, 
  Search,
  Calendar,
  User,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ExamenMedicalPage = () => {
  const { userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // État pour gérer l'étape (1: choix patient, 2: affichage examens)
  const [currentStep, setCurrentStep] = useState(1);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour les données réelles
  const [allPatients, setAllPatients] = useState([]);
  const [examens, setExamens] = useState([]);

  // Charger les patients au démarrage
  useEffect(() => {
    if (userProfile?.id) {
      fetchPatients();
    }
  }, [userProfile?.id]);

  // Gérer le paramètre URL patient_id
  useEffect(() => {
    const patientIdParam = searchParams.get('patient_id');
    if (patientIdParam && allPatients.length > 0) {
      const patient = allPatients.find(p => p.id === parseInt(patientIdParam));
      if (patient) {
        handleSelectPatient(patient);
      }
    }
  }, [searchParams, allPatients]);

  // Charger les examens quand un patient est sélectionné
  useEffect(() => {
    if (selectedPatient && currentStep === 2) {
      fetchExamens();
    }
  }, [selectedPatient, currentStep]);

  // Récupérer tous les patients du médecin
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les consultations du médecin avec les infos patients
      const { data: consultationsData, error: consultError } = await supabase
        .from('consultations')
        .select(`
          *,
          patients (
            id,
            nom,
            prenom,
            date_naissance,
            sexe,
            telephone,
            email,
            numero_dossier,
            adresse
          )
        `)
        .eq('medecin_id', userProfile.id)
        .order('date_consultation', { ascending: false });

      if (consultError) throw consultError;

      // Extraire les patients uniques
      const uniquePatients = [];
      const patientIds = new Set();
      
      consultationsData?.forEach(consultation => {
        if (consultation.patients && !patientIds.has(consultation.patients.id)) {
          patientIds.add(consultation.patients.id);
          uniquePatients.push(consultation.patients);
        }
      });

      setAllPatients(uniquePatients);

    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
      alert('Erreur lors du chargement des patients');
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les examens du patient sélectionné
  const fetchExamens = async () => {
    if (!selectedPatient) return;

    try {
      setIsLoading(true);
      
      // Récupérer les consultations du patient avec ce médecin
      const { data: consultationsData, error: consultError } = await supabase
        .from('consultations')
        .select('*')
        .eq('medecin_id', userProfile.id)
        .eq('patient_id', selectedPatient.id)
        .order('date_consultation', { ascending: false });

      if (consultError) throw consultError;

      setExamens(consultationsData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des examens:', error);
      alert('Erreur lors du chargement des examens');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour sélectionner un patient et passer à l'étape 2
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setCurrentStep(2);
    setSearchParams({ patient_id: patient.id.toString() });
  };

  // Fonction pour revenir à l'étape 1 (choix du patient)
  const handleBackToPatients = () => {
    setSelectedPatient(null);
    setCurrentStep(1);
    setExamens([]);
    setSearchParams({});
  };

  // Fonction pour naviguer vers la consultation
  const handleViewConsultation = (examen) => {
    navigate(`/consultation/${examen.id}`);
  };

  const handleRefresh = () => {
    if (currentStep === 1) {
      fetchPatients();
    } else if (selectedPatient) {
      fetchExamens();
    }
  };

  // Filtrer les examens selon la recherche
  const filteredExamens = examens.filter(examen => {
    const matchesSearch = (examen.motif_consultation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (examen.notes_generales || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filtrer les patients selon la recherche
  const filteredPatients = allPatients.filter(patient => {
    if (!patientSearchTerm) return true;
    const search = patientSearchTerm.toLowerCase();
    return (
      patient.nom?.toLowerCase().includes(search) ||
      patient.prenom?.toLowerCase().includes(search) ||
      patient.numero_dossier?.toLowerCase().includes(search) ||
      patient.telephone?.includes(search)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return '';
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (statut) => {
    if (statut === 'actif' || statut === 'en_cours') {
      return 'text-blue-600 bg-blue-100';
    } else if (statut === 'terminee' || statut === 'terminé') {
      return 'text-green-600 bg-green-100';
    } else if (statut === 'annulee') {
      return 'text-red-600 bg-red-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusLabel = (statut) => {
    if (statut === 'en_cours') return 'En cours';
    if (statut === 'terminee') return 'Terminé';
    if (statut === 'annulee') return 'Annulé';
    if (statut === 'actif') return 'Actif';
    return 'Terminé';
  };

  return (
    <div className="space-y-6 p-6">
      {/* ÉTAPE 1 : Choix du patient */}
      {currentStep === 1 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Examens Médicaux</h1>
              <p className="text-gray-600">Sélectionnez un patient pour consulter ses examens médicaux</p>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                placeholder="Rechercher un patient par nom, prénom, numéro de dossier ou téléphone..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Liste des patients */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Liste des patients</h2>
              <p className="text-sm text-gray-600">{filteredPatients.length} patient(s) trouvé(s)</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-medical-primary animate-spin" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {patientSearchTerm ? 'Aucun patient ne correspond à votre recherche' : 'Aucun patient trouvé'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-medical-primary bg-opacity-10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-medical-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient.prenom} {patient.nom}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            {patient.numero_dossier && (
                              <span>Dossier: {patient.numero_dossier}</span>
                            )}
                            {patient.telephone && (
                              <span className="flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                {patient.telephone}
                              </span>
                            )}
                            {patient.date_naissance && (
                              <span>{calculateAge(patient.date_naissance)} ans</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <button className="px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors">
                          Voir les examens
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ÉTAPE 2 : Affichage des examens médicaux */}
      {currentStep === 2 && selectedPatient && (
        <>
          {/* En-tête avec bouton retour */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToPatients}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Examens Médicaux</h1>
                <p className="text-gray-600">
                  {selectedPatient.prenom} {selectedPatient.nom}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Informations patient */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informations patient
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Nom complet :</span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedPatient.prenom} {selectedPatient.nom}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date de naissance :</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedPatient.date_naissance)} ({calculateAge(selectedPatient.date_naissance)} ans)
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Sexe :</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedPatient.sexe === 'M' ? 'Masculin' : 'Féminin'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">N° Dossier :</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedPatient.numero_dossier || 'Non renseigné'}</p>
                  </div>
                  {selectedPatient.telephone && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="w-4 h-4 mr-1" /> Téléphone :
                      </span>
                      <p className="text-sm text-gray-900 mt-1">{selectedPatient.telephone}</p>
                    </div>
                  )}
                  {selectedPatient.email && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="w-4 h-4 mr-1" /> Email :
                      </span>
                      <p className="text-sm text-gray-900 mt-1">{selectedPatient.email}</p>
                    </div>
                  )}
                  {selectedPatient.adresse && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" /> Adresse :
                      </span>
                      <p className="text-sm text-gray-900 mt-1">{selectedPatient.adresse}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Statistiques
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total examens :</span>
                    <span className="text-sm font-medium text-gray-900">{filteredExamens.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des examens */}
            <div className="lg:col-span-3">
              {/* Barre de recherche et filtres */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Barre de recherche */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher par motif ou notes..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    />
                  </div>
                  
                  {/* Bouton rafraîchir */}
                  <button
                    onClick={handleRefresh}
                    className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Rafraîchir"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Liste des examens médicaux */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Historique des examens</h2>
                  <p className="text-sm text-gray-600">{filteredExamens.length} examen(s) trouvé(s)</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-medical-primary animate-spin" />
                    </div>
                  ) : filteredExamens.length === 0 ? (
                    <div className="text-center py-12">
                      <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm ? 'Aucun examen ne correspond à votre recherche' : 'Aucun examen trouvé'}
                      </p>
                    </div>
                  ) : (
                    filteredExamens.map((examen) => (
                      <div 
                        key={examen.id} 
                        className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleViewConsultation(examen)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="p-2 rounded-full text-blue-600 bg-blue-100">
                                <Stethoscope className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {examen.motif_consultation || 'Examen médical'}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formatDate(examen.date_consultation || examen.created_at)}
                                  </span>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(examen.statut)}`}>
                                    {getStatusLabel(examen.statut)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {examen.notes_generales && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {examen.notes_generales.substring(0, 150)}...
                              </p>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewConsultation(examen);
                              }}
                              className="flex items-center px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors"
                              title="Voir la consultation"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Voir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamenMedicalPage;
