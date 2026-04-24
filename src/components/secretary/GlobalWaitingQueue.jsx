import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Stethoscope, 
  Clock, 
  AlertTriangle, 
  Users, 
  Eye,
  Phone,
  Calendar,
  Activity,
  CheckCircle,
  UserCheck,
  FileImage,
  Upload
} from 'lucide-react';
import PatientDocumentUploader from './PatientDocumentUploader';

const GlobalWaitingQueue = ({ doctors, searchTerm, filterStatus, onDoctorSelect }) => {
  const { userProfile } = useAuth();
  const tenantId = userProfile?.tenant_id || null;
  const [waitingQueues, setWaitingQueues] = useState({});
  const [appointmentsByDoctor, setAppointmentsByDoctor] = useState({});
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPatientForUpload, setSelectedPatientForUpload] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [doctors]);

  // Abonnement temps réel pour actualiser automatiquement les files
  useEffect(() => {
    if (!doctors || doctors.length === 0) return;
    const channel = supabase
      .channel('global_waiting_queue_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiting_queue'
      }, () => {
        fetchAllData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctors]);

  const fetchAllData = async () => {
    try {
      const queues = {};
      const apptsByDoc = {};

      if (!doctors || doctors.length === 0) {
        setWaitingQueues({});
        setAppointmentsByDoctor({});
        setLoading(false);
        return;
      }

      const medecinIds = doctors.map(d => d.id);

      // 1) Récupérer les files d'attente sans jointures
      const { data: waitingData, error: waitingError } = await supabase
        .from('waiting_queue')
        .select('*')
        .in('medecin_id', medecinIds)
        .order('order_position', { ascending: true });

      if (waitingError) {
        console.error('Erreur waiting_queue:', waitingError);
        throw waitingError;
      }

      const waitingList = Array.isArray(waitingData) ? waitingData : [];
      
      // 2) Récupérer les patients référencés
      const patientIds = Array.from(new Set(waitingList.map(w => w.patient_id).filter(Boolean)));
      let patientMap = {};
      
      if (patientIds.length > 0) {
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('id, nom, prenom, telephone, numero_dossier')
          .in('id', patientIds);
        
        if (patientsError) {
          console.error('Erreur patients:', patientsError);
        } else if (patientsData) {
          patientMap = Object.fromEntries(patientsData.map(p => [p.id, p]));
        }
      }

      // 3) Récupérer les appointments référencés
      const appointmentIds = Array.from(new Set(waitingList.map(w => w.appointment_id).filter(Boolean)));
      let appointmentMap = {};
      
      if (appointmentIds.length > 0) {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, motif, duree')
          .in('id', appointmentIds);
        
        if (appointmentsError) {
          console.error('Erreur appointments:', appointmentsError);
        } else if (appointmentsData) {
          appointmentMap = Object.fromEntries(appointmentsData.map(a => [a.id, a]));
        }
      }

      // 4) Fusionner les données
      waitingList.forEach(item => {
        const enrichedItem = {
          ...item,
          patient: patientMap[item.patient_id] || null,
          appointment: appointmentMap[item.appointment_id] || null
        };
        
        const key = item.medecin_id;
        if (!queues[key]) queues[key] = [];
        queues[key].push(enrichedItem);
      });

      // 5) Récupérer tous les rendez-vous du jour pour ces médecins
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: apptsData, error: apptsError } = await supabase
        .from('appointments')
        .select('*')
        .in('medecin_id', medecinIds)
        .gte('date_heure', today.toISOString())
        .lt('date_heure', tomorrow.toISOString())
        .order('date_heure', { ascending: true });

      if (apptsError) {
        console.error('Erreur appointments du jour:', apptsError);
        throw apptsError;
      }

      const apptsList = Array.isArray(apptsData) ? apptsData : [];
      
      // 6) Récupérer les patients pour les RDV du jour
      const apptPatientIds = Array.from(new Set(apptsList.map(a => a.patient_id).filter(Boolean)));
      let apptPatientMap = {};
      
      if (apptPatientIds.length > 0) {
        const { data: apptPatientsData, error: apptPatientsError } = await supabase
          .from('patients')
          .select('id, nom, prenom, telephone, numero_dossier')
          .in('id', apptPatientIds);
        
        if (apptPatientsError) {
          console.error('Erreur patients RDV:', apptPatientsError);
        } else if (apptPatientsData) {
          apptPatientMap = Object.fromEntries(apptPatientsData.map(p => [p.id, p]));
        }
      }

      // 7) Fusionner les RDV avec les patients
      apptsList.forEach(appt => {
        const enrichedAppt = {
          ...appt,
          patient: apptPatientMap[appt.patient_id] || null
        };
        
        const key = appt.medecin_id;
        if (!apptsByDoc[key]) apptsByDoc[key] = [];
        apptsByDoc[key].push(enrichedAppt);
      });

      setWaitingQueues(queues);
      setAppointmentsByDoctor(apptsByDoc);
    } catch (error) {
      console.error('Erreur lors du chargement des files d\'attente:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour marquer un patient comme présent
  const handleMarkPatientPresent = async (patientId) => {
    try {
      console.log('✅ [GlobalWaitingQueue] Marquage patient présent:', patientId);
      
      const { error } = await supabase
        .from('waiting_queue')
        .update({ 
          status: 'present',
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) {
        console.error('❌ [GlobalWaitingQueue] Erreur marquage présent:', error);
        throw error;
      }

      console.log('✅ [GlobalWaitingQueue] Patient marqué comme présent:', patientId);
      
      // Recharger les données
      fetchAllData();
      
      // Afficher une notification de succès
      if (window.showNotification) {
        window.showNotification({
          message: 'Patient marqué comme présent !',
          type: 'success',
          duration: 3000
        });
      }
      
    } catch (error) {
      console.error('❌ [GlobalWaitingQueue] Erreur lors du marquage présent:', error);
      
      // Afficher une notification d'erreur
      if (window.showNotification) {
        window.showNotification({
          message: 'Erreur lors du marquage du patient comme présent',
          type: 'error',
          duration: 4000
        });
      }
    }
  };

  // Ajouter un rendez-vous du jour en file d'attente pour un médecin
  const handleAddAppointmentToQueue = async (doctorId, appointment) => {
    try {
      // Vérifier s'il est déjà en file pour ce RDV
      const { data: existing } = await supabase
        .from('waiting_queue')
        .select('id')
        .eq('patient_id', appointment.patient_id)
        .eq('medecin_id', doctorId)
        .eq('appointment_id', appointment.id)
        .eq('status', 'waiting')
        .maybeSingle();

      if (existing) {
        if (window.showNotification) {
          window.showNotification({ message: 'Le patient est déjà en file d\'attente', type: 'warning', duration: 2500 });
        }
        return;
      }

      // Trouver la dernière position
      const { data: currentQueue } = await supabase
        .from('waiting_queue')
        .select('order_position')
        .eq('medecin_id', doctorId)
        .order('order_position', { ascending: false })
        .limit(1);

      const nextPosition = currentQueue && currentQueue.length > 0 ? currentQueue[0].order_position + 1 : 1;

      const { error } = await supabase
        .from('waiting_queue')
        .insert([{
          patient_id: appointment.patient_id,
          medecin_id: doctorId,
          appointment_id: appointment.id,
          status: 'waiting',
          priority: 'normale',
          arrived_at: new Date().toISOString(),
          order_position: nextPosition
        }]);

      if (error) throw error;

      if (window.showNotification) {
        window.showNotification({ message: 'Patient ajouté à la file', type: 'success', duration: 2500 });
      }

      fetchAllData();
    } catch (e) {
      console.error('Erreur ajout RDV à la file:', e);
      if (window.showNotification) {
        window.showNotification({ message: 'Erreur lors de l\'ajout à la file', type: 'error', duration: 3000 });
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_consultation': return 'text-blue-600 bg-blue-100';
      case 'entre': return 'text-purple-600 bg-purple-100';
      case 'appele': return 'text-orange-600 bg-orange-100';
      case 'en_attente': return 'text-yellow-600 bg-yellow-100';
      case 'termine': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_consultation': return 'En consultation';
      case 'entre': return 'Entré';
      case 'appele': return 'Appelé';
      case 'en_attente': return 'En attente';
      case 'termine': return 'Terminé';
      default: return status;
    }
  };

  const getUrgencyColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'text-red-600 bg-red-100';
      case 'tres_urgente': return 'text-red-800 bg-red-200';
      case 'normale': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateWaitTime = (arrivedAt) => {
    if (!arrivedAt) return 0;
    const arrivalTime = new Date(arrivedAt);
    const now = new Date();
    const diffMs = now - arrivalTime;
    return Math.floor(diffMs / (1000 * 60));
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filterDoctors = () => {
    return doctors.filter(doctor => {
      const doctorName = `${doctor.prenom} ${doctor.nom}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      if (searchTerm && !doctorName.includes(searchLower)) {
        return false;
      }
      
      return true;
    });
  };

  const filterPatients = (patients) => {
    if (filterStatus === 'all') return patients;
    return patients.filter(patient => patient.status === filterStatus);
  };

  const getDoctorStats = (doctorId) => {
    const queue = waitingQueues[doctorId] || [];
    const filteredQueue = filterPatients(queue);
    
    return {
      total: queue.length,
      waiting: queue.filter(p => p.status === 'en_attente' || p.status === 'waiting').length,
      inConsultation: queue.filter(p => p.status === 'entre' || p.status === 'en_consultation' || p.status === 'present' || p.status === 'in_consultation').length,
      urgent: queue.filter(p => p.priority === 'urgente' || p.priority === 'tres_urgente').length,
      filtered: filteredQueue.length
    };
  };

  const isAppointmentInQueue = (doctorId, appointment) => {
    const queue = waitingQueues[doctorId] || [];
    return queue.some(p => p.patient_id === appointment.patient_id && p.appointment_id === appointment.id);
  };

  // Statistiques globales
  const allQueues = Object.values(waitingQueues).flat();
  const totalDoctors = filterDoctors().length;
  const totalAppointments = Object.values(appointmentsByDoctor).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);
  const totalWaiting = allQueues.filter(p => p.status === 'waiting' || p.status === 'en_attente').length;
  const totalInConsult = allQueues.filter(p => ['present','entre','en_consultation','in_consultation'].includes(p.status)).length;
  const totalUrgent = allQueues.filter(p => p.priority === 'urgente' || p.priority === 'tres_urgente').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des files d'attente...</p>
        </div>
      </div>
    );
  }

  const filteredDoctors = filterDoctors();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Vue Globale - Tous les Médecins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalDoctors}</p>
                <p className="text-sm text-blue-600">Médecins</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{totalAppointments}</p>
                <p className="text-sm text-green-600">RDV aujourd'hui</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{totalWaiting}</p>
                <p className="text-sm text-yellow-600">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-red-600">{totalUrgent}</p>
                <p className="text-sm text-red-600">Urgences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => {
          const stats = getDoctorStats(doctor.id);
          const queue = waitingQueues[doctor.id] || [];
          const filteredQueue = filterPatients(queue);
          const todaysAppointments = appointmentsByDoctor[doctor.id] || [];

          return (
            <div key={doctor.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* En-tête du médecin */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-medical-primary rounded-full flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Dr. {doctor.prenom} {doctor.nom}
                      </h3>
                      <p className="text-sm text-gray-500">{doctor.specialite}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDoctorSelect(doctor)}
                    className="flex items-center px-3 py-1 text-medical-primary hover:text-medical-primary-dark text-sm font-medium"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Voir détails
                  </button>
                </div>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-lg font-bold text-blue-600">{stats.total}</p>
                    <p className="text-xs text-blue-600">Total</p>
                  </div>
                  <div className="bg-yellow-50 rounded p-2">
                    <p className="text-lg font-bold text-yellow-600">{stats.waiting}</p>
                    <p className="text-xs text-yellow-600">En attente</p>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <p className="text-lg font-bold text-purple-600">{stats.inConsultation}</p>
                    <p className="text-xs text-purple-600">En consultation</p>
                  </div>
                  <div className="bg-red-50 rounded p-2">
                    <p className="text-lg font-bold text-red-600">{stats.urgent}</p>
                    <p className="text-xs text-red-600">Urgences</p>
                  </div>
                </div>
              </div>

              {/* Liste des patients */}
              <div className="p-4">
                {filteredQueue.length > 0 ? (
                  <div className="space-y-3">
                    {filteredQueue.slice(0, 5).map((patient) => {
                      const waitTime = calculateWaitTime(patient.arrived_at);
                      
                      return (
                        <div 
                          key={patient.id} 
                          className={`border rounded-lg p-3 transition-all duration-200 ${
                            patient.status === 'appele' ? 'border-orange-300 bg-orange-50' :
                            patient.status === 'entre' ? 'border-purple-300 bg-purple-50' :
                            patient.status === 'en_consultation' ? 'border-blue-300 bg-blue-50' :
                            patient.priority === 'urgente' || patient.priority === 'tres_urgente' ? 'border-red-300 bg-red-50' :
                            'border-gray-200 bg-gray-50'
                          } ${patient.status === 'appele' ? 'patient-called animate-pulse' : ''} ${patient.status === 'en_consultation' ? 'opacity-60 grayscale' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-900">
                                  {patient.patient?.prenom} {patient.patient?.nom}
                                </h4>
                                {patient.priority === 'urgente' || patient.priority === 'tres_urgente' && (
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-600">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTime(patient.arrived_at)}
                                </span>
                                <span className="flex items-center">
                                  <Activity className="w-3 h-3 mr-1" />
                                  {waitTime} min
                                </span>
                                {patient.appointment?.motif && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {patient.appointment.motif}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              <div className="flex flex-col items-end space-y-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
                                  {getStatusLabel(patient.status)}
                                </span>
                                {patient.status === 'en_consultation' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                                    Consultation en cours
                                  </span>
                                )}
                                {patient.priority && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(patient.priority)}`}>
                                    {patient.priority}
                                  </span>
                                )}
                              </div>
                              
                              {/* Bouton pour marquer comme présent - visible seulement pour les patients appelés */}
                              {patient.status === 'appele' && (
                                <button
                                  onClick={() => handleMarkPatientPresent(patient.id)}
                                  className="inline-flex items-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                                  title="Marquer le patient comme présent"
                                >
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Présent
                                </button>
                              )}
                              
                              {/* Bouton pour scanner des documents */}
                              <button
                                onClick={() => {
                                  setSelectedPatientForUpload(patient.patient);
                                  setShowUploadModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                                title="Scanner des documents"
                              >
                                <FileImage className="w-3 h-3 mr-1" />
                                Scanner
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredQueue.length > 5 && (
                      <div className="text-center py-2">
                        <span className="text-sm text-gray-500">
                          +{filteredQueue.length - 5} autre(s) patient(s)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {queue.length === 0 ? 'Aucun patient' : 'Aucun patient correspondant aux filtres'}
                    </p>
                  </div>
                )}
              </div>
              {/* Rendez-vous du jour pour ce médecin */}
              <div className="p-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" /> Rendez-vous du jour ({todaysAppointments.length})
                </h4>
                {todaysAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {todaysAppointments.slice(0, 5).map((appt) => {
                      const inQueue = isAppointmentInQueue(doctor.id, appt);
                      return (
                        <div key={appt.id} className={`flex items-center justify-between border rounded-md px-3 py-2 ${inQueue ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {formatTime(appt.date_heure)}
                              </div>
                              <div className="truncate">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {appt.patient?.prenom} {appt.patient?.nom}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{appt.motif || 'Motif non défini'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {inQueue ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" /> En file
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAddAppointmentToQueue(doctor.id, appt)}
                                className="inline-flex items-center px-3 py-1 bg-medical-primary text-white rounded-md hover:bg-medical-primary-dark text-xs"
                              >
                                <UserCheck className="w-3 h-3 mr-1" /> Présent
                              </button>
                            )}
                            
                            {/* Bouton pour scanner des documents */}
                            <button
                              onClick={() => {
                                setSelectedPatientForUpload(appt.patient);
                                setShowUploadModal(true);
                              }}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                              title="Scanner des documents"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Scanner
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-500">Aucun rendez-vous aujourd'hui</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun médecin trouvé</p>
        </div>
      )}

      {/* Modal d'upload de documents */}
      {showUploadModal && selectedPatientForUpload && (
        <PatientDocumentUploader
          patient={selectedPatientForUpload}
          onUploadSuccess={() => {
            setShowUploadModal(false);
            setSelectedPatientForUpload(null);
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

export default GlobalWaitingQueue;

