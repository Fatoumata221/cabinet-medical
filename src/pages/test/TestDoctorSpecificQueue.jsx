import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import DoctorSpecificQueue from '../../components/secretary/DoctorSpecificQueue';
import { 
  Search, 
  Filter, 
  RefreshCw,
  User,
  Stethoscope
} from 'lucide-react';

const TestDoctorSpecificQueue = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      console.log('🔄 [TestDoctorSpecificQueue] Récupération des médecins...');
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('users')
        .select('id, nom, prenom, specialite')
        .eq('role', 'doctor')
        .order('nom', { ascending: true });

      if (doctorsError) {
        console.error('❌ [TestDoctorSpecificQueue] Erreur médecins:', doctorsError);
        throw doctorsError;
      }

      const transformedDoctors = doctorsData?.map(doctor => ({
        id: doctor.id,
        nom: doctor.nom,
        prenom: doctor.prenom,
        specialite: doctor.specialite || 'Généraliste'
      })) || [];

      console.log('✅ [TestDoctorSpecificQueue] Médecins récupérés:', transformedDoctors.length);
      setDoctors(transformedDoctors);
      
      // Sélectionner le premier médecin par défaut
      if (transformedDoctors.length > 0) {
        setSelectedDoctor(transformedDoctors[0]);
      }
    } catch (error) {
      console.error('❌ [TestDoctorSpecificQueue] Erreur lors du chargement des médecins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDoctors();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-medical-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des médecins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de test */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-medical-primary rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Test DoctorSpecificQueue</h1>
                <p className="text-sm text-gray-600">Composant de test pour la file d'attente spécifique au médecin</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Contrôles de test */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Contrôles de Test
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sélection du médecin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médecin à tester
              </label>
              <select
                value={selectedDoctor?.id || ''}
                onChange={(e) => {
                  const doctorId = parseInt(e.target.value);
                  const doctor = doctors.find(d => d.id === doctorId);
                  setSelectedDoctor(doctor);
                }}
                className="w-full input-field"
              >
                <option value="">Sélectionner un médecin</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.prenom} {doctor.nom} - {doctor.specialite}
                  </option>
                ))}
              </select>
            </div>

            {/* Terme de recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terme de recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full input-field pl-10"
                />
              </div>
            </div>

            {/* Filtre de statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtre de statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full input-field"
              >
                <option value="all">Tous les statuts</option>
                <option value="waiting">En attente</option>
                <option value="present">Présent</option>
                <option value="in_consultation">En consultation</option>
                <option value="finished">Terminé</option>
                <option value="late">En retard</option>
                <option value="emergency">Urgence</option>
              </select>
            </div>
          </div>

          {/* Informations du médecin sélectionné */}
          {selectedDoctor && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Médecin sélectionné :</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedDoctor.prenom[0]}{selectedDoctor.nom[0]}
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    Dr. {selectedDoctor.prenom} {selectedDoctor.nom}
                  </p>
                  <p className="text-sm text-blue-700">{selectedDoctor.specialite}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Composant de test */}
        {selectedDoctor ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Composant DoctorSpecificQueue
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Props: doctor={JSON.stringify(selectedDoctor)}, searchTerm="{searchTerm}", filterStatus="{filterStatus}"
              </p>
            </div>
            
            <div className="p-0">
              <DoctorSpecificQueue 
                doctor={selectedDoctor}
                searchTerm={searchTerm}
                filterStatus={filterStatus}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médecin sélectionné</h3>
            <p className="text-gray-600">Veuillez sélectionner un médecin pour tester le composant</p>
          </div>
        )}

        {/* Informations de débogage */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Informations de débogage :</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Nombre de médecins chargés :</strong> {doctors.length}</p>
            <p><strong>Médecin sélectionné :</strong> {selectedDoctor ? `Dr. ${selectedDoctor.prenom} ${selectedDoctor.nom}` : 'Aucun'}</p>
            <p><strong>Terme de recherche :</strong> "{searchTerm}"</p>
            <p><strong>Filtre de statut :</strong> "{filterStatus}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDoctorSpecificQueue;
