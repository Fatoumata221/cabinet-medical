import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendNotification, NOTIFICATION_TYPES } from '../lib/notifications';
import {
  WAITING_QUEUE_ACTIVE_STATUSES,
  computeQueueStats,
  filterActiveQueueItems,
  isInConsultationQueueStatus,
  isOnWaitingBench,
  hasPastAppointment,
  filterOutPastAppointments,
} from '../utils/waitingQueueStatus';
import ClickableStatCard from '../components/common/ClickableStatCard';
import {
  confirmSkippedWorkflowSteps,
  validateQueueTransition,
} from '../utils/workflowGuards';
import { shouldHidePastAppointment } from '../utils/appointmentDisplay';
import { 
  UserPlus, 
  Calendar, 
  Search,
  Clock,
  UserCheck,
  Bell,
  Users,
  Loader2,
  AlertCircle,
  FileText,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { unifiedNotificationService } from '../services/unifiedNotificationService';
import PatientCard from '../components/introduction/PatientCard';
import WaitingQueueItem from '../components/introduction/WaitingQueueItem';
import NotificationPanel from '../components/introduction/NotificationPanel';
import DoctorReassignModal from '../components/secretary/DoctorReassignModal';
import 'react-toastify/dist/ReactToastify.css';

const IntroductionPatientPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // Configuration pour masquer/afficher la section "Rendez-vous du jour"
  const SHOW_APPOINTMENTS_SECTION = false; // Mettre à true pour réactiver la section
  
  // États de l'application
  const [mode, setMode] = useState('arrivals'); // 'arrivals', 'select' ou 'create'
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultationCount, setConsultationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [arrivalsStatFilter, setArrivalsStatFilter] = useState('all');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedPatientForReassign, setSelectedPatientForReassign] = useState(null);
  const [confirmedPresenceAppointmentId, setConfirmedPresenceAppointmentId] = useState(null);
  const waitingSectionRef = useRef(null);

  const waitingQueueStats = useMemo(
    () => computeQueueStats(waitingQueue),
    [waitingQueue],
  );

  const visibleTodayAppointments = useMemo(
    () => appointments.filter((appt) => !shouldHidePastAppointment(appt)),
    [appointments],
  );

  const displayedWaitingQueue = useMemo(() => {
    switch (arrivalsStatFilter) {
      case 'bench':
        return waitingQueue.filter((item) => isOnWaitingBench(item.status));
      case 'consultation':
        return waitingQueue.filter((item) =>
          isInConsultationQueueStatus(item.status),
        );
      case 'doctors_ready':
        return waitingQueue.filter((item) => item.medecin_disponible);
      default:
        return waitingQueue;
    }
  }, [waitingQueue, arrivalsStatFilter]);

  const toggleArrivalsFilter = (filter) => {
    setArrivalsStatFilter((current) => (current === filter ? 'all' : filter));
    waitingSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };
  
  // États de chargement
  // État de chargement global
  const [isLoading, setIsLoading] = useState({
    patients: false,
    medecins: false,
    appointments: false,
    waitingQueue: false,
    actions: false,
    initialLoad: true
  });
  
  // Données du formulaire de création de patient
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    telephone: '',
    adresse: '',
    assurance: '',
    groupe_sanguin: '',
    allergies: '',
    antecedents: ''
  });
  
  // État de soumission du formulaire
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Chargement initial des données
  useEffect(() => {
    let isMounted = true;
    let channel;

    const loadData = async () => {
      if (!isMounted) return;
      
      try {
        setIsLoading(prev => ({ ...prev, 
          patients: true, 
          medecins: true, 
          appointments: true, 
          waitingQueue: true,
          initialLoad: true
        }));
        
        // Chargement parallèle des données
        await Promise.allSettled([
          fetchPatients(),
          fetchMedecins(),
          fetchTodayAppointments(),
          fetchWaitingQueue(),
          fetchConsultationCount(),
          fetchNotifications()
        ]);
        
      } catch (error) {
        console.error('Erreur lors du chargement initial des données:', error);
        unifiedNotificationService.error('Erreur lors du chargement des données. Veuillez rafraîchir la page.');
      } finally {
        if (isMounted) {
          setIsLoading(prev => ({
            ...prev,
            patients: false,
            medecins: false,
            appointments: false,
            waitingQueue: false,
            initialLoad: false
          }));
        }
      }
    };

    // Configuration de l'abonnement temps réel
    const setupRealtime = () => {
      try {
        channel = supabase
          .channel('waiting_queue_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'waiting_queue'
          }, () => {
            if (isMounted) {
              fetchWaitingQueue();
            }
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications_medecin_secretaire'
          }, () => {
            if (isMounted) {
              fetchNotifications();
            }
          })
          .subscribe(
            (status) => {
              if (status === 'SUBSCRIBED') {
                console.log('Abonnement temps réel actif (waiting_queue + notifications)');
              }
            }
          );
      } catch (error) {
        console.error('Erreur lors de la configuration du temps réel:', error);
      }
    };

    // Démarrer le chargement des données
    loadData();
    setupRealtime();

    // Nettoyage
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Fonction pour gérer les erreurs de manière centralisée
  const handleError = useCallback((error, context) => {
    console.error(`${context}:`, error);
    let errorMessage = `Erreur lors de ${context}.`;
    
    // Gestion personnalisée des erreurs
    if (error.code) {
      if (error.code === 'PGRST301' || error.code === 'PGRST302') {
        errorMessage = 'Erreur de connexion à la base de données. Veuillez vérifier votre connexion.';
      } else if (error.code === '23505') {
        errorMessage = 'Cette entrée existe déjà dans le système.';
      } else if (error.code === '42501') {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.';
      } else if (error.message) {
        errorMessage += ` (Code: ${error.code}) ${error.message}`;
      }
    } else if (error.message) {
      errorMessage += ` ${error.message}`;
    }
    
    unifiedNotificationService.error(errorMessage);
    return errorMessage;
  }, []);

  // Compter les patients en consultation (stat carte)
  const fetchConsultationCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('waiting_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_consultation');
      if (error) throw error;
      setConsultationCount(count || 0);
    } catch (error) {
      handleError(error, 'le comptage des patients en consultation');
    }
  }, [handleError]);

  // Récupérer les notifications pour la secrétaire
  const fetchNotifications = useCallback(async () => {
    try {
      // Calculer la date de début d'aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      // 1) Récupérer les notifications sans jointures
      // Filtrer pour n'afficher que les notifications non lues ET du jour
      // Exclure les notifications de type 'patient_ready' car elles sont gérées depuis la Salle d'attente
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications_medecin_secretaire')
        .select('*')
        .eq('lu', false)
        .neq('type_notification', 'patient_ready')
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false })
        .limit(10);

      if (notificationsError) throw notificationsError;
      
      const notifications = Array.isArray(notificationsData) ? notificationsData : [];
      
      if (notifications.length === 0) {
        setNotifications([]);
        return;
      }

      // 2) Récupérer les médecins référencés
      const medecinIds = Array.from(new Set(notifications.map(n => n.medecin_id).filter(Boolean)));
      let medecinMap = {};
      
      if (medecinIds.length > 0) {
        const { data: medecinsData, error: medecinsError } = await supabase
          .from('users')
          .select('id, nom, prenom, specialite')
          .in('id', medecinIds);
        
        if (medecinsError) {
          console.error('Erreur médecins notifications:', medecinsError);
        } else if (medecinsData) {
          medecinMap = Object.fromEntries(medecinsData.map(m => [m.id, m]));
        }
      }

      // 3) Récupérer les patients référencés
      const patientIds = Array.from(new Set(notifications.map(n => n.patient_id).filter(Boolean)));
      let patientMap = {};
      
      if (patientIds.length > 0) {
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('id, nom, prenom')
          .in('id', patientIds);
        
        if (patientsError) {
          console.error('Erreur patients notifications:', patientsError);
        } else if (patientsData) {
          patientMap = Object.fromEntries(patientsData.map(p => [p.id, p]));
        }
      }

      // 4) Fusionner les données
      const enrichedNotifications = notifications.map(notification => ({
        ...notification,
        medecin: medecinMap[notification.medecin_id] || null,
        patient: patientMap[notification.patient_id] || null
      }));

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  }, []);

  // Charger les patients avec gestion du chargement et des erreurs
  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, patients: true }));
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('nom', { ascending: true });
      
      if (error) throw error;
      
      // Vérifier si le composant est toujours monté avant de mettre à jour l'état
      setPatients(Array.isArray(data) ? data : []);
      
      return data || [];
    } catch (error) {
      const errorMessage = handleError(error, 'la récupération des patients');
      console.error('Détails de l\'erreur:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, patients: false }));
    }
  }, [handleError]);

  // Charger les médecins avec gestion du chargement et des erreurs
  const fetchMedecins = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, medecins: true }));
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'doctor')
        .eq('actif', true)
        .order('nom', { ascending: true });
      
      if (error) throw error;
      
      setMedecins(Array.isArray(data) ? data : []);
      return data || [];
    } catch (error) {
      handleError(error, 'la récupération des médecins');
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, medecins: false }));
    }
  }, [handleError]);

  // Charger les rendez-vous du jour avec gestion du chargement et des erreurs
  const fetchTodayAppointments = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, appointments: true }));
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      // 1) Appointments sans jointures
      const { data: appts, error: apptErr } = await supabase
        .from('appointments')
        .select('*')
        .gte('date_heure', start.toISOString())
        .lt('date_heure', end.toISOString())
        .order('date_heure', { ascending: false });
      if (apptErr) throw apptErr;

      const list = Array.isArray(appts) ? appts : [];
      if (list.length === 0) {
        setAppointments([]);
        return;
      }

      // 2) Récupérer patients et médecins
      const patientIds = Array.from(new Set(list.map(a => a.patient_id).filter(Boolean)));
      const doctorIds = Array.from(new Set(list.map(a => a.medecin_id).filter(Boolean)));

      let patientMap = {};
      let doctorMap = {};

      if (patientIds.length > 0) {
        const { data: pRows } = await supabase
          .from('patients')
          .select('id, nom, prenom, telephone, numero_dossier')
          .in('id', patientIds);
        if (pRows) patientMap = Object.fromEntries(pRows.map(p => [p.id, p]));
      }
      if (doctorIds.length > 0) {
        const { data: dRows } = await supabase
          .from('users')
          .select('id, nom, prenom, specialite')
          .in('id', doctorIds);
        if (dRows) doctorMap = Object.fromEntries(dRows.map(d => [d.id, d]));
      }

      // 3) Fusion
      const enriched = list.map(a => ({
        ...a,
        patient: patientMap[a.patient_id] || null,
        medecin: doctorMap[a.medecin_id] || null,
      }));
      setAppointments(enriched);
    } catch (error) {
      handleError(error, 'la récupération des rendez-vous');
    } finally {
      setIsLoading(prev => ({ ...prev, appointments: false }));
    }
  }, [handleError]);

  // Marque en base les entrées de file d'attente dont le rendez-vous est déjà
  // passé (statut -> 'non_honore') afin qu'elles ne réapparaissent jamais,
  // même après un rafraîchissement ou un événement temps réel.
  const archiveExpiredAppointments = useCallback(async (items) => {
    const expiredItems = (items || []).filter((item) => hasPastAppointment(item));
    if (expiredItems.length === 0) return;

    console.log(
      '🕒 [IntroductionPatient] Rendez-vous expirés détectés, archivage ->',
      expiredItems.map((i) => i.id),
    );

    const { error } = await supabase
      .from('waiting_queue')
      .update({
        status: 'non_honore',
        updated_at: new Date().toISOString(),
      })
      .in('id', expiredItems.map((i) => i.id));

    if (error) {
      console.error('Erreur lors de l\'archivage des rendez-vous expirés:', error);
    }
  }, []);

  // Charger la file d'attente avec gestion du chargement et des erreurs
  const fetchWaitingQueue = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, waitingQueue: true }));
    try {
      console.log('🔄 [IntroductionPatient] Récupération de la file d\'attente...');
      // Calculer la date d'aujourd'hui (minuit)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      // 1) Récupérer la file avec jointures sur appointments pour filtrer par date et statut
      const { data: queue, error: qErr } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          appointments(date_heure, statut)
        `)
        .in('status', WAITING_QUEUE_ACTIVE_STATUSES)
        .gte('appointments.date_heure', todayStart)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;

      const list = Array.isArray(queue) ? queue : [];
      console.log('📊 [IntroductionPatient] Données brutes récupérées:', list.length, 'entrées');
      console.log('📊 [IntroductionPatient] Statuts présents:', [...new Set(list.map(i => i.status))]);
      
      if (list.length === 0) {
        setWaitingQueue([]);
        return [];
      }

      // Déduplication: garder la plus récente par appointment_id (prioritaire) ou par (patient_id, medecin_id)
      const pickTimestamp = (it) => new Date(it.arrived_at || it.updated_at || it.created_at || 0).getTime();
      const uniqueMap = new Map();
      for (const it of list) {
        const key = it.appointment_id ? `apt:${it.appointment_id}` : `p:${it.patient_id}-m:${it.medecin_id}`;
        const prev = uniqueMap.get(key);
        if (!prev || pickTimestamp(it) >= pickTimestamp(prev)) {
          uniqueMap.set(key, it);
        }
      }
      const deduped = Array.from(uniqueMap.values());

      // 2) Charger patients et médecins référencés
      const patientIds = Array.from(new Set(deduped.map(i => i.patient_id).filter(Boolean)));
      const doctorIds = Array.from(new Set(deduped.map(i => i.medecin_id).filter(Boolean)));

      let patientMap = {};
      let doctorMap = {};

      if (patientIds.length > 0) {
        const { data: pRows } = await supabase
          .from('patients')
          .select('id, nom, prenom, telephone, numero_dossier')
          .in('id', patientIds);
        if (pRows) patientMap = Object.fromEntries(pRows.map(p => [p.id, p]));
      }
      if (doctorIds.length > 0) {
        const { data: dRows } = await supabase
          .from('users')
          .select('id, nom, prenom, specialite')
          .in('id', doctorIds);
        if (dRows) doctorMap = Object.fromEntries(dRows.map(d => [d.id, d]));
      }

      // 3) Fusion
      const enriched = deduped.map(item => ({
        ...item,
        patient: patientMap[item.patient_id] || null,
        medecin: doctorMap[item.medecin_id] || null,
      }));
      const activeQueue = filterActiveQueueItems(enriched);

      // Exclure les rendez-vous déjà passés (heure de fin < maintenant)
      const withoutPastAppointments = filterOutPastAppointments(activeQueue);

      const expiredCount = activeQueue.length - withoutPastAppointments.length;
      if (expiredCount > 0) {
        console.log(`🕒 [IntroductionPatient] ${expiredCount} rendez-vous passé(s) masqué(s) et archivé(s)`);
        // Ne pas bloquer l'affichage : on archive en base en tâche de fond.
        archiveExpiredAppointments(activeQueue);
      }

      setWaitingQueue(withoutPastAppointments);
      return withoutPastAppointments;
    } catch (error) {
      handleError(error, 'la récupération de la file d\'attente');
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, waitingQueue: false }));
    }
  }, [handleError, archiveExpiredAppointments]);

  const clearWaitingQueue = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir vider complètement la file d\'attente ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      setIsLoading(prev => ({ ...prev, actions: true }));
      
      // Récupérer tous les IDs de la file d'attente
      const { data: queueItems, error: fetchError } = await supabase
        .from('waiting_queue')
        .select('id');
      
      if (fetchError) throw fetchError;

      if (queueItems && queueItems.length > 0) {
        // Supprimer tous les éléments de la file d'attente
        const { error: deleteError } = await supabase
          .from('waiting_queue')
          .delete()
          .in('id', queueItems.map(item => item.id));
        
        if (deleteError) throw deleteError;
      }

      // Rafraîchir la file d'attente
      await fetchWaitingQueue();
      unifiedNotificationService.success('La file d\'attente a été vidée avec succès.');
    } catch (error) {
      console.error('Erreur lors de la suppression de la file d\'attente:', error);
      unifiedNotificationService.error('Une erreur est survenue lors de la suppression de la file d\'attente.');
    } finally {
      setIsLoading(prev => ({ ...prev, actions: false }));
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => 
      (patient.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.numero_dossier?.includes(searchTerm) ||
      patient.telephone?.includes(searchTerm)) &&
      // Filtre temporaire pour masquer les entrées Adama Diao
      !(patient.nom?.toLowerCase() === 'diao' && patient.prenom?.toLowerCase() === 'adama')
    );
  }, [patients, searchTerm]);

  const handlePatientSelect = useCallback((patient) => {
    setSelectedPatient(patient);
    setConfirmedPresenceAppointmentId(null);
    // Afficher un toast pour confirmer la sélection
    unifiedNotificationService.success(`Patient ${patient.prenom} ${patient.nom} sélectionné`);
  }, []);

  const handleViewPatientDetails = (patient) => {
    navigate(`/patients/details/${patient.id}`, {
      state: { from: 'introduction' }
    });
  };

  const handleEditPatient = (patient) => {
    navigate(`/patients/edit/${patient.id}`, {
      state: { from: 'introduction' }
    });
  };

  const handleCreateAppointment = (patient) => {
    navigate('/appointments/new', {
      state: { patientId: patient.id }
    });
  };

  // Confirmer la présence du patient et l'ajouter à la salle d'attente
  const handleConfirmPatientPresence = async (appointmentId) => {
    if (!appointmentId) {
      unifiedNotificationService.error('ID de rendez-vous manquant');
      return;
    }

    setIsLoading(prev => ({ ...prev, actions: true }));

    try {
      console.log('🔍 [IntroductionPatient] userProfile:', userProfile);
      console.log('🔍 [IntroductionPatient] currentUser:', currentUser);
      console.log('🔍 [IntroductionPatient] Appel RPC avec:', {
        appointment_id: appointmentId,
        secretaire_id: userProfile?.id,
        type_secretaire_id: typeof userProfile?.id
      });

      const { data, error } = await supabase.rpc('secretaire_confirme_patient_presence', {
        p_appointment_id: appointmentId,
        p_secretaire_id: userProfile?.id
      });

      if (error) throw error;

      console.log('✅ [IntroductionPatient] RPC réussi:', data);

      if (data?.success) {
        setConfirmedPresenceAppointmentId(appointmentId);
        // Recharger les rendez-vous pour mettre à jour le statut
        await fetchTodayAppointments();
        // Récupérer les infos du rendez-vous pour la notification
        const appointment = appointments.find(a => a.id === appointmentId);
        if (appointment && data?.medecin_id) {
          const patientName = `${appointment.patient?.prenom ?? ''} ${appointment.patient?.nom ?? ''}`.trim();

          console.log('📤 [IntroductionPatient] Envoi notification avec:', {
            type: NOTIFICATION_TYPES.PATIENT_ARRIVED,
            senderId: userProfile?.id,
            receiverId: data.medecin_id,
            patientName,
            additionalData: {
              appointment_id: appointmentId,
              patient_id: data.patient_id
            },
            types: {
              senderId_type: typeof userProfile?.id,
              receiverId_type: typeof data.medecin_id,
              appointment_id_type: typeof appointmentId,
              patient_id_type: typeof data.patient_id
            }
          });

          // Envoyer notification au médecin que le patient est dans la salle d'attente
          await sendNotification(
            NOTIFICATION_TYPES.PATIENT_ARRIVED,
            userProfile?.id,
            data.medecin_id,
            null,
            patientName,
            {
              appointmentId: appointmentId,
              patientId: data.patient_id
            }
          );
        }

        await Promise.all([fetchWaitingQueue(), fetchTodayAppointments(), fetchConsultationCount()]);
        unifiedNotificationService.success(data.message || 'Patient confirmé présent et ajouté à la salle d\'attente');
      } else {
        throw new Error(data?.error || 'Erreur inconnue lors de la confirmation de présence');
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation de présence:', error);
      unifiedNotificationService.error(error.message || 'Erreur lors de la confirmation de présence');
    } finally {
      setIsLoading(prev => ({ ...prev, actions: false }));
    }
  };

  // Confirmation d'entrée du patient
  const handleConfirmPatientEntry = async (waitingQueueId) => {
    if (!waitingQueueId) {
      unifiedNotificationService.error('ID de file d\'attente manquant');
      return;
    }

    const current = waitingQueue.find((i) => i.id === waitingQueueId);
    if (current) {
      const transition = validateQueueTransition(
        current.status,
        'in_consultation',
      );
      if (
        transition.needsConfirmation &&
        !confirmSkippedWorkflowSteps(
          transition.skippedSteps,
          'confirmer l\'entrée en consultation',
        )
      ) {
        return;
      }
    }

    setIsLoading(prev => ({ ...prev, actions: true }));

    try {
      const { data, error } = await supabase.rpc('confirm_patient_entry_basesql', {
        p_waiting_queue_id: waitingQueueId,
        p_secretaire_id: userProfile?.id
      });

      if (error) throw error;

      // Envoyer notification au médecin via le nouveau système
      try {
        const current = waitingQueue.find(i => i.id === waitingQueueId);
        if (current) {
          const patientName = `${current?.patient?.prenom ?? ''} ${current?.patient?.nom ?? ''}`;
          const medecinId = current?.medecin_id ?? current?.medecin?.id;
          
          await sendNotification(
            NOTIFICATION_TYPES.PATIENT_ON_WAY,
            userProfile?.id,      // Secrétaire (expéditeur)
            medecinId,            // Médecin (destinataire)
            null,                 // Pas de consultation_id
            patientName,
            {
              waitingQueueId: waitingQueueId,
              patientId: current?.patient_id ?? current?.patient?.id
            }
          );
        }
      } catch (nerr) {
        console.warn('Envoi notification médecin échoué (non bloquant):', nerr);
      }
      await Promise.all([fetchWaitingQueue(), fetchTodayAppointments()]);
      unifiedNotificationService.success(data?.message || 'Patient envoyé en consultation');
    } catch (error) {
      console.error('Erreur lors de la confirmation d\'entrée:', error);
      unifiedNotificationService.error(error.message || 'Erreur lors de l\'envoi du patient en consultation');
    } finally {
      setIsLoading(prev => ({ ...prev, actions: false }));
    }
  };

  // Autorisation du patient pour consultation (alias "envoyer")
  const handleAuthorizePatient = async (waitingQueueId) => {
    if (!waitingQueueId) {
      unifiedNotificationService.error('ID de file d\'attente manquant');
      return;
    }

    setIsLoading(prev => ({ ...prev, actions: true }));
    
    try {
      console.log('🔄 [IntroductionPatient] Autorisation patient:', waitingQueueId);
      
      // Récupérer les infos du patient avant la mise à jour
      const current = waitingQueue.find(i => i.id === waitingQueueId);
      if (!current) {
        throw new Error('Patient non trouvé dans la file d\'attente');
      }

      const patientName = `${current?.patient?.prenom ?? ''} ${current?.patient?.nom ?? ''}`.trim();
      const medecinId = current?.medecin_id ?? current?.medecin?.id;
      
      console.log('📋 [IntroductionPatient] Patient:', patientName, '| Médecin:', medecinId);

      if (current.status === 'en_route') {
        throw new Error('Le patient est déjà appelé vers le médecin');
      }

      if (
        current.status === 'in_consultation' ||
        current.status === 'en_consultation'
      ) {
        throw new Error('Le patient est déjà en consultation');
      }

      // PAS de validation workflow - "Introduire" est une demande, pas une confirmation
      // La même logique que côté médecin pour éviter le popup inutile

      // Mettre à jour le statut du patient vers "en_route"
      const { error: updErr } = await supabase
        .from('waiting_queue')
        .update({ 
          status: 'en_route',
          updated_at: new Date().toISOString()
        })
        .eq('id', waitingQueueId);

      if (updErr) {
        console.error('❌ [IntroductionPatient] Erreur mise à jour statut:', updErr);
        throw updErr;
      }
      
      console.log('✅ [IntroductionPatient] Statut mis à jour vers "en_route"');

      // Envoyer notification au médecin
      if (medecinId && userProfile?.id) {
        console.log('📤 [IntroductionPatient] Envoi notification au médecin...');
        
        await sendNotification(
          NOTIFICATION_TYPES.PATIENT_ON_WAY,
          userProfile.id,       // Secrétaire (expéditeur)
          medecinId,            // Médecin (destinataire)
          null,                 // Pas de consultation_id
          patientName,
          {
            waitingQueueId: waitingQueueId,
            patientId: current?.patient_id ?? current?.patient?.id
          }
        );
        
        console.log('✅ [IntroductionPatient] Notification envoyée avec succès');
      } else {
        console.warn('⚠️ [IntroductionPatient] Impossible d\'envoyer la notification - medecinId ou userProfile manquant');
      }

      await Promise.all([fetchWaitingQueue(), fetchTodayAppointments()]);
      unifiedNotificationService.success(`${patientName} est appelé vers le médecin`);
    } catch (error) {
      console.error('❌ [IntroductionPatient] Erreur lors de l\'autorisation du patient:', error);
      unifiedNotificationService.error(error.message || 'Erreur lors de l\'envoi du patient en consultation');
    } finally {
      setIsLoading(prev => ({ ...prev, actions: false }));
    }
  };

  // Marquer le patient comme entré en consultation (physiquement dans le bureau)
  const handleMarkInConsultation = async (waitingQueueId) => {
    if (!waitingQueueId) {
      unifiedNotificationService.error('ID de file d\'attente manquant');
      return;
    }

    setIsLoading(prev => ({ ...prev, actions: true }));
    
    try {
      console.log('🔄 [IntroductionPatient] Marquage patient en consultation:', waitingQueueId);
      
      // Récupérer les infos du patient
      const current = waitingQueue.find(i => i.id === waitingQueueId);
      if (!current) {
        throw new Error('Patient non trouvé dans la file d\'attente');
      }

      const patientName = `${current?.patient?.prenom ?? ''} ${current?.patient?.nom ?? ''}`.trim();
      const medecinId = current?.medecin_id ?? current?.medecin?.id;
      
      // Mettre à jour le statut du patient vers "in_consultation"
      const { error: updErr } = await supabase
        .from('waiting_queue')
        .update({ 
          status: 'in_consultation',
          updated_at: new Date().toISOString()
        })
        .eq('id', waitingQueueId);

      if (updErr) {
        console.error('❌ [IntroductionPatient] Erreur mise à jour statut consultation:', updErr);
        throw updErr;
      }
      
      console.log('✅ [IntroductionPatient] Statut mis à jour vers "in_consultation"');

      // Envoyer notification au médecin pour confirmer l'entrée
      if (medecinId && userProfile?.id) {
        await sendNotification(
          NOTIFICATION_TYPES.PATIENT_ON_WAY,
          userProfile.id,
          medecinId,
          null,
          `${patientName} est entré en consultation`,
          {
            waitingQueueId: waitingQueueId,
            patientId: current?.patient_id ?? current?.patient?.id,
            action: 'entered_consultation'
          }
        );
      }

      await fetchWaitingQueue();
      unifiedNotificationService.success(`${patientName} est entré en consultation`);
    } catch (error) {
      console.error('❌ [IntroductionPatient] Erreur lors du marquage en consultation:', error);
      unifiedNotificationService.error(error.message || 'Erreur lors du marquage en consultation');
    } finally {
      setIsLoading(prev => ({ ...prev, actions: false }));
    }
  };

  // Gestion des changements de formulaire avec validation
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Affichage d'un indicateur de chargement
  const renderLoadingState = (loadingText = 'Chargement...') => (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
      <span className="text-gray-600">{loadingText}</span>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Validation des champs obligatoires
      if (!formData.nom || !formData.prenom) {
        throw new Error('Le nom et le prénom sont obligatoires');
      }
      
      // Enregistrer dans Supabase
      const { data, error } = await supabase
        .from('patients')
        .insert([formData])
        .select();
      
      if (error) throw error;
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Réinitialiser le formulaire après 2 secondes et rediriger
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          nom: '', prenom: '', date_naissance: '', telephone: '', adresse: '',
          assurance: '', groupe_sanguin: '', allergies: '', antecedents: ''
        });
        // Rediriger vers la page patients
        navigate('/patients');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du patient:', error);
      setIsSubmitting(false);
      unifiedNotificationService.error(error.message || 'Erreur lors de l\'enregistrement du patient. Veuillez réessayer.');
    }
  };

  const handleReset = () => {
    setFormData({
      nom: '', prenom: '', date_naissance: '', telephone: '', adresse: '',
      assurance: '', groupe_sanguin: '', allergies: '', antecedents: ''
    });
  };

  // Gérer la réassignation d'un patient à un autre médecin
  const handleReassign = (patient) => {
    setSelectedPatientForReassign(patient);
    setShowReassignModal(true);
  };

  const handleReassignComplete = () => {
    setShowReassignModal(false);
    setSelectedPatientForReassign(null);
    fetchWaitingQueue();
    unifiedNotificationService.success('Patient réassigné avec succès');
  };

  // Rendu principal
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4">
      {/* Notification Toast */}
      <div className="fixed top-4 right-4 z-50">
        <div className="toast toast-top toast-end"></div>
      </div>
      
      {/* Indicateur de chargement global */}
      {isLoading.actions && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <span className="text-gray-700 text-sm">Traitement en cours...</span>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* En-tête compact */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Introduction Patient</h1>
          <p className="text-sm text-gray-600">
            {mode === 'arrivals' ? 'Gérez les arrivées des patients' :
             mode === 'select' ? 'Sélectionnez un patient existant' : 
             'Enregistrement d\'un nouveau patient'}
          </p>
        </div>

        {/* Boutons de mode compact */}
        <div className="mb-4 flex space-x-2">
          <button
            onClick={() => setMode('arrivals')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              mode === 'arrivals' 
                ? 'bg-medical-primary text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <UserCheck className="w-4 h-4 mr-1.5" />
            Arrivées
          </button>
          <button
            onClick={() => setMode('select')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              mode === 'select' 
                ? 'bg-medical-primary text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Search className="w-4 h-4 mr-1.5" />
            Rechercher
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              mode === 'create' 
                ? 'bg-medical-primary text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Nouveau
          </button>
        </div>

        {mode === 'arrivals' && (
          <div className="space-y-4">
            {/* Statistiques rapides compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ClickableStatCard
                tone="blue"
                bordered
                icon={Calendar}
                label="RDV"
                value={visibleTodayAppointments.length}
                onClick={() => navigate('/secretary-calendar')}
                title="Ouvrir le calendrier"
                size="sm"
              />
              <ClickableStatCard
                tone="orange"
                bordered
                icon={Clock}
                label="En salle"
                value={waitingQueueStats.onBench}
                onClick={() => toggleArrivalsFilter('bench')}
                active={arrivalsStatFilter === 'bench'}
                title="Filtrer les patients en salle"
                size="sm"
              />
              <ClickableStatCard
                tone="green"
                bordered
                icon={Users}
                label="Consultation"
                value={consultationCount}
                onClick={() => toggleArrivalsFilter('consultation')}
                active={arrivalsStatFilter === 'consultation'}
                title="Filtrer les patients en consultation"
                size="sm"
              />
              <ClickableStatCard
                tone="purple"
                bordered
                icon={Bell}
                label="Prêts"
                value={waitingQueue.filter((q) => q.medecin_disponible).length}
                onClick={() => toggleArrivalsFilter('doctors_ready')}
                active={arrivalsStatFilter === 'doctors_ready'}
                title="Filtrer les médecins disponibles"
                size="sm"
              />
            </div>

            {/* Liste des rendez-vous du jour avec bouton Arrivé */}
            {SHOW_APPOINTMENTS_SECTION && visibleTodayAppointments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Rendez-vous du jour ({visibleTodayAppointments.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {visibleTodayAppointments.map((appointment) => {
                    // Vérifier si le patient est déjà dans la file d'attente
                    const isInWaitingQueue = waitingQueue.some(
                      q => q.patient_id === appointment.patient_id && q.medecin_id === appointment.medecin_id
                    );

                    return (
                      <div key={appointment.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">
                              {appointment.patient?.prenom} {appointment.patient?.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(appointment.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              {' • '}
                              Dr. {appointment.medecin?.prenom} {appointment.medecin?.nom}
                            </p>
                          </div>
                          {isInWaitingQueue || appointment.statut === 'arrive' || appointment.statut_arrivee === 'arrive' ? (
                            <button
                              disabled
                              className="flex items-center px-3 py-1.5 rounded text-xs bg-blue-100 text-blue-800 cursor-not-allowed"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Présent
                            </button>
                          ) : appointment.statut === 'confirme' ? (
                            <button
                              onClick={() => handleConfirmPatientPresence(appointment.id)}
                              disabled={isLoading.actions || confirmedPresenceAppointmentId === appointment.id}
                              className={`flex items-center px-3 py-1.5 rounded text-xs transition-colors ${
                                confirmedPresenceAppointmentId === appointment.id
                                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              {confirmedPresenceAppointmentId === appointment.id ? 'Présence confirmée ✓' : 'Confirmer la présence'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Salle d'attente compact */}
            <div
              ref={waitingSectionRef}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200 scroll-mt-4"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Salle d'attente ({waitingQueueStats.inWaitingRoom})
                </h3>
              </div>
              <div className="space-y-2">
                {displayedWaitingQueue.map((item, index) => (
                  <WaitingQueueItem
                    key={item.id}
                    item={item}
                    index={index}
                    onAuthorize={handleAuthorizePatient}
                    onMarkInConsultation={handleMarkInConsultation}
                    onReassign={handleReassign}
                    isLoading={isLoading}
                  />
                ))}
                {displayedWaitingQueue.length === 0 && (
                  <div className="text-center py-6">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Aucun patient en salle d'attente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications médecin-secrétaire (en bas de page) */}
            <NotificationPanel 
              notifications={notifications} 
              onRefresh={fetchNotifications}
              userProfile={userProfile}
              waitingQueue={waitingQueue}
              onAuthorizePatient={handleAuthorizePatient}
            />
          </div>
        )}

        {/* Mode Sélection compact */}
        {mode === 'select' && (
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher un patient</label>
              <div className="flex">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, prénom, numéro de dossier ou téléphone..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-medical-primary text-white rounded-r-lg hover:bg-medical-primary-dark"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-600 mb-2">{filteredPatients.length} patient(s) trouvé(s)</p>
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  selectedPatient={selectedPatient}
                  onSelect={handlePatientSelect}
                  onView={handleViewPatientDetails}
                  onEdit={handleEditPatient}
                  onAppointment={handleCreateAppointment}
                />
              ))}
              {filteredPatients.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Aucun patient trouvé</p>
                  <button
                    onClick={() => setMode('create')}
                    className="mt-2 text-medical-primary hover:underline text-sm"
                  >
                    Créer un nouveau patient
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode Création compact */}
        {mode === 'create' && (
          <>
            {/* Message de succès */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center mb-4">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Patient enregistré avec succès !</h3>
                  <p className="text-xs text-green-700">Le dossier patient a été créé.</p>
                </div>
              </div>
            )}

            {/* Formulaire compact */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informations personnelles */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Informations personnelles
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                      placeholder="Nom de famille"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date de naissance *</label>
                    <input
                      type="date"
                      name="date_naissance"
                      value={formData.date_naissance}
                      onChange={handleInputChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                      placeholder="77 123 45 67"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                      placeholder="Quartier, Ville"
                    />
                  </div>
                </div>

                {/* Informations médicales */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Informations médicales
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assurance</label>
                    <select
                      name="assurance"
                      value={formData.assurance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                    >
                      <option value="">Sélectionner une assurance</option>
                      <option value="IPM">IPM</option>
                      <option value="IPRES">IPRES</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Groupe sanguin</label>
                    <select
                      name="groupe_sanguin"
                      value={formData.groupe_sanguin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                    >
                      <option value="">Sélectionner</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                      placeholder="Allergies connues du patient..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Antécédents médicaux</label>
                    <textarea
                      name="antecedents"
                      value={formData.antecedents}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                      placeholder="Antécédents médicaux du patient..."
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-2" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Informations importantes compact */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-xs font-medium text-blue-800">Informations importantes</h3>
                  <ul className="mt-1 text-xs text-blue-700 space-y-0.5">
                    <li>• Les champs marqués d'un * sont obligatoires</li>
                    <li>• Les informations médicales peuvent être complétées ultérieurement</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal de réassignation de médecin */}
        {showReassignModal && selectedPatientForReassign && (
          <DoctorReassignModal
            isOpen={showReassignModal}
            onClose={() => {
              setShowReassignModal(false);
              setSelectedPatientForReassign(null);
            }}
            patient={selectedPatientForReassign}
            currentMedecinId={selectedPatientForReassign.medecin_id}
            onReassignComplete={handleReassignComplete}
          />
        )}
      </div>
    </div>
  );
};

export default IntroductionPatientPage;
