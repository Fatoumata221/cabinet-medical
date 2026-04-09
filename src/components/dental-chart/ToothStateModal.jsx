import React from 'react';
import { TOOTH_STATES } from './constants';

const ToothStateModal = ({ isOpen, onClose, onSelectState, toothId }) => {
  if (!isOpen) return null;

  // We don't want to show the "SELECTED" state in the modal
  const statesToShow = Object.values(TOOTH_STATES).filter(
    (state) => state.id !== TOOTH_STATES.SELECTED.id
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>Statut pour la dent {toothId}</h3>
        <div style={styles.buttonContainer}>
          {statesToShow.map((state) => (
            <button
              key={state.id}
              style={{ ...styles.button, backgroundColor: state.color, color: '#000' }}
              onClick={() => onSelectState(state.id)}
            >
              {state.name}
            </button>
          ))}
        </div>
        <button style={styles.closeButton} onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    minWidth: '300px',
    textAlign: 'center',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    margin: '1.5rem 0',
  },
  button: {
    border: '1px solid #ccc',
    padding: '0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
  },
};

export default ToothStateModal;
