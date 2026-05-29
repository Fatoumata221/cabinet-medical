import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import notificationService from '../../services/notificationService';
import { appointmentService } from '../../lib/services';
import AppointmentTypeMotifFields, { resolveAppointmentMotif } from '../../components/common/AppointmentTypeMotifFields';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Heart,
  Stethoscope,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X,
  Plus,
  History,
  Activity,
  Thermometer,
  Eye,
  Search,
  Filter,
  UserPlus
} from 'lucide-react';

const FichePatientRdv = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showConsultationHistory, setShowConsultationHistory] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    medecin_id: '',
    date_heure: '',
    motif: '',
    motif_autre: '',
    type_rdv: 'consultation',
    priorite: 'normale',
    duree: 30,
    statut: 'confirme',
    notes: '',
  });

  useEffect(() => {
    fetchPatients();
    fetchMedecins();
    
    // Si un ID patient est fourni dans l'URL
    const patientId = searchParams.get('id');
    if (patientId) {
      loadPatientData(patientId);
    }
  }, [searchParams]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedecins = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, specialite')
        .eq('role', 'doctor')
        .order('nom', { ascending: true });

      if (error) throw error;
      setMedecins(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
    }
  };

  const loadPatientData = async (patientId) => {
    try {
      // Charger les données du patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setSelectedPatient(patient);

      // Charger l'historique des consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultations')
        .select(`
          *,
          medecin:users(nom, prenom, specialite)
        `)
        .eq('patient_id', patientId)
        .order('date_consultation', { ascending: false })
        .limit(10);

      if (consultationsError) throw consultationsError;
      setConsultations(consultationsData || []);

      // Charger les rendez-vous à venir
      const today = new Date().toISOString().split('T')[0];
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          medecin:users(nom, prenom, specialite)
        `)
        .eq('patient_id', patientId)
        .gte('date_heure', today)
        .order('date_heure', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des données patient:', error);
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.telephone?.includes(searchTerm) ||
    patient.numero_dossier?.includes(searchTerm)
  );

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    loadPatientData(patient.id);
    navigate(`/rendez-vous/fiche-patient?id=${patient.id}`);
  };

  const handleNewAppointment = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const result = await appointmentService.create({
        patient_id: selectedPatient.id,
        medecin_id: appointmentForm.medecin_id,
        date_heure: appointmentForm.date_heure,
        motif: resolveAppointmentMotif(appointmentForm.motif, appointmentForm.motif_autre),
        type_rdv: appointmentForm.type_rdv || 'consultation',
        priorite: appointmentForm.priorite || 'normale',
        duree: appointmentForm.duree || 30,
        statut: appointmentForm.statut || 'confirme',
        notes: appointmentForm.notes || '',
      }, currentUser);

      if (!result?.appointment) {
        throw new Error('Erreur lors de la création du rendez-vous');
      }
      
      // Envoyer une notification au médecin
      if (appointmentForm.medecin_id && currentUser.role === 'secretary') {
        try {
          await notificationService.notifyNewAppointment(
            appointmentForm.medecin_id,
            currentUser.id,
            selectedPatient.id,
            `${selectedPatient.prenom} ${selectedPatient.nom}`,
            appointmentForm.motif,
            appointmentForm.date_heure
          );
        } catch (notifError) {
          console.error('Erreur lors de l\'envoi de la notification:', notifError);
          // Ne pas bloquer le processus si la notification échoue
        }
      }
      
      setShowNewAppointment(false);
      setAppointmentForm({
        medecin_id: '',
        date_heure: '',
        motif: '',
        motif_autre: '',
        type_rdv: 'consultation',
        priorite: 'normale',
        duree: 30,
        statut: 'confirme',
        notes: '',
      });
      
      // Recharger les rendez-vous
      loadPatientData(selectedPatient.id);
      
      // Message de succès
      unifiedNotificationService.success('Rendez-vous créé avec succès');
      
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      unifiedNotificationService.error('Erreur lors de la création du rendez-vous');
    }
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      confirme: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      en_attente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      annule: { color: 'bg-red-100 text-red-800', icon: X }
    };
    
    const config = statusConfig[statut] || statusConfig.confirme;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {statut === 'confirme' ? 'Confirmé' : 
         statut === 'en_attente' ? 'En attente' : 'Annulé'}
      </span>
    );
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des fiches patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fiche Patient - Rendez-vous</h1>
          <p className="text-gray-600">Gestion des dossiers patients et prise de rendez-vous</p>
        </div>
        <button
          onClick={() => navigate('/introduction-patient')}
          className="flex items-center px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nouveau patient
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des patients */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Sélectionner un patient</h2>
              
              {/* Recherche */}
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un patient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-medical-primary flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {patient.prenom} {patient.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {patient.telephone}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Détails du patient sélectionné */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Informations patient */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedPatient.prenom} {selectedPatient.nom}
                    </h2>
                    <button
                      onClick={() => navigate(`/patients?id=${selectedPatient.id}&edit=true`)}
                      className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Informations personnelles
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Date de naissance:</span>
                          <span className="ml-2">
                            {selectedPatient.date_naissance ? 
                              new Date(selectedPatient.date_naissance).toLocaleDateString('fr-FR') : 
                              'Non renseignée'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Téléphone:</span>
                          <span className="ml-2">{selectedPatient.telephone || 'Non renseigné'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Email:</span>
                          <span className="ml-2">{selectedPatient.email || 'Non renseigné'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Adresse:</span>
                          <span className="ml-2">{selectedPatient.adresse || 'Non renseignée'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Informations médicales
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Groupe sanguin:</span>
                          <span className="ml-2">{selectedPatient.groupe_sanguin || 'Non renseigné'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Allergies:</span>
                          <span className="ml-2">{selectedPatient.allergies || 'Aucune connue'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Assurance:</span>
                          <span className="ml-2">{selectedPatient.assurance || 'Non renseignée'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setShowNewAppointment(true)}
                      className="flex items-center justify-center px-4 py-3 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Nouveau RDV
                    </button>
                    <button
                      onClick={() => setShowConsultationHistory(true)}
                      className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <History className="w-5 h-5 mr-2" />
                      Historique
                    </button>
                    <button
                      onClick={() => navigate(`/patients?id=${selectedPatient.id}&view=true`)}
                      className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      Dossier complet
                    </button>
                  </div>
                </div>
              </div>

              {/* Rendez-vous à venir */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Rendez-vous à venir</h3>
                </div>
                <div className="p-6">
                  {appointments.length > 0 ? (
                    <div className="space-y-3">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatDateTime(appointment.date_heure)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Dr. {appointment.medecin?.prenom} {appointment.medecin?.nom} - {appointment.motif || 'Consultation'}
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(appointment.statut)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucun rendez-vous à venir</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un patient</h3>
              <p className="text-gray-600">Choisissez un patient dans la liste pour voir ses informations et gérer ses rendez-vous</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal nouveau rendez-vous */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nouveau rendez-vous
                </h3>
                <button
                  onClick={() => setShowNewAppointment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleNewAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Médecin *</label>
                <select
                  value={appointmentForm.medecin_id}
                  onChange={(e) => setAppointmentForm({...appointmentForm, medecin_id: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                >
                  <option value="">Sélectionner un médecin...</option>
                  {medecins.map((medecin) => (
                    <option key={medecin.id} value={medecin.id}>
                      Dr. {medecin.prenom} {medecin.nom} {medecin.specialite && `- ${medecin.specialite}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
                <input
                  type="datetime-local"
                  value={appointmentForm.date_heure}
                  onChange={(e) => setAppointmentForm({...appointmentForm, date_heure: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                />
              </div>
              
              <AppointmentTypeMotifFields
                typeRdv={appointmentForm.type_rdv}
                motif={appointmentForm.motif}
                motifAutre={appointmentForm.motif_autre}
                priorite={appointmentForm.priorite}
                showPriorite
                onChange={(fields) => setAppointmentForm((prev) => ({ ...prev, ...fields }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
                <select
                  value={appointmentForm.duree}
                  onChange={(e) => setAppointmentForm({...appointmentForm, duree: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors"
                >
                  Créer le rendez-vous
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal historique consultations */}
      {showConsultationHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Historique des consultations
                </h3>
                <button
                  onClick={() => setShowConsultationHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {consultations.length > 0 ? (
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {new Date(consultation.date_consultation).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-600">
                          Dr. {consultation.medecin?.prenom} {consultation.medecin?.nom}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
                        <div><span className="font-medium">Motif:</span> {consultation.motif || 'Non spécifié'}</div>
                        {consultation.diagnostic && (
                          <div><span className="font-medium">Diagnostic:</span> {consultation.diagnostic}</div>
                        )}
                        {consultation.notes && (
                          <div><span className="font-medium">Notes:</span> {consultation.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune consultation trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FichePatientRdv;
