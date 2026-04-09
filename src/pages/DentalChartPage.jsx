import React, { useState } from 'react';
import MouthCanvas from '../components/dental-chart/MouthCanvas';
import ToothLegend from '../components/dental-chart/ToothLegend';
import { useToothSelector } from '../components/dental-chart/useToothSelector';
import { TOOTH_STATES } from '../components/dental-chart/constants';
import ToothStateModal from '../components/dental-chart/ToothStateModal';

const DentalChartPage = () => {
  const [initialState, setInitialState] = useState({
    11: { state: TOOTH_STATES.CARIES.id },
    16: { state: TOOTH_STATES.HEALTHY.id },
    24: { state: TOOTH_STATES.EXTRACTED.id },
    46: { state: TOOTH_STATES.IMPLANT.id },
  });

  const { teeth, setToothState } = useToothSelector(initialState, (newState) => {
    console.log("Tooth state updated:", newState);
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToothId, setSelectedToothId] = useState(null);

  const handleToothClick = (toothId) => {
    setSelectedToothId(toothId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedToothId(null);
  };

  const handleSelectState = (stateId) => {
    if (selectedToothId) {
      setToothState(selectedToothId, stateId);
    }
    handleCloseModal();
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Schéma Dentaire</h1>
      <p>Cliquez sur une dent pour modifier son statut.</p>
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', width: '100%', height: '500px', display: 'flex' }}>
          <MouthCanvas
            teeth={teeth}
            onToothClick={handleToothClick}
          />
        </div>
        <ToothLegend />
      </div>

      <ToothStateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelectState={handleSelectState}
        toothId={selectedToothId}
      />

      <div style={{ marginTop: '2rem', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '5px' }}>
        <h3>État actuel des dents (JSON)</h3>
        <pre>{JSON.stringify(teeth, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DentalChartPage;
