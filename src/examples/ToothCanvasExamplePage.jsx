import React from 'react';
import ToothCanvas from '../components/dental-chart/ToothCanvas';

const ToothCanvasExamplePage = () => {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>ToothCanvas Examples</h1>
      <p>This page demonstrates different tooth types rendered by the ToothCanvas component.</p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '2rem' }}>
        {/* Incisors */}
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={11} type="incisor" />
          <p>Incisor (ID 11)</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={21} type="incisor" width={80} height={120} />
          <p>Incisor (ID 21, Custom Size)</p>
        </div>

        {/* Canines */}
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={13} type="canine" />
          <p>Canine (ID 13)</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={23} type="canine" width={70} height={110} />
          <p>Canine (ID 23, Custom Size)</p>
        </div>

        {/* Premolars */}
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={14} type="premolar" />
          <p>Premolar (ID 14)</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={25} type="premolar" width={110} height={90} />
          <p>Premolar (ID 25, Custom Size)</p>
        </div>

        {/* Molars */}
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={16} type="molar" />
          <p>Molar (ID 16)</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={27} type="molar" width={120} height={110} />
          <p>Molar (ID 27, Custom Size)</p>
        </div>

        {/* Default/Unknown Type */}
        <div style={{ textAlign: 'center' }}>
          <ToothCanvas toothId={99} type="unknown" />
          <p>Unknown Type (ID 99)</p>
        </div>
      </div>
    </div>
  );
};

export default ToothCanvasExamplePage;
