import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { unifiedNotificationService } from '../services/unifiedNotificationService';
// Import des icônes lucide-react - FIXED VERSION
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  Heart,
  FileText,
  X
} from 'lucide-react';

const PatientsPage = () => {
  console.log('🔄 [PatientsFixed] Chargement de la page PatientsFixed');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Vérifier si l'utilisateur est secrétaire (ne peut pas supprimer)
  const isSecretary = hasRole('secretary');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({
    sexe: 'all',
    situation_familiale: 'all',
    mutuelle: '',
    medecin_traitant: '',
    ageMin: '',
    ageMax: ''
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'M',
    telephone: '',
    email: '',
    adresse: '',
    lieu_naissance: '',
    nationalite: '',
    profession: '',
    situation_familiale: '',
    personne_contact: '',
    telephone_contact: '',
    lien_contact: '',
    medecin_traitant: '',
    numero_ipm: '',
    mutuelle: '',
    numero_mutuelle: '',
    actif: true,
    notes: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return '';
    
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleViewPatient = (patient) => {
    // Utiliser la route fiche-patient qui est accessible aux médecins
    navigate(`/rendez-vous/fiche-patient?id=${patient.id}`);
  };

  const handleEditPatient = (patient) => {
    setFormData({
      nom: patient.nom || '',
      prenom: patient.prenom || '',
      date_naissance: patient.date_naissance || '',
      sexe: patient.sexe || 'M',
      telephone: patient.telephone || '',
      email: patient.email || '',
      adresse: patient.adresse || '',
      lieu_naissance: patient.lieu_naissance || '',
      nationalite: patient.nationalite || '',
      profession: patient.profession || '',
      situation_familiale: patient.situation_familiale || '',
      personne_contact: patient.personne_contact || '',
      telephone_contact: patient.telephone_contact || '',
      lien_contact: patient.lien_contact || '',
      medecin_traitant: patient.medecin_traitant || '',
      numero_ipm: patient.numero_ipm || '',
      mutuelle: patient.mutuelle || '',
      numero_mutuelle: patient.numero_mutuelle || '',
      actif: patient.actif !== false,
      notes: patient.notes || ''
    });
    setEditingPatientId(patient.id);
    setShowForm(true);
  };

  const handleDeletePatient = async (patient) => {
    if (!isSecretary && window.confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.prenom} ${patient.nom} ?`)) {
      try {
        const { error } = await supabase
          .from('patients')
          .delete()
          .eq('id', patient.id);
        
        if (error) throw error;
        
        // Recharger la liste des patients
        fetchPatients();
        unifiedNotificationService.success('Patient supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        unifiedNotificationService.error('Erreur lors de la suppression du patient');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPatientId) {
        // Mise à jour
        const { error } = await supabase
          .from('patients')
          .update(formData)
          .eq('id', editingPatientId);
        
        if (error) throw error;
        unifiedNotificationService.success('Patient modifié avec succès');
      } else {
        // Ajout
        const { data: userProfile } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('auth_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        const { error } = await supabase
          .from('patients')
          .insert([{ ...formData, tenant_id: userProfile?.tenant_id }]);
        
        if (error) throw error;
        unifiedNotificationService.success('Patient ajouté avec succès');
      }
      
      setShowForm(false);
      setEditingPatientId(null);
      fetchPatients();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      unifiedNotificationService.error('Erreur lors de la sauvegarde du patient');
    }
  };

  const handleAddPatient = async () => {
    // Générer automatiquement le numéro de dossier
    const { generateNumeroDossier } = await import('../services/patientService');
    const numeroDossier = await generateNumeroDossier();
    
    setFormData({
      nom: '',
      prenom: '',
      date_naissance: '',
      sexe: 'M',
      telephone: '',
      email: '',
      adresse: '',
      lieu_naissance: '',
      nationalite: '',
      profession: '',
      situation_familiale: '',
      personne_contact: '',
      telephone_contact: '',
      lien_contact: '',
      medecin_traitant: '',
      numero_ipm: '',
      mutuelle: '',
      numero_mutuelle: '',
      numero_dossier: numeroDossier,
      actif: true,
      notes: ''
    });
    setEditingPatientId(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPatientId(null);
    setFormData({
      nom: '',
      prenom: '',
      date_naissance: '',
      sexe: 'M',
      telephone: '',
      email: '',
      adresse: '',
      lieu_naissance: '',
      nationalite: '',
      profession: '',
      situation_familiale: '',
      personne_contact: '',
      telephone_contact: '',
      lien_contact: '',
      medecin_traitant: '',
      numero_ipm: '',
      mutuelle: '',
      numero_mutuelle: '',
      actif: true,
      notes: ''
    });
  };

  const getStatusBadge = (actif) => {
    if (actif) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Actif
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Inactif
        </span>
      );
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchTerm || 
      patient.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.telephone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'actif' && patient.actif) ||
      (filterStatus === 'inactif' && !patient.actif);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary"></div>
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
            Gestion des Patients
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez votre base de données patients et leurs informations médicales
          </p>
        </div>
        
        <button 
          onClick={handleAddPatient}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Patient
        </button>
      </div>

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPatientId ? 'Modifier le patient' : 'Nouveau patient'}
            </h2>
            <button
              onClick={handleCancelForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmitForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                  className="input-field"
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
                  className="input-field"
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
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexe *</label>
                <select
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={handleCancelForm}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
              >
                {editingPatientId ? 'Modifier' : 'Enregistrer'}
              </button>
              {!editingPatientId && (
                <button 
                  type="button"
                  onClick={async () => {
                    await handleSubmitForm({ preventDefault: () => {} });
                    await handleAddPatient();
                  }}
                  className="btn btn-outline"
                >
                  Ajouter un autre patient
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Liste des patients */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dossier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-medical-primary flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.prenom} {patient.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.sexe === 'M' ? 'Masculin' : 'Féminin'} • {calculateAge(patient.date_naissance)} ans
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900">
                      {patient.telephone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{patient.telephone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-1">
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
                        onClick={() => handleEditPatient(patient)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!isSecretary && (
                        <button 
                          onClick={() => handleDeletePatient(patient)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
            <p className="text-gray-500">Aucun patient trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
