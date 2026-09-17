/**
 * Color utilities for French color name matching and shade generation
 */

// French color names to base hex values
const FRENCH_COLOR_DICT = {
  rouge: '#ef4444',
  bleu: '#3b82f6',
  vert: '#22c55e',
  jaune: '#eab308',
  rose: '#ec4899',
  violet: '#a855f7',
  orange: '#f97316',
  marron: '#92400e',
  noir: '#000000',
  blanc: '#ffffff',
  gris: '#6b7280',
  bordeaux: '#800020',
  marine: '#001f3f',
  corail: '#ff7f50',
  beige: '#f5f5dc',
  kaki: '#9faf1a',
  turquoise: '#40e0d0',
  moutarde: '#ffdb58',
  prune: '#701c1c',
  camel: '#c19a6b',
  ivoire: '#fffff0',
  taupe: '#b38b6d',
  'gris clair': '#d3d3d3',
  'gris foncé': '#2f4f4f',
  'bleu marine': '#001f3f',
  'bleu ciel': '#87ceeb',
  'vert amande': '#6d8659',
  'rose clair': '#ffb6c1',
  'rose foncé': '#c71585',
  'rouge foncé': '#8b0000',
  'orange foncé': '#ff8c00',
  'jaune pâle': '#ffffe0',
  'vert olive': '#6b8e23',
  'vert bouteille': '#355e3b',
  'bleu roi': '#4169e1',
  'bleu électrique': '#0080ff',
  'violet clair': '#ee82ee',
  'violet foncé': '#4b0082',
};

/**
 * Convert hex to HSL
 * @param {string} hex - Hex color code (e.g., '#ff0000')
 * @returns {Object} { h, s, l } with h: 0-360, s: 0-100, l: 0-100
 */
export function hexToHsl(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h, s;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color code
 */
export function hslToHex(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  
  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate color shades from base hex
 * @param {string} baseHex - Base hex color
 * @param {number} count - Number of shades (default 7)
 * @returns {Array<string>} Array of hex colors from lightest to darkest
 */
export function generateColorShades(baseHex, count = 7) {
  const hsl = hexToHsl(baseHex);
  const shades = [];
  
  // Generate shades by adjusting lightness
  for (let i = 0; i < count; i++) {
    const ratio = i / (count - 1);
    // Go from light (90%) to dark (10%)
    const newL = 90 - ratio * 80;
    shades.push(hslToHex(hsl.h, hsl.s, newL));
  }
  
  return shades;
}

/**
 * Lookup French color name and return base hex
 * @param {string} colorName - French color name
 * @returns {string|null} Hex color or null if not found
 */
export function lookupFrenchColor(colorName) {
  const normalized = colorName.trim().toLowerCase();
  return FRENCH_COLOR_DICT[normalized] || null;
}

/**
 * Get list of available French color names
 * @returns {Array<string>} Array of available color names
 */
export function getAvailableFrenchColors() {
  return Object.keys(FRENCH_COLOR_DICT);
}
