import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendNotification, NOTIFICATION_TYPES } from '../lib/notifications';
import { 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Search,
  User,
  Eye,
  Edit,
  Clock,
  UserCheck,
  Bell,
  CheckSquare,
  Users,
  Shield,
  UserX,
  Loader2,
  Activity
} from 'lucide-react';
import { unifiedNotificationService } from '../services/unifiedNotificationService';
import 'react-toastify/dist/ReactToastify.css';

const IntroductionPatientPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('waiting_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_consultation')
        .gte('created_at', today.toISOString());
      if (error) throw error;
      setConsultationCount(count || 0);
    } catch (error) {
      handleError(error, 'le comptage des patients en consultation');
    }
  }, [handleError]);

  // Récupérer les notifications pour la secrétaire
  const fetchNotifications = useCallback(async () => {
    try {
      // 1) Récupérer les notifications sans jointures
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications_medecin_secretaire')
        .select('*')
        .eq('lu', false)
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

  // Charger la file d'attente avec gestion du chargement et des erreurs
  const fetchWaitingQueue = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, waitingQueue: true }));
    try {
      // 1) Récupérer la file sans jointures
      const { data: queue, error: qErr } = await supabase
        .from('waiting_queue')
        .select('*')
        .in('status', ['waiting', 'present', 'called', 'arrive', 'appele', 'medecin_pret', 'authorized', 'en_route', 'in_consultation'])
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;

      const list = Array.isArray(queue) ? queue : [];
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
      setWaitingQueue(enriched);
      return enriched;
    } catch (error) {
      handleError(error, 'la récupération de la file d\'attente');
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, waitingQueue: false }));
    }
  }, [handleError]);

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

  // Gestion des arrivées des patients
  const handleMarkPatientArrived = async (appointmentId) => {
    if (!appointmentId) {
      unifiedNotificationService.error('ID de rendez-vous manquant');
      return;
    }

    setIsLoading(prev => ({ ...prev, actions: true }));
    
    try {
      const { data, error } = await supabase.rpc('secretaire_marque_patient_arrive', {
        p_appointment_id: appointmentId,
        p_secretaire_id: userProfile?.id
      });

      if (error) throw error;

      if (data?.success) {
        await Promise.all([fetchWaitingQueue(), fetchTodayAppointments(), fetchConsultationCount()]);
        unifiedNotificationService.success(data.message || 'Patient marqué comme arrivé avec succès');
      } else {
        throw new Error(data?.error || 'Erreur inconnue lors du marquage du patient');
      }
    } catch (error) {
      console.error('Erreur lors du marquage du patient comme arrivé:', error);
      unifiedNotificationService.error(error.message || 'Erreur lors du marquage du patient comme arrivé');
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

      // Gérer les différents statuts
      if (current.status === 'en_route') {
        throw new Error('Le patient est déjà en route vers le médecin');
      }
      
      if (current.status === 'in_consultation') {
        throw new Error('Le patient est déjà en consultation');
      }
      
      // Si le médecin n'est pas prêt, afficher un message informatif mais permettre l'action
      if (current.status !== 'medecin_pret') {
        console.warn('Médecin pas encore prêt, mais autorisation forcée par secrétaire');
      }

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
      unifiedNotificationService.success(`${patientName} est en route vers le médecin`);
    } catch (error) {
      console.error('❌ [IntroductionPatient] Erreur lors de l\'autorisation du patient:', error);
      unifiedNotificationService.error(error.message || 'Erreur lors de l\'envoi du patient en consultation');
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

  // Rendu principal
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Notification Toast */}
      <div className="fixed top-4 right-4 z-50">
        <div className="toast toast-top toast-end"></div>
      </div>
      
      {/* Indicateur de chargement global */}
      {isLoading.actions && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
            <span className="text-gray-700">Traitement en cours...</span>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Introduction Patient</h1>
          <p className="text-gray-600">
            {mode === 'arrivals' ? 'Gérez les arrivées des patients et la communication avec les médecins' :
             mode === 'select' ? 'Sélectionnez un patient existant ou créez-en un nouveau' : 
             'Enregistrement d\'un nouveau patient'}
          </p>
        </div>

        {/* Notifications médecin-secrétaire */}
        {notifications.length > 0 && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Bell className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900">
                  Notifications ({notifications.length})
                </h3>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`bg-white p-3 rounded border border-blue-100 ${
                      (notification.type_notification === 'doctor_request' || notification.type_notification === 'demande_autorisation')
                        ? 'cursor-pointer hover:bg-blue-50 transition-colors' 
                        : ''
                    }`}
                    onClick={async () => {
                      // Marquer comme lu automatiquement lors du clic
                      if (!notification.lu) {
                        try {
                          await supabase
                            .from('notifications_medecin_secretaire')
                            .update({ lu: true, lu_at: new Date().toISOString() })
                            .eq('id', notification.id);
                          fetchNotifications();
                        } catch (error) {
                          console.error('Erreur marquage notification:', error);
                        }
                      }
                    }}
                  >
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    {(notification.type_notification === 'doctor_request' || notification.type_notification === 'demande_autorisation') && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        👆 Cliquez pour marquer comme lu
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {!notification.lu && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Non lu
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length > 3 && (
                  <p className="text-xs text-blue-600 text-center">
                    +{notifications.length - 3} autres notifications
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Boutons de mode */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setMode('arrivals')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'arrivals' 
                ? 'bg-medical-primary text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Gestion des arrivées
          </button>
          <button
            onClick={() => setMode('select')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'select' 
                ? 'bg-medical-primary text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Search className="w-5 h-5 mr-2" />
            Sélectionner un patient
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'create' 
                ? 'bg-medical-primary text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Nouveau patient
          </button>
        </div>

        {mode === 'arrivals' && (
          <div className="space-y-6">
            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">RDV Aujourd'hui</p>
                    <p className="text-2xl font-bold text-blue-900">{appointments.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-orange-700">En attente</p>
                    <p className="text-2xl font-bold text-orange-900">{waitingQueue.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-700">En consultation</p>
                    <p className="text-2xl font-bold text-green-900">{consultationCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center">
                  <Bell className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-purple-700">Médecins prêts</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {waitingQueue.filter(q => q.medecin_disponible).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Salle d'attente */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Salle d'attente ({waitingQueue.length})
                </h3>
              </div>
              <div className="space-y-3">
                {waitingQueue.map((item, index) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-medical-primary text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">
                              {item.patient?.prenom} {item.patient?.nom}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'present' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'called' ? 'bg-orange-100 text-orange-800' :
                              item.status === 'medecin_pret' ? 'bg-cyan-100 text-cyan-800' :
                              item.status === 'en_route' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status === 'waiting' ? 'En attente' :
                               item.status === 'present' ? 'Présent' :
                               item.status === 'called' ? 'Appelé' :
                               item.status === 'medecin_pret' ? 'Médecin prêt' :
                               item.status === 'en_route' ? 'En route' : item.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Dr. {item.medecin?.prenom} {item.medecin?.nom} {item.medecin?.specialite ? `- ${item.medecin?.specialite}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.created_at && (
                          <p className="text-xs text-gray-400">Arrivé: {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      {/* Indicateur de statut */}
                      <div className="flex items-center">
                        {item.status === 'arrive' ? (
                          <div className="px-3 py-1 rounded-lg bg-orange-100 text-orange-800 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            En attente du médecin
                          </div>
                        ) : item.status === 'medecin_pret' ? (
                          <div className="px-3 py-1 rounded-lg bg-green-100 text-green-800 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Médecin prêt
                          </div>
                        ) : item.status === 'en_route' ? (
                          <div className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Patient en route
                          </div>
                        ) : item.status === 'in_consultation' ? (
                          <div className="px-3 py-1 rounded-lg bg-purple-100 text-purple-800 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            En consultation
                          </div>
                        ) : item.status === 'appele' ? (
                          <div className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-800 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Patient appelé
                          </div>
                        ) : item.status === 'authorized' ? (
                          <div className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Médecin va recevoir
                          </div>
                        ) : (
                          <div className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            {item.status}
                          </div>
                        )}
                      </div>
                      
                      {/* Bouton autoriser toujours présent */}
                      <button
                        onClick={() => handleAuthorizePatient(item.id)}
                        disabled={isLoading.actions || ['en_route', 'in_consultation'].includes(item.status)}
                        className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 ${
                          ['medecin_pret', 'authorized'].includes(item.status)
                            ? 'bg-green-600 hover:bg-green-700' 
                            : ['en_route', 'in_consultation'].includes(item.status)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600'
                        } ${isLoading.actions ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={
                          item.status === 'medecin_pret' 
                            ? "Introduire patient" 
                            : item.status === 'authorized'
                            ? "Médecin va recevoir - Autoriser maintenant"
                            : item.status === 'en_route'
                            ? "Patient déjà en route"
                            : item.status === 'in_consultation'
                            ? "Patient déjà en consultation"
                            : "Le médecin doit d'abord se rendre disponible"
                        }
                      >
                        <CheckSquare className="w-4 h-4" />
                        {item.status === 'en_route' ? 'En route' : 
                         item.status === 'in_consultation' ? 'En consultation' :
                         'Introduire patient'}
                      </button>
                    </div>
                  </div>
                ))}
                {waitingQueue.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Aucun patient en salle d'attente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mode Sélection */}
        {mode === 'select' && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher un patient</label>
              <div className="flex">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, prénom, numéro de dossier ou téléphone..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                />
                <button
                  type="button"
                  className="px-6 py-2 bg-medical-primary text-white rounded-r-lg hover:bg-medical-primary-dark"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">{filteredPatients.length} patient(s) trouvé(s)</p>
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 border border-gray-200 rounded-lg transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="h-12 w-12 rounded-full bg-medical-primary flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.prenom} {patient.nom}</p>
                        <p className="text-sm text-gray-500">
                          {patient.date_naissance && new Date(patient.date_naissance).toLocaleDateString('fr-FR')} • 
                          {patient.telephone || 'Pas de téléphone'}
                        </p>
                        <p className="text-xs text-gray-500">N° Dossier: {patient.numero_dossier || '-'} • {patient.numero_ipm || 'Pas de N° IPM'}</p>
                      </div>
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPatientDetails(patient);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPatient(patient);
                        }}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateAppointment(patient);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Prendre rendez-vous"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Actions rapides pour le patient sélectionné */}
                  {selectedPatient?.id === patient.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Actions rapides :</p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewPatientDetails(patient)}
                          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </button>
                        <button
                          onClick={() => handleEditPatient(patient)}
                          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleCreateAppointment(patient)}
                          className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Prendre RDV
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredPatients.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun patient trouvé</p>
                  <button
                    onClick={() => setMode('create')}
                    className="mt-4 text-medical-primary hover:underline"
                  >
                    Créer un nouveau patient
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode Création */}
        {mode === 'create' && (
          <>
            {/* Message de succès */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center mb-6">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Patient enregistré avec succès !</h3>
                  <p className="text-sm text-green-700">Le dossier patient a été créé et est maintenant disponible.</p>
                </div>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Informations personnelles
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                      placeholder="Nom de famille"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                    <input
                      type="date"
                      name="date_naissance"
                      value={formData.date_naissance}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                      placeholder="77 123 45 67"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                      placeholder="Quartier, Ville"
                    />
                  </div>
                </div>

                {/* Informations médicales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Informations médicales
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assurance</label>
                    <select
                      name="assurance"
                      value={formData.assurance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    >
                      <option value="">Sélectionner une assurance</option>
                      <option value="IPM">IPM</option>
                      <option value="IPRES">IPRES</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Groupe sanguin</label>
                    <select
                      name="groupe_sanguin"
                      value={formData.groupe_sanguin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                      placeholder="Allergies connues du patient..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antécédents médicaux</label>
                    <textarea
                      name="antecedents"
                      value={formData.antecedents}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                      placeholder="Antécédents médicaux du patient..."
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer le patient
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Informations importantes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Informations importantes</h3>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Les champs marqués d'un * sont obligatoires</li>
                    <li>• Le numéro IPM/CSS est optionnel mais recommandé</li>
                    <li>• Les informations médicales peuvent être complétées ultérieurement</li>
                    <li>• Un dossier patient sera automatiquement créé après enregistrement</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IntroductionPatientPage;
