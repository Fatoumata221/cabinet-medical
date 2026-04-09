import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Eye,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  Heart,
  FileText,
  Stethoscope,
  Clock,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const MesPatientsPage = () => {
  const navigate = useNavigate();
  const { currentUser, getUserProfile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    consultationsRecentes: 0,
    nouveauxCeMois: 0
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      if (currentUser) {
        const profile = await getUserProfile();
        setUserProfile(profile);
        if (profile?.id) {
          await fetchPatients(profile.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async (medecinId) => {
    try {
      // Récupérer les patients du médecin via les consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultations')
        .select(`
          patient_id,
          created_at,
          patients!inner(*)
        `)
        .eq('medecin_id', medecinId)
        .order('created_at', { ascending: false });

      if (consultationsError) throw consultationsError;

      // Déduplication des patients et ajout des informations de dernière consultation
      const uniquePatients = [];
      const patientIds = new Set();

      consultationsData?.forEach(consultation => {
        if (!patientIds.has(consultation.patient_id)) {
          patientIds.add(consultation.patient_id);
          uniquePatients.push({
            ...consultation.patients,
            derniere_consultation: consultation.created_at
          });
        }
      });

      setPatients(uniquePatients);
      calculateStats(uniquePatients, consultationsData);

    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    }
  };

  const calculateStats = (patientsList, consultationsList) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: patientsList.length,
      actifs: patientsList.filter(p => p.actif).length,
      consultationsRecentes: consultationsList?.filter(c => 
        new Date(c.created_at) >= lastWeek
      ).length || 0,
      nouveauxCeMois: consultationsList?.filter(c => 
        new Date(c.created_at) >= startOfMonth
      ).length || 0
    };

    setStats(stats);
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.telephone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.numero_dossier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'actif' && patient.actif) ||
      (filterStatus === 'inactif' && !patient.actif);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (actif) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {actif ? 'Actif' : 'Inactif'}
      </span>
    );
  };

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return '';
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleViewPatient = (patient) => {
    navigate(`/rendez-vous/fiche-patient/form?id=${patient.id}&view=true`);
  };

  const handleNewConsultation = (patient) => {
    navigate(`/consultations/new?patient_id=${patient.id}`);
  };

  const handleViewMedicalRecord = (patient) => {
    navigate(`/medical-records?patient_id=${patient.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-medical-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos patients...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profil non trouvé</h3>
          <p className="text-gray-600 mb-4">Impossible de charger votre profil médecin.</p>
          <button 
            onClick={initializeData}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
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
            <Users className="w-8 h-8 text-medical-primary" />
            Mes Patients
          </h1>
          <p className="text-gray-600 mt-2">
            Dr. {userProfile.prenom} {userProfile.nom} - Gestion de votre patientèle
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/patients')}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Patient
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card card-medical">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-medical-primary" />
          </div>
        </div>
        
        <div className="card card-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patients Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.actifs}</p>
            </div>
            <Heart className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="card card-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultations 7j</p>
              <p className="text-2xl font-bold text-gray-900">{stats.consultationsRecentes}</p>
            </div>
            <Stethoscope className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="card card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nouveaux ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{stats.nouveauxCeMois}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
         <div className="mx-2 flex items-center">
         <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
         </div>
          
          <button 
            onClick={() => fetchPatients(userProfile.id)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Liste des patients */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Patient</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Dossier</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Dernière consultation</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-medical-primary to-medical-secondary rounded-full flex items-center justify-center text-white font-semibold">
                        {patient.prenom?.[0]}{patient.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.prenom} {patient.nom}
                        </p>
                        <p className="text-sm text-gray-500">
                          {patient.sexe === 'M' ? 'Masculin' : 'Féminin'} • {calculateAge(patient.date_naissance)} ans
                        </p>
                        {patient.profession && (
                          <p className="text-sm text-gray-500">{patient.profession}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {patient.telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{patient.telephone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{patient.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div>
                      {patient.numero_dossier && (
                        <div className="text-sm font-medium text-blue-600">{patient.numero_dossier}</div>
                      )}
                      {patient.numero_ipm && (
                        <div className="text-sm text-gray-500">SS: {patient.numero_ipm}</div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{formatDate(patient.derniere_consultation)}</span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    {getStatusBadge(patient.actif)}
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleViewPatient(patient)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewMedicalRecord(patient)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Dossier médical"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleNewConsultation(patient)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Nouvelle consultation"
                      >
                        <Stethoscope className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Aucun patient trouvé pour cette recherche' : 'Vous n\'avez encore aucun patient'}
            </p>
            {!searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                Les patients apparaîtront ici après votre première consultation avec eux
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MesPatientsPage;
