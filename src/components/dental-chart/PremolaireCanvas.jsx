import React, { useRef, useEffect } from 'react';

const PremolaireCanvas = ({ width = 200, height = 280 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Créer un gradient pour la couronne (partie visible)
    const crownGradient = ctx.createLinearGradient(0, 0, width, 0);
    crownGradient.addColorStop(0, '#e8e8e8');
    crownGradient.addColorStop(0.3, '#ffffff');
    crownGradient.addColorStop(0.7, '#f5f5f5');
    crownGradient.addColorStop(1, '#d8d8d8');

    // Dessiner la couronne (partie supérieure)
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.05); // Sommet central
    
    // Cuspide buccale (externe)
    ctx.quadraticCurveTo(width * 0.65, height * 0.08, width * 0.75, height * 0.15);
    ctx.quadraticCurveTo(width * 0.85, height * 0.25, width * 0.88, height * 0.35);
    
    // Côté droit
    ctx.quadraticCurveTo(width * 0.9, height * 0.45, width * 0.88, height * 0.55);
    
    // Transition vers la racine (collet)
    ctx.lineTo(width * 0.75, height * 0.65);
    
    // Racine droite
    ctx.quadraticCurveTo(width * 0.7, height * 0.8, width * 0.65, height * 0.92);
    ctx.quadraticCurveTo(width * 0.6, height * 0.98, width * 0.5, height);
    
    // Racine gauche
    ctx.quadraticCurveTo(width * 0.4, height * 0.98, width * 0.35, height * 0.92);
    ctx.quadraticCurveTo(width * 0.3, height * 0.8, width * 0.25, height * 0.65);
    
    // Collet gauche
    ctx.lineTo(width * 0.12, height * 0.55);
    
    // Côté gauche
    ctx.quadraticCurveTo(width * 0.1, height * 0.45, width * 0.12, height * 0.35);
    ctx.quadraticCurveTo(width * 0.15, height * 0.25, width * 0.25, height * 0.15);
    
    // Cuspide linguale (interne)
    ctx.quadraticCurveTo(width * 0.35, height * 0.08, width * 0.5, height * 0.05);
    
    ctx.closePath();
    ctx.fillStyle = crownGradient;
    ctx.fill();
    
    // Contour principal
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ajouter des détails anatomiques
    
    // Sillon central
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.15);
    ctx.quadraticCurveTo(width * 0.48, height * 0.25, width * 0.5, height * 0.35);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ligne de collet (jonction couronne-racine)
    ctx.beginPath();
    ctx.moveTo(width * 0.25, height * 0.65);
    ctx.quadraticCurveTo(width * 0.5, height * 0.62, width * 0.75, height * 0.65);
    ctx.strokeStyle = '#b8985f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ombres et reliefs sur la couronne
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    
    // Ombre côté droit
    ctx.beginPath();
    ctx.moveTo(width * 0.75, height * 0.15);
    ctx.quadraticCurveTo(width * 0.85, height * 0.3, width * 0.85, height * 0.5);
    ctx.lineTo(width * 0.7, height * 0.5);
    ctx.quadraticCurveTo(width * 0.7, height * 0.3, width * 0.65, height * 0.2);
    ctx.closePath();
    ctx.fill();

    // Reflet (highlight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(width * 0.4, height * 0.25, width * 0.15, height * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Gradient pour la racine
    const rootGradient = ctx.createLinearGradient(width * 0.3, height * 0.65, width * 0.7, height);
    rootGradient.addColorStop(0, '#e8d4a8');
    rootGradient.addColorStop(0.5, '#d4c5a0');
    rootGradient.addColorStop(1, '#b8a888');

    // Colorer la racine
    ctx.beginPath();
    ctx.moveTo(width * 0.25, height * 0.65);
    ctx.lineTo(width * 0.35, height * 0.92);
    ctx.quadraticCurveTo(width * 0.4, height * 0.98, width * 0.5, height);
    ctx.quadraticCurveTo(width * 0.6, height * 0.98, width * 0.65, height * 0.92);
    ctx.lineTo(width * 0.75, height * 0.65);
    ctx.quadraticCurveTo(width * 0.5, height * 0.62, width * 0.25, height * 0.65);
    ctx.closePath();
    ctx.fillStyle = rootGradient;
    ctx.fill();

    // Contour de la racine
    ctx.strokeStyle = '#8e7d60';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Texture de la racine (lignes verticales)
    ctx.strokeStyle = 'rgba(142, 125, 96, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      const x = width * (0.3 + i * 0.05);
      ctx.beginPath();
      ctx.moveTo(x, height * 0.68);
      ctx.lineTo(x - width * 0.02, height * 0.95);
      ctx.stroke();
    }

    // Ajouter un label
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Prémolaire', width / 2, height - 10);

  }, [width, height]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backgroundColor: '#f9f9f9' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        style={{ 
          border: '2px solid #ddd',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
};

export default PremolaireCanvas;