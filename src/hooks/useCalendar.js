
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  secureAppointmentService as appointmentService, 
  securePatientService as patientService, 
  secureUserService as userService,
  waitingQueueService
} from '../lib/secureServices';

import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { supabase } from '../lib/supabase';

export const useCalendar = ({ initialView = 'timeGridWeek', selectedDoctorFilter = 'all' }) => {
  const { currentUser } = useAuth();
  const { showError, showSuccess, showWarning, showInfo } = useAlert();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [calendarView, setCalendarView] = useState(initialView);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [medecinSearchTerm, setMedecinSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showMedecinDropdown, setShowMedecinDropdown] = useState(false);

  const [animatedStats, setAnimatedStats] = useState(false);
  const [showDragDemo, setShowDragDemo] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    medecin_id: '',
    date_heure: '',
    motif: '',
    duree: 30,
    priorite: 'normale',
    statut: 'confirme',
    couleur: '#3b82f6'
  });
  const audioRef = useRef(null);
  const calendarRef = useRef(null);
  const creatingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const [pendingAppointmentUpdates, setPendingAppointmentUpdates] = useState(new Map());
  const [pendingAppointmentDeletions, setPendingAppointmentDeletions] = useState(new Set());
  const saveTimer = useRef(null);

  const predefinedColors = [
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Vert', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Jaune', value: '#eab308' }
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const ignoreSpecialityForSecretary = currentUser?.role === 'secretary'
      const [appointmentsData, patientsData, medecinsData, waitingQueueData] = await Promise.all([
        appointmentService.getAll({ ignoreSpecialityFilter: ignoreSpecialityForSecretary }).catch(() => []),
        patientService.getAll().catch(() => []),
        userService.getDoctors({ ignoreSpecialityFilter: ignoreSpecialityForSecretary }).catch(() => []),
        waitingQueueService.getAll().catch(() => [])
      ]);
      
      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
      setMedecins(medecinsData || []);
      setWaitingQueue(waitingQueueData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showError("Erreur lors du chargement des données du calendrier.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  const fetchSpecialites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select('*')
        .eq('actif', true)
        .order('nom');
      if (error) throw error;
      setSpecialites(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
      setSpecialites([]);
    }
  }, []);
  
  const filteredAppointments = useMemo(() => appointments.filter(apt => {
    let matchesSearch = true;
    if (selectedSearchResult) {
      if (selectedSearchResult.type === 'patient') {
        matchesSearch = apt.patient_id === selectedSearchResult.id;
      } else if (selectedSearchResult.type === 'motif') {
        matchesSearch = apt.motif && apt.motif.toLowerCase().includes(selectedSearchResult.name.toLowerCase());
      }
    }
    const matchesDoctor = selectedDoctorFilter === 'all' || apt.medecin_id === parseInt(selectedDoctorFilter);
    const matchesStatus = selectedStatus === 'all' || apt.statut === selectedStatus;
    return matchesSearch && matchesDoctor && matchesStatus;
  }), [appointments, selectedSearchResult, selectedDoctorFilter, selectedStatus]);

  useEffect(() => {
    loadData();
    fetchSpecialites();
    setTimeout(() => setAnimatedStats(true), 100);
  }, [loadData, fetchSpecialites]);

    useEffect(() => {
    const demoTimeout = setTimeout(() => {
      if (filteredAppointments.length === 0 && !loading) {
        setShowDragDemo(true);
        setTimeout(() => setShowDragDemo(false), 5000);
      }
    }, 2000);
    return () => clearTimeout(demoTimeout);
  }, [filteredAppointments.length, loading]);

  useEffect(() => {
    if (selectedDoctorFilter !== 'all') {
      setShowDragDemo(false);
    }
  }, [selectedDoctorFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = event.target.closest('.search-container');
      if (!searchContainer) setShowSearchDropdown(false);
      
      const patientSearchContainer = event.target.closest('.patient-search-container');
      if (!patientSearchContainer) setShowPatientDropdown(false);

      const medecinSearchContainer = event.target.closest('.medecin-search-container');
      if (!medecinSearchContainer) setShowMedecinDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Erreur audio:', e));
    }
  };

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
      } catch (error) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [waitingQueue, soundEnabled]);


  const debouncedSaveAppointments = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      const updatesToProcess = Array.from(pendingAppointmentUpdates.values());
      const deletionsToProcess = Array.from(pendingAppointmentDeletions.values());

      if (updatesToProcess.length === 0 && deletionsToProcess.length === 0) return;

      try {
        if (updatesToProcess.length > 0) {
          await appointmentService.batchUpdate(updatesToProcess);
          showSuccess(`${updatesToProcess.length} rendez-vous mis à jour.`);
        }
        if (deletionsToProcess.length > 0) {
          await appointmentService.batchDelete(deletionsToProcess);
          showSuccess(`${deletionsToProcess.length} rendez-vous supprimés.`);
        }
        await loadData();
      } catch (error) {
        showError('Erreur lors de la sauvegarde groupée.');
      } finally {
        setPendingAppointmentUpdates(new Map());
        setPendingAppointmentDeletions(new Set());
      }
    }, 1000);
  }, [pendingAppointmentUpdates, pendingAppointmentDeletions, loadData, showError, showSuccess]);
  
  useEffect(() => {
    debouncedSaveAppointments();
  }, [pendingAppointmentUpdates, pendingAppointmentDeletions, debouncedSaveAppointments])

  const searchPatientsAndMotifs = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const results = [];
    const queryLower = query.toLowerCase();

    patients.forEach(patient => {
      const fullName = `${patient.prenom} ${patient.nom}`.toLowerCase();
      if (fullName.includes(queryLower)) {
        results.push({ type: 'patient', id: patient.id, name: `${patient.prenom} ${patient.nom}`, phone: patient.telephone, searchTerm: query });
      }
    });
    appointments.forEach(appointment => {
      if (appointment.motif && appointment.motif.toLowerCase().includes(queryLower)) {
        const patientName = `${appointment.patient?.prenom} ${appointment.patient?.nom}`;
        results.push({ type: 'motif', id: appointment.id, name: appointment.motif, patient: patientName, searchTerm: query });
      }
    });

    const uniqueResults = results.filter((result, index, self) => index === self.findIndex(r => r.id === result.id && r.type === result.type));
    setSearchResults(uniqueResults.slice(0, 8));
    setShowSearchDropdown(uniqueResults.length > 0);
  };

  const selectSearchResult = (result) => {
    setSearchTerm(result.name);
    setSelectedSearchResult(result);
    setShowSearchDropdown(false);
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedSearchResult(null);
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const filteredPatients = patients.filter(patient => {
    if (!patientSearchTerm) return true;
    const searchTerm = patientSearchTerm.toLowerCase();
    return (patient.telephone?.includes(searchTerm) || patient.nom?.toLowerCase().includes(searchTerm) || patient.prenom?.toLowerCase().includes(searchTerm));
  });

  const filteredMedecins = medecins.filter(medecin => {
    if (!medecinSearchTerm) return true;
    const searchTerm = medecinSearchTerm.toLowerCase();
    return (medecin.nom?.toLowerCase().includes(searchTerm) || medecin.prenom?.toLowerCase().includes(searchTerm) || medecin.specialite?.toLowerCase().includes(searchTerm));
  });

  const handlePatientSelect = (patient) => {
    setFormData({...formData, patient_id: patient.id});
    setPatientSearchTerm(`${patient.prenom} ${patient.nom} - ${patient.telephone}`);
    setShowPatientDropdown(false);
  };

  const handleMedecinSelect = (medecin) => {
    setFormData({...formData, medecin_id: medecin.id});
    setMedecinSearchTerm(`Dr. ${medecin.prenom} ${medecin.nom} - ${medecin.specialite}`);
    setShowMedecinDropdown(false);
  };

  const handlePatientSearchFocus = () => { setShowPatientDropdown(true); setShowMedecinDropdown(false); };
  const handleMedecinSearchFocus = () => { setShowMedecinDropdown(true); setShowPatientDropdown(false); };

  const getSpecialiteColor = useCallback((specialiteNom) => {
    if (!specialiteNom) return '#3b82f6';
    const specialiteLower = specialiteNom.toLowerCase().trim();
    const specialite = specialites.find(s => s.nom && s.nom.toLowerCase().trim() === specialiteLower);
    if (specialite && specialite.color) return specialite.color;
    let hash = 0;
    for (let i = 0; i < specialiteLower.length; i++) {
      hash = specialiteLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash % 360)}, 70%, 50%)`;
  }, [specialites]);

  const getEventColor = useCallback((statut, priorite, couleurPersonnalisee, specialiteNom) => {
    if (couleurPersonnalisee) return couleurPersonnalisee;
    if (priorite === 'tres_urgente') return '#dc2626';
    if (priorite === 'urgente') {
      const baseColor = getSpecialiteColor(specialiteNom);
      if (baseColor.startsWith('#')) {
        const r = parseInt(baseColor.slice(1, 3), 16), g = parseInt(baseColor.slice(3, 5), 16), b = parseInt(baseColor.slice(5, 7), 16);
        return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
      }
      return baseColor;
    }
    if (statut === 'annule') return '#6b7280';
    if (statut === 'termine') return '#059669';
    return getSpecialiteColor(specialiteNom);
  }, [getSpecialiteColor]);

  const getEventClassName = (duree, statut, priorite) => {
    let classes = [`fc-event-${statut}`];
    if (priorite === 'urgente' || priorite === 'tres_urgente') classes.push(`fc-event-${priorite}`);
    if (duree === 15) classes.push('fc-event-short');
    else if (duree === 30) classes.push('fc-event-medium');
    else if (duree >= 60) classes.push('fc-event-long');
    return classes.join(' ');
  };
  
  const calendarResources = useMemo(() => medecins.map(medecin => ({
    id: medecin.id.toString(),
    title: `Dr. ${medecin.prenom} ${medecin.nom}`,
    extendedProps: { specialite: medecin.specialite, medecin: medecin }
  })), [medecins]);
  
  const resourcesForView = useMemo(() => {
    const hasUnassignedAppointments = filteredAppointments.some(apt => !apt.medecin_id);
    const unassignedResource = { id: 'unassigned', title: 'Sans médecin' };

    if (calendarView === 'timeGridDay') {
      if (selectedDoctorFilter !== 'all') {
        const doc = medecins.find(m => m.id === parseInt(selectedDoctorFilter));
        return doc ? [calendarResources.find(r => r.id === doc.id.toString())].filter(Boolean) : [];
      }
      return hasUnassignedAppointments ? [...calendarResources, unassignedResource] : calendarResources;
    }
    return undefined;
  }, [calendarView, medecins, selectedDoctorFilter, filteredAppointments, calendarResources]);

  const calendarEvents = useMemo(() => filteredAppointments.map(apt => {
    const duree = apt.duree || 30;
    const medecin = apt.medecin || medecins.find(m => m.id === apt.medecin_id);
    const specialiteNom = medecin?.specialite || null;
    const couleur = getEventColor(apt.statut, apt.priorite, apt.couleur, specialiteNom);
    
    return {
      id: apt.id,
      title: `${apt.patient?.prenom} ${apt.patient?.nom}`,
      start: apt.date_heure,
      end: new Date(new Date(apt.date_heure).getTime() + duree * 60000),
      resourceId: calendarView === 'timeGridDay' ? (apt.medecin_id ? apt.medecin_id.toString() : (selectedDoctorFilter === 'all' ? 'unassigned' : null)) : null,
      backgroundColor: couleur,
      borderColor: couleur,
      textColor: '#ffffff',
      className: getEventClassName(duree, apt.statut, apt.priorite),
      extendedProps: { ...apt }
    };
  }), [filteredAppointments, medecins, calendarView, selectedDoctorFilter, getEventColor]);

  const handleEventClick = (info) => {
    const event = info.event;
    const appointment = appointments.find(apt => apt.id === parseInt(event.id));
    if (appointment) {
      setFormData({ ...appointment, date_heure: event.start.toISOString() });
      const patient = patients.find(p => p.id === appointment.patient_id);
      const medecin = medecins.find(m => m.id === appointment.medecin_id);
      if (patient) setPatientSearchTerm(`${patient.prenom} ${patient.nom} - ${patient.telephone}`);
      if (medecin) setMedecinSearchTerm(`Dr. ${medecin.prenom} ${medecin.nom} - ${medecin.specialite}`);
    } else {
        // Fallback
        setFormData({
            id: event.id,
            patient_id: event.extendedProps.patient_id || '',
            medecin_id: event.extendedProps.medecin_id || '',
            date_heure: event.start.toISOString(),
            motif: event.extendedProps.motif || '',
            duree: event.extendedProps.duree || 30,
            priorite: event.extendedProps.priorite || 'normale',
            statut: event.extendedProps.statut || 'confirme',
            couleur: event.extendedProps.couleur || '#3b82f6'
        });
        setPatientSearchTerm('');
        setMedecinSearchTerm('');
    }
    setShowAppointmentModal(true);
  };
  
  const handleEventDrop = async (info) => {
    const { event } = info;
    const appointmentId = parseInt(event.id);
    const updatedData = { date_heure: event.start.toISOString() };

    setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, ...updatedData } : apt));
    setPendingAppointmentUpdates(prev => new Map(prev).set(appointmentId, { id: appointmentId, updates: updatedData }));
    showInfo('Rendez-vous déplacé. Synchronisation...');
  };

  const handleEventResize = async (info) => {
    const { event } = info;
    const appointmentId = parseInt(event.id);
    const newDuration = Math.max(15, Math.min(Math.round((event.end - event.start) / 60000), 120));
    const updatedData = { date_heure: event.start.toISOString(), duree: newDuration };
    
    setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, ...updatedData } : apt));
    setPendingAppointmentUpdates(prev => new Map(prev).set(appointmentId, { id: appointmentId, updates: updatedData }));
    showInfo('Durée du RDV ajustée. Synchronisation...');
  };

  const handleDateSelect = (selectInfo) => {
    setShowDragDemo(false);
    const durationMinutes = Math.max(15, Math.min(Math.round((selectInfo.end - selectInfo.start) / 60000), 120));
    const adjustedEnd = new Date(selectInfo.start.getTime() + durationMinutes * 60000);
    const selectedMedecinId = selectInfo.resource?.id || '';
    
    setSelectedTimeSlot({ ...selectInfo, end: adjustedEnd });
    setFormData({
      patient_id: '', medecin_id: selectedMedecinId, date_heure: selectInfo.start.toISOString(),
      motif: '', duree: durationMinutes, priorite: 'normale', statut: 'confirme', couleur: '#3b82f6'
    });
    setShowAppointmentModal(true);
    setPatientSearchTerm('');
    setMedecinSearchTerm('');
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    if (creatingRef.current) return;
    creatingRef.current = true;
    setSubmitting(true);
    try {
      if (!formData.patient_id || !formData.medecin_id || !formData.date_heure) {
        showWarning('Veuillez sélectionner un patient, un médecin et une date/heure.');
        return;
      }
      const appointmentData = {
        patient_id: parseInt(formData.patient_id), medecin_id: parseInt(formData.medecin_id),
        date_heure: formData.date_heure, motif: formData.motif, duree: formData.duree,
        priorite: formData.priorite, statut: formData.statut, couleur: formData.couleur
      };
      const newAppointment = await appointmentService.create(appointmentData);
      await loadData(); // Reload all data to ensure consistency
      setShowAppointmentModal(false);
      showSuccess("Rendez-vous créé avec succès !");
    } catch (error) {
      showError('Erreur lors de la création du rendez-vous.');
    } finally {
      creatingRef.current = false;
      setSubmitting(false);
    }
  };

  const updateAppointment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const appointmentId = parseInt(formData.id);
      const appointmentData = {
        patient_id: parseInt(formData.patient_id), medecin_id: parseInt(formData.medecin_id),
        date_heure: formData.date_heure, motif: formData.motif, duree: formData.duree,
        priorite: formData.priorite, statut: formData.statut, couleur: formData.couleur
      };
      await appointmentService.update(appointmentId, appointmentData);
      await loadData();
      setShowAppointmentModal(false);
      showSuccess("Rendez-vous mis à jour avec succès !");
    } catch (error) {
      showError('Erreur lors de la mise à jour du rendez-vous.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAppointment = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      setAppointments(prev => prev.filter(apt => apt.id !== id));
      setShowAppointmentModal(false);
      setPendingAppointmentDeletions(prev => new Set(prev).add(id));
      showInfo('Rendez-vous marqué pour suppression...');
    }
  };

  const handleViewChange = (newView) => {
    setCalendarView(newView);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const viewToUse = newView === 'timeGridDay' ? 'resourceTimeGridDay' : newView;
      calendarApi.changeView(viewToUse);
    }
  };
  
    const handlePrev = () => calendarRef.current?.getApi().prev();
    const handleNext = () => calendarRef.current?.getApi().next();
    const handleToday = () => calendarRef.current?.getApi().today();
    const getDateDisplayText = () => calendarRef.current?.getApi().view.title || new Date().toLocaleDateString();

  return {
    // State
    loading, appointments, patients, medecins, specialites, waitingQueue,
    calendarView, selectedDate, showAppointmentModal, selectedTimeSlot,
    searchTerm, searchResults, showSearchDropdown, selectedSearchResult,
    patientSearchTerm, medecinSearchTerm, showPatientDropdown, showMedecinDropdown,
    animatedStats, showDragDemo, formData, submitting, predefinedColors,
    filteredAppointments, filteredPatients, filteredMedecins,
    calendarEvents, calendarResources, resourcesForView,
    
    // Refs
    audioRef, calendarRef,

    // Setters
    setCalendarView, setSelectedDate, setShowAppointmentModal, setSearchTerm,
    setShowSearchDropdown, setPatientSearchTerm, setMedecinSearchTerm,
    setShowPatientDropdown, setShowMedecinDropdown, setFormData,
    
    // Functions
    loadData, fetchSpecialites, searchPatientsAndMotifs, selectSearchResult, clearSearch,
    handlePatientSelect, handleMedecinSelect, handlePatientSearchFocus, handleMedecinSearchFocus,
    handleEventClick, handleEventDrop, handleEventResize, handleDateSelect,
    createAppointment, updateAppointment, deleteAppointment,
    handlePrev, handleNext, handleToday, handleViewChange, getDateDisplayText
  };
};

