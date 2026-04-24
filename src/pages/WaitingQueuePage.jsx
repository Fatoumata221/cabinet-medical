import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Phone, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PatientForm from '../components/common/PatientForm';
import NotificationPanel from '../components/secretary/NotificationPanel';
import WebSocketDiagnostic from '../components/WebSocketDiagnostic';
import RealtimeTest from '../components/RealtimeTest';
import completeRealtimeService from '../services/completeRealtimeService';

const WaitingQueuePage = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [patientsPresents, setPatientsPresents] = useState(new Set());
  const [realtimeStatus, setRealtimeStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticStatus, setDiagnosticStatus] = useState(null);
  
  // Debounce pour éviter les rechargements trop fréquents
  const [reloadTimeoutId, setReloadTimeoutId] = useState(null);
  
  // Fonction de rechargement avec debounce
  const debouncedReload = () => {
    if (reloadTimeoutId) {
      clearTimeout(reloadTimeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      console.log('🔄 [WaitingQueue] Rechargement debouncé des données');
      loadData();
    }, 500); // Attendre 500ms avant de recharger
    
    setReloadTimeoutId(newTimeoutId);
  };

  // Configuration du service realtime complet
  const setupOptimizedRealtime = async () => {
    console.log('🚀 [WaitingQueue] Configuration service realtime complet...');
    setRealtimeStatus('connecting');
    
    try {
      // Initialiser le service realtime complet
      const initialized = await completeRealtimeService.initialize();
      if (!initialized) {
        console.error('❌ [WaitingQueue] Échec initialisation service realtime');
        setRealtimeStatus('error');
        return;
      }

      // Tester la connexion
      const connectionOk = await completeRealtimeService.testConnection();
      if (!connectionOk) {
        console.error('❌ [WaitingQueue] Test connexion échoué');
        setRealtimeStatus('error');
        return;
      }

      // S'abonner seulement aux tables nécessaires pour éviter les conflits
      completeRealtimeService.subscribeToAll({
        waitingQueue: () => {
          console.log('🔄 [WaitingQueue] File d\'attente mise à jour');
          debouncedReload();
        },
        appointments: () => {
          console.log('🔄 [WaitingQueue] Rendez-vous mis à jour');
          debouncedReload();
        }
      });

      // Vérifier le statut de connexion
      const status = completeRealtimeService.getConnectionStatus();
      if (status.isConnected) {
        setRealtimeStatus('connected');
        console.log('✅ [WaitingQueue] Service realtime complet connecté');
        console.log('📊 [WaitingQueue] Canaux actifs:', status.channelNames);
      } else {
        setRealtimeStatus('connecting');
        console.log('🔄 [WaitingQueue] Connexion service realtime en cours...');
      }

    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur configuration service realtime:', error);
      setRealtimeStatus('error');
    }
  };

  // Nettoyage du service realtime complet
  const cleanupOptimizedRealtime = () => {
    console.log('🧹 [WaitingQueue] Nettoyage service realtime complet...');
    
    // Nettoyer le timeout de debounce
    if (reloadTimeoutId) {
      clearTimeout(reloadTimeoutId);
      setReloadTimeoutId(null);
    }
    
    // Nettoyer le service realtime
    completeRealtimeService.cleanup();
    setRealtimeStatus('connecting');
  };

  // Fonction pour forcer la reconnexion
  const forceReconnect = async () => {
    console.log('🔄 [WaitingQueue] Reconnexion forcée...');
    setRealtimeStatus('connecting');
    
    try {
      // Nettoyer d'abord
      cleanupOptimizedRealtime();
      
      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reconfigurer
      await setupOptimizedRealtime();
      
      console.log('✅ [WaitingQueue] Reconnexion forcée terminée');
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur reconnexion forcée:', error);
      setRealtimeStatus('error');
    }
  };

  // Fonction pour recharger uniquement la file d'attente
  const loadWaitingQueueData = async () => {
    try {
      console.log('🔄 [WaitingQueue] Rechargement file d\'attente...');
      const { data: waitingQueueData, error: waitingError } = await supabase
        .from('waiting_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (waitingError) {
        console.error('❌ [WaitingQueue] Erreur rechargement file d\'attente:', waitingError);
        return;
      }

      // Récupérer les infos patients séparément
      const patientIds = Array.from(new Set((waitingQueueData || []).map(i => i.patient_id).filter(Boolean)));
      let patientMap = {};
      if (patientIds.length > 0) {
        const { data: patientsRows, error: patientsErr } = await supabase
          .from('patients')
          .select('id, nom, prenom, telephone, numero_dossier')
          .in('id', patientIds);
        if (patientsErr) {
          console.warn('❗ [WaitingQueue] Erreur récupération patients:', patientsErr);
        } else {
          patientMap = Object.fromEntries((patientsRows || []).map(p => [p.id, p]));
        }
      }

      // Transformer les données de la file d'attente en format patients
      const rawPatientsData = waitingQueueData?.map(item => {
        const p = patientMap[item.patient_id] || {};
        return {
          id: item.id, // ID de la file d'attente
          patient_id: item.patient_id, // ID du patient
          appointment_id: item.appointment_id || null,
          nom: p.nom || '',
          prenom: p.prenom || '',
          telephone: p.telephone || '',
          heureArrivee: new Date(item.arrived_at || item.updated_at || item.created_at).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          statut: item.status,
          priorite: item.priorite || 'normale',
          motif: item.motif || 'Consultation',
          tempsAttente: Math.floor((new Date() - new Date(item.arrived_at || item.created_at || item.updated_at)) / 60000),
          medecin_id: item.medecin_id
        };
      }) || [];

      // Déduplication par appointment_id si dispo, sinon par (patient_id, medecin_id, statut)
      const uniqueMap = new Map();
      for (const it of rawPatientsData) {
        const key = it.appointment_id
          ? `apt:${it.appointment_id}`
          : `p:${it.patient_id}-m:${it.medecin_id}-s:${it.statut}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, it);
      }
      const patientsData = Array.from(uniqueMap.values());

      setPatients(patientsData);
      console.log('✅ [WaitingQueue] File d\'attente mise à jour:', patientsData.length, 'patients');
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur rechargement file d\'attente:', error);
    }
  };

  // Fonction pour recharger uniquement les rendez-vous
  const loadAppointmentsData = async () => {
    try {
      console.log('🔄 [WaitingQueue] Rechargement rendez-vous...');
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier)
        `)
        .gte('date_heure', new Date().toISOString().split('T')[0])
        .order('date_heure', { ascending: false });

      if (appointmentsError) {
        console.error('❌ [WaitingQueue] Erreur rechargement rendez-vous:', appointmentsError);
        return;
      }

      // Transformer les rendez-vous en format attendu
      const transformedAppointments = appointmentsData?.map(apt => ({
        id: apt.id,
        patient_id: apt.patient_id,
        patient_nom: apt.patient?.nom || '',
        patient_prenom: apt.patient?.prenom || '',
        patient_telephone: apt.patient?.telephone || '',
        date_heure: apt.date_heure,
        motif: apt.motif || 'Consultation',
        medecin_id: apt.medecin_id,
        statut: apt.statut || 'programme'
      })) || [];

      setAppointments(transformedAppointments);
      console.log('✅ [WaitingQueue] Rendez-vous mis à jour:', transformedAppointments.length, 'rendez-vous');
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur rechargement rendez-vous:', error);
    }
  };

  // Charger les vraies données depuis Supabase (une seule fois)
  useEffect(() => {
    let mounted = true;
    
    const initializePage = async () => {
      if (!mounted) return;
      
      // Charger les données une seule fois
      await loadData();
      
      // Configurer WebSocket après chargement des données
      await setupOptimizedRealtime();
    };
    
    initializePage();
    
    // Nettoyer au démontage
    return () => {
      mounted = false;
      cleanupOptimizedRealtime();
    };
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 [WaitingQueue] Début du chargement des données...');
      setLoading(true);
      
      // Charger les patients depuis la file d'attente
      console.log('📋 [WaitingQueue] Récupération de la file d\'attente...');
      const { data: waitingQueueData, error: waitingError } = await supabase
        .from('waiting_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (waitingError) {
        console.error('❌ [WaitingQueue] Erreur file d\'attente:', waitingError);
        throw waitingError;
      }
      console.log('✅ [WaitingQueue] File d\'attente récupérée:', waitingQueueData?.length || 0, 'éléments');

      // Récupérer les infos patients séparément
      const patientIds = Array.from(new Set((waitingQueueData || []).map(i => i.patient_id).filter(Boolean)));
      let patientMap = {};
      if (patientIds.length > 0) {
        const { data: patientsRows, error: patientsErr } = await supabase
          .from('patients')
          .select('id, nom, prenom, telephone, numero_dossier')
          .in('id', patientIds);
        if (patientsErr) {
          console.warn('❗ [WaitingQueue] Erreur récupération patients:', patientsErr);
        } else {
          patientMap = Object.fromEntries((patientsRows || []).map(p => [p.id, p]));
        }
      }

      // Transformer les données de la file d'attente en format patients
      const rawPatientsData = waitingQueueData?.map(item => {
        const p = patientMap[item.patient_id] || {};
        return {
          id: item.id, // ID de la file d'attente
          patient_id: item.patient_id, // ID du patient
          appointment_id: item.appointment_id || null,
          nom: p.nom || '',
          prenom: p.prenom || '',
          telephone: p.telephone || '',
          heureArrivee: new Date(item.created_at).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          statut: item.status,
          priorite: item.priorite || 'normale',
          motif: item.motif || 'Consultation',
          tempsAttente: Math.floor((new Date() - new Date(item.created_at)) / 60000),
          medecin_id: item.medecin_id
        };
      }) || [];
      const uniqueMap2 = new Map();
      for (const it of rawPatientsData) {
        const key = it.appointment_id
          ? `apt:${it.appointment_id}`
          : `p:${it.patient_id}-m:${it.medecin_id}-s:${it.statut}`;
        if (!uniqueMap2.has(key)) uniqueMap2.set(key, it);
      }
      const patientsData = Array.from(uniqueMap2.values());
      console.log('🔄 [WaitingQueue] Patients transformés:', patientsData.length, 'patients');

      // Charger les rendez-vous
      console.log('📅 [WaitingQueue] Récupération des rendez-vous...');
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier)
        `)
        .gte('date_heure', new Date().toISOString().split('T')[0])
        .order('date_heure', { ascending: true });

      if (appointmentsError) {
        console.error('❌ [WaitingQueue] Erreur rendez-vous:', appointmentsError);
        throw appointmentsError;
      }
      console.log('✅ [WaitingQueue] Rendez-vous récupérés:', appointmentsData?.length || 0, 'rendez-vous');

      // Transformer les rendez-vous en format attendu
      const transformedAppointments = appointmentsData?.map(apt => ({
        id: apt.id,
        patient_id: apt.patient_id, // Ajouter le patient_id manquant
        patient_nom: apt.patient?.nom || '',
        patient_prenom: apt.patient?.prenom || '',
        patient_telephone: apt.patient?.telephone || '',
        date_heure: apt.date_heure,
        motif: apt.motif || 'Consultation',
        medecin_id: apt.medecin_id,
        statut: apt.statut || 'programme'
      })) || [];
      console.log('🔄 [WaitingQueue] Rendez-vous transformés:', transformedAppointments.length, 'rendez-vous');

      // Charger les médecins
      console.log('👨‍⚕️ [WaitingQueue] Récupération des médecins...');
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('users')
        .select('id, nom, prenom, specialite')
        .eq('role', 'doctor')
        .order('nom', { ascending: true });

      if (doctorsError) {
        console.error('❌ [WaitingQueue] Erreur médecins:', doctorsError);
        throw doctorsError;
      }
      console.log('✅ [WaitingQueue] Médecins récupérés:', doctorsData?.length || 0, 'médecins');

      const transformedDoctors = doctorsData?.map(doctor => ({
        id: doctor.id,
        nom: doctor.nom,
        prenom: doctor.prenom,
        specialite: doctor.specialite || 'Généraliste'
      })) || [];
      console.log('🔄 [WaitingQueue] Médecins transformés:', transformedDoctors.length, 'médecins');
      // Fallback: si aucun médecin n'est retourné via role='doctor', dériver depuis les rendez-vous
      let finalDoctors = transformedDoctors;
      if ((transformedDoctors?.length || 0) === 0) {
        const uniqueDoctorIds = Array.from(new Set((transformedAppointments || [])
          .map(a => a.medecin_id)
          .filter(Boolean)));
        if (uniqueDoctorIds.length > 0) {
          console.log('⚠️  [WaitingQueue] Aucun médecin via role=doctor, fallback par appointments, ids:', uniqueDoctorIds);
          const { data: doctorsById, error: doctorsByIdError } = await supabase
            .from('users')
            .select('id, nom, prenom, specialite')
            .in('id', uniqueDoctorIds);
          if (doctorsByIdError) {
            console.warn('❗ [WaitingQueue] Erreur fallback médecins par id:', doctorsByIdError);
          }
          if (doctorsById && doctorsById.length > 0) {
            finalDoctors = doctorsById.map(d => ({
              id: d.id,
              nom: d.nom || `#${d.id}`,
              prenom: d.prenom || '',
              specialite: d.specialite || 'Généraliste'
            }));
          } else {
            // Dernier recours: placeholders à partir des IDs
            finalDoctors = uniqueDoctorIds.map(id => ({
              id,
              nom: `Médecin ${id}`,
              prenom: '',
              specialite: 'N/A'
            }));
          }
          console.log('🔄 [WaitingQueue] Fallback médecins transformés:', finalDoctors.length);
        }
      }

      setPatients(patientsData);
      setAppointments(transformedAppointments);
      setDoctors(finalDoctors);
      
      console.log('🎉 [WaitingQueue] Chargement terminé avec succès!');
      console.log('📊 [WaitingQueue] Résumé:', {
        patients: patientsData.length,
        appointments: transformedAppointments.length,
        doctors: transformedDoctors.length
      });
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les rendez-vous quand le médecin change
  useEffect(() => {
    if (selectedDoctor) {
      console.log('🔍 [WaitingQueue] Filtrage par médecin:', selectedDoctor.prenom, selectedDoctor.nom);
      const filtered = appointments.filter(a => a.medecin_id === selectedDoctor.id);
      console.log('📋 [WaitingQueue] Rendez-vous filtrés:', filtered.length, 'pour le médecin', selectedDoctor.id);
      setFilteredAppointments(filtered);
    } else {
      console.log('🔍 [WaitingQueue] Aucun filtre médecin actif');
      setFilteredAppointments([]);
    }
  }, [selectedDoctor, appointments]);

  // Fonctions pour gérer les actions
  const handleAddPatient = async (patientData) => {
    try {
      console.log('➕ [WaitingQueue] Ajout d\'un nouveau patient:', patientData);
      
      // Générer le numéro de dossier automatiquement
      const { generateNumeroDossier } = await import('../services/patientService');
      const numeroDossier = await generateNumeroDossier();
      
      // Créer le patient dans la base de données
      console.log('👤 [WaitingQueue] Création du patient dans la base...');
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert([{
          nom: patientData.nom,
          prenom: patientData.prenom,
          telephone: patientData.telephone,
          numero_dossier: numeroDossier
        }])
        .select()
        .single();

      if (patientError) {
        console.error('❌ [WaitingQueue] Erreur création patient:', patientError);
        throw patientError;
      }
      console.log('✅ [WaitingQueue] Patient créé:', newPatient.id, newPatient.nom, newPatient.prenom);

      // Ajouter le patient à la file d'attente
      console.log('📋 [WaitingQueue] Ajout à la file d\'attente...');
      const { data: waitingQueueItem, error: waitingError } = await supabase
        .from('waiting_queue')
        .insert([{
          patient_id: newPatient.id,
          medecin_id: patientData.medecin_id,
          status: 'waiting',
          priorite: patientData.priorite,
          motif: patientData.motif
        }])
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier)
        `)
        .single();

      if (waitingError) {
        console.error('❌ [WaitingQueue] Erreur ajout file d\'attente:', waitingError);
        throw waitingError;
      }
      console.log('✅ [WaitingQueue] Patient ajouté à la file d\'attente:', waitingQueueItem.id);

      // Transformer en format attendu
      const transformedPatient = {
        id: waitingQueueItem.id,
        nom: waitingQueueItem.patient?.nom || '',
        prenom: waitingQueueItem.patient?.prenom || '',
        telephone: waitingQueueItem.patient?.telephone || '',
        heureArrivee: new Date(waitingQueueItem.created_at).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        statut: waitingQueueItem.status,
        priorite: waitingQueueItem.priorite || 'normale',
        motif: waitingQueueItem.motif || 'Consultation',
        tempsAttente: 0,
        medecin_id: waitingQueueItem.medecin_id
      };

      setPatients(prev => [...prev, transformedPatient]);
      setShowAddPatientModal(false);
      
      console.log('🎉 [WaitingQueue] Patient ajouté avec succès:', transformedPatient.prenom, transformedPatient.nom);
      
      // Afficher un toast de succès
      if (window.showNotification) {
        window.showNotification({
          message: `Patient ${transformedPatient.prenom} ${transformedPatient.nom} ajouté à la file d'attente !`,
          type: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur lors de l\'ajout du patient:', error);
      
      // Afficher un toast d'erreur
      if (window.showNotification) {
        window.showNotification({
          message: 'Erreur lors de l\'ajout du patient. Veuillez réessayer.',
          type: 'error',
          duration: 4000
        });
      }
    }
  };

  const handleStartConsultation = async (patientId) => {
    try {
      console.log('🏥 [WaitingQueue] Démarrage consultation pour patient:', patientId);
      const { error } = await supabase
        .from('waiting_queue')
        .update({ 
          status: 'in_consultation',
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) {
        console.error('❌ [WaitingQueue] Erreur démarrage consultation:', error);
        throw error;
      }
      console.log('✅ [WaitingQueue] Consultation démarrée pour patient:', patientId);
      
      // Mettre à jour l'état local au lieu de recharger toute la page
      setPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? { ...patient, statut: 'in_consultation' }
          : patient
      ));
      
      // Afficher un toast de succès
      if (window.showNotification) {
        window.showNotification({
          message: 'Consultation démarrée avec succès !',
          type: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur lors du démarrage de la consultation:', error);
      
      // Afficher un toast d'erreur
      if (window.showNotification) {
        window.showNotification({
          message: 'Erreur lors du démarrage de la consultation',
          type: 'error',
          duration: 4000
        });
      }
    }
  };

  const handleCancelPatient = async (patientId) => {
    try {
      console.log('❌ [WaitingQueue] Annulation patient:', patientId);
      const { error } = await supabase
        .from('waiting_queue')
        .update({ 
          status: 'absent',
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) {
        console.error('❌ [WaitingQueue] Erreur annulation patient:', error);
        throw error;
      }
      console.log('✅ [WaitingQueue] Patient annulé:', patientId);
      
      // Retirer le patient de la liste au lieu de recharger toute la page
      setPatients(prev => prev.filter(patient => patient.id !== patientId));
      
      // Afficher un toast d'information
      if (window.showNotification) {
        window.showNotification({
          message: 'Patient marqué comme absent',
          type: 'warning',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur lors de l\'annulation du patient:', error);
      
      // Afficher un toast d'erreur
      if (window.showNotification) {
        window.showNotification({
          message: 'Erreur lors de l\'annulation du patient',
          type: 'error',
          duration: 4000
        });
      }
    }
  };

  const handleMarkPresent = async (patientId) => {
    try {
      console.log('✅ [WaitingQueue] Marquage présent patient:', patientId);
      // Marquer le patient comme présent
      setPatientsPresents(prev => new Set([...prev, patientId]));
      
      const { error } = await supabase
        .from('waiting_queue')
        .update({ 
          status: 'present',
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) {
        console.error('❌ [WaitingQueue] Erreur marquage présent:', error);
        throw error;
      }
      console.log('✅ [WaitingQueue] Patient marqué présent:', patientId);
      
      // Mettre à jour l'état local au lieu de recharger toute la page
      setPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? { ...patient, statut: 'present' }
          : patient
      ));
      
      // Afficher un toast de succès
      if (window.showNotification) {
        window.showNotification({
          message: 'Patient marqué comme présent et ajouté à la file d\'attente !',
          type: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur lors du marquage présent:', error);
    }
  };

  // Fonction pour marquer un patient appelé comme présent
  const handleMarkCalledPatientPresent = async (patientId) => {
    try {
      console.log('✅ [WaitingQueue] Marquage patient appelé présent:', patientId);
      
      const { error } = await supabase
        .from('waiting_queue')
        .update({ 
          status: 'present',
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) {
        console.error('❌ [WaitingQueue] Erreur marquage présent:', error);
        throw error;
      }

      console.log('✅ [WaitingQueue] Patient appelé marqué comme présent:', patientId);
      
      // Mettre à jour l'état local
      setPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? { ...patient, statut: 'present' }
          : patient
      ));
      
      // Afficher un toast de succès
      if (window.showNotification) {
        window.showNotification({
          message: 'Patient marqué comme présent !',
          type: 'success',
          duration: 3000
        });
      }
      
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur lors du marquage présent:', error);
      
      // Afficher un toast d'erreur
      if (window.showNotification) {
        window.showNotification({
          message: 'Erreur lors du marquage du patient comme présent',
          type: 'error',
          duration: 4000
        });
      }
    }
  };

  // Nouvelle fonction pour ajouter un patient depuis un rendez-vous à la file d'attente
  const handleAddPatientFromAppointment = async (appointmentId) => {
    try {
      console.log('🔄 [WaitingQueue] Ajout patient depuis rendez-vous:', appointmentId);
      
      // Récupérer les détails du rendez-vous
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) {
        throw new Error('Rendez-vous non trouvé');
      }

      console.log('📋 [WaitingQueue] Détails du rendez-vous:', {
        id: appointment.id,
        patient_id: appointment.patient_id,
        medecin_id: appointment.medecin_id,
        patient_nom: appointment.patient_nom,
        patient_prenom: appointment.patient_prenom
      });

      // Logique manuelle désactivée: l'ajout est automatique lors de la création du RDV
      if (window.showNotification) {
        window.showNotification({
          message: 'Ajout automatique déjà géré à la création du RDV',
          type: 'info',
          duration: 2500
        });
      }

      // Recharger la file pour refléter l'état courant
      await loadWaitingQueueData();
    } catch (error) {
      console.error('❌ [WaitingQueue] Erreur lors de l\'ajout du patient:', error);
      
      // Afficher un toast d'erreur
      if (window.showNotification) {
        window.showNotification({
          message: 'Erreur lors de l\'ajout du patient: ' + error.message,
          type: 'error',
          duration: 4000
        });
      }
    }
  };

  const getStatusBadge = (statut) => {
    const statusClasses = {
      waiting: 'bg-yellow-100 text-yellow-800',
      in_consultation: 'bg-blue-100 text-blue-800',
      finished: 'bg-green-100 text-green-800',
      late: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800',
      present: 'bg-purple-100 text-purple-800'
    };
    
    const statusLabels = {
      waiting: 'En attente',
      in_consultation: 'En consultation',
      finished: 'Terminé',
      late: 'En retard',
      emergency: 'Urgence',
      present: 'Présent'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[statut] || statusClasses.waiting}`}>
        {statusLabels[statut] || statut}
      </span>
    );
  };

  const getPriorityBadge = (priorite) => {
    const priorityClasses = {
      normale: 'bg-gray-100 text-gray-800',
      urgente: 'bg-orange-100 text-orange-800',
      tres_urgente: 'bg-red-100 text-red-800'
    };
    
    const priorityLabels = {
      normale: 'Normale',
      urgente: 'Urgente',
      tres_urgente: 'Très urgente'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityClasses[priorite] || priorityClasses.normale}`}>
        {priorityLabels[priorite] || priorite}
      </span>
    );
  };

  // Filtrer les patients selon le médecin sélectionné
  const patientsEnAttente = selectedDoctor 
    ? patients.filter(p => (p.statut === 'waiting' || p.statut === 'called') && p.medecin_id === selectedDoctor.id)
    : patients.filter(p => p.statut === 'waiting' || p.statut === 'called');
    
  const patientsEnConsultation = selectedDoctor 
    ? patients.filter(p => p.statut === 'in_consultation' && p.medecin_id === selectedDoctor.id)
    : patients.filter(p => p.statut === 'in_consultation');

  // Filtrer les patients en attente par recherche
  const filteredPatientsEnAttente = patientsEnAttente.filter(patient =>
    patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.motif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour vérifier si un patient est présent
  const isPatientPresent = (patientId) => {
    return patientsPresents.has(patientId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-medical-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la file d'attente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-8 h-8 text-medical-primary" />
            File d'Attente
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              realtimeStatus === 'connected' 
                ? 'bg-green-100 text-green-800 animate-pulse' 
                : realtimeStatus === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800 animate-pulse'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-1 ${
                realtimeStatus === 'connected' 
                  ? 'bg-green-500' 
                  : realtimeStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}></div>
              {realtimeStatus === 'connected' 
                ? 'Temps réel' 
                : realtimeStatus === 'error'
                ? 'Erreur WebSocket'
                : 'Connexion WebSocket...'
              }
            </span>
            {diagnosticStatus && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                diagnosticStatus.allOk 
                  ? 'bg-green-100 text-green-800' 
                  : diagnosticStatus.hasError
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  diagnosticStatus.allOk 
                    ? 'bg-green-500' 
                    : diagnosticStatus.hasError
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}></div>
                {diagnosticStatus.allOk 
                  ? 'Diagnostic OK' 
                  : diagnosticStatus.hasError
                  ? 'Problèmes détectés'
                  : 'Diagnostic en cours'
                }
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez la file d'attente des patients en temps réel avec WebSockets
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={loadData}
            className="btn btn-secondary flex items-center gap-2"
            title="Actualiser les données"
          >
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
          <button 
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            className={`btn flex items-center gap-2 ${
              realtimeStatus === 'error' ? 'btn-danger' : 'btn-outline'
            }`}
            title="Diagnostic WebSocket"
          >
            <AlertCircle className="w-5 h-5" />
            Diagnostic
          </button>
          {realtimeStatus === 'error' && (
            <button 
              onClick={forceReconnect}
              className="btn btn-warning flex items-center gap-2"
              title="Forcer la reconnexion"
            >
              <RefreshCw className="w-5 h-5" />
              Reconnexion
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowDoctorSearch(!showDoctorSearch)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              {selectedDoctor ? `${selectedDoctor.prenom} ${selectedDoctor.nom}` : 'Filtrer par médecin'}
            </button>
            
            {/* Recherche dynamique des médecins */}
            {showDoctorSearch && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Sélectionner un médecin</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un médecin..."
                      value={doctorSearchTerm}
                      onChange={(e) => setDoctorSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {doctors
                    .filter(doctor => 
                      doctor.nom.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
                      doctor.prenom.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
                      doctor.specialite.toLowerCase().includes(doctorSearchTerm.toLowerCase())
                    )
                    .map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setShowDoctorSearch(false);
                          setDoctorSearchTerm('');
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-medical-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {(doctor.prenom?.[0] || '').toUpperCase()}{(doctor.nom?.[0] || '').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doctor.prenom} {doctor.nom}</p>
                            <p className="text-sm text-gray-600">{doctor.specialite}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
                
                <div className="p-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      setShowDoctorSearch(false);
                      setDoctorSearchTerm('');
                    }}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Afficher tous les patients
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card card-medical">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {selectedDoctor ? `En attente - ${selectedDoctor.prenom}` : 'Total en attente'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{patientsEnAttente.length}</p>
            </div>
            <Clock className="w-8 h-8 text-medical-primary" />
          </div>
        </div>
        
        <div className="card card-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {selectedDoctor ? `En consultation - ${selectedDoctor.prenom}` : 'En consultation'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{patientsEnConsultation.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="card card-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Temps moyen</p>
              <p className="text-2xl font-bold text-gray-900">18 min</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="card card-danger">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgences</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.filter(p => p.priorite === 'urgente' || p.priorite === 'tres_urgente').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* File d'attente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patients en attente */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              En Attente ({patientsEnAttente.length})
              {selectedDoctor && (
                <span className="text-sm font-normal text-gray-500">
                  - {selectedDoctor.prenom} {selectedDoctor.nom}
                </span>
              )}
              <span className="text-xs text-green-600 font-medium">• Mise à jour automatique</span>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-96">
            {filteredPatientsEnAttente.map((patient, index) => {
              const doctor = doctors.find(d => d.id === patient.medecin_id);
              const isFromAppointment = isPatientPresent(patient.id);
              const isCalled = patient.statut === 'called';
              
              // Déterminer les classes CSS selon le statut
              let cardClass = 'border-gray-200';
              let avatarClass = 'bg-gradient-to-br from-medical-primary to-medical-secondary';
              
              if (isFromAppointment) {
                cardClass = 'border-green-200 bg-green-50';
                avatarClass = 'bg-gradient-to-br from-green-500 to-green-600';
              } else if (isCalled) {
                cardClass = 'border-orange-200 bg-orange-50';
                avatarClass = 'bg-gradient-to-br from-orange-500 to-orange-600';
              }
              
              return (
                <div key={patient.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${cardClass} ${isCalled ? 'animate-pulse' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarClass}`}>
                        {patient.prenom[0]}{patient.nom[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {patient.prenom} {patient.nom}
                          </p>
                          {doctor && (
                            <p className="text-xs text-gray-500">Dr. {doctor.prenom} {doctor.nom} {doctor.specialite ? `- ${doctor.specialite}` : ''}</p>
                          )}
                          {isFromAppointment && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              RDV
                            </span>
                          )}
                          {isCalled && (
                            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Appelé
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{patient.motif}</p>
                      </div>
                    </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityBadge(patient.priorite)}
                      <span className="text-sm text-gray-500">
                        {patient.tempsAttente} min
                      </span>
                    </div>
                      <p className="text-xs text-gray-400">
                        Arrivé à {patient.heureArrivee}
                      </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {patient.telephone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {patient.heureArrivee}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => (isCalled ? handleMarkCalledPatientPresent(patient.id) : handleMarkPresent(patient.id))}
                      className="flex items-center gap-1 px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      title="Marquer présent"
                    >
                      <UserCheck className="w-4 h-4" />
                      Présent
                    </button>
                    <button 
                      onClick={() => handleCancelPatient(patient.id)}
                      className="flex items-center gap-1 px-3 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Marquer absent"
                    >
                      <XCircle className="w-4 h-4" />
                      Absent
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
            
            {filteredPatientsEnAttente.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun patient en attente</p>
              </div>
            )}
          </div>
        </div>

        
      </div>

      {/* Section Rendez-vous - Visible seulement après sélection d'un médecin */}
      {selectedDoctor && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-medical-primary" />
              Rendez-vous de {selectedDoctor.prenom} {selectedDoctor.nom} ({filteredAppointments.length})
              <span className="text-xs text-green-600 font-medium">• Mise à jour automatique</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Filtré pour : <span className="font-medium">{selectedDoctor.prenom} {selectedDoctor.nom}</span> - {selectedDoctor.specialite}
            </p>
          </div>
          
          <div className="p-4">
            {filteredAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-96">
                {filteredAppointments.map((appointment) => {
                  const isPresent = isPatientPresent(appointment.id);
                  return (
                    <div key={appointment.id} className={`rounded-lg p-4 border transition-colors ${
                      isPresent 
                        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                          isPresent ? 'bg-green-500' : 'bg-medical-primary'
                        }`}>
                          {appointment.patient_prenom[0]}{appointment.patient_nom[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {appointment.patient_prenom} {appointment.patient_nom}
                            </h3>
                            {isPresent && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Présent
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Tél: {appointment.patient_telephone}</p>
                        </div>
                      </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">{appointment.motif}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {appointment.patient_telephone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(appointment.date_heure).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Programmé
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {selectedDoctor.prenom} {selectedDoctor.nom}
                        </div>
                        <div className="text-gray-500">{selectedDoctor.specialite}</div>
                      </div>
                      
                      {/* Bouton Présent pour ajouter à la file d'attente */}
                      <div className="pt-2 border-t border-gray-200">
                        {isPresent ? (
                          <div className="w-full bg-green-100 text-green-800 text-xs font-medium py-2 px-3 rounded-md flex items-center justify-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            Déjà présent dans la file d'attente
                          </div>
                        ) : (
                          <div className="w-full bg-blue-50 text-blue-800 text-xs font-medium py-2 px-3 rounded-md flex items-center justify-center gap-2">
                            Ajout automatique à la file d'attente activé
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Aucun rendez-vous pour {selectedDoctor.prenom} {selectedDoctor.nom}
                </p>
                <p className="text-gray-400">Ce médecin n'a pas de patients en attente actuellement</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal pour ajouter un nouveau patient */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PatientForm
            doctors={doctors}
            onSubmit={handleAddPatient}
            onCancel={() => setShowAddPatientModal(false)}
            title="Ajouter un nouveau patient"
            submitText="Ajouter le patient"
            defaultDoctor={selectedDoctor}
          />
        </div>
      )}
      
      {/* Panel de notifications temps réel */}
      <NotificationPanel 
        onNotificationAction={(action, notification) => {
          console.log('🔔 [WaitingQueue] Action notification:', action, notification);
          // Recharger les données après une action
          loadData();
        }}
      />

      {/* Diagnostic WebSocket - Affiché conditionnellement */}
      {showDiagnostic && (
        <div className="mt-6 space-y-4">
          <RealtimeTest />
          <WebSocketDiagnostic onStatusChange={setDiagnosticStatus} />
        </div>
      )}
    </div>
  );
};

export default WaitingQueuePage;

