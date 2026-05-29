import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon,
  MapPin,
  FileText,
  Bell,
  Volume2,
  VolumeX,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Zap,
  Moon,
  Sun,
  Stethoscope
} from 'lucide-react';
import { 
  appointmentService, 
  patientService, 
  userService,
  waitingQueueService,
  notificationService
} from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import AppointmentTypeMotifFields, { resolveAppointmentMotif } from './common/AppointmentTypeMotifFields';
import { useAlert } from '../contexts/AlertContext';
import { supabase } from '../lib/supabase';
import '../styles/customCalendar.css';

const CustomCalendar = ({ selectedDoctorFilter = 'all' }) => {
  const { currentUser, hasRole } = useAuth();
  const { showError } = useAlert();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [selectedSpecialite, setSelectedSpecialite] = useState('all');
  const [disponibilites, setDisponibilites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [calendarView, setCalendarView] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(selectedDoctorFilter);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    patient_id: '',
    medecin_id: '',
    date_heure: '',
    motif: '',
    motif_autre: '',
    motif_detaille: '',
    duree: 30,
    priorite: 'normale',
    statut: 'confirme',
    couleur: '',
    type_rdv: 'consultation',
    notes: '',
    heure_fin: '',
    rappel_envoye: false,
    rappel_veille_envoye: false,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null
  });
  const audioRef = useRef(null);

  // Synchroniser le filtre médecin si fourni par un parent
  useEffect(() => {
    setSelectedDoctor(selectedDoctorFilter);
  }, [selectedDoctorFilter]);

  // Charger la dernière sélection de médecin depuis localStorage si aucun filtre parent n'est imposé
  useEffect(() => {
    if (!selectedDoctorFilter || selectedDoctorFilter === 'all') {
      const saved = localStorage.getItem('calendar_selected_doctor');
      if (saved) setSelectedDoctor(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarder la sélection docteur
  useEffect(() => {
    try {
      localStorage.setItem('calendar_selected_doctor', String(selectedDoctor));
    } catch {}
  }, [selectedDoctor]);

  // Heures de travail
  const workingHours = Array.from({ length: 15 }, (_, i) => i + 8); // 8h à 22h
  const timeSlots = [];
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  useEffect(() => {
    loadData();
    setTimeout(() => setAnimatedStats(true), 100);
  }, []);

  // Charger les spécialités
  useEffect(() => {
    fetchSpecialites();
  }, []);

  // Charger les disponibilités quand la date sélectionnée change
  useEffect(() => {
    if (medecins.length > 0) {
      fetchDisponibilites();
    }
  }, [selectedDate, medecins]);

  const fetchSpecialites = async () => {
    try {
      // D'abord essayer de charger depuis la table specialites
      const { data: specialitesData, error: specialitesError } = await supabase
        .from('specialites')
        .select('*')
        .eq('actif', true)
        .order('nom');

      if (!specialitesError && specialitesData && specialitesData.length > 0) {
        setSpecialites(specialitesData);
      } else {
        // Fallback: dériver les spécialités depuis les médecins
        const { data: medecinsData } = await supabase
          .from('users')
          .select('specialite')
          .eq('role', 'doctor')
          .not('specialite', 'is', null);

        if (medecinsData) {
          const specialitesUniques = [...new Set(medecinsData.map(m => m.specialite).filter(Boolean))];
          setSpecialites(specialitesUniques.map(nom => ({ nom, id: nom })));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
    }
  };

  const fetchDisponibilites = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const medecinIds = medecins.map(m => m.id);

      if (medecinIds.length === 0) return;

      const { data, error } = await supabase
        .from('disponibilites_medecins')
        .select('*')
        .eq('date_disponibilite', dateStr)
        .in('medecin_id', medecinIds);

      if (error) throw error;
      setDisponibilites(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des disponibilités:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const ignoreSpecialityForSecretary = currentUser?.role === 'secretary'
      const [appointmentsData, patientsData, medecinsData, waitingQueueData, notificationsData] = await Promise.all([
        appointmentService.getAll({ ignoreSpecialityFilter: ignoreSpecialityForSecretary }).catch(() => []),
        patientService.getAll().catch(() => []),
        userService.getDoctors({ ignoreSpecialityFilter: ignoreSpecialityForSecretary }).catch(() => []),
        waitingQueueService.getAll().catch(() => []),
        notificationService.getByUser(currentUser.id).catch(() => [])
      ]);

      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
      setMedecins(medecinsData || []);
      setWaitingQueue(waitingQueueData || []);
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Pas de données de fallback, on laisse les tableaux vides
      setAppointments([]);
      setPatients([]);
      setMedecins([]);
      setWaitingQueue([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatWeekRange = (date) => {
    const start = new Date(date);
    const end = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    end.setDate(start.getDate() + 6);
    const format = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    return `Semaine du ${format(start)} au ${format(end)}`;
  };

  // Écouter les changements de la file d'attente en temps réel
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newWaitingQueue = await waitingQueueService.getAll();
        setWaitingQueue(newWaitingQueue);
        
        const newCalledPatients = newWaitingQueue.filter(q => 
          q.status === 'present' && q.called_at && 
          !waitingQueue.find(oldQ => oldQ.id === q.id && oldQ.called_at === q.called_at)
        );

        if (newCalledPatients.length > 0 && soundEnabled) {
          playNotificationSound();
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [waitingQueue, soundEnabled]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Erreur audio:', e));
    }
  };

  const toggleSound = () => setSoundEnabled(!soundEnabled);

  // Filtrer les médecins par spécialité
  const filteredMedecins = (medecins || []).filter(medecin => {
    if (selectedSpecialite === 'all') return true;
    if (!specialites || specialites.length === 0) return true;
    // Normaliser la comparaison en convertissant les deux côtés en string pour gérer les types numériques
    const selectedSpecialiteStr = String(selectedSpecialite);
    const selectedSpecialiteObj = specialites.find(s => {
      const sIdStr = s.id ? String(s.id) : null;
      const sNomStr = s.nom ? String(s.nom) : null;
      return sIdStr === selectedSpecialiteStr || sNomStr === selectedSpecialiteStr;
    });
    const specialiteNom = selectedSpecialiteObj?.nom || selectedSpecialite;
    return medecin.specialite === specialiteNom;
  });

  // Obtenir la disponibilité d'un médecin pour la date sélectionnée
  const getMedecinDisponibilite = (medecinId) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return disponibilites.find(d => 
      d.medecin_id === medecinId && 
      d.date_disponibilite === dateStr
    );
  };

  // Filtrer les rendez-vous (les données du médecin sont déjà chargées dans apt.medecin)
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = searchTerm === '' || 
      apt.patient?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.motif?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrer par spécialité si sélectionnée (utiliser directement apt.medecin.specialite)
    let matchesSpecialite = true;
    if (selectedSpecialite !== 'all') {
      // Trouver le nom de la spécialité sélectionnée
      // Normaliser la comparaison en convertissant les deux côtés en string pour gérer les types numériques
      const selectedSpecialiteStr = String(selectedSpecialite);
      const selectedSpecialiteObj = specialites.find(s => {
        const sIdStr = s.id ? String(s.id) : null;
        const sNomStr = s.nom ? String(s.nom) : null;
        return sIdStr === selectedSpecialiteStr || sNomStr === selectedSpecialiteStr;
      });
      const selectedSpecialiteNom = selectedSpecialiteObj?.nom || selectedSpecialite;
      // Comparer avec la spécialité du médecin du rendez-vous
      matchesSpecialite = apt.medecin?.specialite === selectedSpecialiteNom;
    }
    
    const matchesDoctor = selectedDoctor === 'all' || apt.medecin_id === parseInt(selectedDoctor);
    const matchesStatus = selectedStatus === 'all' || apt.statut === selectedStatus;
    
    return matchesSearch && matchesSpecialite && matchesDoctor && matchesStatus;
  });

  // Fonction pour obtenir la couleur d'une spécialité depuis la base de données
  const getSpecialiteColor = (specialiteNom) => {
    if (!specialiteNom) return '#3b82f6'; // Bleu par défaut
    
    // Rechercher la spécialité dans les données chargées
    const specialiteLower = specialiteNom.toLowerCase().trim();
    const specialite = specialites.find(s => 
      s.nom && s.nom.toLowerCase().trim() === specialiteLower
    );
    
    // Si trouvée et a une couleur définie, l'utiliser
    if (specialite && specialite.color) {
      return specialite.color;
    }
    
    // Fallback: si la spécialité existe mais n'a pas de couleur, générer une couleur basée sur le hash
    if (specialite) {
      let hash = 0;
      for (let i = 0; i < specialiteLower.length; i++) {
        hash = specialiteLower.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 70%, 50%)`;
    }
    
  
    
    for (const [key, color] of Object.entries(specialiteColors)) {
      if (key.toLowerCase() === specialiteLower) {
        return color;
      }
    }
    
    // Générer une couleur basée sur le hash si aucune correspondance
    let hash = 0;
    for (let i = 0; i < specialiteLower.length; i++) {
      hash = specialiteLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Fonction pour convertir une couleur hex en classes Tailwind de gradient
  const colorToGradientClass = (color) => {
    if (!color) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    
    // Mapping des couleurs hex vers les classes Tailwind
    const colorMap = {
      '#3b82f6': 'bg-gradient-to-r from-blue-500 to-indigo-600',
      '#dc2626': 'bg-gradient-to-r from-red-600 to-red-700',
      '#f59e0b': 'bg-gradient-to-r from-amber-500 to-orange-600',
      '#10b981': 'bg-gradient-to-r from-emerald-500 to-green-600',
      '#ec4899': 'bg-gradient-to-r from-pink-500 to-rose-600',
      '#06b6d4': 'bg-gradient-to-r from-cyan-500 to-blue-600',
      '#8b5cf6': 'bg-gradient-to-r from-violet-500 to-purple-600',
      '#6366f1': 'bg-gradient-to-r from-indigo-500 to-blue-600',
      '#14b8a6': 'bg-gradient-to-r from-teal-500 to-cyan-600',
      '#f97316': 'bg-gradient-to-r from-orange-500 to-red-600',
      '#22c55e': 'bg-gradient-to-r from-green-500 to-emerald-600',
      '#a855f7': 'bg-gradient-to-r from-purple-500 to-violet-600',
      '#ef4444': 'bg-gradient-to-r from-red-500 to-rose-600',
      '#64748b': 'bg-gradient-to-r from-slate-500 to-gray-600',
    };
    
    // Normaliser la couleur (mettre en minuscules)
    const normalizedColor = color.toLowerCase();
    if (colorMap[normalizedColor]) {
      return colorMap[normalizedColor];
    }
    
    // Si c'est une couleur HSL, utiliser un gradient bleu par défaut
    if (color.startsWith('hsl(')) {
      return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    }
    
    // Par défaut
    return 'bg-gradient-to-r from-blue-500 to-indigo-600';
  };

  // Fonction pour obtenir les classes de gradient basées sur la spécialité
  const getSpecialiteGradientClass = (specialiteNom) => {
    if (!specialiteNom) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    
    // Obtenir la couleur de la spécialité depuis la base
    const color = getSpecialiteColor(specialiteNom);
    
    // Convertir en classe de gradient
    return colorToGradientClass(color);
  };

  const getEventColor = (statut, priorite, specialiteNom) => {
    // Priorité très urgente : toujours rouge foncé
    if (priorite === 'tres_urgente') return '#dc2626';
    
    // Priorité urgente : assombrir la couleur de la spécialité
    if (priorite === 'urgente') {
      const baseColor = getSpecialiteColor(specialiteNom);
      // Assombrir la couleur de 20%
      if (baseColor.startsWith('#')) {
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
      }
      return baseColor;
    }
    
    // Statut annulé : gris
    if (statut === 'annule') return '#6b7280';
    
    // Statut terminé : vert
    if (statut === 'termine') return '#059669';
    
    // Utiliser la couleur de la spécialité par défaut
    return getSpecialiteColor(specialiteNom);
  };

  const getEventGradientClass = (statut, priorite, specialiteNom) => {
    // Priorité très urgente : toujours rouge foncé
    if (priorite === 'tres_urgente') return 'bg-gradient-to-r from-rose-600 to-red-600';
    
    // Priorité urgente : assombrir le gradient de la spécialité
    if (priorite === 'urgente') {
      const baseGradient = getSpecialiteGradientClass(specialiteNom);
      // Remplacer les couleurs par des versions plus sombres
      return baseGradient
        .replace('from-blue-500', 'from-blue-700')
        .replace('to-indigo-600', 'to-indigo-800')
        .replace('from-red-600', 'from-red-800')
        .replace('to-red-700', 'to-red-900')
        .replace('from-amber-500', 'from-amber-700')
        .replace('to-orange-600', 'to-orange-800')
        .replace('from-emerald-500', 'from-emerald-700')
        .replace('to-green-600', 'to-green-800')
        .replace('from-pink-500', 'from-pink-700')
        .replace('to-rose-600', 'to-rose-800')
        .replace('from-cyan-500', 'from-cyan-700')
        .replace('to-blue-600', 'to-blue-800')
        .replace('from-violet-500', 'from-violet-700')
        .replace('to-purple-600', 'to-purple-800')
        .replace('from-indigo-500', 'from-indigo-700')
        .replace('from-teal-500', 'from-teal-700')
        .replace('to-cyan-600', 'to-cyan-800')
        .replace('from-orange-500', 'from-orange-700')
        .replace('to-red-600', 'to-red-800')
        .replace('from-green-500', 'from-green-700')
        .replace('to-emerald-600', 'to-emerald-800')
        .replace('from-purple-500', 'from-purple-700')
        .replace('to-violet-600', 'to-violet-800')
        .replace('from-red-500', 'from-red-700')
        .replace('from-slate-500', 'from-slate-700')
        .replace('to-gray-600', 'to-gray-800');
    }
    
    // Statut annulé : gris
    if (statut === 'annule') return 'bg-gradient-to-r from-gray-500 to-gray-600';
    
    // Statut terminé : vert
    if (statut === 'termine') return 'bg-gradient-to-r from-emerald-500 to-green-600';
    
    // Utiliser le gradient de la spécialité par défaut
    return getSpecialiteGradientClass(specialiteNom);
  };

  const getInitials = (prenom = '', nom = '') => {
    const p = (prenom || '').toString().trim();
    const n = (nom || '').toString().trim();
    const i1 = p ? p[0].toUpperCase() : '';
    const i2 = n ? n[0].toUpperCase() : '';
    return (i1 + i2) || 'P';
  };

  const handleEventClick = async (appointment) => {
    // Récupérer toutes les données du rendez-vous depuis la base si nécessaire
    let appointmentData = appointment;
    
    // Si l'appointment n'a pas toutes les données, les récupérer depuis la base
    if (!appointment.couleur && !appointment.notes && !appointment.type_rdv) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointment.id)
          .single();
        
        if (!error && data) {
          appointmentData = { ...appointment, ...data };
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données du rendez-vous:', error);
      }
    }
    
    // Récupérer le patient et le médecin si nécessaire
    let patient = appointmentData.patient;
    let medecin = appointmentData.medecin;
    
    if (!patient && appointmentData.patient_id) {
      try {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .eq('id', appointmentData.patient_id)
          .single();
        if (data) patient = data;
      } catch (error) {
        console.error('Erreur lors de la récupération du patient:', error);
      }
    }
    
    if (!medecin && appointmentData.medecin_id) {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', appointmentData.medecin_id)
          .single();
        if (data) medecin = data;
      } catch (error) {
        console.error('Erreur lors de la récupération du médecin:', error);
      }
    }
    
    // Mettre à jour formData avec toutes les données du rendez-vous
    setFormData({
      id: appointmentData.id,
      patient_id: appointmentData.patient_id || patient?.id || '',
      medecin_id: appointmentData.medecin_id || medecin?.id || '',
      date_heure: appointmentData.date_heure || '',
      motif: appointmentData.motif || '',
      motif_autre: '',
      motif_detaille: appointmentData.motif_detaille || '',
      duree: appointmentData.duree || 30,
      priorite: appointmentData.priorite || 'normale',
      statut: appointmentData.statut || 'confirme',
      couleur: appointmentData.couleur || '',
      type_rdv: appointmentData.type_rdv || 'consultation',
      notes: appointmentData.notes || '',
      heure_fin: appointmentData.heure_fin || '',
      rappel_envoye: appointmentData.rappel_envoye || false,
      rappel_veille_envoye: appointmentData.rappel_veille_envoye || false,
      created_at: appointmentData.created_at || '',
      updated_at: appointmentData.updated_at || '',
      created_by: appointmentData.created_by || null,
      updated_by: appointmentData.updated_by || null
    });
    
    setShowAppointmentModal(true);
  };

  const handleTimeSlotClick = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(':');
    const slotDate = new Date(selectedDate);
    slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    setSelectedTimeSlot({
      start: slotDate,
      end: new Date(slotDate.getTime() + 30 * 60000),
      allDay: false
    });
    setFormData({
      id: null,
      patient_id: '',
      medecin_id: '',
      date_heure: slotDate.toISOString(),
      motif: '',
      motif_autre: '',
      motif_detaille: '',
      duree: 30,
      priorite: 'normale',
      statut: 'confirme',
      couleur: '',
      type_rdv: 'consultation',
      notes: '',
      heure_fin: '',
      rappel_envoye: false,
      rappel_veille_envoye: false,
      created_at: '',
      updated_at: '',
      created_by: null,
      updated_by: null
    });
    setShowAppointmentModal(true);
  };

  const handlePrevDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    try {
      const result = await appointmentService.create({
        ...formData,
        motif: resolveAppointmentMotif(formData.motif, formData.motif_autre),
      });
      if (result?.appointment) {
        setAppointments([...appointments, result.appointment]);
      }
      setShowAppointmentModal(false);
      setFormData({
        id: null,
        patient_id: '',
        medecin_id: '',
        date_heure: '',
        motif: '',
        motif_autre: '',
        motif_detaille: '',
        duree: 30,
        priorite: 'normale',
        statut: 'confirme',
        couleur: '',
        type_rdv: 'consultation',
        notes: '',
        heure_fin: '',
        rappel_envoye: false,
        rappel_veille_envoye: false,
        created_at: '',
        updated_at: '',
        created_by: null,
        updated_by: null
      });
    } catch (error) {
      console.error('Erreur lors de la création du RDV:', error);
      showError('Erreur lors de la création du rendez-vous. Veuillez réessayer.');
    }
  };

  const updateAppointment = async (e) => {
    e.preventDefault();
    try {
      const result = await appointmentService.update(formData.id, {
        ...formData,
        motif: resolveAppointmentMotif(formData.motif, formData.motif_autre),
      });
      const updatedAppointment = result?.appointment;
      if (updatedAppointment) {
        setAppointments(appointments.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt));
      }
      setShowAppointmentModal(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du RDV:', error);
    }
  };

  const deleteAppointment = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await appointmentService.delete(id);
        setAppointments(appointments.filter(apt => apt.id !== id));
        setShowAppointmentModal(false);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  // Obtenir les rendez-vous pour la date sélectionnée
  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredAppointments.filter(apt => 
      apt.date_heure.startsWith(dateStr)
    );
  };

  // Obtenir les rendez-vous pour un créneau horaire
  const getAppointmentsForTimeSlot = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(':');
    const slotDate = new Date(selectedDate);
    slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Ne retourner que les RDV qui démarrent exactement à ce créneau (évite les doublons visuels)
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.date_heure);
      return (
        aptDate.toDateString() === slotDate.toDateString() &&
        aptDate.getHours() === slotDate.getHours() &&
        aptDate.getMinutes() === slotDate.getMinutes()
      );
    });
  };

  // Statistiques simplifiées
  const stats = [
    { label: 'Total RDV', value: filteredAppointments.length, icon: CalendarIcon, color: 'from-blue-500 to-cyan-400' },
    { label: "Aujourd'hui", value: filteredAppointments.filter(apt => 
      apt.date_heure.startsWith(new Date().toISOString().split('T')[0])
    ).length, icon: Clock, color: 'from-violet-500 to-purple-400' },
  ];

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'} transition-all duration-500 flex flex-col`}>
      {/* Audio pour les notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Stats Cards à droite du calendrier */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30">
        <div className="flex flex-col gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`relative overflow-hidden ${darkMode ? 'bg-gray-900/50' : 'bg-white'} backdrop-blur-sm rounded-3xl border ${darkMode ? 'border-gray-800' : 'border-gray-100'} p-4 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 ${animatedStats ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-2 bg-gradient-to-r ${stat.color} rounded-2xl text-white shadow-lg mb-2`}>
                  <stat.icon size={20} />
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>{stat.label}</p>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Header principal avec gradient */}
      <div className="px-6 pb-6 flex-1 flex flex-col">
        <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-white'} backdrop-blur-sm rounded-3xl border ${darkMode ? 'border-gray-800' : 'border-gray-100'} overflow-hidden flex-1 flex flex-col`}>
          {/* Calendar Header */}
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handlePrevDay}
                  className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-white'} rounded-xl transition-all`}
                >
                  <ChevronLeft size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {calendarView === 'week' 
                    ? formatWeekRange(selectedDate)
                    : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', day: 'numeric' })}
                </h2>
                <button 
                  onClick={handleNextDay}
                  className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-white'} rounded-xl transition-all`}
                >
                  <ChevronRight size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              <div className="flex items-center space-x-6">
                {/* View Selector amélioré */}
                <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-gray-100/80'} p-1.5 rounded-2xl backdrop-blur-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex gap-1">
                    {[
                      { value: 'day', label: 'Jour' },
                      { value: 'week', label: 'Semaine' }
                    ].map((view) => (
                      <button
                        key={view.value}
                        onClick={() => setCalendarView(view.value)}
                        className={`py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                          calendarView === view.value 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105' 
                            : darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Barre de recherche */}
                <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} w-64`}>
                  <Search size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <input
                    type="text"
                    placeholder="Rechercher un patient ou motif"
                    className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtre spécialités */}
                <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <Stethoscope size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <select
                    value={selectedSpecialite}
                    onChange={(e) => {
                      setSelectedSpecialite(e.target.value);
                      // Réinitialiser la sélection du médecin si on change de spécialité
                      setSelectedDoctor('all');
                    }}
                    className={`bg-transparent text-sm outline-none cursor-pointer ${darkMode ? 'text-white' : 'text-gray-800'}`}
                  >
                    <option value="all">Toutes les spécialités</option>
                    {(specialites || []).map(s => (
                      <option key={s.id || s.nom} value={s.id || s.nom}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre médecins (filtré par spécialité) */}
                <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} relative`}>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className={`bg-transparent text-sm outline-none cursor-pointer ${darkMode ? 'text-white' : 'text-gray-800'}`}
                  >
                    <option value="all">Tous les médecins</option>
                    {filteredMedecins.map(m => {
                      const disponibilite = getMedecinDisponibilite(m.id);
                      const isDisponible = !disponibilite || disponibilite.statut === 'disponible';
                      return (
                        <option key={m.id} value={m.id}>
                          Dr. {m.prenom} {m.nom} {m.specialite ? `(${m.specialite})` : ''} {!isDisponible ? '🔴' : '🟢'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Bouton nouveau RDV amélioré */}
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-2xl flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg font-semibold text-sm"
                >
                  <Plus size={18} />
                  <span>Nouveau RDV</span>
                </button>

                {/* Mode sombre amélioré */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2.5 rounded-2xl transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700' 
                      : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 border border-gray-200'
                  }`}
                  title={darkMode ? 'Mode clair' : 'Mode sombre'}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Calendrier personnalisé */}
          <div className="flex-1 overflow-auto">
            {calendarView === 'day' ? (
              // Vue jour
              <div className="h-full">
                {/* En-tête des heures */}
                <div className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div className="grid grid-cols-1 gap-0">
                    <div className={`px-4 py-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Horaire
                    </div>
                  </div>
                </div>

                {/* Grille des créneaux horaires */}
                <div className="relative">
                  {timeSlots.map((timeSlot, index) => {
                    const appointments = getAppointmentsForTimeSlot(timeSlot);
                    const isCurrentTime = new Date().toDateString() === selectedDate.toDateString() && 
                      new Date().getHours() === parseInt(timeSlot.split(':')[0]) &&
                      Math.abs(new Date().getMinutes() - parseInt(timeSlot.split(':')[1])) <= 7;

                    return (
                      <div
                        key={timeSlot}
                        className={`relative border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} min-h-[60px] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer`}
                        onClick={() => handleTimeSlotClick(timeSlot)}
                      >
                        {/* Indicateur de l'heure actuelle */}
                        {isCurrentTime && (
                          <div className="absolute left-0 right-0 top-0 h-0.5 bg-red-500 z-20"></div>
                        )}

                        {/* Heure */}
                        <div className={`absolute left-2 top-2 text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {timeSlot}
                        </div>

                        {/* Rendez-vous */}
                        <div className="ml-20 pr-4 py-1">
                          {appointments.map((apt, aptIndex) => {
                            const medecin = apt.medecin || medecins.find(m => m.id === apt.medecin_id);
                            const specialiteNom = medecin?.specialite || null;
                            return (
                            <motion.div
                              key={apt.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: aptIndex * 0.1 }}
                              className={`group relative mb-1 p-2 rounded-lg text-white text-sm cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${getEventGradientClass(apt.statut, apt.priorite, specialiteNom)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(apt);
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                                    {getInitials(apt.patient?.prenom, apt.patient?.nom)}
                                  </div>
                                  <div>
                                    <div className="font-semibold leading-tight">
                                      {apt.patient?.prenom} {apt.patient?.nom}
                                    </div>
                                    <div className="text-[11px] opacity-90 leading-tight">
                                      {new Date(apt.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {apt.duree || 30}min
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {apt.priorite && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
                                      {apt.priorite === 'tres_urgente' ? 'Très urgente' : apt.priorite === 'urgente' ? 'Urgente' : 'Normale'}
                                    </span>
                                  )}
                                  {apt.statut && apt.statut !== 'confirme' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20">
                                      {apt.statut === 'en_attente' ? 'En attente' : apt.statut === 'annule' ? 'Annulé' : 'Terminé'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {apt.motif && (
                                <div className="text-xs opacity-95 mt-1 line-clamp-1">
                                  {apt.motif}
                                </div>
                              )}
                              <div className="text-[11px] opacity-80 mt-1">
                                Dr. {apt.medecin?.prenom} {apt.medecin?.nom}
                              </div>

                              {/* Barre de durée proportionnelle (max 60min) */}
                              <div className="mt-2 h-1.5 bg-white/20 rounded">
                                <div
                                  className="h-1.5 bg-white/80 rounded"
                                  style={{ width: `${Math.min(((apt.duree || 30) / 60), 1) * 100}%` }}
                                />
                              </div>

                              {/* Tooltip détaillé au survol */}
                              <div className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-40">
                                <div className="min-w-[220px] rounded-xl shadow-2xl bg-white text-gray-800 p-3 border border-gray-200">
                                  <div className="text-sm font-semibold text-gray-900 mb-1">
                                    {apt.patient?.prenom} {apt.patient?.nom}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    Médecin: Dr. {apt.medecin?.prenom} {apt.medecin?.nom}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    {new Date(apt.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    {apt.duree ? ` • ${apt.duree} min` : ''}
                                  </div>
                                  {apt.motif && (
                                    <div className="text-xs text-gray-700 line-clamp-2">
                                      {apt.motif}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Vue semaine
              <div className="h-full">
                <div className="grid grid-cols-7 gap-1 p-4">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() - date.getDay() + i);
                    const dayAppointments = getAppointmentsForDate(date);
                    
                    return (
                      <div key={i} className={`${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-white to-blue-50'} rounded-xl p-2 min-h-[220px] border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className={`${date.getDay() === 6 || date.getDay() === 0 ? 'text-red-500' : ''}`}>
                              {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'}`}>
                            {dayAppointments.length} RDV
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {dayAppointments.map((apt) => {
                            const medecin = apt.medecin || medecins.find(m => m.id === apt.medecin_id);
                            const specialiteNom = medecin?.specialite || null;
                            return (
                            <div
                              key={apt.id}
                              className={`p-2 rounded-lg text-white text-xs cursor-pointer flex items-center gap-2 ${getEventGradientClass(apt.statut, apt.priorite, specialiteNom)}`}
                              onClick={() => handleEventClick(apt)}
                            >
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {getInitials(apt.patient?.prenom, apt.patient?.nom)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold truncate">
                                  {apt.patient?.prenom} {apt.patient?.nom}
                                </div>
                                <div className="opacity-90 truncate">
                                  {new Date(apt.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  {apt.duree ? ` • ${apt.duree}min` : ''}
                                </div>
                              </div>
                              {apt.statut && apt.statut !== 'confirme' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 shrink-0">
                                  {apt.statut === 'en_attente' ? 'En attente' : apt.statut === 'annule' ? 'Annulé' : 'Terminé'}
                                </span>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de création/édition de RDV */}
      <AnimatePresence>
        {showAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAppointmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 animate-slideUp`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`px-8 py-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formData.id ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
                    </h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      Remplissez les informations pour planifier la consultation
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-xl transition-all`}
                  >
                    <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>
              </div>

              {selectedTimeSlot && (
                <div className={`mx-8 mt-4 p-4 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-2xl border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'} font-medium`}>
                    <ClockIcon className="inline mr-2" size={16} />
                    Horaire sélectionné : {selectedTimeSlot.start.toLocaleString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Modal Body */}
              <div className="px-8 py-6">
                <form onSubmit={formData.id ? updateAppointment : createAppointment} className="space-y-6">
                  {/* Patient et Médecin Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Patient *
                      </label>
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl p-1`}>
                        <select
                          value={formData.patient_id}
                          onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                          className={`w-full px-4 py-3 ${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'} rounded-xl focus:outline-none`}
                          required
                        >
                          <option value="">Sélectionner un patient</option>
                          {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                              {patient.prenom} {patient.nom} - {patient.telephone}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Médecin *
                      </label>
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl p-1`}>
                        <select
                          value={formData.medecin_id}
                          onChange={(e) => setFormData({...formData, medecin_id: e.target.value})}
                          className={`w-full px-4 py-3 ${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'} rounded-xl focus:outline-none`}
                          required
                        >
                          <option value="">Sélectionner un médecin</option>
                          {filteredMedecins.map(medecin => {
                            const disponibilite = getMedecinDisponibilite(medecin.id);
                            const isDisponible = !disponibilite || disponibilite.statut === 'disponible';
                            return (
                              <option key={medecin.id} value={medecin.id}>
                                Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite} {!isDisponible ? '🔴 Indisponible' : '🟢 Disponible'}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date et heure */}
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Date et heure *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.date_heure ? formData.date_heure.slice(0, 16) : ''}
                      onChange={(e) => setFormData({...formData, date_heure: e.target.value})}
                      className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      required
                    />
                  </div>

                  <AppointmentTypeMotifFields
                    typeRdv={formData.type_rdv}
                    motif={formData.motif}
                    motifAutre={formData.motif_autre}
                    priorite={formData.priorite}
                    showPriorite
                    onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
                    inputClassName={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Durée (min)
                      </label>
                      <select
                        value={formData.duree}
                        onChange={(e) => setFormData({...formData, duree: parseInt(e.target.value)})}
                        className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">1 heure</option>
                        <option value="90">1h30</option>
                        <option value="120">2 heures</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Statut
                      </label>
                      <select
                        value={formData.statut}
                        onChange={(e) => setFormData({...formData, statut: e.target.value})}
                        className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="confirme">Confirmé</option>
                        <option value="en_attente">En attente</option>
                        <option value="annule">Annulé</option>
                        <option value="termine">Terminé</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className={`px-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-end space-x-4`}>
                {formData.id && (
                  <button
                    type="button"
                    onClick={() => deleteAppointment(formData.id)}
                    className="px-4 py-2 text-red-700 bg-red-100 hover:bg-red-200 rounded-2xl transition-colors flex items-center space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>Supprimer</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(false)}
                  className={`px-6 py-3 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-2xl font-medium transition-all`}
                >
                  Annuler
                </button>
                
                <button
                  onClick={formData.id ? updateAppointment : createAppointment}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-105"
                >
                  {formData.id ? 'Modifier' : 'Créer'} le rendez-vous
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomCalendar;
