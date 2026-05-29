import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  FileText,
  Users,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSearch,
  FolderOpen,
  Lock,
  Unlock,
  Share2,
  Star,
  TrendingUp,
  BarChart3,
  User,
  Stethoscope,
  Pill,
  Award,
  Receipt,
  Shield,
  FileCheck,
  Radio,
  TestTube,
  Brain,
  Heart,
  Bone,
  Syringe,
  ClipboardList,
  FileSignature,
  Coins,
  Building2,
  Database,
  Fingerprint,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  History,
  ArchiveRestore,
  Folder,
  File
} from 'lucide-react';
import ArchiveStatsCard from '../components/archives/ArchiveStatsCard';
import DocumentRow from '../components/archives/DocumentRow';
import ActivityRow from '../components/archives/ActivityRow';

const HistoriquesArchivesPage = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Données simulées complètes pour démonstration
  const [documents] = useState([
    // DOSSIERS PATIENTS
    {
      id: 1,
      name: 'Dossier Complet - Dupont Jean',
      type: 'dossier_patient',
      patient: 'Dupont Jean',
      date: '2024-01-15',
      size: '15.4 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2054-01-15',
      category: 'dossiers_patients',
      accessLevel: 'confidential',
      shared: false,
      subCategory: 'identification',
      contains: ['fiche_identification', 'antecedents', 'vaccinations', 'consentements']
    },
    {
      id: 2,
      name: 'Fiche Identification - Laurent Marie',
      type: 'fiche_identification',
      patient: 'Laurent Marie',
      date: '2024-01-10',
      size: '2.1 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2054-01-10',
      category: 'dossiers_patients',
      accessLevel: 'restricted',
      shared: true,
      subCategory: 'identification',
      contains: ['photo', 'coordonnees', 'assurances']
    },
    // CONSULTATIONS
    {
      id: 3,
      name: 'Consultation Générale - Bernard Pierre',
      type: 'consultation',
      patient: 'Bernard Pierre',
      date: '2024-01-08',
      size: '3.8 MB',
      status: 'archived',
      archivedBy: 'Dr. Martin',
      archivedAt: '2024-01-12',
      retentionDate: '2034-01-08',
      category: 'consultations',
      accessLevel: 'confidential',
      shared: false,
      subCategory: 'consultation_generale',
      contains: ['motif', 'examen_clinique', 'diagnostic', 'traitement']
    },
    {
      id: 4,
      name: 'Consultation Pédiatrique - Petit Louis',
      type: 'consultation',
      patient: 'Petit Louis',
      date: '2024-01-05',
      size: '4.2 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2034-01-05',
      category: 'consultations',
      accessLevel: 'confidential',
      shared: false,
      subCategory: 'pediatrie',
      contains: ['croissance', 'vaccins', 'developpement']
    },
    // EXAMENS ET ANALYSES
    {
      id: 5,
      name: 'Radiographie Thoracique - Laurent Marie',
      type: 'imagerie',
      patient: 'Laurent Marie',
      date: '2024-01-10',
      size: '15.8 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2034-01-10',
      category: 'examens',
      accessLevel: 'restricted',
      shared: true,
      subCategory: 'radiologie',
      contains: ['radio_thorax', 'compte_rendu_radiologue']
    },
    {
      id: 6,
      name: 'Analyse Sanguine Complète - Dupont Jean',
      type: 'analyse_biologique',
      patient: 'Dupont Jean',
      date: '2024-01-12',
      size: '1.5 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2034-01-12',
      category: 'examens',
      accessLevel: 'restricted',
      shared: false,
      subCategory: 'biologie',
      contains: ['hematologie', 'biochimie', 'serologie']
    },
    {
      id: 7,
      name: 'IRM Cervicale - Bernard Pierre',
      type: 'imagerie',
      patient: 'Bernard Pierre',
      date: '2024-01-06',
      size: '45.2 MB',
      status: 'archived',
      archivedBy: 'Dr. Martin',
      archivedAt: '2024-01-15',
      retentionDate: '2034-01-06',
      category: 'examens',
      accessLevel: 'confidential',
      shared: false,
      subCategory: 'neuroradiologie',
      contains: ['irm_cervicale', 'rapport_medical']
    },
    // ORDONNANCES
    {
      id: 8,
      name: 'Ordonnance Antibiotiques - Dupont Jean',
      type: 'ordonnance',
      patient: 'Dupont Jean',
      date: '2024-01-15',
      size: '0.3 MB',
      status: 'archived',
      archivedBy: 'Dr. Martin',
      archivedAt: '2024-01-20',
      retentionDate: '2029-01-15',
      category: 'ordonnances',
      accessLevel: 'normal',
      shared: false,
      subCategory: 'medicaments',
      contains: ['antibiotiques', 'posologie', 'duree']
    },
    {
      id: 9,
      name: 'Ordonnance Chronique - Laurent Marie',
      type: 'ordonnance',
      patient: 'Laurent Marie',
      date: '2024-01-08',
      size: '0.4 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2029-01-08',
      category: 'ordonnances',
      accessLevel: 'restricted',
      shared: true,
      subCategory: 'traitement_fond',
      contains: ['hypertenseurs', 'statines', 'vitamines']
    },
    // CERTIFICATS MÉDICAUX
    {
      id: 10,
      name: 'Certificat Scolaire - Petit Louis',
      type: 'certificat_medical',
      patient: 'Petit Louis',
      date: '2024-01-03',
      size: '0.5 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2029-01-03',
      category: 'certificats',
      accessLevel: 'normal',
      shared: true,
      subCategory: 'scolaire',
      contains: ['aptitude_sportive', 'vaccins_a_jour']
    },
    {
      id: 11,
      name: 'Arrêt Maladie - Bernard Pierre',
      type: 'certificat_medical',
      patient: 'Bernard Pierre',
      date: '2024-01-07',
      size: '0.4 MB',
      status: 'archived',
      archivedBy: 'Dr. Martin',
      archivedAt: '2024-01-14',
      retentionDate: '2029-01-07',
      category: 'certificats',
      accessLevel: 'restricted',
      shared: false,
      subCategory: 'arret_travail',
      contains: ['duree_15_jours', 'reprise_possible']
    },
    // SYNTHÈSES MÉDICALES
    {
      id: 12,
      name: 'Synthèse Annuelle - Dupont Jean',
      type: 'synthese_medicale',
      patient: 'Dupont Jean',
      date: '2024-01-01',
      size: '2.8 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2054-01-01',
      category: 'syntheses',
      accessLevel: 'confidential',
      shared: false,
      subCategory: 'bilan_annuel',
      contains: ['antecedents_majeurs', 'traitements_encours', 'recommandations']
    },
    // FACTURATION
    {
      id: 13,
      name: 'Facture Consultation - Laurent Marie',
      type: 'facture',
      patient: 'Laurent Marie',
      date: '2024-01-10',
      size: '0.2 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2034-01-10',
      category: 'facturation',
      accessLevel: 'normal',
      shared: true,
      subCategory: 'consultation',
      contains: ['honoraires', 'remboursement_secu', 'tiers_payant']
    },
    {
      id: 14,
      name: 'Devis Soins Dentaires - Bernard Pierre',
      type: 'devis',
      patient: 'Bernard Pierre',
      date: '2024-01-05',
      size: '0.3 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2034-01-05',
      category: 'facturation',
      accessLevel: 'normal',
      shared: false,
      subCategory: 'devis',
      contains: ['cout_total', 'prise_en_charge', 'echeancier']
    },
    // DOCUMENTS ADMINISTRATIFS
    {
      id: 15,
      name: 'Consentement RGPD - Dupont Jean',
      type: 'consentement',
      patient: 'Dupont Jean',
      date: '2023-12-15',
      size: '0.1 MB',
      status: 'archived',
      archivedBy: 'Secrétaire Claire',
      archivedAt: '2024-01-02',
      retentionDate: '2033-12-15',
      category: 'administratif',
      accessLevel: 'confidential',
      shared: false,
      subCategory: 'rgpd',
      contains: ['droit_image', 'traitement_donnees', 'contact']
    },
    {
      id: 16,
      name: 'Correspondance Spécialiste - Laurent Marie',
      type: 'correspondance',
      patient: 'Laurent Marie',
      date: '2024-01-09',
      size: '0.6 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2034-01-09',
      category: 'administratif',
      accessLevel: 'restricted',
      shared: true,
      subCategory: 'correspondance',
      contains: ['avis_cardiologue', 'recommandations']
    },
    // DOCUMENTS CABINET
    {
      id: 17,
      name: 'Rapport Mensuel Cabinet - Janvier 2024',
      type: 'rapport_activite',
      patient: 'Cabinet',
      date: '2024-01-31',
      size: '1.2 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2029-01-31',
      category: 'cabinet',
      accessLevel: 'restricted',
      shared: false,
      subCategory: 'statistiques',
      contains: ['nombre_consultations', 'chiffre_affaires', 'patients_nouveaux']
    },
    {
      id: 18,
      name: 'Registre des Accès - Janvier 2024',
      type: 'registre_securite',
      patient: 'Système',
      date: '2024-01-31',
      size: '0.8 MB',
      status: 'active',
      archivedBy: null,
      archivedAt: null,
      retentionDate: '2029-01-31',
      category: 'securite',
      accessLevel: 'confidential',
      shared: false,
      subCategory: 'journal_connexions',
      contains: ['connexions_utilisateurs', 'actions_sensibles', 'incidents']
    }
  ]);

  const [activities] = useState([
    {
      id: 1,
      action: 'Archivage',
      target: 'Consultation - Dupont Jean',
      user: 'Dr. Martin',
      date: '2024-01-20 14:30',
      type: 'archive',
      details: 'Archivage automatique après 5 ans'
    },
    {
      id: 2,
      action: 'Consultation',
      target: 'Dossier patient - Laurent Marie',
      user: 'Dr. Sophie',
      date: '2024-01-19 10:15',
      type: 'view',
      details: 'Consultation des radiographies'
    },
    {
      id: 3,
      action: 'Suppression',
      target: 'Document temporaire',
      user: 'Secrétaire Claire',
      date: '2024-01-18 16:45',
      type: 'delete',
      details: 'Suppression après période de rétention'
    }
  ]);

  const filteredDocuments = documents.filter(doc => {
    // Filtre par recherche
    const matchesSearch = searchTerm === '' || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patient.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par période
    const docDate = new Date(doc.date);
    const today = new Date();
    const daysDiff = Math.floor((today - docDate) / (1000 * 60 * 60 * 24));
    
    const matchesPeriod = selectedPeriod === 'all' ||
      (selectedPeriod === '7d' && daysDiff <= 7) ||
      (selectedPeriod === '30d' && daysDiff <= 30) ||
      (selectedPeriod === '90d' && daysDiff <= 90) ||
      (selectedPeriod === '1y' && daysDiff <= 365);
    
    // Filtre par catégorie principale
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    
    // Filtre par statut
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    
    return matchesSearch && matchesPeriod && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        const sizeA = parseFloat(a.size);
        const sizeB = parseFloat(b.size);
        comparison = sizeA - sizeB;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredDocuments.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredDocuments.map(doc => doc.id));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'archived': return <Archive className="w-4 h-4 text-blue-500" />;
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'deleted': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDocumentIcon = (type) => {
    const iconMap = {
      // Dossiers Patients
      'dossier_patient': <Folder className="w-5 h-5 text-blue-500" />,
      'fiche_identification': <User className="w-5 h-5 text-indigo-500" />,
      
      // Consultations
      'consultation': <Stethoscope className="w-5 h-5 text-green-500" />,
      'examen_clinique': <Heart className="w-5 h-5 text-red-500" />,
      
      // Examens & Analyses
      'imagerie': <Radio className="w-5 h-5 text-purple-500" />,
      'analyse_biologique': <TestTube className="w-5 h-5 text-cyan-500" />,
      'examen_specialise': <Brain className="w-5 h-5 text-pink-500" />,
      
      // Traitements
      'ordonnance': <Pill className="w-5 h-5 text-orange-500" />,
      'prescription': <FileSignature className="w-5 h-5 text-yellow-500" />,
      'traitement': <Syringe className="w-5 h-5 text-teal-500" />,
      
      // Certificats
      'certificat_medical': <Award className="w-5 h-5 text-emerald-500" />,
      'arret_travail': <CalendarDays className="w-5 h-5 text-blue-600" />,
      'certificat_scolaire': <FileCheck className="w-5 h-5 text-green-600" />,
      
      // Synthèses
      'synthese_medicale': <ClipboardList className="w-5 h-5 text-violet-500" />,
      'bilan': <BarChart3 className="w-5 h-5 text-amber-500" />,
      'rapport': <FileText className="w-5 h-5 text-gray-600" />,
      
      // Facturation
      'facture': <Receipt className="w-5 h-5 text-green-700" />,
      'devis': <Coins className="w-5 h-5 text-blue-700" />,
      'remboursement': <TrendingUp className="w-5 h-5 text-emerald-600" />,
      
      // Administratif
      'consentement': <Fingerprint className="w-5 h-5 text-red-600" />,
      'correspondance': <Mail className="w-5 h-5 text-indigo-600" />,
      'contrat': <FileSignature className="w-5 h-5 text-purple-600" />,
      
      // Cabinet
      'rapport_activite': <Building2 className="w-5 h-5 text-orange-600" />,
      'statistique': <BarChart3 className="w-5 h-5 text-cyan-600" />,
      'planning': <Calendar className="w-5 h-5 text-pink-600" />,
      
      // Sécurité
      'registre_securite': <Shield className="w-5 h-5 text-red-700" />,
      'journal_audit': <Database className="w-5 h-5 text-gray-700" />,
      'incident': <AlertCircle className="w-5 h-5 text-red-500" />
    };
    
    return iconMap[type] || <FileText className="w-5 h-5 text-gray-400" />;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'dossiers_patients': 'Dossiers Patients',
      'consultations': 'Consultations',
      'examens': 'Examens & Analyses',
      'ordonnances': 'Ordonnances',
      'certificats': 'Certificats',
      'syntheses': 'Synthèses',
      'facturation': 'Facturation',
      'administratif': 'Administratif',
      'cabinet': 'Cabinet',
      'securite': 'Sécurité'
    };
    return labels[category] || category;
  };

  const getRetentionInfo = (retentionDate, status) => {
    const today = new Date();
    const retention = new Date(retentionDate);
    const yearsRemaining = Math.floor((retention - today) / (365 * 24 * 60 * 60 * 1000));
    
    if (status === 'archived') {
      return {
        text: `Conservation ${Math.abs(yearsRemaining)} ans restants`,
        color: yearsRemaining > 5 ? 'text-green-600' : yearsRemaining > 2 ? 'text-yellow-600' : 'text-red-600'
      };
    }
    
    return {
      text: `Rétention ${yearsRemaining} ans`,
      color: yearsRemaining > 20 ? 'text-green-600' : yearsRemaining > 10 ? 'text-yellow-600' : 'text-orange-600'
    };
  };

  const getAccessLevelIcon = (level) => {
    switch (level) {
      case 'confidential': return <Lock className="w-4 h-4 text-red-500" />;
      case 'restricted': return <Lock className="w-4 h-4 text-orange-500" />;
      case 'normal': return <Unlock className="w-4 h-4 text-green-500" />;
      default: return <Unlock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'archive': return <Archive className="w-4 h-4 text-blue-500" />;
      case 'view': return <Eye className="w-4 h-4 text-green-500" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'share': return <Share2 className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const stats = {
    totalDocuments: documents.length,
    archivedDocuments: documents.filter(d => d.status === 'archived').length,
    activeDocuments: documents.filter(d => d.status === 'active').length,
    totalSize: '156.8 MB',
    recentActivity: activities.length,
    // Statistiques par catégorie
    categories: {
      dossiers_patients: documents.filter(d => d.category === 'dossiers_patients').length,
      consultations: documents.filter(d => d.category === 'consultations').length,
      examens: documents.filter(d => d.category === 'examens').length,
      ordonnances: documents.filter(d => d.category === 'ordonnances').length,
      certificats: documents.filter(d => d.category === 'certificats').length,
      syntheses: documents.filter(d => d.category === 'syntheses').length,
      facturation: documents.filter(d => d.category === 'facturation').length,
      administratif: documents.filter(d => d.category === 'administratif').length,
      cabinet: documents.filter(d => d.category === 'cabinet').length,
      securite: documents.filter(d => d.category === 'securite').length
    },
    // Documents partagés
    sharedDocuments: documents.filter(d => d.shared).length
  };

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header compact */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="w-6 h-6 text-medical-primary" />
            Historiques & Archives
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Consultez et gérez l'historique des documents et archives du cabinet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-medical-primary text-white rounded-lg hover:bg-medical-primary/90 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Statistiques compact */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <ArchiveStatsCard
          icon={<FileText className="w-6 h-6 text-blue-500" />}
          label="Total"
          value={stats.totalDocuments}
          color="text-gray-900"
          delay={0}
        />
        <ArchiveStatsCard
          icon={<Archive className="w-6 h-6 text-blue-500" />}
          label="Archivés"
          value={stats.archivedDocuments}
          color="text-blue-600"
          delay={0.1}
        />
        <ArchiveStatsCard
          icon={<CheckCircle className="w-6 h-6 text-green-500" />}
          label="Actifs"
          value={stats.activeDocuments}
          color="text-green-600"
          delay={0.2}
        />
        <ArchiveStatsCard
          icon={<BarChart3 className="w-6 h-6 text-purple-500" />}
          label="Espace"
          value={stats.totalSize}
          color="text-purple-600"
          delay={0.3}
        />
        <ArchiveStatsCard
          icon={<TrendingUp className="w-6 h-6 text-orange-500" />}
          label="Activité"
          value={stats.recentActivity}
          color="text-orange-600"
          delay={0.4}
        />
      </div>

      {/* Statistiques détaillées compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-4 rounded-lg border border-gray-200"
        >
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-500" />
            Répartition par Catégorie
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{getCategoryLabel(category)}</span>
                <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-4 rounded-lg border border-gray-200"
        >
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            État des Archives
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Taux d'archivage</span>
              <span className="text-xs font-medium text-blue-600">
                {Math.round((stats.archivedDocuments / stats.totalDocuments) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Espace optimisé</span>
              <span className="text-xs font-medium text-green-600">
                ~{Math.round(stats.archivedDocuments * 0.3)} MB économisés
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Dernière activité</span>
              <span className="text-xs font-medium text-gray-600">Aujourd'hui</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Documents partagés</span>
              <span className="text-xs font-medium text-purple-600">{stats.sharedDocuments}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Onglets compact */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'documents'
                ? 'border-medical-primary text-medical-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Documents ({filteredDocuments.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'activities'
                ? 'border-medical-primary text-medical-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Activités ({filteredActivities.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-medical-primary text-medical-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              Analytiques
            </div>
          </button>
        </nav>
      </div>

      {/* Barre de recherche et filtres compact */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par nom, patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          <Filter className="w-4 h-4" />
          Filtres
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Filtres simplifiés compact */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm"
        >
          {/* Titre des filtres */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">Filtres de recherche</h3>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedPeriod('all');
                setSortBy('date');
                setSortOrder('desc');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Réinitialiser tout
            </button>
          </div>

          {/* Filtres principaux - 3 colonnes simples */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Filtre Catégorie principale */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Folder className="w-3 h-3 text-blue-500" />
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="all">📋 Toutes</option>
                <option value="dossiers_patients">📁 Dossiers Patients</option>
                <option value="consultations">🩺 Consultations</option>
                <option value="examens">🔬 Examens & Analyses</option>
                <option value="ordonnances">💊 Ordonnances</option>
                <option value="certificats">📜 Certificats</option>
                <option value="syntheses">📊 Synthèses</option>
                <option value="facturation">💰 Facturation</option>
                <option value="administratif">📑 Administratif</option>
                <option value="cabinet">🏥 Cabinet</option>
                <option value="securite">🔒 Sécurité</option>
              </select>
            </div>

            {/* Filtre Statut */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Statut
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs"
              >
                <option value="all">📊 Tous</option>
                <option value="active">✅ Actif</option>
                <option value="archived">📦 Archivé</option>
                <option value="deleted">🗑️ Supprimé</option>
              </select>
            </div>

            {/* Filtre Période */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-purple-500" />
                Période
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs"
              >
                <option value="all">📅 Toutes</option>
                <option value="7d">📆 7 derniers jours</option>
                <option value="30d">📆 30 derniers jours</option>
                <option value="90d">📆 90 derniers jours</option>
                <option value="1y">📅 1 an</option>
              </select>
            </div>
          </div>

          {/* Options avancées - Section simplifiée */}
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-orange-500" />
                Options de tri
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tri par</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setSortBy(sort);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs"
                >
                  <option value="date-desc">📅 Date (récent)</option>
                  <option value="date-asc">📅 Date (ancien)</option>
                  <option value="name-asc">🔤 Nom (A-Z)</option>
                  <option value="name-desc">🔤 Nom (Z-A)</option>
                  <option value="size-desc">📦 Taille (décroissant)</option>
                  <option value="size-asc">📦 Taille (croissant)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Résumé des filtres actifs */}
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-600">Filtres actifs:</span>
                <div className="flex gap-1.5">
                  {selectedCategory !== 'all' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Catégorie: {getCategoryLabel(selectedCategory)}
                    </span>
                  )}
                  {selectedStatus !== 'all' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Statut: {selectedStatus}
                    </span>
                  )}
                  {selectedPeriod !== 'all' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      Période: {selectedPeriod}
                    </span>
                  )}
                  {selectedCategory === 'all' && selectedStatus === 'all' && selectedPeriod === 'all' && (
                    <span className="text-gray-500 italic">Aucun filtre actif</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {filteredDocuments.length} document(s) trouvé(s)
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contenu des onglets */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Actions groupées */}
          {selectedItems.length > 0 && (
            <div className="border-b border-gray-200 p-3 bg-blue-50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-800">
                  {selectedItems.length} document(s) sélectionné(s)
                </span>
                <div className="flex items-center gap-1.5">
                  <button className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50">
                    <Archive className="w-3 h-3" />
                    Archiver
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50">
                    <Download className="w-3 h-3" />
                    Télécharger
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-red-300 text-red-600 rounded hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tableau des documents compact */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taille
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rétention
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accès
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    selected={selectedItems.includes(doc.id)}
                    onSelect={() => handleSelectItem(doc.id)}
                    onView={() => {}}
                    onDownload={() => {}}
                    onShare={() => {}}
                    onDelete={() => {}}
                    getDocumentIcon={getDocumentIcon}
                    getStatusIcon={getStatusIcon}
                    getCategoryLabel={getCategoryLabel}
                    getRetentionInfo={getRetentionInfo}
                    getAccessLevelIcon={getAccessLevelIcon}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cible
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    getActivityIcon={getActivityIcon}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Évolution des archives</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Documents archivés ce mois</span>
                <span className="text-base font-bold text-blue-600">+24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Espace économisé</span>
                <span className="text-base font-bold text-green-600">1.2 GB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Taux d'archivage</span>
                <span className="text-base font-bold text-purple-600">68%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Répartition par type</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Consultations</span>
                </div>
                <span className="text-xs font-medium">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Imagerie</span>
                </div>
                <span className="text-xs font-medium">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Ordonnances</span>
                </div>
                <span className="text-xs font-medium">25%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoriquesArchivesPage;
