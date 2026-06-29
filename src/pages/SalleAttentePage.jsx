import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Clock, 
  User, 
  Phone, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  RefreshCw,
  Eye,
  Edit,
  UserCheck,
  Stethoscope,
  Timer,
  Activity,
  MapPin,
  Heart,
  Thermometer,
  FileImage,
  Upload
} from 'lucide-react';
import { formatDoctorSpecialties, getDoctorInitials } from '../utils/doctorUtils';
import PatientDocumentUploader from '../components/secretary/PatientDocumentUploader';
import {
  WAITING_QUEUE_ACTIVE_STATUSES,
  computeQueueStats,
  filterActiveQueueItems,
  isStrictlyWaitingStatus,
  isPresentInQueueStatus,
  isCalledInQueueStatus,
  isInConsultationQueueStatus,
  isTerminalQueueStatus,
  hasPastAppointment,
  filterOutPastAppointments,
  isStuckInConsultation,
  filterOutStuckConsultations,
} from '../utils/waitingQueueStatus';
import {
  confirmSkippedWorkflowSteps,
  validateQueueTransition,
} from '../utils/workflowGuards';

const SalleAttentePage = () => {
  const { currentUser } = useAuth();
  const [patientsEnAttente, setPatientsEnAttente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPatientForUpload, setSelectedPatientForUpload] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    fetchPatientsEnAttente();
    setupRealtimeSubscription();

    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchPatientsEnAttente, 30000);
    return () => clearInterval(interval);
  }, []);

  // Gestion du redimensionnement du panneau
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 500) {
          setLeftPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const setupRealtimeSubscription = () => {
    const channel = supabase.channel('salle_attente_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'waiting_queue'
      }, () => {
        fetchPatientsEnAttente();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchPatientsEnAttente = async () => {
    try {
      // Calculer les bornes de la date d'aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = tomorrow.toISOString();

      // 1) Patients en file d'attente avec rendez-vous aujourd'hui
      const { data: queueData, error: queueError } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          appointments(date_heure, statut_arrivee, heure_arrivee, statut)
        `)
        .gte('appointments.date_heure', todayStart)
        .lt('appointments.date_heure', tomorrowStart)
        .eq('appointments.statut', 'arrive')
        .order('order_position', { ascending: true });

      if (queueError) throw queueError;

      const list = Array.isArray(queueData) ? queueData : [];
      if (list.length === 0) {
        setPatientsEnAttente([]);
        return;
      }

      // Déduplication améliorée: garder la plus récente par patient_id ET medecin_id
      const pickTimestamp = (it) => new Date(it.arrived_at || it.updated_at || it.created_at || 0).getTime();
      const uniqueMap = new Map();
      for (const it of list) {
        // Utiliser une clé unique basée sur patient_id et medecin_id pour éviter les doublons
        const key = `${it.patient_id}-${it.medecin_id}`;
        const prev = uniqueMap.get(key);
        if (!prev || pickTimestamp(it) > pickTimestamp(prev)) {
          uniqueMap.set(key, it);
        }
      }
      const deduped = Array.from(uniqueMap.values());

      // 2) Récupérer en masse les patients et médecins référencés
      const patientIds = Array.from(new Set(deduped.map(i => i.patient_id).filter(Boolean)));
      const doctorIds = Array.from(new Set(deduped.map(i => i.medecin_id).filter(Boolean)));

      let patientMap = {};
      let doctorMap = {};

      if (patientIds.length > 0) {
        const { data: patientsRows, error: patientsErr } = await supabase
          .from('patients')
          .select('id, nom, prenom, telephone, date_naissance')
          .in('id', patientIds);
        if (!patientsErr && patientsRows) {
          patientMap = Object.fromEntries(patientsRows.map(p => [p.id, p]));
        } else {
          console.error('SalleAttente: erreur récupération patients', patientsErr);
          // Créer des entrées par défaut pour éviter les noms manquants
          patientIds.forEach(id => {
            patientMap[id] = { id, nom: 'Inconnu', prenom: 'Patient', telephone: 'N/A' };
          });
        }
      }

      if (doctorIds.length > 0) {
        const { data: doctorsRows, error: doctorsErr } = await supabase
          .from('users')
          .select('id, nom, prenom, specialite')
          .in('id', doctorIds);
        if (!doctorsErr && doctorsRows) {
          doctorMap = Object.fromEntries(doctorsRows.map(d => [d.id, d]));
        } else {
          console.error('SalleAttente: erreur récupération médecins', doctorsErr);
          // Créer des entrées par défaut pour éviter les noms manquants
          doctorIds.forEach(id => {
            doctorMap[id] = { id, nom: 'Inconnu', prenom: 'Dr.', specialite: 'N/A' };
          });
        }
      }

      // 3) Fusionner les données pour correspondre au rendu actuel
      const enriched = deduped.map(item => ({
        ...item,
        patient: patientMap[item.patient_id] || { id: item.patient_id, nom: 'Inconnu', prenom: 'Patient', telephone: 'N/A' },
        medecin: doctorMap[item.medecin_id] || { id: item.medecin_id, nom: 'Inconnu', prenom: 'Dr.', specialite: 'N/A' },
      }));

      // 4) Mettre à jour automatiquement le statut des patients avec rendez-vous passés
      const now = new Date();
      const pastAppointments = enriched.filter(item => hasPastAppointment(item, now));
      
      if (pastAppointments.length > 0) {
        // Mettre à jour le statut des patients passés à "Non honoré"
        for (const item of pastAppointments) {
          try {
            await supabase
              .from('waiting_queue')
              .update({ 
                status: 'non_honore',
                updated_at: now.toISOString()
              })
              .eq('id', item.id);
          } catch (error) {
            console.error('Erreur lors de la mise à jour du statut du patient passé:', error);
          }
        }
      }

      // 5) Filtrer uniquement les patients en attente (exclure appelés, en consultation, terminés)
      const finalFilteredItems = enriched.filter(item => 
        !isCalledInQueueStatus(item.status) && 
        !isInConsultationQueueStatus(item.status) && 
        !isTerminalQueueStatus(item.status) &&
        !hasPastAppointment(item, now)
      );

      setPatientsEnAttente(finalFilteredItems);
    } catch (error) {
      console.error('Erreur lors du chargement des patients en attente:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePatientStatus = async (patientId, newStatus) => {
    try {
      const currentPatient = patientsEnAttente.find(p => p.id === patientId);
      if (!currentPatient) {
        addNotification('Patient non trouvé', 'error');
        return;
      }

      const transition = validateQueueTransition(currentPatient.status, newStatus);
      if (transition.needsConfirmation && !confirmSkippedWorkflowSteps(transition.skippedSteps, 'changer le statut')) {
        return;
      }

      const { error } = await supabase
        .from('waiting_queue')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;

      // Ajouter une notification
      addNotification(`Patient ${newStatus === 'in_consultation' ? 'en consultation' : 'appelé'}`, 'success');
      fetchPatientsEnAttente();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du status:', error);
      addNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      waiting: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
      present: { color: 'bg-blue-100 text-blue-800', icon: UserCheck, label: 'Présent' },
      arrive: { color: 'bg-blue-100 text-blue-800', icon: UserCheck, label: 'Arrivé' },
      called: { color: 'bg-orange-100 text-orange-800', icon: Bell, label: 'Appelé' },
      appele: { color: 'bg-orange-100 text-orange-800', icon: Bell, label: 'Appelé' },
      medecin_pret: { color: 'bg-cyan-100 text-cyan-800', icon: CheckCircle, label: 'Médecin prêt' },
      en_route: { color: 'bg-purple-100 text-purple-800', icon: User, label: 'Patient appelé' },
      in_consultation: { color: 'bg-green-100 text-green-800', icon: Stethoscope, label: 'En consultation' }
    };
    
    const config = statusConfig[status] || statusConfig.waiting;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'border-l-red-500 bg-red-50';
      case 'tres_urgente': return 'border-l-red-700 bg-red-100';
      default: return 'border-l-blue-500 bg-white';
    }
  };

  const getWaitingTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  const handlePatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
  };

  const queueStats = computeQueueStats(patientsEnAttente);

  const displayedPatients = useMemo(() => {
    if (statusFilter === 'all') return patientsEnAttente;
    if (statusFilter === 'waiting') {
      return patientsEnAttente.filter((p) => isStrictlyWaitingStatus(p.status));
    }
    if (statusFilter === 'present') {
      return patientsEnAttente.filter((p) => isPresentInQueueStatus(p.status));
    }
    if (statusFilter === 'called') {
      return patientsEnAttente.filter((p) => isCalledInQueueStatus(p.status));
    }
    if (statusFilter === 'in_consultation') {
      return patientsEnAttente.filter((p) =>
        isInConsultationQueueStatus(p.status),
      );
    }
    return patientsEnAttente;
  }, [patientsEnAttente, statusFilter]);

  const statCardClass =
    'bg-white rounded-lg shadow-md p-4 border border-gray-200 cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-medical-primary/25';


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* En-tête compact */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Salle d'Attente</h1>
            <p className="text-small">Gestion en temps réel des patients présents</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {queueStats.inWaitingRoom} patient
                {queueStats.inWaitingRoom > 1 ? 's' : ''} en salle
              </span>
            </div>
            <button 
              onClick={fetchPatientsEnAttente}
              className="flex items-center px-3 py-1.5 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Notifications compact */}
      {notifications.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 space-y-1">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-2 rounded border-l-4 text-xs ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}
            >
              <div className="flex items-center">
                <Bell className="w-3 h-3 mr-1.5" />
                <span className="font-medium">{notification.message}</span>
                <span className="ml-auto text-xs opacity-75">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistiques compact */}
      <div className="flex-shrink-0 px-4 py-2 grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'waiting' ? 'all' : 'waiting')}
          className={`text-left p-2 bg-white rounded shadow border border-gray-200 hover:shadow-md transition-all ${statusFilter === 'waiting' ? 'ring-2 ring-yellow-400' : ''}`}
        >
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div className="ml-2">
              <p className="text-stat-label">En attente</p>
              <p className="text-stat-number">{queueStats.waiting}</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'called' ? 'all' : 'called')}
          className={`text-left p-2 bg-white rounded shadow border border-gray-200 hover:shadow-md transition-all ${statusFilter === 'called' ? 'ring-2 ring-orange-400' : ''}`}
        >
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-orange-600" />
            <div className="ml-2">
              <p className="text-stat-label">Appelés</p>
              <p className="text-stat-number">{queueStats.called}</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              statusFilter === 'in_consultation' ? 'all' : 'in_consultation',
            )
          }
          className={`text-left p-2 bg-white rounded shadow border border-gray-200 hover:shadow-md transition-all ${statusFilter === 'in_consultation' ? 'ring-2 ring-green-400' : ''}`}
        >
          <div className="flex items-center">
            <Stethoscope className="w-5 h-5 text-green-600" />
            <div className="ml-2">
              <p className="text-stat-label">En consultation</p>
              <p className="text-stat-number">
                {queueStats.inConsultation}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Contenu principal avec panneau redimensionnable */}
      <div className="flex-1 flex overflow-hidden px-4 pb-4">
        {/* Panneau latéral redimensionnable */}
        <div 
          style={{ width: `${leftPanelWidth}px`, minWidth: '200px', maxWidth: '500px' }}
          className="flex-shrink-0 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col"
        >
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Filtres</h3>
          </div>
          <div className="p-3 flex-1 overflow-y-auto">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                >
                  <option value="all">Tous</option>
                  <option value="waiting">En attente</option>
                  <option value="present">Présents</option>
                  <option value="called">Appelés</option>
                  <option value="in_consultation">En consultation</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Handle de redimensionnement */}
        <div
          className="w-1 bg-gray-200 hover:bg-medical-primary cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={(e) => {
            setIsResizing(true);
            e.preventDefault();
          }}
        />

        {/* Panneau principal */}
        <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Patients en salle d'attente</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {loading ? (
                // Skeletons pendant le chargement
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-3 border-l-4 border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          <div className="flex space-x-4">
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                displayedPatients.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`p-3 border-l-4 ${getPriorityColor(item.priorite)} hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-medical-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {item.patient?.prenom} {item.patient?.nom}
                          </h3>
                          {getStatusBadge(item.status)}
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                          <div className="flex items-center">
                            <Stethoscope className="w-3 h-3 mr-1" />
                            {formatDoctorSpecialties(item.medecin)}
                          </div>
                          <div className="flex items-center">
                            <Timer className="w-3 h-3 mr-1" />
                            Attente: {getWaitingTime(item.created_at)}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {item.patient?.telephone}
                          </div>
                        </div>
                        
                        {item.motif_consultation && (
                          <div className="mt-1 text-xs text-gray-700">
                            <span className="font-medium">Motif:</span> {item.motif_consultation}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {item.status === 'called' && (
                        <button
                          onClick={() => updatePatientStatus(item.id, 'in_consultation')}
                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                        >
                          En consultation
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedPatientForUpload(item.patient);
                          setShowUploadModal(true);
                        }}
                        className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                        title="Scanner des documents médicaux"
                      >
                        <FileImage className="w-3 h-3 mr-1" />
                        Scanner
                      </button>
                      
                      <button
                        onClick={() => handlePatientDetails(item)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
  
              
              {!loading && patientsEnAttente.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun patient en salle d'attente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal détails patient */}
      {showPatientDetails && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails du patient
                </h3>
                <button
                  onClick={() => setShowPatientDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations patient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Informations personnelles
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Nom:</span>
                      <span className="ml-2">{selectedPatient.patient?.prenom} {selectedPatient.patient?.nom}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Téléphone:</span>
                      <span className="ml-2">{selectedPatient.patient?.telephone}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Date de naissance:</span>
                      <span className="ml-2">
                        {selectedPatient.patient?.date_naissance ? 
                          new Date(selectedPatient.patient.date_naissance).toLocaleDateString('fr-FR') : 
                          'Non renseignée'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Consultation
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Spécialité:</span>
                      <span className="ml-2">{formatDoctorSpecialties(selectedPatient.medecin)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Motif:</span>
                      <span className="ml-2">{selectedPatient.motif_consultation || 'Non spécifié'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Status:</span>
                      <span className="ml-2">{getStatusBadge(selectedPatient.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions rapides */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Actions rapides</h4>
                <div className="flex space-x-3">
                  {selectedPatient.status === 'waiting' && (
                    <button
                      onClick={() => {
                        updatePatientStatus(selectedPatient.id, 'called');
                        setShowPatientDetails(false);
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Appeler le patient
                    </button>
                  )}
                  
                  {selectedPatient.status === 'called' && (
                    <button
                      onClick={() => {
                        updatePatientStatus(selectedPatient.id, 'in_consultation');
                        setShowPatientDetails(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Démarrer consultation
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowPatientDetails(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'upload de documents */}
      {showUploadModal && selectedPatientForUpload && (
        <PatientDocumentUploader
          patient={selectedPatientForUpload}
          onUploadSuccess={() => {
            setShowUploadModal(false);
            setSelectedPatientForUpload(null);
            addNotification('Documents uploadés avec succès', 'success');
          }}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedPatientForUpload(null);
          }}
        />
      )}
    </div>
  );
};

export default SalleAttentePage;
