import { getMutedVariant, getNeonVariant } from '../../styles/tokens';

export const BOX_COLOR_PALETTE = [
  '#F4C430', // amber (baseline)
  '#FF9F1C', // orange
  '#FF6B6B', // soft red
  '#E056FD', // magenta
  '#A29BFE', // lavender
  '#6C5CE7', // indigo
  '#4D96FF', // blue
  '#00C2FF', // cyan
  '#00D2D3', // aqua
  '#1DD1A1', // teal-green
  '#2ECC71', // green
  '#7BED9F', // soft green
  '#C7F464', // lime
  '#FFD93D', // yellow alt
  '#F78FB3', // pink
  '#FFB8B8', // soft rose
];

function normalizeColorKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function colorBySeed(seed) {
  const safeSeed = Number.isFinite(Number(seed)) ? Math.abs(Math.floor(Number(seed))) : 0;
  return BOX_COLOR_PALETTE[safeSeed % BOX_COLOR_PALETTE.length];
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function getBoxColor(boxId) {
  const rawId = typeof boxId === 'string' ? parseInt(boxId, 10) : Number(boxId);
  const normalizedId = Number.isFinite(rawId) ? Math.abs(Math.floor(rawId)) : 0;
  return colorBySeed(normalizedId);
}

export function getBoxGroupColor(groupLabel, fallbackBoxId = 0) {
  const normalizedGroup = normalizeColorKey(groupLabel);
  if (normalizedGroup) {
    return colorBySeed(hashString(normalizedGroup));
  }
  return getBoxColor(fallbackBoxId);
}

export function hexToRgbString(hex) {
  const safe = String(hex || '')
    .trim()
    .replace('#', '');

  if (safe.length !== 6) return '244, 196, 48';

  const parsed = Number.parseInt(safe, 16);
  if (!Number.isFinite(parsed)) return '244, 196, 48';

  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;

  return `${r}, ${g}, ${b}`;
}

function getColorTones(base) {
  const neon = getNeonVariant(base);
  const muted = getMutedVariant(base);

  return {
    base,
    neon,
    muted,
    baseRgb: hexToRgbString(base),
    neonRgb: hexToRgbString(neon),
    mutedRgb: hexToRgbString(muted),
  };
}

export function getBoxColorTones(boxId) {
  return getColorTones(getBoxColor(boxId));
}

export function getBoxGroupColorTones(groupLabel, fallbackBoxId = 0) {
  return getColorTones(getBoxGroupColor(groupLabel, fallbackBoxId));
}
