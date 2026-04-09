// src/components/dental-chart/toothPaths.js
// Anatomical tooth path definitions for realistic rendering

/**
 * Draws the outline path for an incisor (shovel-shaped tooth)
 * Features: flat incisal edge, convex labial surface, mamelons
 */
export const drawIncisorPath = (ctx, x, y, w, h) => {
  ctx.beginPath();
  // Start at top-left of incisal edge
  ctx.moveTo(x + w * 0.12, y + h * 0.05);

  // Incisal edge with subtle mamelons (3 slight bumps)
  ctx.bezierCurveTo(
    x + w * 0.25, y,
    x + w * 0.35, y + h * 0.02,
    x + w * 0.5, y
  );
  ctx.bezierCurveTo(
    x + w * 0.65, y + h * 0.02,
    x + w * 0.75, y,
    x + w * 0.88, y + h * 0.05
  );

  // Right mesial surface (convex curve)
  ctx.bezierCurveTo(
    x + w * 0.98, y + h * 0.15,
    x + w, y + h * 0.4,
    x + w * 0.95, y + h * 0.65
  );

  // Cervical line (curved toward gum)
  ctx.bezierCurveTo(
    x + w * 0.9, y + h * 0.85,
    x + w * 0.7, y + h * 0.98,
    x + w * 0.5, y + h
  );
  ctx.bezierCurveTo(
    x + w * 0.3, y + h * 0.98,
    x + w * 0.1, y + h * 0.85,
    x + w * 0.05, y + h * 0.65
  );

  // Left distal surface (convex curve back to start)
  ctx.bezierCurveTo(
    x, y + h * 0.4,
    x + w * 0.02, y + h * 0.15,
    x + w * 0.12, y + h * 0.05
  );

  ctx.closePath();
};

/**
 * Draws detail lines for an incisor (mamelons, development lines)
 */
export const drawIncisorDetails = (ctx, x, y, w, h) => {
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.25)';
  ctx.lineWidth = 0.8;

  // Mamelon lines (3 vertical ridges near incisal edge)
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + h * 0.05);
  ctx.lineTo(x + w * 0.3, y + h * 0.2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.03);
  ctx.lineTo(x + w * 0.5, y + h * 0.25);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.7, y + h * 0.05);
  ctx.lineTo(x + w * 0.7, y + h * 0.2);
  ctx.stroke();

  // Labial ridge (central highlight area)
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.15);
  ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.4, x + w * 0.5, y + h * 0.7);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

/**
 * Draws the outline path for a canine (pointed tooth with prominent cusp)
 * Features: single cusp, labial ridge, mesial/distal slopes
 */
export const drawCaninePath = (ctx, x, y, w, h) => {
  ctx.beginPath();
  // Start at cusp tip
  ctx.moveTo(x + w * 0.5, y);

  // Right slope from cusp (mesial)
  ctx.bezierCurveTo(
    x + w * 0.62, y + h * 0.08,
    x + w * 0.78, y + h * 0.18,
    x + w * 0.88, y + h * 0.32
  );

  // Right labial bulge
  ctx.bezierCurveTo(
    x + w * 0.96, y + h * 0.45,
    x + w * 0.98, y + h * 0.6,
    x + w * 0.92, y + h * 0.75
  );

  // Cervical curve (right side)
  ctx.bezierCurveTo(
    x + w * 0.85, y + h * 0.9,
    x + w * 0.7, y + h * 0.98,
    x + w * 0.5, y + h
  );

  // Cervical curve (left side)
  ctx.bezierCurveTo(
    x + w * 0.3, y + h * 0.98,
    x + w * 0.15, y + h * 0.9,
    x + w * 0.08, y + h * 0.75
  );

  // Left labial bulge
  ctx.bezierCurveTo(
    x + w * 0.02, y + h * 0.6,
    x + w * 0.04, y + h * 0.45,
    x + w * 0.12, y + h * 0.32
  );

  // Left slope to cusp (distal)
  ctx.bezierCurveTo(
    x + w * 0.22, y + h * 0.18,
    x + w * 0.38, y + h * 0.08,
    x + w * 0.5, y
  );

  ctx.closePath();
};

/**
 * Draws detail lines for a canine (labial ridge)
 */
export const drawCanineDetails = (ctx, x, y, w, h) => {
  // Prominent labial ridge (central vertical line)
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.05);
  ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.35, x + w * 0.5, y + h * 0.75);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Mesial and distal slopes highlight
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.02);
  ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.15, x + w * 0.75, y + h * 0.35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.02);
  ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.15, x + w * 0.25, y + h * 0.35);
  ctx.stroke();
};

/**
 * Draws the outline path for a premolar (bicuspid tooth)
 * Features: 2 cusps (buccal larger), oval shape, central fissure
 */
export const drawPremolarPath = (ctx, x, y, w, h) => {
  ctx.beginPath();

  // Start at buccal cusp tip (larger cusp)
  ctx.moveTo(x + w * 0.35, y + h * 0.05);

  // Buccal cusp peak
  ctx.bezierCurveTo(
    x + w * 0.45, y,
    x + w * 0.55, y,
    x + w * 0.65, y + h * 0.05
  );

  // Right side (mesial)
  ctx.bezierCurveTo(
    x + w * 0.85, y + h * 0.12,
    x + w * 0.95, y + h * 0.35,
    x + w * 0.95, y + h * 0.55
  );

  // Right cervical
  ctx.bezierCurveTo(
    x + w * 0.95, y + h * 0.75,
    x + w * 0.85, y + h * 0.92,
    x + w * 0.65, y + h * 0.98
  );

  // Bottom (lingual side - smaller cusp area)
  ctx.bezierCurveTo(
    x + w * 0.5, y + h,
    x + w * 0.35, y + h * 0.98,
    x + w * 0.35, y + h * 0.98
  );

  // Left cervical
  ctx.bezierCurveTo(
    x + w * 0.15, y + h * 0.92,
    x + w * 0.05, y + h * 0.75,
    x + w * 0.05, y + h * 0.55
  );

  // Left side (distal)
  ctx.bezierCurveTo(
    x + w * 0.05, y + h * 0.35,
    x + w * 0.15, y + h * 0.12,
    x + w * 0.35, y + h * 0.05
  );

  ctx.closePath();
};

/**
 * Draws detail lines for a premolar (cusps, fissure)
 */
export const drawPremolarDetails = (ctx, x, y, w, h) => {
  // Central fissure (mesio-distal)
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.45);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.4, x + w * 0.8, y + h * 0.45);
  ctx.strokeStyle = 'rgba(80, 80, 80, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Buccal cusp outline
  ctx.beginPath();
  ctx.moveTo(x + w * 0.25, y + h * 0.2);
  ctx.bezierCurveTo(
    x + w * 0.4, y + h * 0.08,
    x + w * 0.6, y + h * 0.08,
    x + w * 0.75, y + h * 0.2
  );
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.25)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Lingual cusp outline (smaller)
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + h * 0.7);
  ctx.bezierCurveTo(
    x + w * 0.45, y + h * 0.62,
    x + w * 0.55, y + h * 0.62,
    x + w * 0.7, y + h * 0.7
  );
  ctx.stroke();

  // Cusp highlights
  const cusps = [
    { cx: 0.5, cy: 0.18, r: 0.08 },  // Buccal cusp
    { cx: 0.5, cy: 0.72, r: 0.06 }   // Lingual cusp
  ];

  cusps.forEach(cusp => {
    ctx.beginPath();
    ctx.arc(x + w * cusp.cx, y + h * cusp.cy, w * cusp.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fill();
  });
};

/**
 * Draws the outline path for a molar (large multi-cusped tooth)
 * Features: 4-5 cusps, square-rounded shape, complex fissure pattern
 */
export const drawMolarPath = (ctx, x, y, w, h) => {
  ctx.beginPath();

  // Start at top-left (buccal surface)
  ctx.moveTo(x + w * 0.12, y + h * 0.1);

  // Buccal surface (top) with slight cusp peaks
  ctx.bezierCurveTo(
    x + w * 0.25, y,
    x + w * 0.4, y + h * 0.02,
    x + w * 0.5, y
  );
  ctx.bezierCurveTo(
    x + w * 0.6, y + h * 0.02,
    x + w * 0.75, y,
    x + w * 0.88, y + h * 0.1
  );

  // Mesial surface (right side)
  ctx.bezierCurveTo(
    x + w * 0.98, y + h * 0.2,
    x + w, y + h * 0.4,
    x + w, y + h * 0.5
  );
  ctx.bezierCurveTo(
    x + w, y + h * 0.6,
    x + w * 0.98, y + h * 0.8,
    x + w * 0.88, y + h * 0.9
  );

  // Lingual surface (bottom) with cusp peaks
  ctx.bezierCurveTo(
    x + w * 0.75, y + h,
    x + w * 0.6, y + h * 0.98,
    x + w * 0.5, y + h
  );
  ctx.bezierCurveTo(
    x + w * 0.4, y + h * 0.98,
    x + w * 0.25, y + h,
    x + w * 0.12, y + h * 0.9
  );

  // Distal surface (left side)
  ctx.bezierCurveTo(
    x + w * 0.02, y + h * 0.8,
    x, y + h * 0.6,
    x, y + h * 0.5
  );
  ctx.bezierCurveTo(
    x, y + h * 0.4,
    x + w * 0.02, y + h * 0.2,
    x + w * 0.12, y + h * 0.1
  );

  ctx.closePath();
};

/**
 * Draws detail lines for a molar (fissures, cusps)
 */
export const drawMolarDetails = (ctx, x, y, w, h) => {
  // Central pit (darker area)
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.5, w * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(80, 80, 80, 0.3)';
  ctx.fill();

  // Main fissure pattern (cross shape)
  ctx.strokeStyle = 'rgba(70, 70, 70, 0.4)';
  ctx.lineWidth = 1.2;

  // Horizontal fissure (bucco-lingual)
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + h * 0.5);
  ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.48, x + w * 0.5, y + h * 0.5);
  ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.52, x + w * 0.85, y + h * 0.5);
  ctx.stroke();

  // Vertical fissure (mesio-distal)
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.15);
  ctx.quadraticCurveTo(x + w * 0.48, y + h * 0.35, x + w * 0.5, y + h * 0.5);
  ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.65, x + w * 0.5, y + h * 0.85);
  ctx.stroke();

  // Cusp boundary lines
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
  ctx.lineWidth = 0.8;

  // Mesio-buccal to central
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.2);
  ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.35, x + w * 0.5, y + h * 0.5);
  ctx.stroke();

  // Disto-buccal to central
  ctx.beginPath();
  ctx.moveTo(x + w * 0.8, y + h * 0.2);
  ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.35, x + w * 0.5, y + h * 0.5);
  ctx.stroke();

  // Mesio-lingual to central
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.8);
  ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.65, x + w * 0.5, y + h * 0.5);
  ctx.stroke();

  // Disto-lingual to central
  ctx.beginPath();
  ctx.moveTo(x + w * 0.8, y + h * 0.8);
  ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.65, x + w * 0.5, y + h * 0.5);
  ctx.stroke();

  // Cusp highlights (4 cusps)
  const cusps = [
    { cx: 0.3, cy: 0.28, r: 0.1 },   // Mesio-buccal
    { cx: 0.7, cy: 0.28, r: 0.1 },   // Disto-buccal
    { cx: 0.28, cy: 0.72, r: 0.09 }, // Mesio-lingual
    { cx: 0.72, cy: 0.72, r: 0.09 }  // Disto-lingual
  ];

  cusps.forEach(cusp => {
    ctx.beginPath();
    ctx.arc(x + w * cusp.cx, y + h * cusp.cy, w * cusp.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
  });

  // Marginal ridges
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;

  // Mesial marginal ridge
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + h * 0.35);
  ctx.quadraticCurveTo(x + w * 0.08, y + h * 0.5, x + w * 0.15, y + h * 0.65);
  ctx.stroke();

  // Distal marginal ridge
  ctx.beginPath();
  ctx.moveTo(x + w * 0.85, y + h * 0.35);
  ctx.quadraticCurveTo(x + w * 0.92, y + h * 0.5, x + w * 0.85, y + h * 0.65);
  ctx.stroke();
};
