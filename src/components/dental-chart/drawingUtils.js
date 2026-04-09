// src/components/dental-chart/drawingUtils.js
import { TOOTH_STATES } from './constants';
import {
  drawIncisorPath,
  drawIncisorDetails,
  drawCaninePath,
  drawCanineDetails,
  drawPremolarPath,
  drawPremolarDetails,
  drawMolarPath,
  drawMolarDetails
} from './toothPaths';

// Get fill color based on tooth state
const getFillColor = (stateOrId) => {
  // If it's already a state object with a color property
  if (typeof stateOrId === 'object' && stateOrId !== null) {
      if (stateOrId.color) return stateOrId.color;
      if (stateOrId.id) return getFillColor(stateOrId.id); 
  }
  
  // If it's a string ID
  const toothStateInfo = Object.values(TOOTH_STATES).find(s => s.id === stateOrId) || TOOTH_STATES.HEALTHY;
  return toothStateInfo.color;
};

// Get border color based on tooth state (new helper)
const getBorderColor = (stateOrId) => {
    if (typeof stateOrId === 'object' && stateOrId !== null) {
        if (stateOrId.borderColor) return stateOrId.borderColor;
        if (stateOrId.id) return getBorderColor(stateOrId.id);
    }
    const toothStateInfo = Object.values(TOOTH_STATES).find(s => s.id === stateOrId) || TOOTH_STATES.HEALTHY;
    return toothStateInfo.borderColor || '#9CA3AF';
};

// Lighten a hex color by a percentage
const lightenColor = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1).padStart(6, '0')}`;
};

// Darken a hex color by a percentage
const darkenColor = (hex, percent) => {
  return lightenColor(hex, -percent);
};

// Create a radial gradient for 3D porcelain effect
const createToothGradient = (ctx, x, y, width, height, baseColor) => {
  const gradient = ctx.createRadialGradient(
    x + width * 0.4, y + height * 0.3, width * 0.1, // Highlight source
    x + width * 0.5, y + height * 0.5, Math.max(width, height) * 0.8
  );
  gradient.addColorStop(0, '#FFFFFF'); // Specular highlight
  gradient.addColorStop(0.2, lightenColor(baseColor, 10));
  gradient.addColorStop(0.5, baseColor);
  gradient.addColorStop(1, darkenColor(baseColor, 10)); // Subtle shadow at edges
  return gradient;
};

// Draw tooth label (ID number)
const drawToothLabel = (ctx, toothId, x, y, width, height, isUpper) => {
  ctx.fillStyle = '#6B7280'; // Gray 500
  ctx.font = '500 10px Inter, sans-serif'; // More modern font weight
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const labelY = isUpper ? y + height + 14 : y - 10;
  ctx.fillText(toothId.toString(), x + width / 2, labelY);
};

// Apply shadow effect - Softer, more diffuse
const applyShadow = (ctx, enabled = true) => {
  if (enabled) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'; // Much softer shadow
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
};

/**
 * Draw an incisor tooth (shovel-shaped, front teeth)
 */
export const drawIncisor = (ctx, toothId, x, y, width, height, state, isUpper = true) => {
  const fillColor = getFillColor(state);
  const borderColor = getBorderColor(state);

  ctx.save();

  // Apply shadow
  applyShadow(ctx, true);

  // Draw main tooth shape
  drawIncisorPath(ctx, x, y, width, height);

  // Fill with gradient
  const gradient = createToothGradient(ctx, x, y, width, height, fillColor);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Remove shadow for stroke
  applyShadow(ctx, false);

  // Stroke outline
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1; // Thinner, cleaner line
  ctx.stroke();

  // Draw anatomical details (subtle)
  // Only draw details if not purely healthy to avoid clutter, OR draw them very subtly
  if (getFillColor(state) === TOOTH_STATES.HEALTHY.color) {
     drawIncisorDetails(ctx, x, y, width, height);
  }

  ctx.restore();

  // Draw tooth ID label
  drawToothLabel(ctx, toothId, x, y, width, height, isUpper);
};

/**
 * Draw a canine tooth (pointed tooth with single cusp)
 */
export const drawCanine = (ctx, toothId, x, y, width, height, state, isUpper = true) => {
  const fillColor = getFillColor(state);
  const borderColor = getBorderColor(state);

  ctx.save();

  // Apply shadow
  applyShadow(ctx, true);

  // Draw main tooth shape
  drawCaninePath(ctx, x, y, width, height);

  // Fill with gradient
  const gradient = createToothGradient(ctx, x, y, width, height, fillColor);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Remove shadow for stroke
  applyShadow(ctx, false);

  // Stroke outline
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw anatomical details
  if (getFillColor(state) === TOOTH_STATES.HEALTHY.color) {
    drawCanineDetails(ctx, x, y, width, height);
  }

  ctx.restore();

  // Draw tooth ID label
  drawToothLabel(ctx, toothId, x, y, width, height, isUpper);
};

/**
 * Draw a premolar tooth (bicuspid with 2 cusps)
 */
export const drawPremolar = (ctx, toothId, x, y, width, height, state, isUpper = true) => {
  const fillColor = getFillColor(state);
  const borderColor = getBorderColor(state);

  ctx.save();

  // Apply shadow
  applyShadow(ctx, true);

  // Draw main tooth shape
  drawPremolarPath(ctx, x, y, width, height);

  // Fill with gradient
  const gradient = createToothGradient(ctx, x, y, width, height, fillColor);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Remove shadow for stroke
  applyShadow(ctx, false);

  // Stroke outline
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw anatomical details
  if (getFillColor(state) === TOOTH_STATES.HEALTHY.color) {
      drawPremolarDetails(ctx, x, y, width, height);
  }

  ctx.restore();

  // Draw tooth ID label
  drawToothLabel(ctx, toothId, x, y, width, height, isUpper);
};

/**
 * Draw a molar tooth (large multi-cusped tooth)
 */
export const drawMolar = (ctx, toothId, x, y, width, height, state, isUpper = true) => {
  const fillColor = getFillColor(state);
  const borderColor = getBorderColor(state);

  ctx.save();

  // Apply shadow
  applyShadow(ctx, true);

  // Draw main tooth shape
  drawMolarPath(ctx, x, y, width, height);

  // Fill with gradient
  const gradient = createToothGradient(ctx, x, y, width, height, fillColor);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Remove shadow for stroke
  applyShadow(ctx, false);

  // Stroke outline
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw anatomical details
  if (getFillColor(state) === TOOTH_STATES.HEALTHY.color) {
      drawMolarDetails(ctx, x, y, width, height);
  }

  ctx.restore();

  // Draw tooth ID label
  drawToothLabel(ctx, toothId, x, y, width, height, isUpper);
};

// Generic dispatcher
export const drawTooth = (ctx, toothData, state) => {
  const { type, id, x, y, width, height, isUpper } = toothData;
  switch (type) {
    case 'incisor':
      drawIncisor(ctx, id, x, y, width, height, state, isUpper);
      break;
    case 'canine':
      drawCanine(ctx, id, x, y, width, height, state, isUpper);
      break;
    case 'premolar':
      drawPremolar(ctx, id, x, y, width, height, state, isUpper);
      break;
    case 'molar':
      drawMolar(ctx, id, x, y, width, height, state, isUpper);
      break;
    default:
      drawIncisor(ctx, id, x, y, width, height, state, isUpper);
      break;
  }
};

export const drawToothNumber = (ctx, tooth) => {
    drawToothLabel(ctx, tooth.id, tooth.x, tooth.y, tooth.width, tooth.height, tooth.isUpper);
};

// Export path functions for hit detection
export {
  drawIncisorPath,
  drawCaninePath,
  drawPremolarPath,
  drawMolarPath
};
