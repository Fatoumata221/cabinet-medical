import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Clock, 
  Stethoscope, 
  AlertTriangle, 
  Search,
  Filter,
  Plus,
  RefreshCw,
  Bell,
  Eye,
  Calendar,
  Phone,
  UserCheck
} from 'lucide-react';
import GlobalWaitingQueue from './GlobalWaitingQueue';
import DoctorSpecificQueue from './DoctorSpecificQueue';
import AddPatientModal from './AddPatientModal';
import CustomCalendar from '../CustomCalendar';
import { getUnreadNotifications, subscribeToNotifications, unsubscribeFromNotifications } from '../../lib/notifications';
import useUserProfile from '../../hooks/useUserProfile';
import { useSpecialityConfig } from '../../contexts/SpecialityConfigContext';

const SecretaryDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { profile: userProfile, isLoading: userProfileLoading } = useUserProfile();
  const [activeView, setActiveView] = useState('global'); // 'global' ou 'specific'
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { specialityConfig } = useSpecialityConfig();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [doctorQueueFilter, setDoctorQueueFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [notificationSubscription, setNotificationSubscription] = useState(null);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      fetchDoctors().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userProfile?.tenant_id]);

  useEffect(() => {
    // Abonnement aux changements de la file d'attente
    const waitingQueueChannel = supabase.channel('secretary_dashboard_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'waiting_queue'
      }, () => {
        fetchData();
      })
      .subscribe();

    if (userProfile?.id && userProfile?.role) {
      fetchNotifications();
      const { subscription, unsubscribe } = subscribeToNotifications(userProfile.id, userProfile.role, () => {
        fetchNotifications();
      });
      
      setNotificationSubscription({ subscription, unsubscribe });

      return () => {
        supabase.removeChannel(waitingQueueChannel);
        if (notificationSubscription?.unsubscribe) {
          notificationSubscription.unsubscribe();
        }
      };
    }

    return () => {
      supabase.removeChannel(waitingQueueChannel);
    };
  }, [userProfile?.id, userProfile?.role]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchDoctors(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'doctor')
        .eq('actif', true)
        .eq('tenant_id', userProfile?.tenant_id)
        .order('nom', { ascending: true });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!userProfile?.id || !userProfile?.role) {
        console.log('⚠️ [SecretaryDashboard] Profil utilisateur non disponible');
        return;
      }
      const data = await getUnreadNotifications(userProfile.id, userProfile.role);
      setNotifications(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      setNotifications([]);
    }
  };

  const handleDoctorSelect = (doctor, queueFilter = 'all') => {
    if (!doctor) {
      setSelectedDoctor(null);
      setDoctorQueueFilter('all');
      setActiveView('global');
      return;
    }
    setSelectedDoctor(doctor);
    setDoctorQueueFilter(queueFilter);
    setActiveView('specific');
  };

  const handleBackToGlobal = () => {
    setSelectedDoctor(null);
    setActiveView('global');
  };

  const getUrgencyColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'text-red-600 bg-red-100';
      case 'tres_urgente': return 'text-red-800 bg-red-200';
      case 'normale': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading || userProfileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Secrétaire</h1>
          <p className="text-gray-600">Gestion des files d'attente et des patients</p>
          {specialityConfig && (
            <p className="text-sm text-gray-500 mt-1">
              Mode actuel: <span className="font-semibold">
                {specialityConfig.mode === 'generaliste' ? 'Généraliste' : `Spécialité: ${specialityConfig.specialite?.nom || 'Inconnue'}`}
              </span>
              {specialityConfig.mode_specialite_id && ` (ID: ${specialityConfig.mode_specialite_id})`}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">{notifications.length} notifications</span>
          </div>
          <button 
            onClick={() => setShowCalendarView(!showCalendarView)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors shadow-sm ${
              showCalendarView 
                ? 'bg-gray-700 text-white hover:bg-gray-800' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {showCalendarView ? 'Voir file d\'attente' : 'Voir calendrier'}
          </button>
          <button 
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Navigation des vues - Uniquement visible quand le calendrier n'est pas affiché */}
      {!showCalendarView && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveView('global')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'global'
                    ? 'bg-medical-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Vue Globale
              </button>
              
              <button
                onClick={() => setActiveView('specific')}
                disabled={!selectedDoctor}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'specific'
                    ? 'bg-medical-primary text-white'
                    : selectedDoctor
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vue Spécifique
              </button>
            </div>

            {activeView === 'specific' && selectedDoctor && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Médecin sélectionné : <strong>Dr. {selectedDoctor.prenom} {selectedDoctor.nom}</strong>
                </span>
                <button
                  onClick={handleBackToGlobal}
                  className="text-medical-primary hover:text-medical-primary-dark text-sm font-medium"
                >
                  Retour à la vue globale
                </button>
              </div>
            )}

            <button
              onClick={() => setShowAddPatientModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Inscrire Patient
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un médecin ou un patient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="waiting">En attente</option>
                  <option value="appele">Appelé</option>
                  <option value="entre">Entré</option>
                  <option value="in_consultation">En consultation</option>
                  <option value="urgent">Urgences</option>
                  <option value="finished">Terminé</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {showCalendarView ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Calendrier des rendez-vous</h2>
              <button
                onClick={() => setShowCalendarView(false)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Retour à la salle d'attente
              </button>
            </div>
            <CustomCalendar />
          </div>
        ) : (
          activeView === 'global' ? (
            <GlobalWaitingQueue
              doctors={doctors}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              onFilterStatus={setFilterStatus}
              onDoctorSelect={handleDoctorSelect}
              onNavigateCalendar={() => navigate('/secretary-calendar')}
              onNavigateWaitingRoom={() => navigate('/salle-attente')}
            />
          ) : (
            <DoctorSpecificQueue
              doctor={selectedDoctor}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              initialQueueFilter={doctorQueueFilter}
            />
          )
        )}
      </div>

      {/* Modal d'ajout de patient */}
      {showAddPatientModal && (
        <AddPatientModal
          doctors={doctors}
          onClose={() => setShowAddPatientModal(false)}
          onPatientAdded={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default SecretaryDashboard;