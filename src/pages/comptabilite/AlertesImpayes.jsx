import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, AlertTriangle, Bell, Calendar,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw,
  Mail, Phone, MessageSquare, Eye, Edit, Trash2
} from 'lucide-react';

const AlertesImpayes = () => {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverite, setFilterSeverite] = useState('all');
  const [filterPeriode, setFilterPeriode] = useState('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({
    seuilAlerte: 30, // jours
    emailActive: true,
    smsActive: false,
    frequenceRappel: 7 // jours
  });

  // Charger les alertes
  useEffect(() => {
    chargerAlertes();
  }, []);

  const chargerAlertes = async () => {
    setLoading(true);
    try {
      // Données de test pour démonstration
      const mockAlertes = [
        {
          id: 1,
          patient: {
            id: 1,
            nom: 'Cissé',
            prenom: 'Baba',
            telephone: '77 123 45 67',
            email: 'baba.cisse@email.com'
          },
          facture: {
            numero: 'FACT-2025-045',
            montant_total: 150000,
            montant_paye: 0,
            montant_restant: 150000,
            date_emission: '2024-12-10',
            date_echeance: '2024-12-25'
          },
          retard: 45,
          severite: 'critique',
          dernierRappel: '2025-01-15',
          nombreRappels: 3,
          statut: 'actif',
          notes: 'Patient contacté par téléphone le 15/01, promet de payer cette semaine'
        },
        {
          id: 2,
          patient: {
            id: 2,
            nom: 'Touré',
            prenom: 'Awa',
            telephone: '76 987 65 43',
            email: 'awa.toure@email.com'
          },
          facture: {
            numero: 'FACT-2025-042',
            montant_total: 85000,
            montant_paye: 25000,
            montant_restant: 60000,
            date_emission: '2024-12-20',
            date_echeance: '2025-01-05'
          },
          retard: 30,
          severite: 'eleve',
          dernierRappel: '2025-01-20',
          nombreRappels: 2,
          statut: 'actif',
          notes: 'En attente de confirmation du paiement'
        },
        {
          id: 3,
          patient: {
            id: 3,
            nom: 'Sarr',
            prenom: 'Omar',
            telephone: '78 456 78 90',
            email: 'omar.sarr@email.com'
          },
          facture: {
            numero: 'FACT-2025-038',
            montant_total: 120000,
            montant_paye: 80000,
            montant_restant: 40000,
            date_emission: '2024-12-25',
            date_echeance: '2025-01-10'
          },
          retard: 25,
          severite: 'moyen',
          dernierRappel: '2025-01-22',
          nombreRappels: 1,
          statut: 'actif',
          notes: 'Patient a demandé un délai supplémentaire'
        },
        {
          id: 4,
          patient: {
            id: 4,
            nom: 'Dieng',
            prenom: 'Khady',
            telephone: '77 234 56 78',
            email: 'khady.dieng@email.com'
          },
          facture: {
            numero: 'FACT-2025-035',
            montant_total: 65000,
            montant_paye: 0,
            montant_restant: 65000,
            date_emission: '2025-01-05',
            date_echeance: '2025-01-20'
          },
          retard: 20,
          severite: 'moyen',
          dernierRappel: null,
          nombreRappels: 0,
          statut: 'actif',
          notes: 'Nouveau cas, pas encore contacté'
        },
        {
          id: 5,
          patient: {
            id: 5,
            nom: 'Faye',
            prenom: 'Ibrahim',
            telephone: '76 345 67 89',
            email: 'ibrahim.faye@email.com'
          },
          facture: {
            numero: 'FACT-2025-032',
            montant_total: 95000,
            montant_paye: 95000,
            montant_restant: 0,
            date_emission: '2024-12-01',
            date_echeance: '2024-12-15'
          },
          retard: 60,
          severite: 'critique',
          dernierRappel: '2025-01-10',
          nombreRappels: 5,
          statut: 'resolu',
          notes: 'Paiement complet reçu le 10/01'
        }
      ];
      
      setAlertes(mockAlertes);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les alertes
  const filteredAlertes = alertes.filter(alerte => {
    const matchesSearch = 
      `${alerte.patient.prenom} ${alerte.patient.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alerte.facture.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alerte.patient.telephone?.includes(searchTerm);
    
    const matchesSeverite = filterSeverite === 'all' || alerte.severite === filterSeverite;
    
    return matchesSearch && matchesSeverite;
  });

  // Obtenir la couleur de sévérité
  const getSeveriteColor = (severite) => {
    switch (severite) {
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'eleve': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moyen': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'faible': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtenir l'icône de sévérité
  const getSeveriteIcon = (severite) => {
    switch (severite) {
      case 'critique': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'eleve': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'moyen': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'faible': return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Formater les montants
  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  // Envoyer un rappel
  const envoyerRappel = async (alerteId, type) => {
    try {
      console.log(`Envoi de rappel ${type} pour l'alerte ${alerteId}`);
      // Implémentation de l'envoi de rappel
      alert(`Rappel ${type} envoyé avec succès!`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      alert('Erreur lors de l\'envoi du rappel');
    }
  };

  // Marquer comme résolu
  const marquerResolu = async (alerteId) => {
    try {
      setAlertes(prev => prev.map(alerte => 
        alerte.id === alerteId 
          ? { ...alerte, statut: 'resolu' }
          : alerte
      ));
      alert('Alerte marquée comme résolue!');
    } catch (error) {
      console.error('Erreur lors de la résolution:', error);
      alert('Erreur lors de la résolution de l\'alerte');
    }
  };

  // Exporter les alertes
  const exporterAlertes = (format) => {
    console.log(`Exportation en ${format}`);
  };

  // Statistiques
  const stats = {
    total: alertes.length,
    actives: alertes.filter(a => a.statut === 'actif').length,
    critiques: alertes.filter(a => a.severite === 'critique' && a.statut === 'actif').length,
    montantTotal: alertes.reduce((sum, a) => sum + a.facture.montant_restant, 0),
    montantCritique: alertes.filter(a => a.severite === 'critique' && a.statut === 'actif')
      .reduce((sum, a) => sum + a.facture.montant_restant, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Chargement des alertes...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-600" />
            Alertes Impayés
          </h1>
          <p className="text-gray-600 mt-2">
            Gestion automatique des alertes de paiements en retard
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Configuration
          </button>
          
          <button
            onClick={() => exporterAlertes('pdf')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exporter
          </button>
          
          <button
            onClick={chargerAlertes}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Alertes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes Actives</p>
              <p className="text-2xl font-bold text-orange-600">{stats.actives}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critiques</p>
              <p className="text-2xl font-bold text-red-600">{stats.critiques}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatMontant(stats.montantTotal)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant Critique</p>
              <p className="text-2xl font-bold text-red-600">
                {formatMontant(stats.montantCritique)}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Recherche
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Patient, facture, téléphone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Sévérité
            </label>
            <select
              value={filterSeverite}
              onChange={(e) => setFilterSeverite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Toutes les sévérités</option>
              <option value="critique">Critique</option>
              <option value="eleve">Élevée</option>
              <option value="moyen">Moyenne</option>
              <option value="faible">Faible</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Statut
            </label>
            <select
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actives</option>
              <option value="resolu">Résolues</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Alertes ({filteredAlertes.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredAlertes.map((alerte) => (
            <div key={alerte.id} className={`p-6 ${alerte.statut === 'resolu' ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getSeveriteIcon(alerte.severite)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSeveriteColor(alerte.severite)}`}>
                      {alerte.severite === 'critique' ? 'Critique' :
                       alerte.severite === 'eleve' ? 'Élevée' :
                       alerte.severite === 'moyen' ? 'Moyenne' : 'Faible'}
                    </span>
                    {alerte.statut === 'resolu' && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                        Résolu
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {alerte.retard} jours de retard
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {alerte.patient.prenom} {alerte.patient.nom}
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>{alerte.patient.telephone}</div>
                        <div>{alerte.patient.email}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {alerte.facture.numero}
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Total: {formatMontant(alerte.facture.montant_total)}</div>
                        <div>Reste: {formatMontant(alerte.facture.montant_restant)}</div>
                        <div>Échéance: {new Date(alerte.facture.date_echeance).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </div>
                  
                  {alerte.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <strong>Notes:</strong> {alerte.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Dernier rappel: {alerte.dernierRappel ? 
                        new Date(alerte.dernierRappel).toLocaleDateString('fr-FR') : 
                        'Jamais'
                      }
                    </div>
                    <div>
                      Nombre de rappels: {alerte.nombreRappels}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  {alerte.statut === 'actif' && (
                    <>
                      <button
                        onClick={() => envoyerRappel(alerte.id, 'email')}
                        className="btn btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </button>
                      
                      <button
                        onClick={() => envoyerRappel(alerte.id, 'sms')}
                        className="btn btn-secondary flex items-center gap-2 text-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        SMS
                      </button>
                      
                      <button
                        onClick={() => envoyerRappel(alerte.id, 'telephone')}
                        className="btn btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        Appel
                      </button>
                      
                      <button
                        onClick={() => marquerResolu(alerte.id)}
                        className="btn btn-primary flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Résolu
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de configuration */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configuration des Alertes
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil d'alerte (jours)
                </label>
                <input
                  type="number"
                  value={config.seuilAlerte}
                  onChange={(e) => setConfig({...config, seuilAlerte: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence des rappels (jours)
                </label>
                <input
                  type="number"
                  value={config.frequenceRappel}
                  onChange={(e) => setConfig({...config, frequenceRappel: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailActive"
                  checked={config.emailActive}
                  onChange={(e) => setConfig({...config, emailActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="emailActive" className="text-sm text-gray-700">
                  Activer les rappels par email
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smsActive"
                  checked={config.smsActive}
                  onChange={(e) => setConfig({...config, smsActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="smsActive" className="text-sm text-gray-700">
                  Activer les rappels par SMS
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  alert('Configuration sauvegardée!');
                }}
                className="btn btn-primary flex-1"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertesImpayes;
