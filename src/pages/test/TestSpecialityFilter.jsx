import React, { useState, useEffect } from 'react';
import { 
  userService, 
  typesActesService, 
  appointmentService, 
  consultationService 
} from '../../lib/services';
import { getCurrentSpeciality } from '../../lib/specialityConfigService';
import { 
  CheckCircle, 
  XCircle, 
  Loader, 
  RefreshCw,
  Filter,
  Users,
  Activity,
  Calendar,
  FileText,
  Stethoscope
} from 'lucide-react';

const TestSpecialityFilter = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState({
    doctors: { data: null, error: null, count: 0 },
    typesActes: { data: null, error: null, count: 0 },
    appointments: { data: null, error: null, count: 0 },
    consultations: { data: null, error: null, count: 0 }
  });

  // Charger la configuration actuelle
  const loadConfig = async () => {
    try {
      const currentConfig = await getCurrentSpeciality();
      setConfig(currentConfig);
      console.log('[TEST] Configuration chargée:', currentConfig);
    } catch (error) {
      console.error('[TEST] Erreur chargement config:', error);
    }
  };

  // Tester tous les services
  const testAllServices = async () => {
    setLoading(true);
    console.log('[TEST] ========== DÉBUT TEST FILTRAGE SPÉCIALITÉ ==========');
    
    const newResults = {
      doctors: { data: null, error: null, count: 0 },
      typesActes: { data: null, error: null, count: 0 },
      appointments: { data: null, error: null, count: 0 },
      consultations: { data: null, error: null, count: 0 }
    };

    try {
      // 1. Test userService.getDoctors()
      console.log('[TEST] Test 1: userService.getDoctors()');
      try {
        const doctors = await userService.getDoctors();
        newResults.doctors = {
          data: doctors,
          error: null,
          count: doctors?.length || 0
        };
        console.log('[TEST] ✅ Praticiens récupérés:', doctors?.length || 0);
        console.log('[TEST] Détails praticiens:', doctors?.map(d => ({
          id: d.id,
          nom: d.nom,
          prenom: d.prenom,
          specialite_id: d.specialite_id
        })));
      } catch (error) {
        newResults.doctors = { data: null, error: error.message, count: 0 };
        console.error('[TEST] ❌ Erreur praticiens:', error);
      }

      // 2. Test typesActesService.getAll()
      console.log('[TEST] Test 2: typesActesService.getAll()');
      try {
        const typesActes = await typesActesService.getAll();
        newResults.typesActes = {
          data: typesActes,
          error: null,
          count: typesActes?.length || 0
        };
        console.log('[TEST] ✅ Types d\'actes récupérés:', typesActes?.length || 0);
        console.log('[TEST] Détails types actes:', typesActes?.map(a => ({
          id: a.id,
          nom: a.nom,
          specialite_id: a.specialite_id
        })));
      } catch (error) {
        newResults.typesActes = { data: null, error: error.message, count: 0 };
        console.error('[TEST] ❌ Erreur types actes:', error);
      }

      // 3. Test appointmentService.getAll()
      console.log('[TEST] Test 3: appointmentService.getAll()');
      try {
        const appointments = await appointmentService.getAll();
        newResults.appointments = {
          data: appointments,
          error: null,
          count: appointments?.length || 0
        };
        console.log('[TEST] ✅ Rendez-vous récupérés:', appointments?.length || 0);
        console.log('[TEST] Détails rendez-vous:', appointments?.map(a => ({
          id: a.id,
          medecin_id: a.medecin_id,
          medecin_specialite_id: a.medecin?.specialite_id
        })));
      } catch (error) {
        newResults.appointments = { data: null, error: error.message, count: 0 };
        console.error('[TEST] ❌ Erreur rendez-vous:', error);
      }

      // 4. Test consultationService.getAll()
      console.log('[TEST] Test 4: consultationService.getAll()');
      try {
        const consultations = await consultationService.getAll();
        newResults.consultations = {
          data: consultations,
          error: null,
          count: consultations?.length || 0
        };
        console.log('[TEST] ✅ Consultations récupérées:', consultations?.length || 0);
        console.log('[TEST] Détails consultations:', consultations?.map(c => ({
          id: c.id,
          medecin_id: c.medecin_id,
          medecin_specialite_id: c.medecin?.specialite_id
        })));
      } catch (error) {
        newResults.consultations = { data: null, error: error.message, count: 0 };
        console.error('[TEST] ❌ Erreur consultations:', error);
      }

      console.log('[TEST] ========== FIN TEST FILTRAGE SPÉCIALITÉ ==========');
    } catch (error) {
      console.error('[TEST] Erreur générale:', error);
    } finally {
      setResults(newResults);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    testAllServices();
  }, []);

  const handleRefresh = () => {
    loadConfig();
    testAllServices();
  };

  const renderResultCard = (title, icon, result, specialiteId) => {
    const hasError = !!result.error;
    const hasData = !!result.data;
    const count = result.count;
    
    // Vérifier si les données respectent le filtre
    let filterRespected = true;
    if (hasData && specialiteId !== null && result.data.length > 0) {
      if (result.data[0].specialite_id !== undefined) {
        // Filtrage direct (specialite_id)
        filterRespected = result.data.every(item => item.specialite_id === specialiteId);
      } else if (result.data[0].medecin?.specialite_id !== undefined) {
        // Filtrage via relation (medecin.specialite_id)
        filterRespected = result.data.every(item => item.medecin?.specialite_id === specialiteId);
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            {hasError ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : hasData ? (
              filterRespected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-yellow-500" />
              )
            ) : (
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        {hasError ? (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-800 font-medium">Erreur:</p>
            <p className="text-sm text-red-600">{result.error}</p>
          </div>
        ) : hasData ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Nombre d'éléments:</span> {count}
              </p>
              {specialiteId !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Filtre appliqué:</span> Spécialité ID {specialiteId}
                </p>
              )}
              {specialiteId === null && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Mode:</span> Généraliste (pas de filtre)
                </p>
              )}
            </div>

            {count > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase">Premiers éléments:</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {result.data.slice(0, 5).map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {item.nom || item.libelle || `ID: ${item.id}`}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          item.specialite_id === specialiteId || item.medecin?.specialite_id === specialiteId
                            ? 'bg-green-100 text-green-800'
                            : specialiteId === null
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Spécialité: {item.specialite_id || item.medecin?.specialite_id || 'N/A'}
                        </span>
                      </div>
                      {item.prenom && (
                        <div className="text-gray-600 mt-1">
                          {item.prenom} {item.nom}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {count > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    ... et {count - 5} autres éléments
                  </p>
                )}
              </div>
            )}

            {count === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  Aucune donnée trouvée. {specialiteId !== null && 'Le filtre peut être trop restrictif.'}
                </p>
              </div>
            )}

            {!filterRespected && specialiteId !== null && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800 font-medium">⚠️ Attention:</p>
                <p className="text-sm text-red-600">
                  Certaines données ne respectent pas le filtre de spécialité configuré.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <Loader className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Chargement...</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Filter className="w-8 h-8 mr-3 text-blue-600" />
            Test du Filtrage par Spécialité
          </h1>
          <p className="text-gray-600 mt-2">
            Vérification que tous les services appliquent correctement le filtre de spécialité
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Configuration actuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <Stethoscope className="w-5 h-5 mr-2" />
          Configuration Actuelle
        </h2>
        {config ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Mode:</span>{' '}
                {config.mode_specialite_id !== null ? (
                  <span className="text-green-700">Spécialité (ID: {config.mode_specialite_id})</span>
                ) : (
                  <span className="text-blue-700">Généraliste</span>
                )}
              </p>
            </div>
            {config.specialite && (
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Spécialité:</span>{' '}
                  <span className="text-gray-900">{config.specialite.nom}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Chargement de la configuration...</p>
        )}
      </div>

      {/* Résultats des tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderResultCard(
          'Praticiens (users)',
          <Users className="w-5 h-5 text-blue-600" />,
          results.doctors,
          config?.mode_specialite_id || null
        )}

        {renderResultCard(
          'Types d\'Actes',
          <Activity className="w-5 h-5 text-green-600" />,
          results.typesActes,
          config?.mode_specialite_id || null
        )}

        {renderResultCard(
          'Rendez-vous',
          <Calendar className="w-5 h-5 text-purple-600" />,
          results.appointments,
          config?.mode_specialite_id || null
        )}

        {renderResultCard(
          'Consultations',
          <FileText className="w-5 h-5 text-orange-600" />,
          results.consultations,
          config?.mode_specialite_id || null
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Cette page teste tous les services qui appliquent le filtre de spécialité.</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Les services sont appelés directement sans filtrage local supplémentaire.</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Vérifiez que tous les éléments affichés ont la même <code className="bg-gray-200 px-1 rounded">specialite_id</code> que celle configurée.</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">ℹ</span>
            <span>En mode généraliste, toutes les données sont affichées (pas de filtre).</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-500 mr-2">⚠</span>
            <span>Si une carte affiche une alerte rouge, le filtre ne fonctionne pas correctement pour ce service.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TestSpecialityFilter;











