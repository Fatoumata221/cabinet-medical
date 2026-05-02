import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Clock, 
  User, 
  Phone, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  RefreshCw,
  Eye,
  Edit,
  UserCheck,
  Stethoscope,
  Timer,
  Activity,
  MapPin,
  Heart,
  Thermometer,
  FileImage,
  Upload
} from 'lucide-react';
import { formatDoctorSpecialties, getDoctorInitials } from '../utils/doctorUtils';
import PatientDocumentUploader from '../components/secretary/PatientDocumentUploader';

const SalleAttentePage = () => {
  const { currentUser } = useAuth();
  const [patientsEnAttente, setPatientsEnAttente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPatientForUpload, setSelectedPatientForUpload] = useState(null);

  useEffect(() => {
    fetchPatientsEnAttente();
    setupRealtimeSubscription();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchPatientsEnAttente, 30000);
    return () => clearInterval(interval);
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase.channel('salle_attente_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'waiting_queue'
      }, () => {
        fetchPatientsEnAttente();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchPatientsEnAttente = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1) Récupérer la file d'attente sans jointures imbriquées - inclure tous les statuts pertinents
      const { data: queueData, error: queueError } = await supabase
        .from('waiting_queue')
        .select('*')
        .in('status', ['waiting', 'present', 'called', 'arrive', 'appele', 'en_route', 'medecin_pret'])
        .gte('created_at', `${today}T00:00:00`)
        .order('order_position', { ascending: true });

      if (queueError) throw queueError;

      const list = Array.isArray(queueData) ? queueData : [];
      if (list.length === 0) {
        setPatientsEnAttente([]);
        return;
      }

      // Déduplication améliorée: garder la plus récente par patient_id ET medecin_id
      const pickTimestamp = (it) => new Date(it.arrived_at || it.updated_at || it.created_at || 0).getTime();
      const uniqueMap = new Map();
      for (const it of list) {
        // Utiliser une clé unique basée sur patient_id et medecin_id pour éviter les doublons
        const key = `${it.patient_id}-${it.medecin_id}`;
        const prev = uniqueMap.get(key);
        if (!prev || pickTimestamp(it) > pickTimestamp(prev)) {
          uniqueMap.set(key, it);
        }
      }
      const deduped = Array.from(uniqueMap.values());

      // 2) Récupérer en masse les patients et médecins référencés
      const patientIds = Array.from(new Set(deduped.map(i => i.patient_id).filter(Boolean)));
      const doctorIds = Array.from(new Set(deduped.map(i => i.medecin_id).filter(Boolean)));

      let patientMap = {};
      let doctorMap = {};

      if (patientIds.length > 0) {
        const { data: patientsRows, error: patientsErr } = await supabase
          .from('patients')
          .select('id, nom, prenom, telephone, date_naissance')
          .in('id', patientIds);
        if (!patientsErr && patientsRows) {
          patientMap = Object.fromEntries(patientsRows.map(p => [p.id, p]));
        } else {
          console.error('SalleAttente: erreur récupération patients', patientsErr);
          // Créer des entrées par défaut pour éviter les noms manquants
          patientIds.forEach(id => {
            patientMap[id] = { id, nom: 'Inconnu', prenom: 'Patient', telephone: 'N/A' };
          });
        }
      }

      if (doctorIds.length > 0) {
        const { data: doctorsRows, error: doctorsErr } = await supabase
          .from('users')
          .select('id, nom, prenom, specialite')
          .in('id', doctorIds);
        if (!doctorsErr && doctorsRows) {
          doctorMap = Object.fromEntries(doctorsRows.map(d => [d.id, d]));
        } else {
          console.error('SalleAttente: erreur récupération médecins', doctorsErr);
          // Créer des entrées par défaut pour éviter les noms manquants
          doctorIds.forEach(id => {
            doctorMap[id] = { id, nom: 'Inconnu', prenom: 'Dr.', specialite: 'N/A' };
          });
        }
      }

      // 3) Fusionner les données pour correspondre au rendu actuel
      const enriched = deduped.map(item => ({
        ...item,
        patient: patientMap[item.patient_id] || { id: item.patient_id, nom: 'Inconnu', prenom: 'Patient', telephone: 'N/A' },
        medecin: doctorMap[item.medecin_id] || { id: item.medecin_id, nom: 'Inconnu', prenom: 'Dr.', specialite: 'N/A' },
      }));

      setPatientsEnAttente(enriched);
    } catch (error) {
      console.error('Erreur lors du chargement des patients en attente:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePatientStatus = async (patientId, newStatus) => {
    try {
      const { error } = await supabase
        .from('waiting_queue')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;
      
      // Ajouter une notification
      addNotification(`Patient ${newStatus === 'in_consultation' ? 'en consultation' : 'appelé'}`, 'success');
      fetchPatientsEnAttente();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      addNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      waiting: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
      present: { color: 'bg-blue-100 text-blue-800', icon: UserCheck, label: 'Présent' },
      arrive: { color: 'bg-blue-100 text-blue-800', icon: UserCheck, label: 'Arrivé' },
      called: { color: 'bg-orange-100 text-orange-800', icon: Bell, label: 'Appelé' },
      appele: { color: 'bg-orange-100 text-orange-800', icon: Bell, label: 'Appelé' },
      medecin_pret: { color: 'bg-cyan-100 text-cyan-800', icon: CheckCircle, label: 'Médecin prêt' },
      en_route: { color: 'bg-purple-100 text-purple-800', icon: User, label: 'En route' },
      in_consultation: { color: 'bg-green-100 text-green-800', icon: Stethoscope, label: 'En consultation' }
    };
    
    const config = statusConfig[status] || statusConfig.waiting;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'border-l-red-500 bg-red-50';
      case 'tres_urgente': return 'border-l-red-700 bg-red-100';
      default: return 'border-l-blue-500 bg-white';
    }
  };

  const getWaitingTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  const handlePatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la salle d'attente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec notifications */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salle d'Attente</h1>
          <p className="text-gray-600">Gestion en temps réel des patients présents</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">{patientsEnAttente.length} patients</span>
          </div>
          <button 
            onClick={fetchPatientsEnAttente}
            className="flex items-center px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Notifications en temps réel */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-3 rounded-lg border-l-4 ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}
            >
              <div className="flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{notification.message}</span>
                <span className="ml-auto text-xs opacity-75">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {patientsEnAttente.filter(p => p.status === 'waiting').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Présents</p>
              <p className="text-2xl font-bold text-gray-900">
                {patientsEnAttente.filter(p => ['present', 'arrive'].includes(p.status)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Appelés</p>
              <p className="text-2xl font-bold text-gray-900">
                {patientsEnAttente.filter(p => ['called', 'appele'].includes(p.status)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center">
            <Stethoscope className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">En consultation</p>
              <p className="text-2xl font-bold text-gray-900">
                {patientsEnAttente.filter(p => p.status === 'in_consultation').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des patients */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Patients en salle d'attente</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {patientsEnAttente.map((item, index) => (
            <div 
              key={item.id} 
              className={`p-6 border-l-4 ${getPriorityColor(item.priorite)} hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-medical-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.patient?.prenom} {item.patient?.nom}
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Stethoscope className="w-4 h-4 mr-1" />
                        {formatDoctorSpecialties(item.medecin)}
                      </div>
                      <div className="flex items-center">
                        <Timer className="w-4 h-4 mr-1" />
                        Attente: {getWaitingTime(item.created_at)}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {item.patient?.telephone}
                      </div>
                    </div>
                    
                    {item.motif_consultation && (
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Motif:</span> {item.motif_consultation}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.status === 'called' && (
                    <button
                      onClick={() => updatePatientStatus(item.id, 'in_consultation')}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      En consultation
                    </button>
                  )}
                  
                  {/* Bouton pour scanner des documents */}
                  <button
                    onClick={() => {
                      setSelectedPatientForUpload(item.patient);
                      setShowUploadModal(true);
                    }}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                    title="Scanner des documents médicaux"
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    Scanner
                  </button>
                  
                  <button
                    onClick={() => handlePatientDetails(item)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Voir détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {patientsEnAttente.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun patient en salle d'attente</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal détails patient */}
      {showPatientDetails && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails du patient
                </h3>
                <button
                  onClick={() => setShowPatientDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations patient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Informations personnelles
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Nom:</span>
                      <span className="ml-2">{selectedPatient.patient?.prenom} {selectedPatient.patient?.nom}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Téléphone:</span>
                      <span className="ml-2">{selectedPatient.patient?.telephone}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Date de naissance:</span>
                      <span className="ml-2">
                        {selectedPatient.patient?.date_naissance ? 
                          new Date(selectedPatient.patient.date_naissance).toLocaleDateString('fr-FR') : 
                          'Non renseignée'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Consultation
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Spécialité:</span>
                      <span className="ml-2">{formatDoctorSpecialties(selectedPatient.medecin)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Motif:</span>
                      <span className="ml-2">{selectedPatient.motif_consultation || 'Non spécifié'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Statut:</span>
                      <span className="ml-2">{getStatusBadge(selectedPatient.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions rapides */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Actions rapides</h4>
                <div className="flex space-x-3">
                  {selectedPatient.status === 'waiting' && (
                    <button
                      onClick={() => {
                        updatePatientStatus(selectedPatient.id, 'called');
                        setShowPatientDetails(false);
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Appeler le patient
                    </button>
                  )}
                  
                  {selectedPatient.status === 'called' && (
                    <button
                      onClick={() => {
                        updatePatientStatus(selectedPatient.id, 'in_consultation');
                        setShowPatientDetails(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Démarrer consultation
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowPatientDetails(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'upload de documents */}
      {showUploadModal && selectedPatientForUpload && (
        <PatientDocumentUploader
          patient={selectedPatientForUpload}
          onUploadSuccess={() => {
            setShowUploadModal(false);
            setSelectedPatientForUpload(null);
            addNotification('Documents uploadés avec succès', 'success');
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

export default SalleAttentePage;
