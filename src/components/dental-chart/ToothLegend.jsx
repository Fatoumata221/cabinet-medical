import React from 'react';
import { TOOTH_STATES } from './constants';

const ToothLegend = ({ toothStates }) => {
  const statesToRender = toothStates ? Object.values(toothStates) : Object.values(TOOTH_STATES);
  
  return (
    <div style={{ padding: '10px', marginTop: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h4>Légende</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {statesToRender.map(state => (
          <div key={state.id || state.code} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: state.color,
                border: `1px solid ${state.borderColor || state.border_color || '#616161'}`,
                marginRight: '10px',
              }}
            ></div>
            <span>{state.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToothLegend;
