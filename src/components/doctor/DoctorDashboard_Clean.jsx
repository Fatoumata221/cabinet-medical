import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
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
  Activity
} from 'lucide-react';

const DoctorDashboard = () => {
  const { userProfile } = useAuth();
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalWaiting: 0,
    inConsultation: 0,
    newPatients: 0,
    consultationsFinished: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) {
      fetchDashboardData();
      
      // Subscription temps réel
      const channel = supabase.channel('doctor_dashboard')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'waiting_queue',
          filter: `medecin_id=eq.${userProfile.id}`
        }, () => {
          fetchDashboardData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer la file d'attente du médecin
      const { data: queueData, error: queueError } = await supabase
        .from('v_waiting_queue_complete')
        .select('*')
        .eq('medecin_id', userProfile.id)
        .in('status', ['waiting', 'present', 'authorized', 'medecin_pret', 'en_route', 'in_consultation'])
        .order('priorite_calculee', { ascending: true })
        .order('order_position', { ascending: true });

      if (queueError) throw queueError;
      setWaitingQueue(queueData || []);

      // Récupérer les RDV du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(nom, prenom, telephone),
          waiting_queue!left(id, status, arrived_at)
        `)
        .eq('medecin_id', userProfile.id)
        .gte('date_heure', today.toISOString())
        .lt('date_heure', tomorrow.toISOString())
        .order('date_heure');

      if (appointmentsError) throw appointmentsError;
      setTodayAppointments(appointmentsData || []);

      // Calculer les statistiques
      const queueStats = {
        totalWaiting: queueData?.filter(q => ['waiting', 'present', 'authorized'].includes(q.status)).length || 0,
        inConsultation: queueData?.filter(q => q.status === 'in_consultation').length || 0,
        newPatients: queueData?.filter(q => q.nouveau_en_attente).length || 0,
        consultationsFinished: queueData?.filter(q => q.status === 'termine' && q.updated_at > new Date(Date.now() - 2 * 60 * 60 * 1000)).length || 0
      };
      setStats(queueStats);

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAction = async (patientId, action) => {
    try {
      const patient = waitingQueue.find(p => p.id === patientId);
      const patientName = patient ? `${patient.patient_prenom} ${patient.patient_nom}` : 'Patient';

      switch (action) {
        case 'available':
          const { data: availableData, error: availableError } = await supabase.rpc('mark_doctor_available_basesql', {
            p_waiting_queue_id: patientId,
            p_medecin_id: userProfile.id
          });
          if (availableError) throw availableError;
          
          if (availableData?.success) {
            unifiedNotificationService.success(availableData.message);
          }
          break;

        case 'start':
          const { error: startError } = await supabase.rpc('start_consultation_basesql', {
            p_waiting_queue_id: patientId,
            p_medecin_id: userProfile.id
          });
          if (startError) throw startError;
          break;

        case 'finish':
          const { error: finishError } = await supabase.rpc('finish_consultation_basesql', {
            p_waiting_queue_id: patientId,
            p_medecin_id: userProfile.id
          });
          if (finishError) throw finishError;
          break;

        default:
          console.warn('Action non reconnue:', action);
      }

      // Actualiser les données
      fetchDashboardData();
    } catch (error) {
      console.error('Erreur lors de l\'action patient:', error);
      unifiedNotificationService.error('Erreur lors de l\'action. Veuillez réessayer.');
    }
  };

  const currentPatient = waitingQueue.find(p => ['present', 'authorized', 'medecin_pret', 'en_route', 'in_consultation'].includes(p.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-medical-primary mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de Bord - Dr. {userProfile?.prenom} {userProfile?.nom}
          </h1>
          <p className="text-gray-600">{userProfile?.specialite}</p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} - {new Date().toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWaiting}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Stethoscope className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En consultation</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inConsultation}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nouveaux</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newPatients}</p>
                {stats.newPatients > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                    Alertes
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.consultationsFinished}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Actuel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="w-6 h-6 mr-2" />
                  Patient Actuel
                </h2>
              </div>
              
              {currentPatient ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {currentPatient.patient_prenom} {currentPatient.patient_nom}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {currentPatient.rdv_motif || 'Consultation'}
                      </p>
                      {currentPatient.rdv_date_heure && (
                        <p className="text-xs text-gray-400">
                          RDV prévu : {new Date(currentPatient.rdv_date_heure).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentPatient.status === 'present' ? 'bg-orange-100 text-orange-800' :
                        currentPatient.status === 'authorized' ? 'bg-green-100 text-green-800' :
                        currentPatient.status === 'medecin_pret' ? 'bg-blue-100 text-blue-800' :
                        currentPatient.status === 'en_route' ? 'bg-purple-100 text-purple-800' :
                        currentPatient.status === 'in_consultation' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {currentPatient.status === 'present' ? 'Arrivé' :
                         currentPatient.status === 'authorized' ? 'Autorisé' :
                         currentPatient.status === 'medecin_pret' ? 'Médecin prêt' :
                         currentPatient.status === 'en_route' ? 'Patient appelé' :
                         currentPatient.status === 'in_consultation' ? 'En consultation' :
                         currentPatient.status}
                      </span>
                      {currentPatient.temps_attente_minutes > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(currentPatient.temps_attente_minutes)}min d'attente
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {currentPatient.status === 'present' && (
                      <button
                        onClick={() => handlePatientAction(currentPatient.id, 'available')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Je suis disponible
                      </button>
                    )}
                    
                    {currentPatient.status === 'en_route' && (
                      <button
                        onClick={() => handlePatientAction(currentPatient.id, 'start')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Commencer consultation
                      </button>
                    )}
                    
                    {currentPatient.status === 'in_consultation' && (
                      <button
                        onClick={() => handlePatientAction(currentPatient.id, 'finish')}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Terminer consultation
                      </button>
                    )}
                    
                    {currentPatient.status === 'medecin_pret' && (
                      <div className="flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
                        <Clock className="w-4 h-4 mr-2" />
                        En attente de confirmation secrétaire
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun patient en attente</p>
                </div>
              )}
            </div>
          </div>

          {/* Salle d'attente */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Salle d'attente ({waitingQueue.length})</h3>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {waitingQueue.length > 0 ? (
                  <div className="space-y-3">
                    {waitingQueue.map((patient, index) => (
                      <div key={patient.id} className={`p-3 border rounded-lg ${
                        patient.id === currentPatient?.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {patient.patient_prenom} {patient.patient_nom}
                            </p>
                            <p className="text-xs text-gray-500">
                              Position: {index + 1}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            patient.status === 'waiting' ? 'bg-gray-100 text-gray-800' :
                            patient.status === 'present' ? 'bg-orange-100 text-orange-800' :
                            patient.status === 'authorized' ? 'bg-green-100 text-green-800' :
                            patient.status === 'in_consultation' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {patient.status === 'waiting' ? 'Attente' :
                             patient.status === 'present' ? 'Arrivé' :
                             patient.status === 'authorized' ? 'Autorisé' :
                             patient.status === 'in_consultation' ? 'Consultation' :
                             patient.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Salle d'attente vide</p>
                  </div>
                )}
              </div>
            </div>

            {/* RDV du jour */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 mt-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">RDV du jour ({todayAppointments.length})</h3>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                {todayAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-2 border rounded text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {appointment.patient?.prenom} {appointment.patient?.nom}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(appointment.date_heure).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{appointment.motif}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Aucun RDV aujourd'hui</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
