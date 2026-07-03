import React, { useState, useEffect, useRef, useCallback } from 'react';
import MouthCanvas from '../dental-chart/MouthCanvas';
import ToothLegend from '../dental-chart/ToothLegend';
import ToothDetailsModal from '../dental-chart/ToothDetailsModal';
import { useToothSelector } from '../dental-chart/useToothSelector';
import { updateDentalState } from '../../services/consultation/consultationService';
import { useAlert } from '../../contexts/AlertContext';
import { useToothStates } from '../../hooks/useToothStates';

const ConsultationDentalChart = ({ consultationId, initialDentalState, fetchActes, isTerminated = false }) => {
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
