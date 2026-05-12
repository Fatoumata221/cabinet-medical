import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    CurrencyEuroIcon,
    DocumentTextIcon,
    CreditCardIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    EyeIcon,
    ChevronLeft,
    ChevronRight
} from '@heroicons/react/24/outline';
import { traduire } from '../../utils/traductions';
import { sendNotification, NOTIFICATION_TYPES } from '../../lib/notifications';

const FacturesPage = () => {
    const [factures, setFactures] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [assurances, setAssurances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaiementModal, setShowPaiementModal] = useState(false);
    const [editingFacture, setEditingFacture] = useState(null);
    const [selectedFacture, setSelectedFacture] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatut, setFilterStatut] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    // État du formulaire facture
    const [formData, setFormData] = useState({
        consultation_id: '',
        patient_id: '',
        tva: 20,
        notes: ''
    });

    // État du formulaire paiement
    const [paiementData, setPaiementData] = useState({
        montant_paye: 0,
        mode_paiement: '',
        assurance_id: '',
        numero_carte: '',
        emetteur_monnaie_electronique: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Récupérer les consultations
            const { data: consultationsData, error: consultationsError } = await supabase
                .from('consultations')
                .select(`
                    id,
                    date_consultation,
                    patients (id, nom, prenom),
                    users (nom, prenom)
                `)
                .order('date_consultation', { ascending: false });

            if (consultationsError) throw consultationsError;
            setConsultations(consultationsData || []);

            // Récupérer les assurances
            const { data: assurancesData, error: assurancesError } = await supabase
                .from('assurances')
                .select('*')
                .order('nom');

            if (assurancesError) throw assurancesError;
            setAssurances(assurancesData || []);

            // Récupérer les factures
            await fetchFactures();

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFactures = async () => {
        try {
            const { data, error } = await supabase
                .from('factures')
                .select(`
                    *,
                    consultations (
                        date_consultation,
                        patients (nom, prenom),
                        users (nom, prenom)
                    ),
                    assurances (nom)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFactures(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des factures:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const factureData = {
                ...formData,
                created_by: (await supabase.auth.getUser()).data.user?.id
            };

            if (editingFacture) {
                const { error } = await supabase
                    .from('factures')
                    .update(factureData)
                    .eq('id', editingFacture.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('factures')
                    .insert(factureData);

                if (error) throw error;
            }

            setShowModal(false);
            setEditingFacture(null);
            resetForm();
            fetchFactures();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    };

    const handlePaiementSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Concaténer les notes de paiement avec les notes existantes
            const existingNotes = selectedFacture.notes || '';
            const newNote = paiementData.notes ? paiementData.notes.trim() : '';
            const combinedNotes = existingNotes && newNote 
                ? `${existingNotes} | ${newNote}` 
                : (existingNotes || newNote);

            const paiementUpdate = {
                ...paiementData,
                notes: combinedNotes,
                date_paiement: new Date().toISOString(),
                statut_paiement: paiementData.montant_paye >= selectedFacture.montant_ttc ? 'paye' : 'partiel',
                updated_by: (await supabase.auth.getUser()).data.user?.id
            };

            const { error } = await supabase
                .from('factures')
                .update(paiementUpdate)
                .eq('id', selectedFacture.id);

            if (error) throw error;

            // Envoyer notification à la secrétaire après paiement (une seule fois)
            try {
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('nom, prenom')
                    .eq('id', selectedFacture.patient_id)
                    .single();

                const { data: userData } = await supabase.auth.getUser();
                const caissierId = userData.data.user?.id;

                // Vérifier si une notification existe déjà pour cette facture spécifique
                const { data: existingNotification } = await supabase
                    .from('notifications_medecin_secretaire')
                    .select('id')
                    .eq('type_notification', 'facturation_complete')
                    .eq('patient_id', selectedFacture.patient_id)
                    .eq('lu', false)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (patientData && caissierId && (!existingNotification || existingNotification.length === 0)) {
                    await sendNotification(
                        NOTIFICATION_TYPES.FACTURATION_COMPLETE,
                        caissierId,
                        null, // receiverId null car envoi à toutes les secrétaires
                        selectedFacture.consultation_id,
                        `${patientData.prenom} ${patientData.nom}`,
                        {
                            factureId: selectedFacture.id,
                            patientId: selectedFacture.patient_id
                        }
                    );
                    console.log('✅ [Factures] Notification envoyée à la secrétaire après paiement');
                } else if (existingNotification && existingNotification.length > 0) {
                    console.log('ℹ️ [Factures] Notification déjà existante pour cette facturation');
                }
            } catch (notifError) {
                console.error('⚠️ [Factures] Erreur envoi notification:', notifError);
                // Ne pas bloquer le processus si la notification échoue
            }

            setShowPaiementModal(false);
            setSelectedFacture(null);
            resetPaiementForm();
            fetchFactures();
        } catch (error) {
            console.error('Erreur lors du paiement:', error);
        }
    };

    const handleEdit = (facture) => {
        setEditingFacture(facture);
        setFormData({
            consultation_id: facture.consultation_id,
            patient_id: facture.patient_id,
            tva: facture.tva || 20,
            notes: facture.notes || ''
        });
        setShowModal(true);
    };

    const handlePaiement = (facture) => {
        setSelectedFacture(facture);
        setPaiementData({
            montant_paye: facture.montant_restant,
            mode_paiement: '',
            assurance_id: '',
            numero_carte: '',
            emetteur_monnaie_electronique: '',
            notes: ''
        });
        setShowPaiementModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
            try {
                const { error } = await supabase
                    .from('factures')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                fetchFactures();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            consultation_id: '',
            patient_id: '',
            tva: 20,
            notes: ''
        });
    };

    const resetPaiementForm = () => {
        setPaiementData({
            montant_paye: 0,
            mode_paiement: '',
            assurance_id: '',
            numero_carte: '',
            emetteur_monnaie_electronique: '',
            notes: ''
        });
    };

    const handleConsultationChange = (consultationId) => {
        const consultation = consultations.find(c => c.id === parseInt(consultationId));
        setFormData(prev => ({
            ...prev,
            consultation_id: consultationId,
            patient_id: consultation ? consultation.patients.id : ''
        }));
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'en_attente': return 'bg-yellow-100 text-yellow-800';
            case 'partiel': return 'bg-orange-100 text-orange-800';
            case 'paye': return 'bg-green-100 text-green-800';
            case 'impaye': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getModePaiementIcon = (mode) => {
        switch (mode) {
            case 'carte': return <CreditCardIcon className="h-4 w-4" />;
            case 'especes': return <BanknotesIcon className="h-4 w-4" />;
            case 'assurance': return <DocumentTextIcon className="h-4 w-4" />;
            default: return <CurrencyEuroIcon className="h-4 w-4" />;
        }
    };

    const filteredFactures = factures.filter(facture => {
        const matchesSearch = 
            facture.consultations?.patients?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            facture.consultations?.patients?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            facture.numero_facture?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatut = !filterStatut || facture.statut_paiement === filterStatut;
        const matchesDate = !filterDate || facture.date_facture === filterDate;
        
        return matchesSearch && matchesStatut && matchesDate;
    });

    // Pagination
    const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFactures = filteredFactures.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const stats = {
        total: filteredFactures.length,
        enAttente: filteredFactures.filter(f => f.statut_paiement === 'en_attente').length,
        partiel: filteredFactures.filter(f => f.statut_paiement === 'partiel').length,
        payees: filteredFactures.filter(f => f.statut_paiement === 'paye').length,
        totalMontant: filteredFactures.reduce((sum, f) => sum + f.montant_ttc, 0),
        totalPaye: filteredFactures.reduce((sum, f) => sum + f.montant_paye, 0)
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* En-tête */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
                            Gestion des Factures
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Gestion des factures et des paiements
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nouvelle Facture
                    </button>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total Factures</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">En Attente</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.enAttente}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <CurrencyEuroIcon className="h-8 w-8 text-orange-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Partiel</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.partiel}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Payées</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.payees}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <CurrencyEuroIcon className="h-8 w-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total TTC</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.totalMontant.toFixed(2)} €
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <CurrencyEuroIcon className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total Payé</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.totalPaye.toFixed(2)} €
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtres */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rechercher
                            </label>
                            <input
                                type="text"
                                placeholder="Patient, numéro facture..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut Paiement
                            </label>
                            <select
                                value={filterStatut}
                                onChange={(e) => setFilterStatut(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="en_attente">En attente</option>
                                <option value="partiel">Partiel</option>
                                <option value="paye">Payé</option>
                                <option value="impaye">Impayé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date Facture
                            </label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Tableau des factures */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        N° Facture
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date Facture
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Montant TTC
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Montant Payé
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
                                {paginatedFactures.map((facture) => (
                                    <tr key={facture.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {facture.numero_facture}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {facture.consultations?.patients?.nom} {facture.consultations?.patients?.prenom}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(facture.consultations?.date_consultation).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(facture.date_facture).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {facture.montant_ttc.toFixed(2)} €
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {facture.montant_paye.toFixed(2)} €
                                            </div>
                                            {facture.montant_restant > 0 && (
                                                <div className="text-sm text-red-600">
                                                    Reste: {facture.montant_restant.toFixed(2)} €
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutColor(facture.statut_paiement)}`}>
                                                {facture.statut_paiement}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(facture)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title={traduire('edit')}
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                {facture.montant_restant > 0 && (
                                                    <button
                                                        onClick={() => handlePaiement(facture)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Paiement"
                                                    >
                                                        <CurrencyEuroIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(facture.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title={traduire('delete')}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {filteredFactures.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredFactures.length)} sur {filteredFactures.length} factures
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Modal Facture */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
                    >
                        <h2 className="text-2xl font-bold mb-6">
                            {editingFacture ? 'Modifier la Facture' : 'Nouvelle Facture'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Consultation
                                </label>
                                <select
                                    required
                                    value={formData.consultation_id}
                                    onChange={(e) => handleConsultationChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Sélectionner une consultation</option>
                                    {consultations.map(consultation => (
                                        <option key={consultation.id} value={consultation.id}>
                                            {consultation.patients?.nom} {consultation.patients?.prenom} - 
                                            {new Date(consultation.date_consultation).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    TVA (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.tva}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tva: parseFloat(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingFacture(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    {editingFacture ? 'Modifier' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modal Paiement */}
            {showPaiementModal && selectedFacture && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
                    >
                        <h2 className="text-2xl font-bold mb-6">
                            Paiement - {selectedFacture.numero_facture}
                        </h2>
                        
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">
                                <p><strong>Patient:</strong> {selectedFacture.consultations?.patients?.nom} {selectedFacture.consultations?.patients?.prenom}</p>
                                <p><strong>Montant TTC:</strong> {selectedFacture.montant_ttc.toFixed(2)} €</p>
                                <p><strong>Déjà payé:</strong> {selectedFacture.montant_paye.toFixed(2)} €</p>
                                <p><strong>Reste à payer:</strong> {selectedFacture.montant_restant.toFixed(2)} €</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handlePaiementSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Montant Payé (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={selectedFacture.montant_restant}
                                    required
                                    value={paiementData.montant_paye}
                                    onChange={(e) => setPaiementData(prev => ({ ...prev, montant_paye: parseFloat(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mode de Paiement
                                </label>
                                <select
                                    required
                                    value={paiementData.mode_paiement}
                                    onChange={(e) => setPaiementData(prev => ({ ...prev, mode_paiement: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Sélectionner un mode</option>
                                    <option value="especes">Espèces</option>
                                    <option value="carte">Carte bancaire</option>
                                    <option value="cheque">Chèque</option>
                                    <option value="assurance">Assurance</option>
                                    <option value="monnaie_electronique">Monnaie électronique</option>
                                </select>
                            </div>

                            {paiementData.mode_paiement === 'assurance' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assurance
                                    </label>
                                    <select
                                        required
                                        value={paiementData.assurance_id}
                                        onChange={(e) => setPaiementData(prev => ({ ...prev, assurance_id: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Sélectionner une assurance</option>
                                        {assurances.map(assurance => (
                                            <option key={assurance.id} value={assurance.id}>
                                                {assurance.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {paiementData.mode_paiement === 'carte' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Numéro de Carte
                                    </label>
                                    <input
                                        type="text"
                                        value={paiementData.numero_carte}
                                        onChange={(e) => setPaiementData(prev => ({ ...prev, numero_carte: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="**** **** **** ****"
                                    />
                                </div>
                            )}

                            {paiementData.mode_paiement === 'monnaie_electronique' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Émetteur
                                    </label>
                                    <input
                                        type="text"
                                        value={paiementData.emetteur_monnaie_electronique}
                                        onChange={(e) => setPaiementData(prev => ({ ...prev, emetteur_monnaie_electronique: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nom de l'émetteur"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={paiementData.notes}
                                    onChange={(e) => setPaiementData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaiementModal(false);
                                        setSelectedFacture(null);
                                        resetPaiementForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Enregistrer Paiement
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default FacturesPage;
