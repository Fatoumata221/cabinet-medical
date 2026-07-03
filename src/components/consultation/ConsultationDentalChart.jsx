import React, { useState, useEffect, useRef, useCallback } from 'react';
import MouthCanvas from '../dental-chart/MouthCanvas';
import ToothLegend from '../dental-chart/ToothLegend';
import ToothDetailsModal from '../dental-chart/ToothDetailsModal';
import { useToothSelector } from '../dental-chart/useToothSelector';
import { updateDentalState } from '../../services/consultation/consultationService';
import { useAlert } from '../../contexts/AlertContext';
import { useToothStates } from '../../hooks/useToothStates';
import { supabase } from '../../lib/supabase';

const ConsultationDentalChart = ({ consultationId, initialDentalState, fetchActes, patientId, isTerminated = false }) => {
    const { showError, showSuccess } = useAlert();
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedToothId, setSelectedToothId] = useState(null);
    const teethRef = useRef(null);
    const hasChangesRef = useRef(false);

    // Charger les états dentaires dynamiques
    const { formattedStates, refresh: refreshStates, createState } = useToothStates();

    // Initialiser le sélecteur avec l'état sauvegardé ou vide
    const { teeth, setToothState, handleToothClick: originalHandleToothClick, updateToothData } = useToothSelector(
        initialDentalState || {},
        (newState) => {
             hasChangesRef.current = true;
        }
    );

    // Charger l'historique des actes dentaires depuis la base de données
    useEffect(() => {
        const loadDentalHistory = async () => {
            if (!patientId) return;

            try {
                // Récupérer tous les actes dentaires du patient (consultations passées)
                const { data: dentalActs, error } = await supabase
                    .from('actes_consultation')
                    .select(`
                        dent_id,
                        dent_nom,
                        tarif_unitaire,
                        notes,
                        created_at,
                        consultations (
                            id,
                            date_heure,
                            statut
                        ),
                        types_actes (
                            nom,
                            code_ccam
                        )
                    `)
                    .not('dent_id', 'is', null)
                    .eq('consultations.patient_id', patientId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('[DentalChart] Erreur chargement historique dentaire:', error);
                    return;
                }

                if (dentalActs && dentalActs.length > 0) {
                    // Construire l'historique par dent
                    const historyByTooth = {};
                    dentalActs.forEach(act => {
                        const toothId = act.dent_id;
                        if (!toothId) return;

                        if (!historyByTooth[toothId]) {
                            historyByTooth[toothId] = [];
                        }

                        historyByTooth[toothId].push({
                            date: act.created_at,
                            type: 'PROCEDURE',
                            code: act.types_actes?.code_ccam || 'ACTE',
                            name: act.types_actes?.nom || 'Acte dentaire',
                            note: act.notes,
                            consultationId: act.consultations?.id,
                            consultationDate: act.consultations?.date_heure,
                            price: act.tarif_unitaire
                        });
                    });

                    // Fusionner avec l'état existant
                    const updatedTeeth = { ...teeth };
                    Object.keys(historyByTooth).forEach(toothId => {
                        const existingData = updatedTeeth[toothId] || { state: 'HEALTHY' };
                        const existingHistory = existingData.history || [];
                        
                        // Fusionner l'historique (éviter les doublons)
                        const mergedHistory = [
                            ...historyByTooth[toothId],
                            ...existingHistory.filter(item => 
                                !historyByTooth[toothId].some(h => 
                                    h.date === item.date && h.name === item.name
                                )
                            )
                        ].sort((a, b) => new Date(b.date) - new Date(a.date));

                        updatedTeeth[toothId] = {
                            ...existingData,
                            history: mergedHistory
                        };

                        // Mettre à jour l'état visuel si des actes existent
                        if (mergedHistory.length > 0) {
                            // Vérifier si c'est une extraction
                            const hasExtraction = mergedHistory.some(h => 
                                h.name.toLowerCase().includes('extraction')
                            );
                            if (hasExtraction) {
                                updatedTeeth[toothId].state = 'EXTRACTED';
                            }
                        }
                    });

                    updateToothData(null, updatedTeeth);
                    console.log('[DentalChart] Historique dentaire chargé pour', Object.keys(historyByTooth).length, 'dents');
                }
            } catch (err) {
                console.error('[DentalChart] Erreur lors du chargement de l\'historique:', err);
            }
        };

        loadDentalHistory();
    }, [patientId, consultationId]);

    // Garder la ref à jour avec le dernier état
    useEffect(() => {
        teethRef.current = teeth;
    }, [teeth]);

    // Sauvegarde automatique au démontage (quand on quitte l'onglet)
    useEffect(() => {
        return () => {
            if (hasChangesRef.current && teethRef.current && consultationId) {
                updateDentalState(consultationId, teethRef.current).catch((err) =>
                    console.error('Erreur sauvegarde automatique schéma dentaire:', err)
                );
            }
        };
    }, [consultationId]);

    const handleToothClick = (toothId) => {
        if (isTerminated) return;
        setSelectedToothId(toothId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedToothId(null);
    };

    const handleUpdateTooth = (toothId, newData) => {
        updateToothData(toothId, newData);
        // Optional: Close modal automatically or keep open? 
        // Let's keep it open to allow multiple edits (e.g. state change then add note)
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await updateDentalState(consultationId, teeth);
            hasChangesRef.current = false;
            showSuccess('État dentaire sauvegardé avec succès');
        } catch (error) {
            console.error(error);
            showError('Erreur lors de la sauvegarde de l\'état dentaire');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Schéma Dentaire</h3>
                    <p className="text-sm text-gray-500">Cliquez sur une dent pour modifier son état.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm w-full h-[600px] flex justify-center items-center relative">
                    <MouthCanvas
                        teeth={teeth}
                        onToothClick={handleToothClick}
                        toothStates={formattedStates}
                    />
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-medium mb-3 text-gray-900">Légende</h4>
                    <ToothLegend toothStates={formattedStates} />
                </div>
            </div>

            <ToothDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                toothId={selectedToothId}
                toothData={selectedToothId ? teeth[selectedToothId] : null}
                onUpdateTooth={handleUpdateTooth}
                toothStates={formattedStates}
                onStateCreated={refreshStates}
                onCreateState={createState}
                consultationId={consultationId}
                fetchActes={fetchActes}
            />
        </div>
    );
};

export default ConsultationDentalChart;
