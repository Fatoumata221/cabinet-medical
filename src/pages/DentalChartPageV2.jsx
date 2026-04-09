import React, { useState } from 'react';
import MouthCanvas from '../components/dental-chart/MouthCanvas';
import ToothLegend from '../components/dental-chart/ToothLegend'; // Re-using old legend
import ToothStateModal from '../components/dental-chart/ToothStateModal'; // Re-using old modal
import { TOOTH_STATES } from '../components/dental-chart/constants';

const DentalChartPageV2 = () => {
  const [teethState, setTeethState] = useState({
    16: { state: TOOTH_STATES.CARIES.id },
    13: { state: TOOTH_STATES.SELECTED.id },
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
      setTeethState(prevState => ({
        ...prevState,
        [selectedToothId]: { state: stateId }
      }));
    }
    handleCloseModal();
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Schéma Dentaire (V2 - Hybride)</h1>
      <p>Cliquez sur une dent pour modifier son statut. Les molaires/prémolaires sont des images, les autres sont dessinées.</p>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', width: '100%', height: '500px', display: 'flex' }}>
          <MouthCanvas
            teeth={teethState}
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
        <pre>{JSON.stringify(teethState, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DentalChartPageV2;
