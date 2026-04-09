import React, { useState, useEffect } from 'react';
import { useTypesActes } from '../../hooks/useTypesActes';
import { 
  Activity, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Download,
  Printer,
  Calendar,
  User,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Save,
  X,
  Calculator,
  CreditCard,
  Receipt
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SearchableSelect from '../../components/common/SearchableSelect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateFacturePDF } from '../../services/impression/facturePdf.js';
import { useToast } from '../../hooks/useToast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const FacturationActes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedActe, setSelectedActe] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [editingFacture, setEditingFacture] = useState(null);
  const [factureData, setFactureData] = useState({
    patientId: '',
    acteId: '',
    quantite: 1,
    tarifUnitaire: '',
    remise: 0,
    observations: ''
  });

  // États pour les données réelles
  const [patients, setPatients] = useState([]);
  const [facturationActes, setFacturationActes] = useState([]);
  
  // Utilisation du hook pour les actes disponibles
  const { typesActes, loading: loadingActes } = useTypesActes();
  // Adapter le format des actes du hook pour ce composant
  const actesDisponibles = (typesActes || []).map(acte => ({
        id: acte.id,
        code: acte.code_ccam || `ACT-${acte.id}`,
        libelle: acte.nom,
        tarif: acte.tarif_defaut || 0,
        description: acte.description || '',
        categorie: acte.specialite_id ? 'Spécialisé' : 'Général',
        duree_estimee: acte.duree_estimee || null
  }));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hooks pour les notifications
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const { dialogState, showConfirm, closeDialog } = useConfirmDialog();

  // Charger les données depuis la base de données
  useEffect(() => {
    fetchPatients();
    fetchFacturations();
    // fetchActesDisponibles() n'est plus nécessaire car géré par le hook
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('patients')
        .select(`
          id,
          nom,
          prenom,
          date_naissance,
          sexe,
          telephone,
          adresse,
          numero_dossier,
          assurance_id,
          actif,
          assurances (
            id,
            nom,
            type_assurance,
            taux_remboursement,
            description
          )
        `)
        .eq('actif', true)
        .order('nom', { ascending: true });

      if (fetchError) throw fetchError;

      console.log('✅ Patients chargés:', data?.length || 0);
      setPatients(data || []);
    } catch (err) {
      console.error('❌ Erreur chargement patients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacturations = async () => {
    try {
      console.log('🔄 Chargement des facturations d\'actes...');

      // Récupérer les actes de consultation avec toutes les relations
      const { data: actesData, error: actesError } = await supabase
        .from('actes_consultation')
        .select(`
          id,
          quantite,
          tarif_unitaire,
          montant_total,
          notes,
          created_at,
          consultation_id,
          consultations (
            id,
            date_consultation,
            patients (
              id,
              nom,
              prenom,
              assurance_id,
              assurances (
                nom,
                taux_remboursement
              )
            ),
            users (
              id,
              nom,
              prenom
            )
          ),
          types_actes (
            id,
            nom,
            description
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (actesError) throw actesError;

      console.log('✅ Actes récupérés:', actesData?.length || 0);

      // Transformer les données pour correspondre au format attendu
      const facturations = actesData?.map((acte, index) => {
        const patient = acte.consultations?.patients;
        const medecin = acte.consultations?.users;
        const assurance = patient?.assurances;
        const tauxCouverture = assurance?.taux_remboursement || 0;
        
        const montantTotal = acte.montant_total || 0;
        const montantAssurance = (montantTotal * tauxCouverture) / 100;
        const montantPatient = montantTotal - montantAssurance;

        return {
          id: acte.id,
          consultation_id: acte.consultation_id,
          numero: `FA-${new Date(acte.created_at).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          date: acte.consultations?.date_consultation || acte.created_at?.split('T')[0],
          patient: {
            id: patient?.id,
            nom: patient?.nom || 'Inconnu',
            prenom: patient?.prenom || '',
            assurance: assurance?.nom || 'Sans assurance',
            tauxCouverture: tauxCouverture
          },
      actes: [
            {
              acte: {
                id: acte.types_actes?.id,
                libelle: acte.types_actes?.nom || 'Acte médical',
                code: `ACT-${acte.types_actes?.id || acte.id}`
              },
              quantite: acte.quantite || 1,
              tarifUnitaire: parseFloat(acte.tarif_unitaire) || 0
            }
          ],
          sousTotal: montantTotal,
      remise: 0,
          montantAssurance: montantAssurance,
          montantPatient: montantPatient,
          total: montantTotal,
          statut: 'payee', // À adapter selon votre logique
          medecin: medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Non spécifié'
        };
      }) || [];

      console.log('✅ Facturations formatées:', facturations.length);
      setFacturationActes(facturations);
    } catch (err) {
      console.error('❌ Erreur chargement facturations:', err);
      setError(err.message);
    }
  };




  const filteredFacturations = facturationActes.filter(facture => {
    const matchesSearch = facture.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${facture.patient.prenom} ${facture.patient.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facture.medecin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || facture.statut === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si c'est un changement d'acte, pré-remplir le tarif
    if (name === 'acteId' && value) {
      const acteSelectionne = actesDisponibles.find(a => a.id === parseInt(value));
      if (acteSelectionne) {
        setFactureData(prev => ({
          ...prev,
          [name]: value,
          tarifUnitaire: acteSelectionne.tarif || ''
        }));
        return;
      }
    }
    
    setFactureData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
    if (editingFacture) {
      console.log('Modification facturation:', factureData);
      showSuccess('Facturation modifiée avec succès!');
      setEditingFacture(null);
    } else {
        console.log('🔄 Création nouvelle facturation d\'acte...');
        
        // Récupérer l'acte sélectionné
        const acteSelectionne = actesDisponibles.find(a => a.id === parseInt(factureData.acteId));
        if (!acteSelectionne) {
          showWarning('Veuillez sélectionner un acte valide');
          return;
        }

        // 1. Récupérer la dernière consultation du patient pour obtenir le medecin_id
        const { data: derniereConsultation, error: derniereConsultationError } = await supabase
          .from('consultations')
          .select('medecin_id')
          .eq('patient_id', factureData.patientId)
          .order('date_consultation', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let medecinId = null;

        if (derniereConsultationError) {
          // Erreur lors de la requête
          console.error('❌ Erreur récupération consultation:', derniereConsultationError);
          showError('Erreur lors de la récupération de la consultation. Veuillez réessayer.');
          return;
        }

        if (!derniereConsultation) {
          // Si aucune consultation n'existe, essayer de récupérer l'utilisateur connecté
          console.warn('⚠️ Aucune consultation trouvée pour ce patient, tentative avec utilisateur connecté...');
          
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            showError('Erreur: Aucune consultation trouvée pour ce patient et utilisateur non connecté. Veuillez d\'abord créer une consultation pour ce patient.');
            return;
          }

          const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

          if (userDataError || !userData) {
            showError('Erreur: Impossible de récupérer les informations du médecin. Veuillez d\'abord créer une consultation pour ce patient.');
            return;
          }

          medecinId = userData.id;
        } else {
          medecinId = derniereConsultation.medecin_id;
        }

        if (!medecinId) {
          showError('Erreur: Impossible de déterminer le médecin. Veuillez d\'abord créer une consultation pour ce patient.');
          return;
        }

        console.log('✅ Médecin ID (depuis consultation):', medecinId);
        
        // 2. Créer une consultation pour ce patient
        const { data: consultationData, error: consultationError } = await supabase
          .from('consultations')
          .insert({
            patient_id: factureData.patientId,
            medecin_id: medecinId,
            date_consultation: new Date().toISOString().split('T')[0],
            motif: `Acte: ${acteSelectionne.libelle}`,
            statut: 'terminee'
          })
          .select()
          .single();

        if (consultationError) throw consultationError;
        console.log('✅ Consultation créée:', consultationData.id);

        // 2. Créer l'acte de consultation
        // Utiliser le tarif saisi par l'utilisateur ou le tarif par défaut de l'acte
        const tarifUnitaire = factureData.tarifUnitaire 
          ? parseFloat(factureData.tarifUnitaire) 
          : (acteSelectionne.tarif || 0);

        const { data: acteData, error: acteError } = await supabase
          .from('actes_consultation')
          .insert({
            consultation_id: consultationData.id,
            type_acte_id: parseInt(factureData.acteId),
            quantite: parseInt(factureData.quantite) || 1,
            tarif_unitaire: tarifUnitaire,
            notes: factureData.observations || null
          })
          .select()
          .single();

        if (acteError) throw acteError;
        console.log('✅ Acte de consultation créé:', acteData.id);

      showSuccess('Nouvelle facturation créée avec succès!');
        
        // Recharger les facturations
        await fetchFacturations();
    }
      
    setShowForm(false);
    setFactureData({
      patientId: '', acteId: '', quantite: 1, tarifUnitaire: '', remise: 0, observations: ''
    });
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      showError(`Erreur: ${error.message}`);
    }
  };

  const handleEdit = (facture) => {
    setEditingFacture(facture);
    setFactureData({
      patientId: facture.patient.id,
      acteId: facture.actes[0]?.acte.id || '',
      quantite: facture.actes[0]?.quantite || 1,
      tarifUnitaire: facture.actes[0]?.tarifUnitaire || '',
      remise: facture.remise || 0,
      observations: facture.observations || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (facture) => {
    const confirmed = await showConfirm({
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer la facture ${facture.numero} ?`,
      type: 'warning',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });
    
    if (confirmed) {
      console.log('Suppression facture:', facture.id);
      // TODO: Implémenter la suppression réelle
      showSuccess('Facture supprimée avec succès!');
    }
  };

  const handleDownload = async (facture) => {
    console.log('📄 Génération PDF pour téléchargement:', facture.numero);
    const { success, error } = await generateFacturePDF(supabase, facture, false);
    if (!success) {
      showError(`Erreur lors du téléchargement: ${error}`);
    }
  };

  const handlePrint = async (facture) => {
    console.log('🖨️ Génération PDF pour impression:', facture.numero);
    const { success, error } = await generateFacturePDF(supabase, facture, true);
    if (!success) {
      showError(`Erreur lors de l'impression: ${error}`);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'payee': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'impayee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'payee': return 'Payée';
      case 'en_attente': return 'En attente';
      case 'impayee': return 'Impayée';
      default: return statut;
    }
  };

  const calculateTotal = () => {
    const acte = actesDisponibles.find(a => a.id === parseInt(factureData.acteId));
    if (!acte) return { total: 0, sousTotal: 0, remise: 0, partAssurance: 0, partPatient: 0 };
    
    const sousTotal = acte.tarif * factureData.quantite;
    const montantRemise = (sousTotal * factureData.remise) / 100;
    const total = sousTotal - montantRemise;
    
    // Récupérer le taux de couverture du patient sélectionné
    const patient = patients.find(p => p.id === factureData.patientId);
    const tauxCouverture = patient?.assurances?.taux_remboursement || 0;
    
    const partAssurance = (total * tauxCouverture) / 100;
    const partPatient = total - partAssurance;
    
    return {
      total,
      sousTotal,
      remise: montantRemise,
      partAssurance,
      partPatient,
      tauxCouverture
    };
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturation des Actes</h1>
          <p className="text-gray-600">Gestion et facturation des actes médicaux</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facturation
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total factures</p>
              <p className="text-2xl font-semibold text-gray-900">{facturationActes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Payées</p>
              <p className="text-2xl font-semibold text-gray-900">
                {facturationActes.filter(f => f.statut === 'payee').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-2xl font-semibold text-gray-900">
                {facturationActes.filter(f => f.statut === 'en_attente').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="w-8 h-8 text-medical-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Chiffre d&apos;affaires</p>
              <p className="text-2xl font-semibold text-gray-900">
                {facturationActes.reduce((sum, f) => sum + f.total, 0).toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="N° facture, patient, médecin..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
              />
              <button className="px-4 py-2 bg-medical-primary text-white rounded-r-lg hover:bg-medical-primary-dark transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="payee">Payées</option>
              <option value="en_attente">En attente</option>
              <option value="impayee">Impayées</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtres avancés
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire de nouvelle facturation */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              {editingFacture ? 'Modifier la facturation' : 'Nouvelle facturation d\'acte'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingFacture(null);
                setFactureData({
                  patientId: '', acteId: '', quantite: 1, tarifUnitaire: '', remise: 0, observations: ''
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SearchableSelect
                  options={patients.map(patient => ({
                    id: patient.id,
                    label: `${patient.prenom} ${patient.nom}`,
                    nom: patient.nom,
                    prenom: patient.prenom,
                    assurance: patient.assurances?.nom || 'Sans assurance',
                    tauxCouverture: patient.assurances?.taux_remboursement || 0,
                    telephone: patient.telephone || '',
                    numero_dossier: patient.numero_dossier || ''
                  }))}
                  value={factureData.patientId}
                  onChange={(value) => setFactureData({...factureData, patientId: value})}
                  placeholder={loading ? 'Chargement des patients...' : 'Sélectionner un patient'}
                  searchPlaceholder="Rechercher un patient (nom, prénom, dossier)..."
                  label="Patient *"
                  required={true}
                  emptyMessage="Aucun patient trouvé"
                  renderOption={(patient) => (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {patient.prenom} {patient.nom}
                        </span>
                        {patient.numero_dossier && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            #{patient.numero_dossier}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="mr-3">
                          🏥 {patient.assurance}
                          {patient.tauxCouverture > 0 && (
                            <span className="ml-1 text-green-600 font-medium">
                              ({patient.tauxCouverture}%)
                            </span>
                          )}
                        </span>
                        {patient.telephone && (
                          <span>📞 {patient.telephone}</span>
                        )}
                      </div>
                    </div>
                  )}
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600">
                    Erreur: {error}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Acte *</label>
                {actesDisponibles.length === 0 ? (
                  <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-medical-primary mr-2"></div>
                    <span className="text-sm text-gray-600">Chargement des actes...</span>
                  </div>
                ) : (
                  <SearchableSelect
                    options={actesDisponibles.map(acte => ({
                      id: acte.id,
                      label: `${acte.code} - ${acte.libelle}`,
                      code: acte.code,
                      libelle: acte.libelle,
                      tarif: acte.tarif,
                      description: acte.description,
                      categorie: acte.categorie,
                      telephone: `${acte.tarif.toLocaleString()} FCFA${acte.description ? ` - ${acte.description}` : ''}${acte.categorie ? ` (${acte.categorie})` : ''}`
                    }))}
                    value={factureData.acteId ? String(factureData.acteId) : ''}
                    onChange={(value) => {
                      // Trouver l'acte sélectionné et pré-remplir le tarif
                      const acteSelectionne = actesDisponibles.find(a => a.id === parseInt(value));
                      if (acteSelectionne) {
                        setFactureData(prev => ({
                          ...prev,
                          acteId: value,
                          tarifUnitaire: acteSelectionne.tarif || ''
                        }));
                      } else {
                        setFactureData(prev => ({
                          ...prev,
                          acteId: value
                        }));
                      }
                    }}
                    placeholder="Rechercher un acte..."
                    searchPlaceholder="Rechercher par code, libellé, description..."
                    emptyMessage="Aucun acte trouvé"
                    renderOption={(option) => (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {option.label}
                        </span>
                        {option.telephone && (
                          <span className="text-xs text-gray-500 mt-1">
                            {option.telephone}
                          </span>
                        )}
                      </div>
                    )}
                  />
                )}
                {actesDisponibles.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {actesDisponibles.length} acte(s) disponible(s)
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantité *</label>
                <input
                  type="number"
                  name="quantite"
                  value={factureData.quantite}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remise (%)</label>
                <input
                  type="number"
                  name="remise"
                  value={factureData.remise}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total estimé</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium">
                  {calculateTotal().total.toLocaleString()} FCFA
                </div>
              </div>
            </div>
            
            {/* Détails de la facturation */}
            {factureData.patientId && factureData.acteId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Détails de la facturation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total :</span>
                    <span className="font-medium">{calculateTotal().sousTotal.toLocaleString()} FCFA</span>
                  </div>
                  {calculateTotal().remise > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Remise ({factureData.remise}%) :</span>
                      <span className="font-medium">-{calculateTotal().remise.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Total :</span>
                    <span className="font-bold text-lg">{calculateTotal().total.toLocaleString()} FCFA</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-blue-600">
                      <span>Part assurance ({calculateTotal().tauxCouverture}%) :</span>
                      <span className="font-medium">{calculateTotal().partAssurance.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Part patient :</span>
                      <span className="font-bold">{calculateTotal().partPatient.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observations</label>
              <textarea
                name="observations"
                value={factureData.observations}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                placeholder="Observations particulières..."
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingFacture(null);
                  setFactureData({
                    patientId: '', acteId: '', quantite: 1, tarifUnitaire: '', remise: 0, observations: ''
                  });
                }}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingFacture ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des facturations */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Facturations d'actes</h2>
          <p className="text-sm text-gray-600">{filteredFacturations.length} facturation(s) trouvée(s)</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Clock className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                      <p className="text-gray-500">Chargement des facturations...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredFacturations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Aucune facturation d'acte trouvée</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm || selectedStatus !== 'all' 
                          ? 'Essayez de modifier vos filtres de recherche'
                          : 'Créez votre première facturation d\'acte'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFacturations.map((facture) => (
                <tr key={facture.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{facture.numero}</div>
                      <div className="text-sm text-gray-500">{new Date(facture.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {facture.patient.prenom} {facture.patient.nom}
                      </div>
                      <div className="text-sm text-gray-500">{facture.patient.assurance}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {facture.actes.map((item, index) => (
                        <div key={index} className="mb-1">
                          {item.acte.libelle} (x{item.quantite})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {facture.total.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-gray-500">
                        Patient: {facture.montantPatient.toLocaleString()} FCFA
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(facture.statut)}`}>
                      {getStatusText(facture.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setShowDetails(facture)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(facture)}
                        className="text-medical-primary hover:text-medical-primary-dark"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDownload(facture)}
                        className="text-green-600 hover:text-green-900"
                        title="Télécharger PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePrint(facture)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Imprimer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(facture)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détails */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails de la facture {showDetails.numero}
                </h3>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations patient */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informations patient</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Nom :</span> {showDetails.patient.prenom} {showDetails.patient.nom}</p>
                  <p><span className="font-medium">Assurance :</span> {showDetails.patient.assurance}</p>
                  <p><span className="font-medium">Médecin :</span> {showDetails.medecin}</p>
                </div>
              </div>
              
              {/* Actes facturés */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Actes facturés</h4>
                <div className="space-y-2">
                  {showDetails.actes.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded flex justify-between">
                      <span>{item.acte.libelle} (x{item.quantite})</span>
                      <span className="font-medium">{(item.tarifUnitaire * item.quantite).toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Détails financiers */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Détails financiers</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total :</span>
                    <span>{showDetails.sousTotal.toLocaleString()} FCFA</span>
                  </div>
                  {showDetails.remise > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Remise :</span>
                      <span>-{showDetails.remise.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Part assurance :</span>
                    <span>{showDetails.montantAssurance.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Part patient :</span>
                    <span>{showDetails.montantPatient.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total :</span>
                    <span>{showDetails.total.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetails(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
              <button 
                onClick={() => handleDownload(showDetails)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger PDF
              </button>
              <button 
                onClick={() => handlePrint(showDetails)}
                className="flex items-center px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        showCancel={dialogState.showCancel}
      />
    </div>
  );
};

export default FacturationActes;
