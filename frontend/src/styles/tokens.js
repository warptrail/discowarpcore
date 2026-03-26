/* ===== Tokens ===== */

export const OPEN_ACCENT = '#50aaff';
export const CLOSE_ACCENT = '#3cdca0';
export const BASE_BORDER = '#333';
export const ACTIVE_BORDER = '#4cc6c1';
export const CARD_BG = '#161616';
export const ROW_BG = '#1a1a1a';
export const ROW_BG_ACTIVE = '#202020';

/* ===== Responsive Tokens ===== */
export const MOBILE_MAX_WIDTH = 700;
export const MOBILE_BREAKPOINT = `${MOBILE_MAX_WIDTH}px`;
export const MOBILE_NARROW_BREAKPOINT = '520px';

/* ===== Mobile Density Tokens ===== */
export const MOBILE_PAGE_GAP = '0.55rem';
export const MOBILE_PANEL_RADIUS = '10px';
export const MOBILE_CONTROL_MIN_HEIGHT = '38px';
export const MOBILE_TOUCH_TARGET = '36px';
export const MOBILE_FONT_SM = '0.82rem';
export const MOBILE_FONT_XS = '0.72rem';

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHexColor(hex) {
  const normalized = String(hex || '')
    .trim()
    .replace('#', '');

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const parsed = Number.parseInt(normalized, 16);
  if (!Number.isFinite(parsed)) return null;

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function toHexColor({ r, g, b }) {
  const value =
    (clampChannel(r) << 16) +
    (clampChannel(g) << 8) +
    clampChannel(b);
  return `#${value.toString(16).padStart(6, '0').toUpperCase()}`;
}

function createSaturationShift(rgb, saturationFactor) {
  const average = (rgb.r + rgb.g + rgb.b) / 3;
  return {
    r: average + (rgb.r - average) * saturationFactor,
    g: average + (rgb.g - average) * saturationFactor,
    b: average + (rgb.b - average) * saturationFactor,
  };
}

function blendToward(rgb, target, amount) {
  return {
    r: rgb.r + (target.r - rgb.r) * amount,
    g: rgb.g + (target.g - rgb.g) * amount,
    b: rgb.b + (target.b - rgb.b) * amount,
  };
}

export function getNeonVariant(color) {
  const parsed = parseHexColor(color);
  if (!parsed) return '#F4C430';

  const boosted = createSaturationShift(parsed, 1.24);
  const brightened = blendToward(boosted, { r: 255, g: 255, b: 255 }, 0.22);

  return toHexColor(brightened);
}

export function getMutedVariant(color) {
  const parsed = parseHexColor(color);
  if (!parsed) return '#B08A2A';

  const softened = createSaturationShift(parsed, 0.54);
  const darkened = blendToward(softened, { r: 18, g: 24, b: 34 }, 0.24);

  return toHexColor(darkened);
}
