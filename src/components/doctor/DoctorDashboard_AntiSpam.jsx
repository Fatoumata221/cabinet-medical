import React, { useState, useEffect, useCallback, useRef } from 'react';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Clock, 
  Calendar, 
  Bell, 
  User, 
  CheckCircle, 
  Phone, 
  UserCheck,
  Stethoscope,
  AlertTriangle,
  Activity,
  Shield,
  AlertCircle
} from 'lucide-react';
import CalendarView from '../Calendar';

const DoctorDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  
  // États
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [currentFromRaw, setCurrentFromRaw] = useState(null);
  const [selectedCurrentPatientId, setSelectedCurrentPatientId] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [finishedConsultations, setFinishedConsultations] = useState([]);
  const [canceledAppointments, setCanceledAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalWaiting: 0,
    inConsultation: 0,
    newPatients: 0,
    consultationsFinished: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Anti-spam : éviter les rechargements multiples
  const fetchTimeoutRef = useRef(null);
  const lastFetchTime = useRef(0);
  const isActionInProgress = useRef(false);
  
  // Fonction de fetch optimisée avec anti-spam
  const fetchDashboardData = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Anti-spam : éviter les fetch trop fréquents (moins de 2 secondes)
    if (!force && (now - lastFetchTime.current) < 2000) {
      console.log('Fetch ignoré (anti-spam)');
      return;
    }
    
    // Annuler le fetch précédent s'il existe
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Debounce : attendre 500ms avant de fetch
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        lastFetchTime.current = now;
        setLoading(true);

        // Récupérer les données en parallèle
        const [queueResult, appointmentsResult, finishedResult, canceledResult] = await Promise.all([
          // File d'attente
          supabase
            .from('waiting_queue')
            .select(`
              *,
              patient:patients(id, nom, prenom, telephone),
              appointment:appointments(id, heure_debut, motif)
            `)
            .eq('medecin_id', userProfile.id)
            .in('status', ['arrive', 'in_consultation', 'present', 'waiting'])
            .order('created_at', { ascending: true }),
          
          // Rendez-vous du jour
          supabase
            .from('appointments')
            .select(`
              *,
              patient:patients(id, nom, prenom, telephone)
            `)
            .eq('medecin_id', userProfile.id)
            .gte('date_rdv', new Date().toISOString().split('T')[0])
            .lte('date_rdv', new Date().toISOString().split('T')[0])
            .order('heure_debut', { ascending: true }),
          
          // Consultations terminées
          supabase
            .from('waiting_queue')
            .select(`
              *,
              patient:patients(id, nom, prenom, telephone)
            `)
            .eq('medecin_id', userProfile.id)
            .eq('status', 'termine')
            .gte('updated_at', new Date().toISOString().split('T')[0])
            .order('updated_at', { ascending: false }),
          
          // Rendez-vous annulés/reportés
          supabase
            .from('waiting_queue')
            .select(`
              *,
              patient:patients(id, nom, prenom, telephone)
            `)
            .eq('medecin_id', userProfile.id)
            .in('status', ['reporte', 'absent'])
            .gte('updated_at', new Date().toISOString().split('T')[0])
            .order('updated_at', { ascending: false })
        ]);

        // Traitement des résultats
        if (queueResult.error) throw queueResult.error;
        if (appointmentsResult.error) throw appointmentsResult.error;
        if (finishedResult.error) throw finishedResult.error;
        if (canceledResult.error) throw canceledResult.error;

        const queue = queueResult.data || [];
        const appointments = appointmentsResult.data || [];
        const finished = finishedResult.data || [];
        const canceled = canceledResult.data || [];

        // Mise à jour des états
        setWaitingQueue(queue);
        setTodayAppointments(appointments);
        setFinishedConsultations(finished);
        setCanceledAppointments(canceled);

        // Calcul des statistiques
        setStats({
          totalWaiting: queue.filter(p => ['arrive', 'present', 'waiting'].includes(p.status)).length,
          inConsultation: queue.filter(p => p.status === 'in_consultation').length,
          newPatients: queue.filter(p => p.is_new_patient).length,
          consultationsFinished: finished.length
        });

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        unifiedNotificationService.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }, force ? 0 : 500);
  }, [userProfile?.id, showError]);

  // Fonction de fetch des notifications optimisée
  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications_medecin_secretaire')
        .select('*')
        .eq('medecin_id', userProfile.id)
        .eq('lu', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  }, [userProfile?.id]);

  // Effet principal avec subscription optimisée
  useEffect(() => {
    if (!userProfile?.id) return;

    // Fetch initial
    fetchDashboardData(true);
    fetchNotifications();
    
    // Subscription Realtime optimisée
    const channel = supabase.channel('doctor_dashboard_optimized')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'waiting_queue',
        filter: `medecin_id=eq.${userProfile.id}`
      }, (payload) => {
        console.log('Changement waiting_queue:', payload);
        // Fetch différé pour éviter les cascades
        setTimeout(() => fetchDashboardData(), 1000);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications_medecin_secretaire',
        filter: `medecin_id=eq.${userProfile.id}`
      }, (payload) => {
        console.log('Nouvelle notification:', payload);
        // Seulement fetch les notifications, pas tout le dashboard
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [userProfile?.id, fetchDashboardData, fetchNotifications]);

  // Fonction d'action patient optimisée avec anti-spam
  const handlePatientAction = async (patientId, action, patientName = '') => {
    // Éviter les actions multiples simultanées
    if (isActionInProgress.current) {
      console.log('Action ignorée (déjà en cours)');
      return;
    }
    
    isActionInProgress.current = true;
    
    try {
      console.log(`Action ${action} pour patient ${patientId}`);

      switch (action) {
        case 'receive': {
          console.log('Action receive - patientId:', patientId, 'userProfile.id:', userProfile.id);
          
          if (!userProfile?.id) {
            throw new Error('ID du médecin manquant');
          }

          // Si pas de patientId, chercher le premier patient arrivé
          if (!patientId) {
            const firstArrivedPatient = waitingQueue.find(p => p.status === 'arrive');
            if (!firstArrivedPatient) {
              unifiedNotificationService.error('Aucun patient en attente trouvé');
              break;
            }
            patientId = firstArrivedPatient.waiting_queue_id || firstArrivedPatient.id;
            console.log('Patient trouvé automatiquement:', patientId);
          }

          // Utiliser la fonction SQL optimisée pour recevoir le patient
          const { data: result, error: receiveError } = await supabase
            .rpc('medecin_recoit_patient_optimise', {
              p_waiting_queue_id: patientId,
              p_medecin_id: userProfile.id
            });

          if (receiveError) {
            console.error('Erreur fonction SQL:', receiveError);
            throw new Error(`Erreur lors de la réception: ${receiveError.message}`);
          }

          if (!result.success) {
            throw new Error(result.error);
          }

          // Toast seulement si notification créée (évite les doublons)
          if (result.notification_created) {
            showMedicalNotification('Médecin disponible', result.message + '. La secrétaire a été notifiée.', 'patient_called');
          } else {
            unifiedNotificationService.info(result.message);
          }
          break;
        }
        
        case 'consultation': {
          // Démarrer la consultation si le patient est en route
          try {
            const target = waitingQueue.find(p => p.id === patientId || p.waiting_queue_id === patientId);
            if (target && target.status === 'en_route') {
              const { error: startErr } = await supabase
                .from('waiting_queue')
                .update({ 
                  status: 'in_consultation',
                  updated_at: new Date().toISOString()
                })
                .eq('id', patientId)
                .eq('medecin_id', userProfile.id);
              if (startErr) throw startErr;
            }
          } catch (e) {
            console.warn('Impossible de démarrer automatiquement:', e?.message || e);
          }
          
          // Trouver ou créer une consultation et rediriger directement
          try {
            const { data: wq, error: wqErr } = await supabase
              .from('waiting_queue')
              .select('patient_id, medecin_id, consultation_id')
              .eq('id', patientId)
              .single();
            
            if (wqErr) throw wqErr;
            
            if (wq?.patient_id && wq?.medecin_id) {
              let consultationId = wq.consultation_id;
              
              if (!consultationId) {
                const startOfDay = new Date();
                startOfDay.setHours(0,0,0,0);
                const { data: existing, error: findErr } = await supabase
                  .from('consultations')
                  .select('id')
                  .eq('patient_id', wq.patient_id)
                  .eq('medecin_id', wq.medecin_id)
                  .gte('date_consultation', startOfDay.toISOString())
                  .in('statut', ['en_cours','en_attente'])
                  .order('date_consultation', { ascending: false })
                  .limit(1);
                
                if (findErr) throw findErr;
                consultationId = existing && existing.length > 0 ? existing[0].id : null;
              }
              
              if (!consultationId) {
                const { data: created, error: createErr } = await supabase
                  .from('consultations')
                  .insert({
                    patient_id: wq.patient_id,
                    medecin_id: wq.medecin_id,
                    date_consultation: new Date().toISOString(),
                    statut: 'en_cours'
                  })
                  .select('id')
                  .single();
                
                if (createErr) throw createErr;
                consultationId = created.id;
              }
              
              const qs = `?from=workflow&waiting_queue_id=${patientId}`;
              navigate(`/consultation/${consultationId}${qs}`);
            }
          } catch (e) {
            console.error('Erreur lors de la redirection vers la consultation:', e);
            unifiedNotificationService.error('Erreur lors de la redirection vers la consultation');
          }
          break;
        }
        
        case 'start': {
          const { error: startError } = await supabase
            .from('waiting_queue')
            .update({ 
              status: 'in_consultation',
              updated_at: new Date().toISOString()
            })
            .eq('id', patientId)
            .eq('medecin_id', userProfile.id);
          if (startError) throw startError;
          showMedicalNotification('Consultation démarrée', `Consultation démarrée pour ${patientName}`, 'patient_entered');
          break;
        }
        
        case 'finish': {
          // Utiliser la fonction SQL pour terminer la consultation
          const { data: result, error: finishError } = await supabase
            .rpc('medecin_termine_consultation', {
              p_waiting_queue_id: patientId,
              p_medecin_id: userProfile.id
            });

          if (finishError) {
            console.error('Erreur fonction SQL:', finishError);
            throw new Error(`Erreur lors de la fin de consultation: ${finishError.message}`);
          }

          if (!result.success) {
            throw new Error(result.error);
          }

          showMedicalNotification('Consultation terminée', result.message + '. La secrétaire a été notifiée.', 'consultation_finished');
          break;
        }
        
        case 'cancel': {
          // Annuler la consultation côté file d'attente (remet dans annulés du jour)
          const { error: cancelErr } = await supabase
            .from('waiting_queue')
            .update({ status: 'reporte', updated_at: new Date().toISOString() })
            .eq('id', patientId)
            .eq('medecin_id', userProfile.id);
          if (cancelErr) throw cancelErr;
          unifiedNotificationService.error(`Consultation annulée pour ${patientName}`);
          break;
        }
        
        default:
          console.warn('Action non reconnue:', action);
      }

      // Actualiser les données avec délai pour éviter les cascades
      setTimeout(() => fetchDashboardData(), 1500);
      
    } catch (error) {
      console.error('Erreur lors de l\'action patient:', error);
      console.error('Détails erreur:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      
      const errorMessage = error?.message || error?.error_description || 'Erreur inconnue';
      unifiedNotificationService.error(`Erreur: ${errorMessage}`);
    } finally {
      // Libérer le verrou après un délai
      setTimeout(() => {
        isActionInProgress.current = false;
      }, 2000);
    }
  };
  
  // Logique de sélection du patient actuel améliorée
  const currentPatient = (() => {
    // Si un patient est sélectionné manuellement, le prioriser
    if (selectedCurrentPatientId) {
      const manuallySelected = waitingQueue.find(p => 
        (p.id === selectedCurrentPatientId || p.waiting_queue_id === selectedCurrentPatientId) &&
        ['arrive', 'in_consultation', 'present', 'waiting'].includes(p.status)
      );
      if (manuallySelected) {
        return manuallySelected;
      }
    }
    
    // Sinon, utiliser la logique automatique (patient en consultation en priorité)
    const inConsultation = waitingQueue.find(p => p.status === 'in_consultation');
    if (inConsultation) {
      return inConsultation;
    }
    
    // Puis patient arrivé
    return waitingQueue.find(p => ['arrive', 'present'].includes(p.status));
  })();
  
  // Fonction pour sélectionner manuellement un patient actuel
  const handleSelectCurrentPatient = (patientId) => {
    console.log('Sélection manuelle du patient actuel:', patientId);
    setSelectedCurrentPatientId(patientId);
    
    // Sauvegarder dans le localStorage pour persistance
    if (patientId) {
      localStorage.setItem(`doctor_${userProfile?.id}_current_patient`, patientId);
      const patient = waitingQueue.find(p => 
        (p.id === patientId || p.waiting_queue_id === patientId)
      );
      const patientName = patient ? `${patient.patient_prenom} ${patient.patient_nom}` : 'Patient';
      unifiedNotificationService.success(`${patientName} défini comme patient actuel`);
    } else {
      localStorage.removeItem(`doctor_${userProfile?.id}_current_patient`);
      unifiedNotificationService.info('Mode automatique activé');
    }
  };
  
  // Restaurer la sélection depuis le localStorage au chargement
  useEffect(() => {
    if (userProfile?.id && waitingQueue.length > 0) {
      const savedPatientId = localStorage.getItem(`doctor_${userProfile.id}_current_patient`);
      if (savedPatientId && !selectedCurrentPatientId) {
        // Vérifier que le patient existe toujours dans la file d'attente
        const patientExists = waitingQueue.find(p => 
          (p.id === savedPatientId || p.waiting_queue_id === savedPatientId) &&
          ['arrive', 'in_consultation', 'present', 'waiting'].includes(p.status)
        );
        if (patientExists) {
          setSelectedCurrentPatientId(savedPatientId);
        } else {
          // Nettoyer si le patient n'existe plus
          localStorage.removeItem(`doctor_${userProfile.id}_current_patient`);
        }
      }
    }
  }, [waitingQueue, userProfile?.id, selectedCurrentPatientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Médecin - Dr. {userProfile?.prenom} {userProfile?.nom}
        </h1>
        <p className="text-gray-600">
          Spécialité: {userProfile?.specialite || 'Médecine générale'} | 
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-blue-700 text-sm font-medium">En attente</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalWaiting}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center">
            <Stethoscope className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-green-700 text-sm font-medium">En consultation</p>
              <p className="text-2xl font-bold text-green-900">{stats.inConsultation}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-yellow-700 text-sm font-medium">Urgences</p>
              <p className="text-2xl font-bold text-yellow-900">
                {waitingQueue.filter(p => p.priority === 'urgente' || p.priority === 'tres_urgente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-purple-700 text-sm font-medium">Notifications</p>
              <p className="text-2xl font-bold text-purple-900">{notifications.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient actuel */}
      {currentPatient && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-600" />
              Patient actuel
            </h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentPatient.status === 'in_consultation' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentPatient.status === 'in_consultation' ? 'En consultation' : 'En attente'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {currentPatient.patient?.prenom} {currentPatient.patient?.nom}
              </h3>
              <p className="text-gray-600">
                Téléphone: {currentPatient.patient?.telephone || 'Non renseigné'}
              </p>
              <p className="text-gray-600">
                Motif: {currentPatient.appointment?.motif || 'Consultation générale'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Arrivé à: {currentPatient.arrived_at ? new Date(currentPatient.arrived_at).toLocaleTimeString('fr-FR') : 'Non renseigné'}
              </p>
              <p className="text-sm text-gray-500">
                Temps d'attente: {currentPatient.arrived_at ? 
                  Math.round((new Date() - new Date(currentPatient.arrived_at)) / (1000 * 60)) + ' min' : 
                  'Non calculé'
                }
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            {currentPatient.status === 'arrive' && (
              <button
                onClick={() => {
                  const patientId = currentPatient.waiting_queue_id || currentPatient.id;
                  if (!patientId) {
                    unifiedNotificationService.error('ID du patient manquant');
                    return;
                  }
                  handlePatientAction(patientId, 'receive');
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={isActionInProgress.current}
              >
                <Shield className="w-4 h-4 mr-2" />
                {isActionInProgress.current ? 'En cours...' : 'Recevoir'}
              </button>
            )}

            {currentPatient.status === 'in_consultation' && (
              <>
                <button
                  onClick={() => {
                    const patientId = currentPatient.waiting_queue_id || currentPatient.id;
                    handlePatientAction(patientId, 'consultation');
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Consultation
                </button>
                <button
                  onClick={() => {
                    const patientId = currentPatient.waiting_queue_id || currentPatient.id;
                    const patientName = `${currentPatient.patient?.prenom} ${currentPatient.patient?.nom}`;
                    handlePatientAction(patientId, 'finish', patientName);
                  }}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  disabled={isActionInProgress.current}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isActionInProgress.current ? 'En cours...' : 'Terminer'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reste du composant... */}
      <div className="text-center text-gray-500 mt-8">
        <p>Dashboard optimisé - Anti-spam activé</p>
      </div>
    </div>
  );
};

export default DoctorDashboard;
