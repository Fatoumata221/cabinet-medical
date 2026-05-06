import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Search, 
  Plus, 
  Eye,
  Phone,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';

const MesPatientsPage = () => {
  console.log('🔄 [MesPatientsPage] DÉBUT - Chargement de la page Mes Patients');
  
  try {
    const navigate = useNavigate();
    const { currentUser, getUserProfile } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
      initializeData();
    }, []);

    const initializeData = async () => {
      try {
        console.log('🔄 [MesPatientsPage] Initialisation des données...');
        if (currentUser) {
          const profile = await getUserProfile();
          console.log('🔄 [MesPatientsPage] Profil chargé:', profile);
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

    const fetchPatients = async (doctorId) => {
      try {
        console.log('🔄 [MesPatientsPage] Récupération des patients du médecin:', doctorId);
        
        // Analyser plusieurs colonnes possibles pour la liaison médecin-patient
        const { data: allPatients, error: allError } = await supabase
          .from('patients')
          .select('*')
          .order('nom', { ascending: true })
          .limit(5); // Limiter pour l'analyse

        if (allError) {
          console.error('Erreur lors de la récupération des patients:', allError);
          setPatients([]);
          return;
        }

        console.log('🔍 [ANALYSE] Échantillon de patients pour analyse:');
        allPatients.forEach((patient, index) => {
          console.log(`Patient ${index + 1}:`, {
            id: patient.id,
            nom: patient.nom,
            prenom: patient.prenom,
            medecin_traitant_id: patient.medecin_traitant_id,
            medecin_traitant: patient.medecin_traitant,
            created_by: patient.created_by,
            updated_by: patient.updated_by,
            tenant_id: patient.tenant_id,
            cabinet_id: patient.cabinet_id
          });
        });

        // Essayer différentes stratégies pour trouver les patients du médecin
        let foundPatients = [];
        
        // Stratégie 1: medecin_traitant_id
        const { data: strategy1, error: error1 } = await supabase
          .from('patients')
          .select('*')
          .eq('medecin_traitant_id', doctorId)
          .order('nom', { ascending: true });

        if (!error1 && strategy1 && strategy1.length > 0) {
          console.log(' [STRATÉGIE 1] Patients trouvés avec medecin_traitant_id:', strategy1.length);
          foundPatients = strategy1;
        } else {
          console.log(' [STRATÉGIE 1] Aucun patient avec medecin_traitant_id');
          
          // Stratégie 2: created_by (si le médecin a créé les patients)
          const { data: strategy2, error: error2 } = await supabase
            .from('patients')
            .select('*')
            .eq('created_by', doctorId)
            .order('nom', { ascending: true });

          if (!error2 && strategy2 && strategy2.length > 0) {
            console.log(' [STRATÉGIE 2] Patients trouvés avec created_by:', strategy2.length);
            foundPatients = strategy2;
          } else {
            console.log(' [STRATÉGIE 2] Aucun patient avec created_by');
            
            // Stratégie 3: consultations (patients que le médecin a consultés)
            // Vérifier d'abord si la table consultations existe
            const { data: tables, error: tablesError } = await supabase
              .from('information_schema.tables')
              .select('table_name')
              .eq('table_schema', 'public')
              .like('table_name', '%consultation%');

            if (!tablesError && tables) {
              console.log(' [TABLES] Tables de consultation trouvées:', tables.map(t => t.table_name));
            }

            // Essayer avec différentes tables possibles
            const consultationTables = ['consultations', 'consultation', 'rendez_vous', 'consultations_medecins'];

            for (const tableName of consultationTables) {
              try {
                console.log(` [TEST] Test de la table: ${tableName}`);
                
                // Vérifier si la table existe en essayant une requête simple
                const { data: testTable, error: testError } = await supabase
                  .from(tableName)
                  .select('*')
                  .limit(1);

                if (testError) {
                  console.log(` [TEST] Table ${tableName} n'existe pas ou erreur:`, testError.message);
                  continue;
                }

                console.log(` [TEST] Table ${tableName} existe, test de récupération...`);

                // Si la table existe, essayer de trouver les patients du médecin
                const { data: consultData, error: consultError } = await supabase
                  .from(tableName)
                  .select('*')
                  .eq('medecin_id', doctorId)
                  .limit(10);

                if (consultError) {
                  console.log(` [TEST] Erreur avec ${tableName}:`, consultError.message);
                  continue;
                }

                if (consultData && consultData.length > 0) {
                  console.log(` [TEST] Données trouvées dans ${tableName}:`, consultData.length);
                  
                  // Extraire les IDs des patients
                  const patientIds = [...new Set(
                    consultData
                      .filter(row => row.patient_id)
                      .map(row => row.patient_id)
                  )];
                  
                  if (patientIds.length > 0) {
                    console.log(` [SUCCESS] Patients IDs trouvés via ${tableName}:`, patientIds);
                    
                    const { data: patientData, error: patientError } = await supabase
                      .from('patients')
                      .select('*')
                      .in('id', patientIds)
                      .order('nom', { ascending: true });

                    if (!patientError) {
                      foundPatients = patientData || [];
                      console.log(` [FINAL] Patients récupérés via ${tableName}:`, foundPatients.length);
                      break;
                    }
                  }
                } else {
                  console.log(` [TEST] Aucune donnée trouvée dans ${tableName}`);
                }
              } catch (err) {
                console.log(` [TEST] Erreur avec table ${tableName}:`, err.message);
              }
            }

            if (foundPatients.length === 0) {
              console.log(' [FINAL] Aucune stratégie n\'a fonctionné, fallback sur tous les patients');
              // En dernier recours, afficher tous les patients avec un message explicatif
              const { data: allPatientsFallback, error: allErrorFallback } = await supabase
                .from('patients')
                .select('*')
                .order('nom', { ascending: true });

              if (!allErrorFallback) {
                console.log(' [FALLBACK] Tous les patients affichés (aucune liaison médecin-patient trouvée)');
                setPatients(allPatientsFallback || []);
              }
            }
          }
        }

        console.log(' [FINAL] Patients du médecin trouvés:', foundPatients.length);
        setPatients(foundPatients);

      } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
        setPatients([]);
      }
    };

    const handleViewPatient = (patient) => {
      navigate(`/rendez-vous/fiche-patient?id=${patient.id}`);
    };

    const handleEditPatient = (patient) => {
      navigate(`/patients?id=${patient.id}&edit=true`);
    };

    const handleDeletePatient = async (patient) => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.prenom} ${patient.nom} ?`)) {
        try {
          const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', patient.id);

          if (error) {
            console.error('Erreur lors de la suppression du patient:', error);
            alert('Erreur lors de la suppression du patient');
          } else {
            console.log('✅ Patient supprimé avec succès');
            // Recharger la liste des patients
            fetchPatients(userProfile?.id);
          }
        } catch (error) {
          console.error('Erreur lors de la suppression du patient:', error);
          alert('Erreur lors de la suppression du patient');
        }
      }
    };

    const filteredPatients = patients.filter(patient => {
      const matchesSearch = !searchTerm || 
        patient.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.telephone?.includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-medical-primary" />
              Mes Patients
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez votre liste de patients personnels
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

        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
            
            <button 
              onClick={() => fetchPatients(userProfile?.id)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
          </div>

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
                      <div className="flex items-center gap-2">
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
                          title="Modifier le patient"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePatient(patient)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le patient"
                        >
                          <Trash2 className="w-4 h-4" />
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
  } catch (error) {
    console.error('❌ [MesPatientsPage] Erreur dans le composant:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
          <p className="text-red-600 text-sm mt-1">Une erreur est survenue lors du chargement de la page.</p>
        </div>
      </div>
    );
  }
};

export default MesPatientsPage;
