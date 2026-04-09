import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import { 
  Stethoscope, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Phone,
  Activity,
  UserCheck,
  Plus,
  Eye,
  FileImage,
  Upload
} from 'lucide-react';
import PatientDocumentUploader from './PatientDocumentUploader';

const DoctorSpecificQueue = ({ doctor, searchTerm, filterStatus }) => {
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPatientForUpload, setSelectedPatientForUpload] = useState(null);

  useEffect(() => {
    if (doctor) {
      fetchDoctorData();
    }
  }, [doctor]);

  // Abonnement temps réel pour la file d'un médecin spécifique
  useEffect(() => {
    if (!doctor) return;
    const channel = supabase
      .channel(`doctor_specific_queue_${doctor.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiting_queue',
        filter: `medecin_id=eq.${doctor.id}`
      }, (payload) => {
        console.log('🔄 [DoctorSpecificQueue] Changement temps réel détecté:', payload);
        fetchWaitingQueue();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `medecin_id=eq.${doctor.id}`
      }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctor]);

  const fetchDoctorData = async () => {
    try {
      console.log('🔄 [DoctorSpecificQueue] Rechargement des données...');
      setLoading(true);
      await Promise.all([
        fetchWaitingQueue(),
        fetchAppointments()
      ]);
      console.log('✅ [DoctorSpecificQueue] Données rechargées avec succès');
    } catch (error) {
      console.error('❌ [DoctorSpecificQueue] Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitingQueue = async () => {
    try {
      console.log('📋 [DoctorSpecificQueue] Récupération de la file d\'attente pour médecin:', doctor.id);
      const { data, error } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier),
          appointment:appointments(motif, duree)
        `)
        .eq('medecin_id', doctor.id)
        .order('order_position', { ascending: true });

      if (error) {
        console.error('❌ [DoctorSpecificQueue] Erreur récupération file d\'attente:', error);
        throw error;
      }
      
      console.log('✅ [DoctorSpecificQueue] File d\'attente récupérée:', data?.length || 0, 'patients');
      console.log('📊 [DoctorSpecificQueue] Détails file d\'attente:', data?.map(p => ({
        id: p.id,
        patient_id: p.patient_id,
        appointment_id: p.appointment_id,
        status: p.status,
        patient_name: `${p.patient?.prenom} ${p.patient?.nom}`
      })));
      
      setWaitingQueue(data || []);
    } catch (error) {
      console.error('❌ [DoctorSpecificQueue] Erreur lors du chargement de la file d\'attente:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier)
        `)
        .eq('medecin_id', doctor.id)
        .gte('date_heure', today.toISOString())
        .lt('date_heure', tomorrow.toISOString())
        .order('date_heure', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
    }
  };

  // Fonction pour marquer un patient appelé comme présent
  const handleMarkCalledPatientPresent = async (patientId) => {
    try {
      console.log('✅ [DoctorSpecificQueue] Marquage patient appelé présent:', patientId);
      
      const { error } = await supabase
        .from('waiting_queue')
        .update({ 
          status: 'present',
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) {
        console.error('❌ [DoctorSpecificQueue] Erreur marquage présent:', error);
        throw error;
      }

      console.log('✅ [DoctorSpecificQueue] Patient appelé marqué comme présent:', patientId);
      
      // Recharger les données
      fetchWaitingQueue();
      
      // Afficher une notification de succès
      if (window.showNotification) {
        window.showNotification({
          message: 'Patient marqué comme présent !',
          type: 'success',
          duration: 3000
        });
      }
      
    } catch (error) {
      console.error('❌ [DoctorSpecificQueue] Erreur lors du marquage présent:', error);
      
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

  const handlePatientPresent = async (appointmentId, patientId) => {
    try {
      console.log('🔄 [DoctorSpecificQueue] Ajout patient à la file:', { appointmentId, patientId, doctorId: doctor.id });
      
      // Vérifier si le patient n'est pas déjà en file d'attente pour ce rendez-vous
      const { data: existingPatient } = await supabase
        .from('waiting_queue')
        .select('id')
        .eq('patient_id', patientId)
        .eq('medecin_id', doctor.id)
        .eq('appointment_id', appointmentId)
        .eq('status', 'waiting')
        .single();

      if (existingPatient) {
        console.log('⚠️ [DoctorSpecificQueue] Patient déjà en file d\'attente:', existingPatient);
        unifiedNotificationService.warning('Le patient est déjà en file d\'attente');
        return;
      }

      // Récupérer la position actuelle
      const { data: currentQueue } = await supabase
        .from('waiting_queue')
        .select('order_position')
        .eq('medecin_id', doctor.id)
        .order('order_position', { ascending: false })
        .limit(1);

      const nextPosition = currentQueue && currentQueue.length > 0 ? currentQueue[0].order_position + 1 : 1;
      console.log('📊 [DoctorSpecificQueue] Position suivante:', nextPosition);

      // Ajouter le patient à la file d'attente
      const { data, error } = await supabase
        .from('waiting_queue')
        .insert([{
          patient_id: patientId,
          medecin_id: doctor.id,
          appointment_id: appointmentId,
          status: 'waiting',
          priority: 'normale',
          arrived_at: new Date().toISOString(),
          order_position: nextPosition
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [DoctorSpecificQueue] Erreur insertion:', error);
        throw error;
      }

      console.log('✅ [DoctorSpecificQueue] Patient ajouté avec succès:', data);

      // Attendre un peu pour que la base de données se synchronise
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recharger les données
      await fetchDoctorData();
      console.log('🔄 [DoctorSpecificQueue] Données rechargées');
      
      // Vérifier que le patient est bien dans la file d'attente
      const { data: verifyData } = await supabase
        .from('waiting_queue')
        .select('*')
        .eq('patient_id', patientId)
        .eq('medecin_id', doctor.id)
        .eq('appointment_id', appointmentId)
        .single();
      
      console.log('🔍 [DoctorSpecificQueue] Vérification après ajout:', verifyData);
      
      // Forcer le refresh de l'interface
      setRefreshKey(prev => prev + 1);
      console.log('🔄 [DoctorSpecificQueue] Interface rafraîchie');
    } catch (error) {
      console.error('❌ [DoctorSpecificQueue] Erreur lors de l\'ajout du patient à la file d\'attente:', error);
      unifiedNotificationService.error('Erreur lors de l\'ajout du patient à la file d\'attente: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_consultation': return 'text-blue-600 bg-blue-100';
      case 'present': return 'text-purple-600 bg-purple-100';
      case 'late': return 'text-orange-600 bg-orange-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'finished': return 'text-green-600 bg-green-100';
      case 'emergency': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_consultation': return 'En consultation';
      case 'present': return 'Présent';
      case 'late': return 'En retard';
      case 'waiting': return 'En attente';
      case 'finished': return 'Terminé';
      case 'emergency': return 'Urgence';
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

  const filterPatients = () => {
    let filtered = waitingQueue;

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(patient => patient.status === filterStatus);
    }

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => {
        const patientName = `${patient.patient?.prenom} ${patient.patient?.nom}`.toLowerCase();
        return patientName.includes(searchLower);
      });
    }

    return filtered;
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => {
        const patientName = `${appointment.patient?.prenom} ${appointment.patient?.nom}`.toLowerCase();
        return patientName.includes(searchLower);
      });
    }

    return filtered;
  };

  const isPatientInQueue = (patientId, appointmentId = null) => {
    const isInQueue = waitingQueue.some(patient => {
      if (appointmentId) {
        // Vérifier si le patient est en file pour ce rendez-vous spécifique
        return patient.patient_id === patientId && patient.appointment_id === appointmentId;
      } else {
        // Vérifier si le patient est en file pour n'importe quel rendez-vous
        return patient.patient_id === patientId;
      }
    });
    console.log('🔍 [DoctorSpecificQueue] Vérification patient en file:', { 
      patientId, 
      appointmentId,
      isInQueue, 
      waitingQueueLength: waitingQueue.length,
      waitingQueuePatients: waitingQueue.map(p => ({ 
        id: p.patient_id, 
        appointment_id: p.appointment_id,
        status: p.status 
      }))
    });
    return isInQueue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const filteredPatients = filterPatients();
  const filteredAppointments = filterAppointments();

  return (
    <div key={refreshKey} className="p-6">
      {/* En-tête du médecin */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-medical-primary rounded-full flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dr. {doctor.prenom} {doctor.nom}
            </h2>
            <p className="text-gray-600">{doctor.specialite}</p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{waitingQueue.length}</p>
                <p className="text-sm text-blue-600">Total patients</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {waitingQueue.filter(p => p.status === 'waiting').length}
                </p>
                <p className="text-sm text-yellow-600">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Stethoscope className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {waitingQueue.filter(p => p.status === 'present' || p.status === 'in_consultation').length}
                </p>
                <p className="text-sm text-purple-600">En consultation</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{appointments.length}</p>
                <p className="text-sm text-green-600">Rendez-vous</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File d'attente */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              File d'Attente ({filteredPatients.length})
            </h3>
          </div>
          
          <div className="p-4">
            {filteredPatients.length > 0 ? (
              <div className="space-y-3">
                {filteredPatients.map((patient, index) => {
                  const waitTime = calculateWaitTime(patient.arrived_at);
                  
                  return (
                    <div 
                      key={patient.id} 
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        patient.status === 'appele' ? 'border-orange-300 bg-orange-50' :
                        patient.status === 'entre' ? 'border-purple-300 bg-purple-50' :
                        patient.status === 'en_consultation' ? 'border-blue-300 bg-blue-50' :
                        patient.priority === 'urgente' || patient.priority === 'tres_urgente' ? 'border-red-300 bg-red-50' :
                        'border-gray-200 bg-gray-50'
                      } ${patient.status === 'appele' ? 'patient-called animate-pulse' : ''} ${patient.status === 'en_consultation' ? 'opacity-60 grayscale' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-medical-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {patient.patient?.prenom} {patient.patient?.nom}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Dossier: {patient.patient?.numero_dossier}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              Arrivé à {formatTime(patient.arrived_at)}
                            </span>
                            <span className="flex items-center">
                              <Activity className="w-4 h-4 mr-1" />
                              {waitTime} min d'attente
                            </span>
                          </div>
                          
                          {patient.appointment?.motif && (
                            <p className="text-sm text-gray-600">
                              Motif: {patient.appointment.motif}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex flex-col items-end space-y-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
                              {getStatusLabel(patient.status)}
                            </span>
                            {patient.status === 'en_consultation' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                                Consultation en cours
                              </span>
                            )}
                            {patient.priority && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(patient.priority)}`}>
                                {patient.priority === 'urgente' || patient.priority === 'tres_urgente' && (
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                )}
                                {patient.priority}
                              </span>
                            )}
                          </div>
                          
                          {/* Bouton pour marquer comme présent - visible seulement pour les patients appelés */}
                          {patient.status === 'appele' && (
                            <button
                              onClick={() => handleMarkCalledPatientPresent(patient.id)}
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
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucun patient en file d'attente</p>
              </div>
            )}
          </div>
        </div>

        {/* Rendez-vous du jour */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Rendez-vous du Jour ({filteredAppointments.length})
            </h3>
          </div>
          
          <div className="p-4">
            {filteredAppointments.length > 0 ? (
              <div className="space-y-3">
                {filteredAppointments.map((appointment) => {
                  const isInQueue = isPatientInQueue(appointment.patient_id, appointment.id);
                  
                  return (
                    <div 
                      key={appointment.id} 
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        isInQueue ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {formatTime(appointment.date_heure).split(':')[0]}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {appointment.patient?.prenom} {appointment.patient?.nom}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {formatTime(appointment.date_heure)} - {appointment.motif}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {appointment.patient?.telephone || 'Non renseigné'}
                            </span>
                            {appointment.duree && (
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {appointment.duree} min
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          {isInQueue ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-600">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Présent
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePatientPresent(appointment.id, appointment.patient_id)}
                              className="flex items-center px-3 py-1 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors text-sm"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Présent
                            </button>
                          )}
                          
                          {/* Bouton pour scanner des documents */}
                          <button
                            onClick={() => {
                              setSelectedPatientForUpload(appointment.patient);
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucun rendez-vous aujourd'hui</p>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default DoctorSpecificQueue;

